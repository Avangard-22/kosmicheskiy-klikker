// js/tutorial.js — 📖 ВСТРОЕННАЯ ИНСТРУКЦИЯ (v1.0)
// ЧТО: книга-гайд с постраничной навигацией + иконка на главном экране.
// ЗАЧЕМ: до/во время игры понятно, что за что отвечает.
// КАК: автономный модуль. Текст внутри (window.currentLanguage → фолбэк ru/en).
//      Разметку создаёт сам — из index.html нужен только <script>.
(function () {
'use strict';

// ═══════════════════ КОНФИГ ═══════════════════
const CFG = {
    zIndex: 3000
};

// ═══════════════════ ТЕКСТ ═══════════════════
const TEXT = {
ru: {
    title: '📖 Инструкция', subtitle: 'Краткий гайд по игре',
    pages: [
    { title: '🎯 Как играть', sub: 'Цель и основной цикл', blocks: [
        { p: 'Блоки поднимаются снизу вверх — разбивай их кликами.' },
        { p: 'У каждого блока своё HP: чем дальше планета и выше прокачка, тем крепче блоки.' },
        { ul: ['💎 Разбил блок — получил Кристаллы',
               '📈 Одновременно растёт Прогресс планеты (в а.е.) вверху экрана',
               '🚀 Прогресс 100% → планета пройдена'] },
        { p: 'Чтобы улететь дальше, платишь BoC на Врата следующей планеты.' },
        { p: 'Маршрут: Меркурий → Венера → Земля → Марс → Юпитер → Сатурн → Уран → Нептун → Плутон → 🌌 Гелиопауза (рейд).' },
        { note: '⏱ Если блок улетел за верхнюю границу — это промах (см. «Промахи и откат»).' }
    ]},
    { title: '💎 Ресурсы', sub: 'Кристаллы и BoC', blocks: [
        { p: '💎 Кристаллы — основная валюта: улучшения, магазин, пошлины.' },
        { h: 'BoC 🪙 — престиж-очки (между планетами и на телепортах):' },
        { ul: ['🏆 BoC earned — накопленный престиж: пассивный бонус к доходу, НЕ тратится',
               'Жидкая BoC — «кошелёк»: тратится на Врата и телепорты',
               'Кешбэк — часть потраченных 💎 возвращается жидкой BoC (до 10%)'] },
        { note: 'Чем больше жидкой BoC — тем дальше по системе можно улететь за один Ран.' }
    ]},
    { title: '🚪 Врата, Телепорт, Ран', sub: 'Как двигаться по системе', blocks: [
        { h: 'Врата (цена в жидкой BoC, база):' },
        { table: { head: ['Планета', 'BoC'], rows: [
            ['♀ Венера', '20'], ['♁ Земля', '30'], ['♂ Марс', '45'], ['♃ Юпитер', '75'],
            ['♄ Сатурн', '250'], ['♅ Уран', '700'], ['♆ Нептун', '1100'], ['♇ Плутон', '2000'],
            ['🌌 Гелиопауза', '7500'] ] } },
        { p: 'С каждым новым Раном цены Врат растут.' },
        { h: 'Телепорт' },
        { ul: ['На пройденной планете можно проскочить ещё круг',
               'Даёт множитель дохода ×1.5–×5',
               'Множители складываются в стек (кап поднимает апгрейд «Якорь»)',
               'Каждый фарм-круг истощает «жилу» — следующий даёт меньше'] },
        { h: 'Ран (престиж)' },
        { p: 'Это один полный заход по Солнечной системе. Каждый новый Ран усиливает престиж-бонус BoC, но поднимает цены Врат.' }
    ]},
    { title: '⚡ Улучшения', sub: 'Куда тратить Кристаллы', blocks: [
        { p: 'Открой панель «⚡ Улучшения» на рабочем столе — игра встанет на паузу. В карточках: название, стоимость, уровень и текущий эффект.' },
        { h: 'Базовые:' },
        { ul: ['Сила удара — урон за один клик',
               'Шанс крита / Множитель крита — сила критических ударов',
               'Bobo — авто-помощник, бьёт по блокам 60 секунд',
               'Урон Bobo — усиливает удары Bobo'] },
        { h: 'Дополнительные:' },
        { ul: ['⚡ Ускоритель — Bobo бьёт чаще',
               '🎵 Резонанс — дольше держится комбо',
               '🪐 Гравитация — блоки замедляются в верхней зоне (меньше промахов)',
               '⚓ Якорь — выше кап стека телепортов',
               '🧭 Компас — больше редких ⭐ блоков'] },
        { note: 'Цены растут с уровнем, но шаг мягчает на высоких уровнях.' }
    ]},
    { title: '⭐ Блоки, криты, комбо', sub: 'Как получать больше', blocks: [
        { ul: ['Крит — случайный мощный удар (шанс и множитель — в HUD слева)',
               'Комбо — разбивай блоки подряд без промахов: растёт счётчик и бонус к награде',
               '⭐ Редкий блок — низкий шанс, но крупная награда',
               'Особые блоки (например, кольца Сатурна) — крепче, но награда ×3'] },
        { note: '🍀 «Талисман удачи» и 🧭 «Компас» повышают шанс редких блоков.' }
    ]},
    { title: '⚠️ Промахи и откат', sub: 'Чего избегать', blocks: [
        { p: 'Промах — блок ушёл за верхнюю границу. За промахи игра наказывает:' },
        { ul: ['Может урезать случайный апгрейд (часть уровня «сгорает»)',
               'Много пропусков подряд (после 30% прогресса планеты) → ОТКАТ: теряется часть прогресса в а.е.'] },
        { note: '🛡️ «Неуязвимость» из магазина отменяет штрафы на время действия. «Гравитация», «⏳ Искажение времени» и авто-кликер тоже помогают не пропускать.' }
    ]},
    { title: '🛒 Магазин бустов', sub: 'Разовые усилители', blocks: [
        { table: { head: ['Буст', 'Эффект'], rows: [
            ['⏳ Искажение времени', 'Блоки на 50% медленнее'],
            ['💰 Усилитель кристаллов', '+100% к награде за блоки'],
            ['⚡ Скачок силы', '+200% к силе клика'],
            ['🍀 Талисман удачи', '+70% к шансу редких'],
            ['🛡️ Неуязвимость', 'Нет штрафов за промах'],
            ['🤖 Авто-кликер', 'Клик каждые 0.5 сек'] ] } },
        { p: '🎟️ Купон даёт скидку 10–70% на случайное улучшение.' },
        { note: 'Цены магазина растут по мере покупок и сбрасываются после ежедневного бонуса.' }
    ]},
    { title: '🎁 Ежедневный бонус и события', sub: 'Возвращайся каждый день', blocks: [
        { ul: ['Раз в день (после ~23 ч) забирай 🎁 бонус: 💎, бустер или уровни улучшений',
               'Золотые дни серии: 7 / 14 / 21 / 30 → 1000 / 2500 / 5000 / 15000 💎',
               '30 дней подряд → буст +500% к кристаллам и +5 силы на 3 часа',
               'Цикл — 30 дней, затем отсчёт начинается заново с Дня 1'] },
        { p: 'Случайные события:' },
        { ul: ['☄️ Астероид — успей кликнуть, даёт доп. 💎',
               '🌠 Комета — временный бафф урона или кристаллов'] }
    ]},
    { title: '🔥 Хардкор-разнообразие', sub: 'Цепная реакция и Хроно-блоки', blocks: [
        { h: 'Цепная реакция' },
        { ul: ['Разбивай блоки без промахов — растёт серия',
               'Вехи: 25 / 75 / 150 / 300 → множитель 💎 ×1.3 / ×1.8 / ×2.5 / ×3',
               'На 300 (кап) — «Кровавая луна»: шанс ⭐ ×2 на 15 сек',
               'Промах сбрасывает серию'] },
        { h: 'Хроно-блоки' },
        { ul: ['Каждые ~80 блоков — блок с таймером ⏱ (~3.5 сек)',
               'Добей обычным кликом → награда ×3 и +1 заряд времени',
               '3 заряда → 6 сек слоу-мо',
               'Прозевал → следующие 15 блоков чуть быстрее'] },
        { note: 'Прогресс видно в пилюле слева снизу: 🔥 серия · ⏱ заряды.' }
    ]},
    { title: '🏆 Достижения и лидеры', sub: 'Долгосрочные цели', blocks: [
        { ul: ['Достижения считаются отдельно по каждой планете (блоки, криты, комбо, редкие и т.д.)',
               'Выполняешь цели — получаешь ранги и награды',
               'Таблица лидеров сравнивает твой прогресс с другими игроками (глобально и по периодам)'] }
    ]},
    { title: '💾 Сохранения', sub: 'Облако и локально', blocks: [
        { ul: ['Игра сохраняется автоматически',
               'В Telegram — облако (приоритет): прогресс общий на всех устройствах',
               'Без Telegram — локально в браузере (fallback)',
               '💾 — сохранить вручную'] },
        { note: 'Облачный и локальный сейвы не смешиваются: при входе через Telegram грузится облако. После крупной покупки дай паре секунд на синхронизацию.' }
    ]}
]},
en: {
    title: '📖 Guide', subtitle: 'Quick game guide',
    pages: [
    { title: '🎯 How to play', sub: 'Goal and core loop', blocks: [
        { p: 'Blocks rise from the bottom — destroy them by clicking.' },
        { p: 'Every block has HP: the further the planet and the higher your upgrades, the tougher they get.' },
        { ul: ['💎 Destroy a block — earn Crystals',
               '📈 Planet progress (in AU) fills at the top',
               '🚀 100% progress → planet cleared'] },
        { p: 'To fly further you pay BoC for the next planet’s Gate.' },
        { p: 'Route: Mercury → Venus → Earth → Mars → Jupiter → Saturn → Uranus → Neptune → Pluto → 🌌 Heliopause (raid).' },
        { note: '⏱ If a block escapes past the top edge, that is a miss (see «Misses & rollback»).' }
    ]},
    { title: '💎 Currencies', sub: 'Crystals and BoC', blocks: [
        { p: '💎 Crystals — main currency: upgrades, shop, fees.' },
        { h: 'BoC 🪙 — prestige points (between planets and from teleports):' },
        { ul: ['🏆 BoC earned — accumulated prestige: passive income bonus, never spent',
               'Liquid BoC — your wallet: spent on Gates and teleports',
               'Cashback — a share of spent 💎 returns as liquid BoC (up to 10%)'] },
        { note: 'More liquid BoC means you can travel further in a single Run.' }
    ]},
    { title: '🚪 Gates, Teleport, Run', sub: 'Moving through the system', blocks: [
        { h: 'Gates (price in liquid BoC, base):' },
        { table: { head: ['Planet', 'BoC'], rows: [
            ['♀ Venus', '20'], ['♁ Earth', '30'], ['♂ Mars', '45'], ['♃ Jupiter', '75'],
            ['♄ Saturn', '250'], ['♅ Uranus', '700'], ['♆ Neptune', '1100'], ['♇ Pluto', '2000'],
            ['🌌 Heliopause', '7500'] ] } },
        { p: 'Gate prices rise with each new Run.' },
        { h: 'Teleport' },
        { ul: ['On a cleared planet you can skip through another round',
               'Gives an income multiplier ×1.5–×5',
               'Multipliers stack (the Anchor upgrade raises the cap)',
               'Each farm round depletes the vein — the next one yields less'] },
        { h: 'Run (prestige)' },
        { p: 'One full pass across the Solar system. Each new Run boosts the BoC prestige bonus but raises Gate prices.' }
    ]},
    { title: '⚡ Upgrades', sub: 'Where Crystals go', blocks: [
        { p: 'Open the «⚡ Upgrades» panel on the field — the game pauses. Cards show name, cost, level and current effect.' },
        { h: 'Base:' },
        { ul: ['Click Power — damage per click',
               'Crit Chance / Crit Multiplier — crit damage',
               'Bobo — auto-helper attacking blocks for 60 s',
               'Bobo Damage — boosts Bobo’s hits'] },
        { h: 'Extra:' },
        { ul: ['⚡ Booster — Bobo attacks faster',
               '🎵 Resonance — combo lasts longer',
               '🪐 Gravity — blocks slow down near the top (fewer misses)',
               '⚓ Anchor — higher teleport stack cap',
               '🧭 Compass — more rare ⭐ blocks'] },
        { note: 'Prices grow with level, but the step softens at high levels.' }
    ]},
    { title: '⭐ Blocks, crits, combo', sub: 'Earning more', blocks: [
        { ul: ['Crit — a random heavy hit (chance & mult in the left HUD)',
               'Combo — destroy blocks in a row without misses: counter and bonus grow',
               '⭐ Rare block — low chance, big reward',
               'Special blocks (e.g. Saturn’s rings) — tougher, reward ×3'] },
        { note: '🍀 Lucky Charm and 🧭 Compass increase rare block chance.' }
    ]},
    { title: '⚠️ Misses & rollback', sub: 'What to avoid', blocks: [
        { p: 'A miss is a block escaping past the top edge. Misses cost you:' },
        { ul: ['A random upgrade may be cut (part of a level lost)',
               'Many misses in a row (after 30% planet progress) → ROLLBACK: planet progress is lost'] },
        { note: '🛡️ Shop «Invincibility» cancels penalties while active. Gravity, Time Warp and Auto-Clicker also help you not miss.' }
    ]},
    { title: '🛒 Bonus shop', sub: 'One-off boosters', blocks: [
        { table: { head: ['Boost', 'Effect'], rows: [
            ['⏳ Time Warp', 'Blocks move 50% slower'],
            ['💰 Crystal Boost', '+100% block rewards'],
            ['⚡ Power Surge', '+200% click power'],
            ['🍀 Lucky Charm', '+70% rare chance'],
            ['🛡️ Invincibility', 'No miss penalties'],
            ['🤖 Auto-Clicker', 'A click every 0.5 s'] ] } },
        { p: '🎟️ Coupon gives 10–70% off a random upgrade.' },
        { note: 'Shop prices rise with purchases and reset after the daily bonus.' }
    ]},
    { title: '🎁 Daily bonus & events', sub: 'Come back every day', blocks: [
        { ul: ['Once a day (after ~23 h) claim a 🎁 bonus: 💎, a booster or upgrade levels',
               'Golden streak days: 7 / 14 / 21 / 30 → 1000 / 2500 / 5000 / 15000 💎',
               '30 days in a row → buff +500% crystals and +5 power for 3 hours',
               'The cycle is 30 days, then it restarts from Day 1'] },
        { p: 'Random events:' },
        { ul: ['☄️ Asteroid — click in time for extra 💎',
               '🌠 Comet — temporary damage or crystal buff'] }
    ]},
    { title: '🔥 Hardcore variety', sub: 'Chain reaction & Chrono blocks', blocks: [
        { h: 'Chain reaction' },
        { ul: ['Destroy blocks without misses — the streak grows',
               'Milestones: 25 / 75 / 150 / 300 → 💎 multiplier ×1.3 / ×1.8 / ×2.5 / ×3',
               'At 300 (cap) — «Blood Moon»: rare ⭐ chance ×2 for 15 s',
               'A miss resets the streak'] },
        { h: 'Chrono blocks' },
        { ul: ['Every ~80 blocks — a block with a ⏱ timer (~3.5 s)',
               'Finish it with a click → reward ×3 and +1 time charge',
               '3 charges → 6 s slow-mo',
               'Missed it → next 15 blocks are a bit faster'] },
        { note: 'Progress shows in the pill at the bottom-left: 🔥 streak · ⏱ charges.' }
    ]},
    { title: '🏆 Achievements & leaderboard', sub: 'Long-term goals', blocks: [
        { ul: ['Achievements are tracked per planet (blocks, crits, combos, rares, etc.)',
               'Complete goals — earn ranks and rewards',
               'The leaderboard compares your progress with other players (global and by period)'] }
    ]},
    { title: '💾 Saves', sub: 'Cloud and local', blocks: [
        { ul: ['The game saves automatically',
               'In Telegram — cloud (priority): progress shared across devices',
               'Outside Telegram — localStorage fallback',
               '💾 — save manually'] },
        { note: 'Cloud and local saves are not merged: entering via Telegram loads the cloud. After a big purchase, give sync a couple of seconds.' }
    ]}
]}};

const BTN = { ru: '📖 Инструкция', en: '📖 Guide', zh: '📖 指南' };

// ═══════════════════ СОСТОЯНИЕ ═══════════════════
const S = { open: false, page: 0, ownsPause: false, built: false };
let overlay, card, bodyEl, titleEl, subEl, dotsEl, prevBtn, nextBtn;

const lang = () => {
    const l = window.currentLanguage || 'ru';
    return TEXT[l] ? l : (l === 'zh' ? 'en' : 'ru');   // zh пока → en
};
const pack = () => TEXT[lang()];

// ═══════════════════ UI ═══════════════════
function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
}

function build() {
    if (S.built) return;
    injectStyles();

    overlay = el('div', 'tut-overlay');
    overlay.id = 'tutorialOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
        '<div class="tut-card" id="tutCard">' +
          '<div class="tut-head">' +
            '<div><div class="tut-title" id="tutTitle"></div><div class="tut-sub" id="tutSub"></div></div>' +
            '<button type="button" class="tut-close" id="tutClose" aria-label="Закрыть">✕</button>' +
          '</div>' +
          '<div class="tut-body" id="tutBody"></div>' +
          '<div class="tut-foot">' +
            '<button type="button" class="tut-nav" id="tutPrev">‹</button>' +
            '<div class="tut-dots" id="tutDots"></div>' +
            '<button type="button" class="tut-nav tut-nav-primary" id="tutNext">›</button>' +
          '</div>' +
        '</div>';
    document.body.appendChild(overlay);

    card = overlay.querySelector('#tutCard');
    bodyEl = overlay.querySelector('#tutBody');
    titleEl = overlay.querySelector('#tutTitle');
    subEl = overlay.querySelector('#tutSub');
    dotsEl = overlay.querySelector('#tutDots');
    prevBtn = overlay.querySelector('#tutPrev');
    nextBtn = overlay.querySelector('#tutNext');

    overlay.querySelector('#tutClose').addEventListener('click', close);
    prevBtn.addEventListener('click', () => go(-1));
    nextBtn.addEventListener('click', () => go(1));
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    enableSwipe(card);
    S.built = true;
}

function renderBlocks(blocks) {
    bodyEl.innerHTML = '';
    (blocks || []).forEach(b => {
        if (typeof b === 'string') { bodyEl.appendChild(el('p', 'tut-p', b)); return; }
        if (b.h) bodyEl.appendChild(el('h4', 'tut-h', b.h));
        if (b.p) bodyEl.appendChild(el('p', 'tut-p', b.p));
        if (b.note) bodyEl.appendChild(el('div', 'tut-note', b.note));
        if (b.ul) {
            const ul = el('ul', 'tut-ul');
            b.ul.forEach(x => { const li = el('li', '', x); ul.appendChild(li); });
            bodyEl.appendChild(ul);
        }
        if (b.table) {
            const rows = (b.table.rows || []).map(r =>
                '<tr>' + r.map((c, i) => (i === 0 ? '<td>' + c + '</td>' : '<td>' + c + '</td>')).join('') + '</tr>').join('');
            const head = (b.table.head || []).map(c => '<th>' + c + '</th>').join('');
            bodyEl.appendChild(el('table', 'tut-table', '<thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody>'));
        }
    });
}

function render(i) {
    const pages = pack().pages;
    S.page = Math.max(0, Math.min(pages.length - 1, i));
    const p = pages[S.page];

    titleEl.textContent = p.title;
    subEl.textContent = p.sub || '';
    renderBlocks(p.blocks);

    dotsEl.innerHTML = '';
    pages.forEach((_, idx) => {
        const d = el('button', 'tut-dot' + (idx === S.page ? ' active' : ''));
        d.type = 'button';
        d.setAttribute('aria-label', 'Стр. ' + (idx + 1));
        d.addEventListener('click', () => render(idx));
        dotsEl.appendChild(d);
    });

    prevBtn.textContent = S.page === 0 ? '✕' : '‹';
    nextBtn.textContent = S.page === pages.length - 1 ? '✓' : '›';
    bodyEl.scrollTop = 0;
}

// ═══════════════════ УПРАВЛЕНИЕ ═══════════════════
function go(delta) {
    const pages = pack().pages;
    if (delta > 0 && S.page === pages.length - 1) { close(); return; }
    if (delta < 0 && S.page === 0) { close(); return; }
    render(S.page + delta);
    if (window.telegramHaptic?.selectionChanged) window.telegramHaptic.selectionChanged();
}

function closeOtherPanels() {
    const tries = [
        () => window.shopSystem?.closeShop?.(),
        () => window.achievementsSystem?.hideAchievementsPanel?.(),
        () => window.UpgradesPanel?.close?.(),
        () => window.upgradesPanel?.close?.(),
        () => window.Leaderboard?.close?.(),
        () => window.leaderboardSystem?.close?.()
    ];
    tries.forEach(f => { try { f(); } catch (e) {} });
}

function open() {
    build();
    closeOtherPanels();
    overlay.classList.add('open');
    S.open = true;
    if (!S.ownsPause && window.gameState?.gameActive && window.GAME_CORE?.pauseGame) {
        window.GAME_CORE.pauseGame();
        S.ownsPause = true;
    }
    render(S.page);
    if (window.telegramHaptic?.light) window.telegramHaptic.light();
}

function close() {
    if (!S.open) return;
    S.open = false;
    overlay.classList.remove('open');
    if (S.ownsPause) {
        S.ownsPause = false;
        if (window.GAME_CORE?.resumeGame) window.GAME_CORE.resumeGame();
    }
    if (window.telegramHaptic?.selectionChanged) window.telegramHaptic.selectionChanged();
}

function toggle() { S.open ? close() : open(); }

function onKey(e) {
    if (!S.open) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowRight') { go(1); return; }
    if (e.key === 'ArrowLeft') { go(-1); return; }
    if (e.key === 'Home') { render(0); return; }
    if (e.key === 'End') { render(pack().pages.length - 1); return; }
    if (e.key === 'Tab') {                      // фокус-ловушка
        const focusable = card.querySelectorAll('button');
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
}

function enableSwipe(node) {
    let x0 = null, y0 = null;
    node.addEventListener('touchstart', e => {
        if (e.touches.length !== 1) return;
        x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    node.addEventListener('touchend', e => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        const dy = e.changedTouches[0].clientY - y0;
        x0 = y0 = null;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    }, { passive: true });
}

// ═══════════════════ ИКОНКИ ═══════════════════
function mountButtons() {
    // 1) На главном экране: используем #tutorialBtn, иначе создаём перед «Продолжить»
    let wb = document.getElementById('tutorialBtn');
    if (!wb) {
        const ws = document.getElementById('welcomeScreen');
        if (ws) {
            wb = el('button', 'tut-welcome-btn', BTN[lang()] || BTN.ru);
            wb.type = 'button';
            wb.id = 'tutorialBtn';
            const cont = document.getElementById('continueBtn');
            if (cont && cont.parentNode === ws) ws.insertBefore(wb, cont);
            else ws.appendChild(wb);
        }
    }
    if (wb && !wb._tutBound) { wb._tutBound = true; wb.addEventListener('click', open); }

    // 2) Плавающая 📖 во время игры
    if (CFG.floatBtn && !document.getElementById('tutorialFloatBtn')) {
        const f = el('button', 'tut-float-btn', '📖');
        f.type = 'button'; f.id = 'tutorialFloatBtn';
        f.setAttribute('aria-label', 'Инструкция');
        f.style.left = CFG.floatPos.left;
        f.style.bottom = CFG.floatPos.bottom;
        f.addEventListener('click', open);
        document.body.appendChild(f);
        setInterval(syncFloat, 1000);
        syncFloat();
    }
}

function syncFloat() {
    const f = document.getElementById('tutorialFloatBtn');
    if (!f) return;
    f.style.display = window.gameState?.gameActive ? 'flex' : 'none';
}

function refresh() {
    const wb = document.getElementById('tutorialBtn');
    if (wb) wb.textContent = BTN[lang()] || BTN.ru;
    if (S.open) render(S.page);
}

// ═══════════════════ СТИЛИ ═══════════════════
function injectStyles() {
    if (document.getElementById('tut-styles')) return;
    const st = document.createElement('style');
    st.id = 'tut-styles';
    st.textContent = `
.tut-overlay{position:fixed;inset:0;z-index:${CFG.zIndex};display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.72);backdrop-filter:blur(4px);font-family:'Orbitron',system-ui,sans-serif}
.tut-overlay.open{display:flex}
.tut-card{width:92vw;max-width:560px;max-height:86vh;display:flex;flex-direction:column;background:rgba(12,10,24,.97);border:2px solid rgba(255,215,0,.25);border-radius:16px;box-shadow:0 12px 60px rgba(0,0,0,.7);overflow:hidden}
.tut-head{display:flex;align-items:flex-start;gap:10px;padding:14px 16px 10px;border-bottom:1px solid rgba(255,255,255,.08)}
.tut-title{color:#FFD700;font-weight:700;font-size:1.05em}
.tut-sub{color:#9aa;font-size:.72em;margin-top:2px}
.tut-close{margin-left:auto;flex:0 0 auto;width:32px;height:32px;background:transparent;border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:8px;font-size:1em;cursor:pointer}
.tut-body{padding:12px 16px;overflow-y:auto;color:#e8e8f0;font-size:.85em;line-height:1.5}
.tut-p{margin:0 0 8px}
.tut-h{margin:10px 0 6px;color:#4fc3f7;font-size:.95em;font-weight:700}
.tut-ul{margin:0 0 8px;padding-left:18px}
.tut-ul li{margin:3px 0}
.tut-note{margin:8px 0;padding:8px 10px;border-left:3px solid #FFD700;background:rgba(255,215,0,.08);border-radius:6px}
.tut-table{width:100%;border-collapse:collapse;margin:4px 0 10px;font-size:.92em}
.tut-table th,.tut-table td{padding:4px 6px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left}
.tut-table th{color:#FFD700;font-weight:700}
.tut-foot{display:flex;align-items:center;gap:8px;padding:10px 14px;border-top:1px solid rgba(255,255,255,.08)}
.tut-nav{min-width:44px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:10px;padding:8px 12px;font-family:inherit;font-weight:700;font-size:.85em;cursor:pointer}
.tut-nav-primary{background:linear-gradient(135deg,#4CAF50,#388E3C);border-color:transparent}
.tut-dots{display:flex;gap:5px;margin:0 auto;flex-wrap:wrap;justify-content:center;max-width:60%}
.tut-dot{width:8px;height:8px;padding:0;border:none;border-radius:50%;background:rgba(255,255,255,.25);cursor:pointer}
.tut-dot.active{background:#FFD700;transform:scale(1.3)}
.tut-welcome-btn{margin-top:6px;background:transparent;border:2px solid rgba(255,215,0,.5);color:#FFD700;border-radius:10px;padding:10px 16px;font-family:inherit;font-weight:700;cursor:pointer}
.tut-float-btn{position:fixed;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,215,0,.5);background:rgba(0,0,0,.55);color:#FFD700;font-size:1.4em;display:none;align-items:center;justify-content:center;cursor:pointer;z-index:40;box-shadow:0 4px 14px rgba(0,0,0,.4)}
.tut-float-btn:active{transform:scale(.92)}
`;
    document.head.appendChild(st);
}

// ═══════════════════ BOOT ═══════════════════
function boot() {
    build();
    mountButtons();
    if (!document.getElementById('tutorialBtn')) setTimeout(mountButtons, 1500); // welcome мог появиться позже
    console.log('📖 [TUTORIAL] v1.0 готов (' + lang() + ')');
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

window.TutorialSystem = {
    open, close, toggle, refresh,
    goto: i => { build(); render(i); },
    isOpen: () => S.open,
    config: CFG, text: TEXT
};
})();
