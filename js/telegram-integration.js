// Telegram Mini App Integration с облачными сохранениями
(function() {
    'use strict';
    
    // ✅ Проверка наличия Telegram WebApp
    const isTelegram = !!window.Telegram?.WebApp;
    
    if (!isTelegram) {
        console.log('ℹ️ Не в Telegram — работаем в обычном режиме (localStorage)');
        return;
    }
    
    const tg = window.Telegram.WebApp;
    
    // ✅ Конфигурация
    const CONFIG = {
        saveKey: 'cosmicBlocksSave',
        cloudEndpoint: '/api/telegram/save',
        loadEndpoint: '/api/telegram/load',
        maxRetries: 3,
        retryDelay: 1000,
        autoSaveInterval: 30000 // 30 секунд
    };
    
    // ✅ Состояние интеграции
    let isInitialized = false;
    let autoSaveInterval = null;
    let isSaving = false;
    let pendingSaveData = null;
    
    // ✅ Инициализация Telegram WebApp
    function initTelegram() {
        if (isInitialized) {
            console.log('ℹ️ Telegram уже инициализирован');
            return;
        }
        
        console.log('🔷 Telegram WebApp detected');
        console.log('👤 User ID:', tg.initDataUnsafe?.user?.id);
        console.log('👤 Username:', tg.initDataUnsafe?.user?.username);
        
        // ✅ Расширить на весь экран
        tg.expand();
        
        // ✅ Настроить цвета под тему Telegram
        if (tg.themeParams) {
            tg.setHeaderColor(tg.themeParams.secondary_bg_color || '#1a1a2e');
            tg.setBackgroundColor(tg.themeParams.bg_color || '#0f0f1a');
        }
        
        // ✅ Включить подтверждение закрытия
        tg.enableClosingConfirmation();
        
        // ✅ Готово
        tg.ready();
        
        // ✅ Запуск автосохранения
        startAutoSave();
        
        // ✅ Обработчик закрытия приложения
        tg.onEvent('before_close', () => {
            console.log('📱 Приложение закрывается, сохраняем прогресс...');
            forceSave();
        });
        
        // ✅ Обработчик видимости
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('👁️ Вкладка скрыта, сохраняем...');
                forceSave();
            }
        });
        
        isInitialized = true;
        console.log('✅ Telegram Integration initialized');
    }
    
    // ✅ Получение ID пользователя
    function getUserId() {
        return tg.initDataUnsafe?.user?.id;
    }
    
    // ✅ Получение initData для валидации
    function getInitData() {
        return tg.initData;
    }
    
    // ✅ Сохранение в облако с повторными попытками
    async function saveToCloud(data, retryCount = 0) {
        const userId = getUserId();
        if (!userId) {
            console.warn('⚠️ Нет user ID для облачного сохранения');
            return false;
        }
        
        if (isSaving) {
            console.log('⏳ Сохранение уже выполняется, откладываем...');
            pendingSaveData = data;
            return false;
        }
        
        isSaving = true;
        
        try {
            const payload = {
                userId: userId,
                data: data,
                timestamp: Date.now(),
                version: data.version || '1.0',
                initData: getInitData()
            };
            
            // ✅ Попытка отправки на бэкенд
            const response = await fetch(CONFIG.cloudEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status === 'ok' || result.status === 'saved') {
                console.log('✅ Saved to Telegram Cloud');
                showSaveIndicator('cloud');
                return true;
            } else {
                throw new Error(result.error || 'Unknown error');
            }
            
        } catch (error) {
            console.warn(`⚠️ Cloud save failed (attempt ${retryCount + 1}/${CONFIG.maxRetries}):`, error.message);
            
            // ✅ Повторная попытка
            if (retryCount < CONFIG.maxRetries) {
                await sleep(CONFIG.retryDelay * (retryCount + 1));
                return saveToCloud(data, retryCount + 1);
            }
            
            console.error('❌ Cloud save failed after all retries');
            return false;
            
        } finally {
            isSaving = false;
            
            // ✅ Есть отложенное сохранение?
            if (pendingSaveData) {
                const data = pendingSaveData;
                pendingSaveData = null;
                setTimeout(() => saveToCloud(data), 1000);
            }
        }
    }
    
    // ✅ Загрузка из облака с повторными попытками
    async function loadFromCloud(retryCount = 0) {
        const userId = getUserId();
        if (!userId) {
            console.warn('⚠️ Нет user ID для загрузки из облака');
            return null;
        }
        
        try {
            const response = await fetch(`${CONFIG.loadEndpoint}?userId=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('ℹ️ Нет сохранения в облаке');
                    return null;
                }
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.status === 'ok' && result.data) {
                console.log('✅ Loaded from Telegram Cloud');
                return result.data;
            } else {
                return null;
            }
            
        } catch (error) {
            console.warn(`⚠️ Cloud load failed (attempt ${retryCount + 1}/${CONFIG.maxRetries}):`, error.message);
            
            if (retryCount < CONFIG.maxRetries) {
                await sleep(CONFIG.retryDelay * (retryCount + 1));
                return loadFromCloud(retryCount + 1);
            }
            
            console.error('❌ Cloud load failed after all retries');
            return null;
        }
    }
    
    // ✅ Принудительное сохранение (перед закрытием)
    async function forceSave() {
        if (!window.gameState || !window.gameMetrics) {
            console.warn('⚠️ Нет данных для сохранения');
            return false;
        }
        
        const saveData = {
            gameState: JSON.parse(JSON.stringify(window.gameState)),
            gameMetrics: JSON.parse(JSON.stringify(window.gameMetrics)),
            timestamp: Date.now(),
            version: '1.0'
        };
        
        // ✅ Сохраняем в localStorage (всегда)
        try {
            localStorage.setItem(CONFIG.saveKey, JSON.stringify(saveData));
            console.log('💾 Saved to localStorage');
        } catch (e) {
            console.error('❌ localStorage save failed:', e);
        }
        
        // ✅ Сохраняем в облако (если Telegram)
        await saveToCloud(saveData);
        
        // ✅ Обновляем кнопку продолжения
        if (typeof window.updateContinueButton === 'function') {
            window.updateContinueButton();
        }
        
        return true;
    }
    
    // ✅ Загрузка с приоритетом облака
    async function loadWithCloudPriority() {
        // ✅ Сначала пытаемся загрузить из облака
        const cloudData = await loadFromCloud();
        
        if (cloudData) {
            console.log('☁️ Используем облачное сохранение');
            return cloudData;
        }
        
        // ✅ Fallback на localStorage
        const localData = localStorage.getItem(CONFIG.saveKey);
        if (localData) {
            console.log('📱 Используем локальное сохранение');
            try {
                return JSON.parse(localData);
            } catch (e) {
                console.error('❌ Failed to parse local save:', e);
                return null;
            }
        }
        
        console.log('🆕 Нет сохранений, новая игра');
        return null;
    }
    
    // ✅ Автосохранение
    function startAutoSave() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
        }
        
        autoSaveInterval = setInterval(() => {
            if (window.gameState?.gameActive) {
                console.log('🔄 Автосохранение...');
                forceSave();
            }
        }, CONFIG.autoSaveInterval);
        
        console.log(`⏱️ Автосохранение запущено (каждые ${CONFIG.autoSaveInterval / 1000} сек)`);
    }
    
    // ✅ Остановка автосохранения
    function stopAutoSave() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
        }
    }
    
    // ✅ Haptic Feedback для Telegram
    window.telegramHaptic = {
        light: () => {
            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
            } else if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        },
        medium: () => {
            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('medium');
            } else if (navigator.vibrate) {
                navigator.vibrate(30);
            }
        },
        heavy: () => {
            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('heavy');
            } else if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        },
        success: () => {
            if (tg.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('success');
            } else if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
        },
        error: () => {
            if (tg.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('error');
            } else if (navigator.vibrate) {
                navigator.vibrate([150, 50, 150]);
            }
        },
        warning: () => {
            if (tg.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('warning');
            } else if (navigator.vibrate) {
                navigator.vibrate([50, 50, 50]);
            }
        }
    };
    
    // ✅ MainButton Telegram
    window.telegramMainButton = {
        show: function(text, callback) {
            if (tg.MainButton) {
                tg.MainButton.setText(text);
                tg.MainButton.onClick(callback);
                tg.MainButton.show();
                tg.MainButton.enable();
            }
        },
        hide: function() {
            if (tg.MainButton) {
                tg.MainButton.hide();
                tg.MainButton.offClick();
            }
        },
        enable: function() {
            if (tg.MainButton) {
                tg.MainButton.enable();
            }
        },
        disable: function() {
            if (tg.MainButton) {
                tg.MainButton.disable();
            }
        },
        setProgress: function(progress) {
            if (tg.MainButton && tg.MainButton.setProgress) {
                tg.MainButton.setProgress(progress);
            }
        }
    };
    
    // ✅ BackButton Telegram
    window.telegramBackButton = {
        show: function(callback) {
            if (tg.BackButton) {
                tg.BackButton.onClick(callback);
                tg.BackButton.show();
            }
        },
        hide: function() {
            if (tg.BackButton) {
                tg.BackButton.hide();
                tg.BackButton.offClick();
            }
        }
    };
    
    // ✅ Индикатор сохранения
    function showSaveIndicator(status) {
        let indicator = document.getElementById('saveIndicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'saveIndicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 8px 16px;
                background: rgba(0, 0, 0, 0.8);
                color: #4CAF50;
                border-radius: 8px;
                font-size: 0.9em;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
            `;
            document.body.appendChild(indicator);
        }
        
        const messages = {
            saving: '💾 Сохранение...',
            saved: '✅ Сохранено',
            error: '❌ Ошибка сохранения',
            cloud: '☁️ Облачное сохранение'
        };
        
        indicator.textContent = messages[status] || '';
        indicator.style.opacity = '1';
        indicator.style.color = status === 'error' ? '#f44336' : '#4CAF50';
        
        if (status !== 'saving') {
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 2000);
        }
    }
    
    // ✅ Вспомогательная функция для задержки
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ✅ Модификация window.saveGame для облака
    const originalSaveGame = window.saveGame;
    window.saveGame = async function() {
        // ✅ Сначала локальное сохранение (оригинальная функция)
        const localResult = originalSaveGame ? originalSaveGame() : false;
        
        // ✅ Затем облачное (если Telegram)
        if (isInitialized && window.gameState && window.gameMetrics) {
            const saveData = {
                gameState: JSON.parse(JSON.stringify(window.gameState)),
                gameMetrics: JSON.parse(JSON.stringify(window.gameMetrics)),
                timestamp: Date.now(),
                version: '1.0'
            };
            await saveToCloud(saveData);
        }
        
        return localResult;
    };
    
    // ✅ Модификация window.loadGame для приоритета облака
    const originalLoadGame = window.loadGame;
    window.loadGame = async function() {
        try {
            // ✅ Приоритет: Telegram Cloud
            if (isInitialized) {
                const cloudData = await loadFromCloud();
                if (cloudData) {
                    console.log('☁️ Загрузка из Telegram Cloud...');
                    applySaveData(cloudData);
                    return true;
                }
            }
            
            // ✅ Fallback: localStorage (оригинальная функция)
            if (originalLoadGame) {
                return originalLoadGame();
            }
            
            return false;
        } catch (e) {
            console.error('❌ Ошибка загрузки:', e);
            return false;
        }
    };
    
    // ✅ Применение данных сохранения
    function applySaveData(data) {
        if (data.gameState && window.gameState) {
            Object.assign(window.gameState, data.gameState);
        }
        if (data.gameMetrics && window.gameMetrics) {
            Object.assign(window.gameMetrics, data.gameMetrics);
        }
        console.log('✅ Данные сохранения применены');
    }
    
    // ✅ Debug интерфейс
    window.telegramDebug = {
        getStatus: function() {
            return {
                isTelegram: isTelegram,
                isInitialized: isInitialized,
                userId: getUserId(),
                username: tg.initDataUnsafe?.user?.username,
                platform: tg.platform,
                version: tg.version,
                colorScheme: tg.colorScheme,
                isSaving: isSaving,
                hasPendingSave: !!pendingSaveData
            };
        },
        
        forceSave: function() {
            console.log('🔄 Принудительное сохранение...');
            forceSave();
        },
        
        forceLoad: async function() {
            console.log('🔄 Принудительная загрузка из облака...');
            const data = await loadFromCloud();
            if (data) {
                applySaveData(data);
                console.log('✅ Загружено из облака');
            } else {
                console.log('❌ Нет данных в облаке');
            }
        },
        
        clearCloud: async function() {
            if (confirm('⚠️ Очистить сохранение в облаке?')) {
                const userId = getUserId();
                if (userId) {
                    await fetch(CONFIG.cloudEndpoint, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId })
                    });
                    console.log('🗑️ Облачное сохранение очищено');
                }
            }
        },
        
        testHaptic: function() {
            console.log('📳 Тест Haptic Feedback...');
            window.telegramHaptic.light();
            setTimeout(() => window.telegramHaptic.medium(), 200);
            setTimeout(() => window.telegramHaptic.heavy(), 400);
            setTimeout(() => window.telegramHaptic.success(), 600);
            setTimeout(() => window.telegramHaptic.error(), 800);
        }
    };
    
    // ✅ Экспорт публичного API
    window.telegramSave = {
        saveToCloud,
        loadFromCloud,
        forceSave,
        getUserId,
        getInitData,
        isTelegram: () => isTelegram,
        isInitialized: () => isInitialized
    };
    
    // ✅ Инициализация при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initTelegram, 200);
        });
    } else {
        setTimeout(initTelegram, 200);
    }
    
    // ✅ Очистка при закрытии страницы
    window.addEventListener('beforeunload', () => {
        console.log('📱 Страница закрывается, сохраняем...');
        stopAutoSave();
        forceSave();
    });
    
    console.log('🔷 Telegram Integration loaded');
})();