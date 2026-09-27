/*  Emoji game for arthurabrarov.com
    Loaded on the live site from GitHub Pages (code/emoji-game.min.js) through one script tag in
    Framer: Site Settings, General, Custom Code, end of body. Edit this file, rebuild the .min.js, push.
    Needs: a frame named "Hero" containing an avatar image of 48px or less, and the footer links frame named "Footer".
    Runs on the homepage only. The dot grid is the DotGridRepel code component, which reacts to the emojis on its own. */
(() => {
  if (window.__emojiGame) return;          // run once, even with Framer's page transitions
  window.__emojiGame = true;

  /* ───────────── Emoji avatar + gravity playground ───────────── */
  function emojiDrop() {
    // rarity tiers: chance, avatar tint, emoji pool
    const TIERS = [
      { name: 'Common',    p: 0.85,   tint: '#f4f4f4', pool: ['😄','😎','🥳','😊','😁','😂','🤩','😍','🙂','😜'] },   // yellow faces
      { name: 'Uncommon',  p: 0.12,   tint: '#e9f5ec', pool: ['🍀','🐸','🥑','🌵','🐢','🥝','🌿','🍏'] },           // green
      { name: 'Rare',      p: 0.025,  tint: '#e7efff', pool: ['🐳','🦋','💧','🧊','🐬'] },                          // blue
      { name: 'Epic',      p: 0.0045, tint: '#f1e7ff', pool: ['🔮','🍇','👾','💜','😈','☂️'] },                               // purple
      { name: 'Legendary', p: 0.0005, tint: 'gold',    pool: ['🦄','🐉','🦖','👽','🪐','🧞','💍'] },   // mythical & cool
    ];
    const tierOf = new Map();
    TIERS.forEach((t, i) => t.pool.forEach(e => tierOf.set(e, i)));
    const fromTier = (i, not) => { const p = TIERS[i].pool; let e; do e = p[Math.random() * p.length | 0]; while (e === not && p.length > 1); return e; };

    /* clicker state */
    const game = { luck: 0, auto: 0 };
    // progress is kept in this browser between visits: coins, power-up levels and the mute setting
    const SAVE_KEY = 'fx-emoji-game';
    const saved = (() => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; } })();
    const lvlOf = v => Math.max(0, Math.min(10, v | 0));
    game.auto = lvlOf(saved.auto); game.luck = lvlOf(saved.luck);
    const returning = (saved.coins | 0) > 0 || game.auto > 0 || game.luck > 0;
    const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const TOUCH = matchMedia('(hover: none)').matches;
    // Luck boosts every tier above Common, rarer tiers more: weight × (1 + 0.15·luck)^tier
    function odds() {
      const w = TIERS.map((t, i) => t.p * (i ? (1 + 0.15 * game.luck) ** i : 1));
      const sum = w.reduce((a, b) => a + b, 0);
      return w.map(x => x / sum);
    }
    function roll(not) {
      const o = odds();
      let r = Math.random(), i = 0;
      while (i < TIERS.length - 1 && r >= o[i]) { r -= o[i]; i++; }
      return fromTier(i, not);
    }
    const pct = p => { const v = p * 100; return (v >= 1 ? +v.toFixed(1) : +v.toPrecision(2)) + '%'; };   // 85%, 2.5%, 0.45%, 0.05%
    const BASE = 40;            // px diameter on a quick click
    const MAX = 180;            // px diameter after a long hold
    const GROW_DELAY = 180;     // ms before holding starts to grow it
    const GROW_TIME = 2200;     // ms from BASE to MAX while holding
    const GRAVITY = 2600;       // px/s²
    const BOUNCE = 0.28;
    const LIMIT = innerWidth < 700 ? 100 : 350;   // oldest emoji is removed past this (fewer on phones)


    const css = document.createElement('style');
    css.textContent = `
      .fx-av-emoji{position:absolute;inset:0;display:grid;place-items:center;font-size:20px;line-height:1;
        background:#f4f4f4;border-radius:50%;
        opacity:0;scale:.5;transition:opacity .2s ease,scale .3s cubic-bezier(.3,1.6,.5,1);
        pointer-events:none;user-select:none;}
      .fx-av{cursor:pointer;touch-action:none;}
      .fx-av > :not(.fx-av-emoji):not(.fx-rarity){transition:opacity .2s ease,scale .25s ease;}
      .fx-av.fx-av-on > :not(.fx-av-emoji):not(.fx-rarity){opacity:0;scale:.6;}
      .fx-av.fx-av-on .fx-av-emoji{opacity:1;scale:1;}
      .fx-playing .fx-av > :not(.fx-av-emoji):not(.fx-rarity){opacity:0;scale:.6;}   /* in the game the avatar always shows the next emoji */
      .fx-playing .fx-av .fx-av-emoji{opacity:1;scale:1;}
      .fx-world{position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;}
      .fx-body{position:absolute;left:0;top:0;display:grid;place-items:center;line-height:1;
        pointer-events:auto;cursor:grab;user-select:none;touch-action:none;will-change:transform;}
      .fx-body.fx-held{cursor:grabbing;}
      .fx-body.fx-new{pointer-events:none;}
      .fx-av-emoji{transition:opacity .2s ease,scale .3s cubic-bezier(.3,1.6,.5,1),background-color .3s ease;}
      .fx-av-emoji.fx-legend{background:linear-gradient(115deg,#f7e7b4,#fff6d8 40%,#f2d98a 60%,#f7e7b4);
        background-size:250% 100%;animation:fx-shimmer 2.4s linear infinite;}
      @keyframes fx-shimmer{from{background-position:100% 0}to{background-position:-150% 0}}
      .fx-rarity{position:absolute;left:44px;top:6px;font:500 14px/20px "Instrument Sans","Instrument Sans Placeholder",sans-serif;
        color:rgb(104,104,112);white-space:nowrap;pointer-events:none;opacity:0;translate:-4px 0;
        transition:opacity .3s ease,translate .3s ease;}
      .fx-rarity.fx-show{opacity:1;translate:0 0;}
      .fx-rarity[data-tier]{color:transparent;-webkit-background-clip:text;background-clip:text;font-weight:600;
        background-size:250% 100%;animation:fx-wave 1.6s linear infinite;}
      .fx-rarity[data-tier="1"]{background-image:linear-gradient(100deg,#2f9e5b 0%,#2f9e5b 35%,#8ee6a9 50%,#2f9e5b 65%,#2f9e5b 100%);}
      .fx-rarity[data-tier="2"]{background-image:linear-gradient(100deg,#2f6fe0 0%,#2f6fe0 35%,#9cc3ff 50%,#2f6fe0 65%,#2f6fe0 100%);}
      .fx-rarity[data-tier="3"]{background-image:linear-gradient(100deg,#8a3ee0 0%,#8a3ee0 30%,#e08bff 45%,#6a8bff 55%,#8a3ee0 70%,#8a3ee0 100%);}
      .fx-rarity[data-tier="4"]{background-image:linear-gradient(100deg,#b8860b 0%,#b8860b 30%,#ffe27a 45%,#fff6cf 50%,#ffe27a 55%,#b8860b 70%,#b8860b 100%);
        animation-duration:2.2s;}
      .fx-rarity[data-tier="1"]{filter:drop-shadow(0 0 6px rgba(47,158,91,.25));}
      .fx-rarity[data-tier="2"]{filter:drop-shadow(0 0 6px rgba(47,111,224,.3));}
      .fx-rarity[data-tier="3"]{filter:drop-shadow(0 0 8px rgba(138,62,224,.35));}
      .fx-rarity[data-tier="4"]{filter:drop-shadow(0 0 10px rgba(242,201,76,.55));}
      @keyframes fx-wave{from{background-position:125% 0}to{background-position:-125% 0}}
      .fx-body.fx-pop{animation:fx-pop .45s cubic-bezier(.3,1.6,.5,1);}
      .fx-score{position:absolute;right:0;top:4px;font:500 16px/24px "Instrument Sans","Instrument Sans Placeholder",sans-serif;
        color:rgb(31,31,31);font-variant-numeric:tabular-nums;white-space:nowrap;pointer-events:none;
        opacity:0;translate:0 -6px;scale:.6;transform-origin:100% 50%;
        transition:opacity .35s ease,translate .5s cubic-bezier(.3,1.6,.5,1),scale .5s cubic-bezier(.3,1.6,.5,1);}
      .fx-score.fx-show{opacity:1;translate:0 0;scale:1;}
      .fx-score .fx-pts{margin-left:4px;}
      .fx-score .fx-num{display:inline-block;transform-origin:100% 60%;}
      .fx-back{all:unset;align-self:flex-start;cursor:pointer;color:rgb(104,104,112);
        font:500 14px/20px "Instrument Sans","Instrument Sans Placeholder",sans-serif;
        text-decoration:underline;text-decoration-color:rgba(104,104,112,.35);text-underline-offset:3px;transition:color .2s;}
      .fx-back:hover{color:rgb(31,31,31);}
      .fx-shop-foot{display:flex;gap:16px;margin-top:8px;}
      .fx-shop > .fx-up:first-child{margin-top:8px;}   /* spacing inside the shop, so it collapses with it */
      .fx-game [data-framer-name="Hero"] [data-framer-name="Footer"]{pointer-events:none !important;}
      .fx-game-full [data-framer-name="Hero"] [data-framer-name="Footer"]{display:none !important;}
      .fx-play > :not(.fx-av):not(.fx-shop):not(.fx-score):not(:has(.fx-av)){display:none !important;}
      .fx-shop{display:flex;flex-direction:column;gap:10px;overflow:hidden;align-self:stretch;width:100%;box-sizing:border-box;
        font:500 14px/20px "Instrument Sans","Instrument Sans Placeholder",sans-serif;color:rgb(31,31,31);}
      .fx-up{position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:8px;
        transition:padding-bottom .4s cubic-bezier(.45,0,.2,1);}
      .fx-up.fx-has-bar{padding-bottom:18px;}   /* room for the progress line, so the gap to the next row stays the same */
      .fx-up-name{font-size:16px;line-height:24px;}
      .fx-up-lvl{color:rgb(104,104,112);}
      .fx-up-info{color:rgb(104,104,112);font-size:14px;line-height:20px;font-variant-numeric:tabular-nums;}
      .fx-buy{all:unset;box-sizing:border-box;margin-left:auto;flex:none;height:32px;padding:0 12px;border-radius:999px;background:#f4f4f4;
        font:500 14px/32px "Instrument Sans","Instrument Sans Placeholder",sans-serif;color:rgb(31,31,31);
        white-space:nowrap;cursor:pointer;font-variant-numeric:tabular-nums;transition:background-color .2s,opacity .2s;}
      .fx-buy:hover{background:#ebebeb;}
      .fx-buy.fx-cant{opacity:.45;cursor:default;}
      .fx-buy.fx-max{cursor:default;opacity:.45;}
      .fx-buy.fx-max:hover{background:#f4f4f4;}
      .fx-buy.fx-cant:hover{background:#f4f4f4;}
      .fx-up-bar{position:absolute;left:0;right:0;bottom:8px;height:2px;border-radius:2px;background:rgba(31,31,31,.12);
        transform-origin:0 50%;scale:0 1;}
      .fx-float{position:absolute;right:0;top:0;font:700 13px/20px "Instrument Sans","Instrument Sans Placeholder",sans-serif;
        pointer-events:none;white-space:nowrap;}
      @keyframes fx-pop{from{scale:.3}to{scale:1}}
    `;
    document.head.appendChild(css);

    const world = document.createElement('div');
    world.className = 'fx-world';
    document.body.appendChild(world);

    const bodies = [];
    window.__fxEmoji = bodies;   // read by the dot grid
    let W = innerWidth, H = innerHeight;
    addEventListener('resize', () => { W = innerWidth; H = innerHeight; });

    /* pointer tracking for throws */
    const ptr = { x: 0, y: 0, vx: 0, vy: 0, t: 0 };
    let held = null;
    addEventListener('pointermove', e => {
      const now = performance.now(), dt = Math.max(1, now - ptr.t) / 1000;
      const k = 0.35;
      ptr.vx = ptr.vx * (1 - k) + ((e.clientX - ptr.x) / dt) * k;
      ptr.vy = ptr.vy * (1 - k) + ((e.clientY - ptr.y) / dt) * k;
      if (held) detectShake(e.clientX - ptr.x, e.clientY - ptr.y, now);
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = now;
    }, { passive: true });

    /* shake: several quick direction reversals while holding → dissolve */
    const SHAKE_FLIPS = 5, SHAKE_WINDOW = 700, SHAKE_MIN = 6;
    const shake = { sx: 0, sy: 0, flips: [] };
    function detectShake(dx, dy, now) {
      const axis = Math.abs(dx) > Math.abs(dy) ? 'sx' : 'sy';
      const mv = axis === 'sx' ? dx : dy;
      if (Math.abs(mv) < SHAKE_MIN) return;
      const sign = Math.sign(mv);
      if (shake[axis] && sign !== shake[axis]) shake.flips.push(now);
      shake[axis] = sign;
      while (shake.flips.length && now - shake.flips[0] > SHAKE_WINDOW) shake.flips.shift();
      if (shake.flips.length >= SHAKE_FLIPS) {
        const b = held;
        held = null;
        shake.flips.length = 0;
        dissolve(b);
        addCoins(Math.ceil(POINTS[b.tier] / 2), b.tier);   // dust pays half
      }
    }

    /* dissolve into drifting dust */
    const dust = document.createElement('canvas');
    dust.dataset.fx = 'dust';          // keeps the dot grid from adopting it
    Object.assign(dust.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
    world.appendChild(dust);
    const dctx = dust.getContext('2d');
    let grains = [], dustRaf = 0;
    function sizeDust() {
      const dpr = devicePixelRatio || 1;
      dust.width = innerWidth * dpr; dust.height = innerHeight * dpr;
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    sizeDust();
    addEventListener('resize', sizeDust);

    function dissolve(b) {
      const i = bodies.indexOf(b);
      if (i >= 0) bodies.splice(i, 1);
      b.el.remove();

      // rasterise the emoji as it looks right now
      const size = Math.ceil(b.d * 1.4);
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const cx = c.getContext('2d', { willReadFrequently: true });
      cx.translate(size / 2, size / 2);
      cx.rotate(b.a * Math.PI / 180);
      cx.font = `${b.d * 0.86}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      cx.fillText(b.el.textContent, 0, b.d * 0.04);
      const px = cx.getImageData(0, 0, size, size).data;

      const step = Math.max(1, Math.round(b.d / 60));     // fine 1px grains; coarser only for big emojis
      const ox = b.x - size / 2, oy = b.y - size / 2;
      const now = performance.now();
      for (let y = 0; y < size; y += step)
        for (let x = 0; x < size; x += step) {
          const k = (y * size + x) * 4;
          if (px[k + 3] < 40) continue;
          const u = x / size;                               // sweep left → right
          grains.push({
            x: ox + x, y: oy + y, s: step,
            c: `rgb(${px[k]},${px[k + 1]},${px[k + 2]})`,
            t0: now + (u * 0.55 + Math.random() * 0.35) * 1000,
            life: 900 + Math.random() * 900,
            vx: 25 + Math.random() * 70, vy: -30 - Math.random() * 60,
            wob: Math.random() * 6.28,
          });
        }
      if (!dustRaf) dustRaf = requestAnimationFrame(drawDust);
    }

    let lastDust = 0;
    function drawDust(now) {
      const dt = lastDust ? Math.min(0.033, (now - lastDust) / 1000) : 0.016;
      lastDust = now;
      dctx.clearRect(0, 0, innerWidth, innerHeight);
      grains = grains.filter(g => now < g.t0 + g.life);
      for (const g of grains) {
        const age = now - g.t0;
        if (age > 0) {
          const t = age / g.life;
          g.x += (g.vx + Math.sin(g.wob + age / 180) * 20) * dt;
          g.y += g.vy * dt;
          g.vx *= 1.01; g.vy *= 1.01;
          dctx.globalAlpha = (1 - t) ** 1.5;
          const s = g.s * (0.8 - t * 0.4);                 // grains shrink a little as soon as they fly
          dctx.fillStyle = g.c;
          dctx.fillRect(g.x, g.y, s, s);
        } else {
          dctx.globalAlpha = 1;                              // not yet released: still part of the emoji
          dctx.fillStyle = g.c;
          dctx.fillRect(g.x, g.y, g.s, g.s);
        }
      }
      dctx.globalAlpha = 1;
      if (grains.length) dustRaf = requestAnimationFrame(drawDust);
      else { dustRaf = 0; lastDust = 0; dctx.clearRect(0, 0, innerWidth, innerHeight); }
    }

    const release = () => {
      if (!held) return;
      const cap = 3500;
      held.vx = Math.max(-cap, Math.min(cap, ptr.vx));
      held.vy = Math.max(-cap, Math.min(cap, ptr.vy));
      if (performance.now() - ptr.t > 80) { held.vx *= 0.2; held.vy *= 0.2; } // held still, then let go
      held.el.classList.remove('fx-held');
      const el = held.el; setTimeout(() => el.classList.remove('fx-new'), 400);
      held.held = false;
      held = null;
    };
    addEventListener('pointerup', release);
    addEventListener('pointercancel', release);

    function grab(b, e) {
      e.preventDefault();
      if (held && held !== b) release();
      held = b;
      b.held = true;
      b.heldAt = performance.now();
      b.startD = b.d;
      b.el.classList.add('fx-held');
      shake.sx = shake.sy = 0; shake.flips.length = 0;
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.vx = ptr.vy = 0; ptr.t = performance.now();
    }

    function spawn(char, x, y, e) {
      const el = document.createElement('div');
      el.className = 'fx-body fx-new';
      el.textContent = char;
      world.appendChild(el);
      const b = { el, char, tier: tierOf.get(char) ?? 0, x: x + (Math.random() - 0.5) * 6, y, vx: (Math.random() - 0.5) * 120, vy: 0, a: 0, d: BASE, startD: BASE, held: false, heldAt: 0, born: performance.now(), auto: false };
      el.addEventListener('pointerdown', ev => grab(b, ev));
      bodies.push(b);
      if (bodies.length > LIMIT) bodies.shift().el.remove();
      if (e) grab(b, e);
      else setTimeout(() => el.classList.remove('fx-new'), 400);
      wake();
      return b;
    }

    /* rarity label next to the avatar */
    let labelEl = null;
    // confetti of mini copies — no gravity, just a burst that eases out and fades
    const BURST = [
      null,
      { n: 6,  dist: 50,  size: 14, dur: 700,  waves: 1 },   // Uncommon
      { n: 12, dist: 85,  size: 16, dur: 900,  waves: 1 },   // Rare
      { n: 22, dist: 125, size: 18, dur: 1100, waves: 2 },   // Epic
      { n: 40, dist: 180, size: 22, dur: 1500, waves: 3 },   // Legendary
    ];
    function burst(char, tier, x, y) {
      const cfg = BURST[tier];
      if (!cfg) return;
      for (let w = 0; w < cfg.waves; w++) {
        const count = Math.round(cfg.n * (1 - w * 0.3));
        const spin = Math.random() * Math.PI * 2;
        for (let i = 0; i < count; i++) {
          const a = spin + (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
          const dist = cfg.dist * (0.55 + Math.random() * 0.6) * (1 + w * 0.35);
          const size = cfg.size * (0.6 + Math.random() * 0.6);
          const s = document.createElement('span');
          s.textContent = char;
          Object.assign(s.style, { position: 'absolute', left: x + 'px', top: y + 'px', fontSize: size + 'px',
            lineHeight: 1, pointerEvents: 'none', translate: '-50% -50%' });
          world.appendChild(s);
          const rot = (Math.random() - 0.5) * 360;
          s.animate([
            { transform: 'translate(0,0) scale(.2) rotate(0deg)', opacity: 1 },
            { transform: `translate(${Math.cos(a) * dist * 0.8}px,${Math.sin(a) * dist * 0.8}px) scale(1) rotate(${rot * 0.7}deg)`, opacity: 1, offset: 0.45 },
            { transform: `translate(${Math.cos(a) * dist}px,${Math.sin(a) * dist}px) scale(.6) rotate(${rot}deg)`, opacity: 0 },
          ], { duration: cfg.dur * (0.8 + Math.random() * 0.4), delay: w * 140, easing: 'cubic-bezier(.12,.8,.25,1)', fill: 'backwards' })
            .finished.then(() => s.remove());
        }
      }
    }

    /* ───── celebrations: the rarer, the louder ───── */
    const SOUND = true;                                  // soft synth chime on Rare and up
    const GLOW = [null, null, '47,111,224', '138,62,224', '242,190,60'];
    let timeScale = 1;
    const celebCss = document.createElement('style');
    celebCss.textContent = `
      .fx-flash{position:fixed;inset:0;pointer-events:none;z-index:9998;}
      .fx-show-wrap{position:fixed;inset:0;display:grid;place-items:center;pointer-events:none;z-index:10000;}
      .fx-show-card{display:grid;justify-items:center;gap:10px;}
      .fx-show-emoji{font-size:120px;line-height:1;filter:drop-shadow(0 12px 30px rgba(0,0,0,.18));}
      .fx-show-name{font:700 22px/1 "Instrument Sans","Instrument Sans Placeholder",sans-serif;letter-spacing:.14em;
        text-transform:uppercase;color:transparent;-webkit-background-clip:text;background-clip:text;
        background-size:250% 100%;animation:fx-wave 1.4s linear infinite;}
      .fx-show-name[data-tier="3"]{background-image:linear-gradient(100deg,#8a3ee0 0%,#8a3ee0 30%,#e08bff 45%,#6a8bff 55%,#8a3ee0 70%,#8a3ee0 100%);}
      .fx-show-name[data-tier="4"]{background-image:linear-gradient(100deg,#b8860b 0%,#b8860b 30%,#ffe27a 45%,#fff6cf 50%,#ffe27a 55%,#b8860b 70%,#b8860b 100%);}
      .fx-show-odds{font:500 14px/1 "Instrument Sans","Instrument Sans Placeholder",sans-serif;color:rgb(104,104,112);}
      .fx-rays{position:absolute;width:520px;height:520px;border-radius:50%;
        background:repeating-conic-gradient(from 0deg,rgba(var(--c),.22) 0deg 7deg,transparent 7deg 20deg);
        -webkit-mask:radial-gradient(circle,#000 20%,transparent 68%);mask:radial-gradient(circle,#000 20%,transparent 68%);
        animation:fx-spin 9s linear infinite;}
      @keyframes fx-spin{to{rotate:360deg}}
    `;
    document.head.appendChild(celebCss);

    function celebrate(tier, x, y, char) {
      if (tier < 2) return;
      chime(tier);
      if (REDUCED) return;                       // keep label, confetti and sound; skip flash, shake and slow-mo
      flash(tier, x, y);
      screenShake([0, 0, 3, 7, 12][tier]);
      if (tier >= 3) { slowmo(tier === 4 ? 1.1 : 0.6); showcase(tier, char); }
    }

    function flash(tier, x, y) {
      const f = document.createElement('div');
      f.className = 'fx-flash';
      const r = [0, 0, 55, 80, 120][tier];
      f.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(${GLOW[tier]},.35), rgba(${GLOW[tier]},.12) ${r * 0.4}vmax, transparent ${r}vmax)`;
      document.body.appendChild(f);
      f.animate([{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 0 }],
        { duration: [0, 0, 700, 1000, 1500][tier], easing: 'ease-out' }).finished.then(() => f.remove());
    }

    function screenShake(px) {
      const main = document.getElementById('main') || document.body.firstElementChild;
      const kf = [];
      for (let i = 0; i < 8; i++) {
        const k = px * (1 - i / 8);
        kf.push({ translate: `${(Math.random() - 0.5) * 2 * k}px ${(Math.random() - 0.5) * 2 * k}px` });
      }
      kf.push({ translate: '0 0' });
      for (const el of [main, world]) el && el.animate(kf, { duration: 420, easing: 'linear' });
    }

    let slowTween = 0;
    function slowmo(sec) {
      cancelAnimationFrame(slowTween);
      const t0 = performance.now();
      const tick = now => {
        const k = Math.min(1, (now - t0) / (sec * 1000));
        timeScale = 0.12 + 0.88 * k * k;                     // freeze-frame, then ease back to real time
        if (k < 1) slowTween = requestAnimationFrame(tick); else timeScale = 1;
      };
      slowTween = requestAnimationFrame(tick);
    }

    function showcase(tier, char) {
      const wrap = document.createElement('div');
      wrap.className = 'fx-show-wrap';
      wrap.innerHTML = `
        ${tier === 4 ? `\x3Cdiv class="fx-rays" style="--c:${GLOW[4]}">\x3C/div>` : ''}
        \x3Cdiv class="fx-show-card">
          \x3Cdiv class="fx-show-emoji">${char}\x3C/div>
          \x3Cdiv class="fx-show-name" data-tier="${tier}">${TIERS[tier].name}\x3C/div>
          \x3Cdiv class="fx-show-odds">${pct(odds()[tier])} chance\x3C/div>
        \x3C/div>`;
      document.body.appendChild(wrap);
      const base = tier === 4 ? 1900 : 1200, EXTRA = 1000;       // pop-in/out keep their pace; the pause grows by 1s
      const hold = base + EXTRA, o = t => (t * base) / hold, h = t => (t * base + EXTRA) / hold;
      const card = wrap.querySelector('.fx-show-card');
      card.animate([
        { scale: 0.2, opacity: 0, rotate: '-12deg' },
        { scale: 1.12, opacity: 1, rotate: '4deg', offset: o(0.18) },
        { scale: 1, opacity: 1, rotate: '0deg', offset: o(0.3) },
        { scale: 1, opacity: 1, offset: h(0.82) },
        { scale: 0.6, opacity: 0, translate: '0 -30px' },
      ], { duration: hold, easing: 'cubic-bezier(.3,1.3,.5,1)' }).finished.then(() => wrap.remove());
      const rays = wrap.querySelector('.fx-rays');
      if (rays) rays.animate([{ opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, offset: o(0.25) }, { opacity: 1, offset: h(0.8) }, { opacity: 0, scale: 1.2 }],
        { duration: hold, easing: 'ease-out' });
    }

    let audio = null;
    let lastChime = 0, lastChimeTier = 0;
    let soundOn = SOUND && !saved.muted;
    function chime(tier) {
      if (!soundOn) return;
      const now = performance.now();
      if (now - lastChime < 350 && tier <= lastChimeTier) return;   // no pile-ups of sound
      lastChime = now; lastChimeTier = tier;
      try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        const notes = [[], [], [659, 784, 988], [523, 659, 784, 1047], [523, 659, 784, 1047, 1319, 1568]][tier];
        const t = audio.currentTime + 0.01;
        notes.forEach((f, i) => {
          const o = audio.createOscillator(), g = audio.createGain();
          o.type = 'sine';
          o.frequency.value = f;
          const at = t + i * (tier === 4 ? 0.07 : 0.09);
          g.gain.setValueAtTime(0, at);
          g.gain.linearRampToValueAtTime(0.07, at + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, at + 0.6 + tier * 0.1);
          o.connect(g).connect(audio.destination);
          o.start(at);
          o.stop(at + 0.8 + tier * 0.1);
        });
      } catch (_) {}
    }

    function announce(tier, x, y, char) {
      if (tier < 1 || !labelEl) return;                        // Uncommon and up
      if (x != null) { burst(char, tier, x, y); celebrate(tier, x, y, char); }
      const t = TIERS[tier];
      labelEl.textContent = `${t.name} · ${pct(odds()[tier])}`;
      labelEl.dataset.tier = tier;
      labelEl.classList.add('fx-show');                       // stays until the next avatar click
    }
    const hideLabel = () => labelEl && labelEl.classList.remove('fx-show');

    /* points counter — appears on the first drop */
    const POINTS = [1, 5, 25, 100, 1000];
    // 999 → 999, 1000 → 1k, 1150 → 1.1k, 25400 → 25.4k, 1.2M … (rounded down so it never overstates)
    const short = n => {
      const unit = n >= 1e9 ? [1e9, 'B'] : n >= 1e6 ? [1e6, 'M'] : n >= 1e3 ? [1e3, 'k'] : null;
      if (!unit) return String(n);
      const v = Math.floor(n / unit[0] * 10) / 10;
      return (v >= 100 ? Math.floor(v) : v) + unit[1];
    };
    const TIER_INK = ['#b08a00', '#2f9e5b', '#2f6fe0', '#8a3ee0', '#c98a12'];
    let scoreEl = null, numEl = null, score = Math.max(0, saved.coins | 0), shown = score, tween = 0;
    let saveTimer = 0;
    function save() {                                          // batched, so auto-drops don't write every second
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveNow, 400);
    }
    function saveNow() {
      clearTimeout(saveTimer);
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ coins: score, auto: game.auto, luck: game.luck, muted: !soundOn })); } catch (e) {}
    }
    addEventListener('pagehide', saveNow);
    function mountScore(row) {
      scoreEl = document.createElement('div');
      scoreEl.className = 'fx-score';
      scoreEl.innerHTML = `\x3Cspan class="fx-num">${short(score)}\x3C/span>\x3Cspan class="fx-pts">coins\x3C/span>`;
      numEl = scoreEl.querySelector('.fx-num');
      row.appendChild(scoreEl);
    }
    function countTo(to, dur) {
      const from = shown, t0 = performance.now();
      cancelAnimationFrame(tween);
      const tick = now => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - (1 - k) ** 3;
        shown = Math.round(from + (to - from) * e);
        numEl.textContent = short(shown);
        if (k < 1) tween = requestAnimationFrame(tick);
      };
      tween = requestAnimationFrame(tick);
    }
    let started = false;
    let playing = false;
    let welcomed = false;
    function award(tier) {
      if (!scoreEl) return;
      if (!started) {
        started = true; scoreEl.classList.add('fx-show');
        if (returning && !welcomed && tier < 1 && labelEl) {       // first drop of a return visit
          welcomed = true;
          delete labelEl.dataset.tier;
          labelEl.textContent = 'Welcome back';
          labelEl.classList.add('fx-show');
        }
      }
      if (!playing) openShop();
      addCoins(POINTS[tier], tier);
    }
    function addCoins(gain, tier) {
      if (!scoreEl || !gain) return;
      score += gain;
      countTo(score, Math.min(900, 350 + tier * 150));
      updateShop();
      save();

      // bump — bigger for rarer
      const amp = [1.18, 1.3, 1.45, 1.6, 1.9][tier];
      numEl.animate([{ scale: 1 }, { scale: amp, offset: 0.3 }, { scale: 1 }],
        { duration: 450 + tier * 120, easing: 'cubic-bezier(.3,1.6,.5,1)' });
      if (tier >= 1) numEl.animate([{ color: TIER_INK[tier] }, { color: TIER_INK[tier], offset: 0.6 }, { color: 'rgb(31,31,31)' }],
        { duration: 900 + tier * 300 });
      if (tier >= 3) scoreEl.animate([{ rotate: '0deg' }, { rotate: '-6deg' }, { rotate: '5deg' }, { rotate: '-3deg' }, { rotate: '0deg' }],
        { duration: 500 });

      // floating +N
      const f = document.createElement('span');
      f.className = 'fx-float';
      f.textContent = '+' + short(gain);
      f.style.color = TIER_INK[tier];
      f.style.fontSize = 12 + tier * 2 + 'px';
      scoreEl.appendChild(f);
      const drift = (Math.random() - 0.5) * 16;
      f.animate([
        { transform: 'translate(0, 4px) scale(.6)', opacity: 0 },
        { transform: `translate(${drift * 0.4}px, -14px) scale(1.1)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${drift}px, -${30 + tier * 6}px) scale(1)`, opacity: 0 },
      ], { duration: 900 + tier * 150, easing: 'cubic-bezier(.2,.7,.3,1)' }).finished.then(() => f.remove());
    }

    /* ───── shop: power-ups that appear under the avatar after the first drop ───── */
    const MAX_LVL = 10;
    const UPGRADES = {
      auto: {
        name: 'Auto-drop',
        cost: lvl => Math.round(40 * 2.2 ** lvl),
        every: lvl => 2 * 0.88 ** (lvl - 1),                          // seconds between drops (12% faster per level)
        info: lvl => lvl ? `Every ${+UPGRADES.auto.every(lvl).toFixed(1)}s` + (lvl < MAX_LVL ? ` → ${+UPGRADES.auto.every(lvl + 1).toFixed(1)}s` : '')
                         : 'Drops an emoji every 2s',
      },
      luck: {
        name: 'Luck',
        cost: lvl => Math.round(60 * 2.4 ** lvl),
        info: lvl => {
          const now = odds(); game.luck++; const next = odds(); game.luck--;
          const rare = o => o.slice(2).reduce((a, b) => a + b, 0);
          return lvl >= MAX_LVL ? `Rare+ ${pct(rare(now))}` : `Rare+ ${pct(rare(now))} → ${pct(rare(next))}`;
        },
      },
    };
    let shopEl = null, shopRow = null;
    // Framer sometimes wraps the avatar in a display:contents layer — find the real column and the avatar's slot in it
    function slotOf(av) {
      let anchor = av, col = av.parentElement;
      while (col && col.parentElement && getComputedStyle(col).display === 'contents') { anchor = col; col = col.parentElement; }
      return { col, anchor };
    }
    function mountShop(row, avatar) {
      shopRow = row;
      if (!shopEl) {
        shopEl = document.createElement('div');
        shopEl.className = 'fx-shop';
        shopEl.innerHTML = Object.entries(UPGRADES).map(([k, u]) => `
          \x3Cdiv class="fx-up" data-k="${k}">
            \x3Cdiv class="fx-up-txt">\x3Cdiv class="fx-up-name">${u.name}\x3Cspan class="fx-up-lvl">\x3C/span>\x3C/div>\x3Cdiv class="fx-up-info">\x3C/div>\x3C/div>
            \x3Cbutton class="fx-buy" type="button">\x3Cspan class="fx-buy-cost">\x3C/span> coins\x3C/button>
            ${k === 'auto' ? '\x3Ci class="fx-up-bar">\x3C/i>' : ''}
          \x3C/div>`).join('') + '\x3Cdiv class="fx-shop-foot">\x3Cbutton class="fx-back" type="button">Back to portfolio\x3C/button>\x3Cbutton class="fx-back fx-mute" type="button">Mute\x3C/button>' +
          (MOTION_ASK ? '\x3Cbutton class="fx-back fx-shake" type="button">Shake to clear\x3C/button>' : '') + '\x3C/div>';
        shopEl.querySelectorAll('.fx-up').forEach(r => r.querySelector('.fx-buy').addEventListener('click', () => buy(r.dataset.k, r)));
        shopEl.querySelector('.fx-back:not(.fx-mute):not(.fx-shake)').addEventListener('click', closeGame);
        const shake = shopEl.querySelector('.fx-shake');
        if (shake) shake.addEventListener('click', () => enableShake(shake), { once: true });
        const mute = shopEl.querySelector('.fx-mute');
        mute.addEventListener('click', () => { soundOn = !soundOn; mute.textContent = soundOn ? 'Mute' : 'Unmute'; saveNow(); if (soundOn) chime(2); });
        mute.textContent = soundOn ? 'Mute' : 'Unmute';
      }
      if (playing && !shopEl.isConnected) { slotOf(avatar).anchor.after(shopEl); row.classList.add('fx-play'); }  // Framer re-rendered the row
    }
    let avatarEl = null;
    /* layout swaps: fade out → heights swap in one motion → fade in (no jumps, no down-then-up) */
    const SWAP = 420, FADE = 180, EASE = 'cubic-bezier(.45,0,.2,1)';
    const gapOf = el => parseFloat(getComputedStyle(el.parentElement).rowGap) || 0;
    // only ever cancel our own animations — Framer runs its own appear animations on these elements
    const mine = new WeakSet();
    const own = a => {
      mine.add(a);
      // browsers auto-discard older finished animations that ours override — keep Framer's so they come back when ours end
      a.effect && a.effect.target && a.effect.target.getAnimations().forEach(x => !mine.has(x) && x.persist && x.persist());
      return a;
    };
    function shrink(el, delay) {
      const h = el.offsetHeight, g = gapOf(el);
      el.style.overflow = 'hidden';
      return own(el.animate([{ height: h + 'px', marginTop: '0px' }, { height: '0px', marginTop: -g + 'px' }],
        { duration: SWAP, delay, easing: EASE, fill: 'forwards' })).finished;
    }
    function grow(el, delay) {
      const h = el.offsetHeight, g = gapOf(el);
      el.style.overflow = 'hidden';
      return own(el.animate([{ height: '0px', marginTop: -g + 'px' }, { height: h + 'px', marginTop: '0px' }],
        { duration: SWAP, delay, easing: EASE, fill: 'backwards' })).finished.then(() => { el.style.overflow = ''; });
    }
    const fadeOut = (el, delay = 0) => own(el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE, delay, easing: 'ease-in', fill: 'forwards' }));
    const fadeIn = (el, delay = 0) => own(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay, easing: 'ease-out', fill: 'backwards' }));
    const settle = el => { el.getAnimations().forEach(a => mine.has(a) && a.cancel()); el.style.overflow = ''; };
    const footerOf = () => {
      const hero = avatarEl && avatarEl.closest('[data-framer-name="Hero"]');
      return hero && [...hero.querySelectorAll('[data-framer-name="Footer"]')].find(f => f.offsetHeight > 0);
    };
    // Framer renders one Hero per breakpoint — always work with the avatar that is actually on screen
    const visibleAvatar = () => [...document.querySelectorAll('.fx-av')].find(a => a.offsetWidth > 0) || avatarEl;
    const introOf = (row, anchor) => [...row.children].filter(c => c !== anchor && c !== shopEl && !c.classList.contains('fx-score'));

    function openShop() {
      avatarEl = visibleAvatar();
      if (!shopEl || !avatarEl) return;
      playing = true;
      document.body.classList.add('fx-game', 'fx-playing');
      const { col: row, anchor } = slotOf(avatarEl);
      const intro = introOf(row, anchor), foot = footerOf();
      // 1) intro + footer links fade out
      [...intro, foot].filter(Boolean).forEach(el => fadeOut(el));
      // 2) intro and footer close while the shop opens — one continuous height change
      anchor.after(shopEl);
      settle(shopEl);                                   // clear anything left from a previous close
      updateShop();
      if (game.auto) startAuto();                       // saved auto-drop picks up again
      intro.forEach(c => shrink(c, FADE).then(() => { if (playing) row.classList.add('fx-play'); settle(c); }));
      if (foot) shrink(foot, FADE).then(() => { if (playing) document.body.classList.add('fx-game-full'); settle(foot); });
      grow(shopEl, FADE);
      // 3) shop content fades in as it lands
      shopEl.querySelectorAll('.fx-up, .fx-shop-foot').forEach((r, i) => r.animate(
        [{ opacity: 0, translate: '0 8px' }, { opacity: 1, translate: '0 0' }],
        { duration: 380, delay: FADE + SWAP - 160 + i * 70, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
    }
    // leave the game: fold it away, clear the pile, stop auto-drop, bring the intro back (coins and levels are kept)
    function closeGame() {
      if (!playing || !shopEl) return;
      playing = false;
      started = false;
      document.body.classList.remove('fx-playing');
      hideLabel();
      clearTimeout(autoTimer);
      saveNow();
      scoreEl.classList.remove('fx-show');
      if (held) release();
      for (const b of bodies.splice(0)) {
        b.el.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.4 }],
          { duration: 350, delay: Math.random() * 250, easing: 'ease-in', fill: 'forwards' }).finished.then(() => b.el.remove());
      }
      world.querySelectorAll('.fx-body').forEach(el => el.isConnected && !el.getAnimations().length && el.remove());   // any stragglers
      avatarEl.classList.remove('fx-av-on');
      document.querySelectorAll('.fx-av').forEach(a => a.__fx && a.__fx.setFace(fromTier(0)));   // next game starts with a Common too

      avatarEl = visibleAvatar();
      const { col: row, anchor } = slotOf(avatarEl);
      // 1) shop content fades out
      fadeOut(shopEl);
      // 2) shop closes while the intro and footer links reopen (still invisible)
      document.querySelectorAll('.fx-play').forEach(c => c.classList.remove('fx-play'));   // every breakpoint's copy
      document.body.classList.remove('fx-game-full');
      const intro = introOf(row, anchor), foot = footerOf();
      shrink(shopEl, FADE).then(() => { if (!playing) { settle(shopEl); shopEl.remove(); } });   // reset while still in the page
      [...intro, foot].filter(Boolean).forEach((el, i) => {
        grow(el, FADE);
        // 3) then fade back in
        fadeIn(el, FADE + SWAP - 120 + i * 60).finished.then(() => el === foot && document.body.classList.remove('fx-game'));
      });
      if (!foot) document.body.classList.remove('fx-game');
    }
    function updateShop() {
      if (!shopEl) return;
      shopEl.querySelectorAll('.fx-up').forEach(r => {
        const k = r.dataset.k, u = UPGRADES[k], lvl = game[k], cost = u.cost(lvl);
        r.querySelector('.fx-up-lvl').textContent = lvl ? ` · ${lvl}` : '';
        r.classList.toggle('fx-has-bar', k === 'auto' && lvl > 0);
        r.querySelector('.fx-up-info').textContent = u.info(lvl);
        const maxed = lvl >= MAX_LVL, btn = r.querySelector('.fx-buy');
        btn.innerHTML = maxed ? 'Max' : `\x3Cspan class="fx-buy-cost">${short(cost)}\x3C/span> coins`;
        btn.classList.toggle('fx-max', maxed);
        btn.disabled = maxed;
        btn.classList.toggle('fx-cant', !maxed && score < cost);
      });
    }
    function buy(k, row) {
      if (game[k] >= MAX_LVL) return;
      const cost = UPGRADES[k].cost(game[k]);
      const btn = row.querySelector('.fx-buy');
      if (score < cost) {
        btn.animate([{ translate: '0 0' }, { translate: '-4px 0' }, { translate: '4px 0' }, { translate: '-2px 0' }, { translate: '0 0' }], { duration: 300 });
        return;
      }
      score -= cost;
      countTo(score, 500);
      game[k]++;
      if (k === 'auto') startAuto();
      updateShop();
      saveNow();
      btn.animate([{ scale: 1 }, { scale: 1.15, offset: 0.35 }, { scale: 1 }], { duration: 450, easing: 'cubic-bezier(.3,1.6,.5,1)' });
      row.querySelector('.fx-up-lvl').animate([{ opacity: 0, scale: .4 }, { opacity: 1, scale: 1 }], { duration: 400, easing: 'cubic-bezier(.3,1.6,.5,1)' });
      const f = document.createElement('span');
      f.className = 'fx-float';
      f.textContent = '−' + short(cost);
      f.style.color = '#686870';
      scoreEl.appendChild(f);
      f.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(0,22px)', opacity: 0 }],
        { duration: 800, easing: 'cubic-bezier(.2,.7,.3,1)' }).finished.then(() => f.remove());
    }

    /* auto-drop loop */
    let autoTimer = 0;
    function startAuto() {
      clearTimeout(autoTimer);
      const ms = UPGRADES.auto.every(game.auto) * 1000;
      const bar = shopEl && shopEl.querySelector('.fx-up-bar');
      if (bar) bar.animate([{ scale: '0 1' }, { scale: '1 1' }], { duration: ms, easing: 'linear' });
      autoTimer = setTimeout(() => {
        if (!document.hidden && playing) drop(null, true);
        startAuto();
      }, ms);
    }

    /* one drop from the avatar — by hand (with a pointer event) or by the auto-dropper */
    let faceEl = null, setFaceFn = null;
    function drop(e, auto) {
      if (auto) { const v = visibleAvatar(); if (v && v.__fx) ({ av: avatarEl, face: faceEl, setFace: setFaceFn, label: labelEl } = v.__fx); }
      if (!avatarEl || !faceEl) return;
      hideLabel();                                             // label always refers to the latest drop
      const r = avatarEl.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const b = spawn(faceEl.textContent, cx, cy, e || undefined);
      if (e && TOUCH) avatarEl.classList.add('fx-av-on');     // phones have no hover: keep the next emoji visible
      if (auto) {
        b.auto = true;
        b.vx = (Math.random() - 0.3) * 500;
        b.vy = -350 - Math.random() * 250;
        avatarEl.animate([{ scale: 1 }, { scale: 0.85, offset: 0.3 }, { scale: 1 }], { duration: 350, easing: 'cubic-bezier(.3,1.6,.5,1)' });
      }
      announce(b.tier, cx, cy, b.char);
      award(b.tier);
      setFaceFn(roll(faceEl.textContent));
      if (playing) own(faceEl.animate([{ scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1 }],
        { duration: 380, delay: 90, easing: 'cubic-bezier(.3,1.6,.5,1)', fill: 'backwards' }));
    }

    /* tidy-up: auto-dropped Commons fade to dust after 20s */
    setInterval(() => {
      const now = performance.now();
      let n = 0;
      for (const b of [...bodies]) {
        if (n >= 3) break;
        if (b.auto && b.tier === 0 && !b.held && now - b.born > 20000) { dissolve(b); n++; }
      }
    }, 1000);

    /* phones: shake the device and every emoji vanishes */
    function clearAll() {
      if (held) release();
      const list = [...bodies].sort(() => Math.random() - 0.5);
      list.forEach((b, i) => {
        const wait = Math.min(i * 25, 700);
        if (i < 12) setTimeout(() => bodies.includes(b) && dissolve(b), wait);   // the first dozen turn to dust
        else {                                                                  // the rest just fade, to keep phones smooth
          const k = bodies.indexOf(b); if (k >= 0) bodies.splice(k, 1);
          b.el.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.4 }],
            { duration: 320, delay: wait, easing: 'ease-in', fill: 'forwards' }).finished.then(() => b.el.remove());
        }
      });
      if (navigator.vibrate) navigator.vibrate(30);
    }
    let motionOn = false;
    function listenForShake() {
      if (motionOn || !('DeviceMotionEvent' in window)) return;
      motionOn = true;
      let lastA = null, hits = [], cool = 0;
      addEventListener('devicemotion', e => {
        const a = e.accelerationIncludingGravity;
        if (!a || a.x == null) return;
        if (lastA) {
          const jolt = Math.abs(a.x - lastA.x) + Math.abs(a.y - lastA.y) + Math.abs(a.z - lastA.z);
          const now = performance.now();
          if (jolt > 28) hits.push(now);
          hits = hits.filter(t => now - t < 900);
          if (hits.length >= 3 && now > cool && bodies.length) { hits = []; cool = now + 1500; clearAll(); }
        }
        lastA = { x: a.x, y: a.y, z: a.z };
      });
    }
    // iPhones only share motion after the visitor allows it, and the request has to come from a tap —
    // so there it sits behind a "Shake to clear" link in the game; other phones just listen
    const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const CAN_ASK = window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function';
    const MOTION_ASK = TOUCH && IOS && CAN_ASK;
    let motionAsked = false;
    function askForMotion() {                            // other phones: start listening on the first tap, no prompt
      if (motionOn || motionAsked || !TOUCH || MOTION_ASK) return;
      motionAsked = true;
      if (CAN_ASK) DeviceMotionEvent.requestPermission().then(r => r === 'granted' && listenForShake()).catch(() => {});
      else listenForShake();
    }
    function enableShake(btn) {
      const gone = () => btn.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).finished.then(() => btn.remove());
      DeviceMotionEvent.requestPermission()
        .then(r => { if (r === 'granted') listenForShake(); gone(); })   // declined: iOS won't ask again this visit, so the link goes too
        .catch(gone);
    }

    /* avatar */
    const seen = new WeakSet();
    const onHome = () => location.pathname === '/' || location.pathname === '';   // the game lives on the homepage only
    const scan = () => onHome() && document.querySelectorAll('[data-framer-name="Hero"] img').forEach(img => {
      const r = img.getBoundingClientRect();
      if (!r.width || r.width > 48) return;
      // the avatar box: the outermost ancestor that is still the photo's size (works for components and plain Image layers)
      let av = img.parentElement;
      for (let n = img.parentElement; n && n !== document.body; n = n.parentElement) {
        const q = n.getBoundingClientRect();
        if (Math.abs(q.width - r.width) <= 2 && Math.abs(q.height - r.height) <= 2) av = n; else break;
      }
      if (!av || seen.has(av)) return;
      // one game per photo: never set up an avatar inside (or around) one that is already set up
      if (img.__fx || av.closest('.fx-av') || av.querySelector('.fx-av')) return;
      img.__fx = true;
      if (getComputedStyle(av).position === 'static') av.style.position = 'relative';
      seen.add(av);
      av.classList.add('fx-av');
      const face = document.createElement('span');
      face.className = 'fx-av-emoji';
      av.appendChild(face);
      const label = document.createElement('span');
      label.className = 'fx-rarity';
      av.appendChild(label);
      labelEl = label;
      const { col } = slotOf(av);
      if (!scoreEl) mountScore(col);
      else if (!scoreEl.isConnected) col.appendChild(scoreEl);   // Framer re-rendered the row
      const setFace = char => {
        face.textContent = char;
        const tier = tierOf.get(char) ?? 0;
        face.classList.toggle('fx-legend', tier === 4);
        face.style.backgroundColor = tier === 4 ? '' : TIERS[tier].tint;
      };
      setFace(fromTier(0));                              // before a game starts the avatar only offers Commons
      avatarEl = av; faceEl = face; setFaceFn = setFace;
      mountShop(col, av);
      av.addEventListener('pointerenter', () => { if (!playing) setFace(fromTier(0, face.textContent)); av.classList.add('fx-av-on'); });
      av.addEventListener('pointerleave', () => av.classList.remove('fx-av-on'));
      av.__fx = { av, face, setFace, label };
      av.addEventListener('click', askForMotion);
      av.addEventListener('pointerdown', e => { avatarEl = av; faceEl = face; setFaceFn = setFace; labelEl = label; drop(e, false); });
    });
    scan();
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });

    /* physics */
    let raf = 0, last = 0, still = 0;
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };

    function step(dt) {
      const now = performance.now();
      for (const b of bodies) {
        if (b.held) {
          const t = Math.max(0, now - b.heldAt - GROW_DELAY) / GROW_TIME;
          const ease = 1 - (1 - Math.min(1, t)) ** 2;
          b.d = b.startD + (Math.max(MAX, b.startD) - b.startD) * ease;
          b.vx = (ptr.x - b.x) / dt * 0.5; b.vy = (ptr.y - b.y) / dt * 0.5;
          b.x = ptr.x; b.y = ptr.y;
          continue;
        }
        b.vy += GRAVITY * dt;
        b.x += b.vx * dt; b.y += b.vy * dt;
        const r = b.d / 2;
        if (b.y + r > H) { b.y = H - r; b.vy = Math.abs(b.vy) > 60 ? -b.vy * BOUNCE : 0; b.vx *= 0.985; }
        if (b.y - r < 0 && b.vy < 0) { b.y = r; b.vy *= -BOUNCE; }
        if (b.x - r < 0) { b.x = r; b.vx = Math.abs(b.vx) * BOUNCE; }
        if (b.x + r > W) { b.x = W - r; b.vx = -Math.abs(b.vx) * BOUNCE; }
      }
      // circle collisions
      for (let i = 0; i < bodies.length; i++) {
        const A = bodies[i];
        for (let j = i + 1; j < bodies.length; j++) {
          const B = bodies[j];
          const dx = B.x - A.x, dy = B.y - A.y;
          const min = (A.d + B.d) / 2 * 0.92;          // slight overlap reads as softer emoji edges
          const d2 = dx * dx + dy * dy;
          if (d2 >= min * min) continue;
          let d = Math.sqrt(d2), nx, ny;
          if (d < 0.01) { const a = Math.random() * Math.PI * 2; nx = Math.cos(a); ny = Math.sin(a); d = 0; }
          else { nx = dx / d; ny = dy / d; }
          const over = min - d;
          const ma = A.held ? Infinity : A.d * A.d, mb = B.held ? Infinity : B.d * B.d;
          const wa = A.held ? 0 : (B.held ? 1 : mb / (ma + mb));
          const wb = B.held ? 0 : (A.held ? 1 : ma / (ma + mb));
          A.x -= nx * over * wa; A.y -= ny * over * wa;
          B.x += nx * over * wb; B.y += ny * over * wb;
          const rel = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
          if (rel < 0) {
            const imp = -(1 + BOUNCE) * rel;
            if (!A.held) { A.vx -= nx * imp * wa; A.vy -= ny * imp * wa; }
            if (!B.held) { B.vx += nx * imp * wb; B.vy += ny * imp * wb; }
          }
        }
      }
    }

    function loop(now) {
      const frame = Math.min(0.033, (now - last) / 1000) * timeScale;
      last = now;
      const SUB = 4;
      for (let s = 0; s < SUB; s++) step(frame / SUB);
      let moving = false;
      for (const b of bodies) {
        if (!b.held) b.a += (b.vx * frame) / (b.d / 2) * 57.3 * 0.6;   // roll
        if (b.held || Math.abs(b.vx) > 2 || Math.abs(b.vy) > 2) moving = true;
        if (b.sz !== b.d) {                                   // size only changes while held — skip the layout work otherwise
          b.sz = b.d;
          b.el.style.width = b.el.style.height = b.d + 'px';
          b.el.style.fontSize = b.d * 0.86 + 'px';
        }
        const tf = `translate(${(b.x - b.d / 2).toFixed(1)}px, ${(b.y - b.d / 2).toFixed(1)}px) rotate(${b.a.toFixed(1)}deg)`;
        if (b.tf !== tf) { b.tf = tf; b.el.style.transform = tf; }   // resting emojis aren't touched at all
      }
      if (moving) dispatchEvent(new Event('fx-emoji-tick'));   // lets the DotGridRepel component react
      still = moving ? 0 : still + 1;
      raf = still < 45 ? requestAnimationFrame(loop) : 0;
    }
    addEventListener('resize', wake);
  }

  const start = () => emojiDrop();
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', start) : start();
})();
