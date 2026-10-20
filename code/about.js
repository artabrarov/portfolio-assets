/*  About sheet for arthurabrarov.com
    Loaded on the live site from GitHub Pages (code/about.min.js) through one script tag in
    Framer: Site Settings, General, Custom Code, end of body. Edit this file, rebuild the .min.js, push.
    The Hero's About button (a Secondary button labelled "About", linked to #about) opens a white sheet in the middle of
    the screen, on the page's grey: a short bio, the companies I've worked at, and ways to get in touch.
    Close, a click on the grey, Esc, or on phones and tablets a swipe down closes it. Opening /#about (or any page with #about) opens it straight away.
    Keyboard: focus moves into the sheet, Tab stays inside it, and focus returns to the About button on close.
    The sheet is drawn from the site's Framer styles: the cards' White colour style and corners, the Hero's text styles,
    and the Secondary button's look, so tweaks in Framer reach it. */
(() => {
  if (window.__about) return;              // run once, even with Framer's page transitions
  window.__about = true;

  // ---- content: edit here ----
  const CONTENT = {
    name: 'Arthur Abrarov',
    // the photo at the top of the sheet (in this repo, about/); empty shows the homepage avatar instead
    photo: 'https://artabrarov.github.io/portfolio-assets/about/arthur.jpg',
    photoAlt: 'Arthur outside the National Museum of Scotland',
    role: '',                              // a line under the name; empty hides it
    bio: [
      "I'm a product designer based in London. I love fast-paced teams full of people I can learn from, where we work hard and have a lot of fun along the way.",
      "Currently, I'm leading Apron Card, wearing both the design and the product hat. I also help look after our design system and mobile app, so things feel consistent across the product.",
      "Before that, I helped launch and scale Joompay, a consumer banking app, and learned the ropes of design at Redmadrobot. My degree is in international business, and I hold a UK Global Talent visa.",
    ],
    // company, role, years
    work: [
      { company: 'Apron', role: 'Product & Design', years: '2022–now' },
      { company: 'Joompay', role: 'Founding Designer', years: '2020–2022' },
      { company: 'Redmadrobot', role: 'Product Designer', years: '2019–2020' },
    ],
    // the bio's last line: "Reach out by email or LinkedIn." (either left empty drops out of the sentence)
    email: 'hello@arthurabrarov.com',
    linkedin: 'https://www.linkedin.com/in/arthur-abrarov',
  };
  const TRIGGER = 'About';                 // the label of the Hero button that opens the sheet (or any link to #about)
  const HASH = '#about';

  const PHONE = matchMedia('(max-width: 599px)').matches;
  const MARGIN = PHONE ? 16 : 32;          // px: Close sits this far from the screen edges, as in the lightbox
  const TOP = MARGIN + 32 + 16;            // px above the sheet: Close (32px tall) and a 16px gap
  // motion, in ms: the lightbox's soft glide
  const M = { ease: 'cubic-bezier(.32,.72,0,1)', open: 300, close: 250, rise: 16 };
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // the site's Framer colour styles (fallbacks after the commas)
  const WHITE = 'var(--token-772df573-5188-456c-a0aa-cb8aab4df26b,#fffffd)';   // the cards
  const PAGE = 'var(--token-161d896a-76d8-4d9e-baab-5089a763c675,#f5f4f0)';    // the page background (Site Settings)
  const DARK = 'var(--token-5bd8d564-6722-4f00-b75b-168ab9b708da,#2e261c)';    // dark text
  const MUTED = 'var(--token-615fb88e-2b97-4a94-a05e-5dc74036ced2,#726555)';   // grey text
  // the line between the bio and the companies: the colour style behind the homepage images (#eeece6)
  const LINE = 'var(--token-152a03bd-74bc-479f-a914-107adfcad8e6,#eeece6)';
  const IMAGE = 'var(--token-152a03bd-74bc-479f-a914-107adfcad8e6,#eeece6)';   // the Image Frame's fill, behind the photo
  // the Secondary button, as in the emoji game: the Hover colour style at rest, Stroke on hover
  const BUTTON = 'var(--token-561f0f19-24cd-4e69-b381-b29adb2edb7f,#e9e7e0)';
  const BUTTON_HOVER = 'var(--token-c0c08a01-85af-48e1-a222-d1e74edf9e8e,#e0ddd4)';
  const MEDIUM = '"Open Runde Medium","Open Runde",sans-serif';   // fallbacks before the page's styles are read
  const SEMI = '"Open Runde Semibold","Open Runde",sans-serif';

  const css = document.createElement('style');
  css.textContent = `
    .ab-backdrop{position:fixed;inset:0;z-index:10001;background:${PAGE};opacity:0;overflow-y:auto;overscroll-behavior:contain;
      -webkit-overflow-scrolling:touch;}
    .ab-backdrop.ab-show{opacity:1;}
    .ab-wrap{min-height:100%;box-sizing:border-box;display:flex;justify-content:center;align-items:flex-start;
      padding:${TOP}px ${MARGIN}px calc(${MARGIN}px + env(safe-area-inset-bottom,0px));}
    ${PHONE ? '' : `.ab-wrap{align-items:center;padding-top:${TOP}px;padding-bottom:${TOP}px;}`}
    /* the sheet: a card, as on the homepage (White, the cards' corners and padding) */
    .ab-sheet{box-sizing:border-box;width:100%;max-width:512px;background:${WHITE};border-radius:var(--ab-radius,24px);
      corner-shape:var(--ab-corner,round);padding:var(--ab-pad,32px);display:flex;flex-direction:column;gap:32px;
      will-change:transform,opacity;}
    .ab-sheet:focus{outline:none;}
    .ab-sheet p{margin:0;}
    /* type copied from the Hero's Framer styles by syncType(); the values after the commas are fallbacks */
    .ab-body{font-family:var(--ab-body-family,${MEDIUM});font-weight:var(--ab-body-weight,500);font-size:var(--ab-body-size,15px);
      line-height:var(--ab-body-lh,23px);letter-spacing:var(--ab-body-ls,-0.1px);color:${MUTED};}
    .ab-head{display:flex;flex-direction:column;gap:24px;}
    .ab-head .ab-avatar{width:32px;height:32px;border-radius:999px;overflow:hidden;}
    .ab-head .ab-avatar img{display:block;width:100%;height:100%;object-fit:cover;}
    /* the photo: framed like the homepage cards' images (Image Frame: corners, fill, faint inner stroke) */
    .ab-photo{position:relative;overflow:hidden;aspect-ratio:16/9;background:var(--ab-frame-bg,${IMAGE});
      border-radius:var(--ab-frame-radius,20px);corner-shape:var(--ab-frame-corner,round);}
    .ab-photo img{display:block;width:100%;height:100%;object-fit:cover;}
    .ab-photo::after{content:"";position:absolute;inset:0;border-radius:inherit;corner-shape:inherit;pointer-events:none;
      box-shadow:inset 0 0 0 var(--ab-frame-line,1px rgba(114,101,85,.04));}
    /* spacing on the site's scale (4 / 16 / 24 / 32): 32 between sections, as in the cards; 24 from the photo to the
       text, as from the Hero's avatar to the name; 16 between paragraphs and between companies */
    .ab-intro,.ab-bio{display:flex;flex-direction:column;gap:16px;}
    .ab-bio .ab-body:first-child{color:${DARK};}   /* the opening paragraph, in the dark text colour */
    /* the companies, one per row: name over role, years on the right */
    .ab-divider{height:1px;flex-shrink:0;background:${LINE};}   /* 32 above and below: the sheet's gap */
    .ab-list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:16px;}
    .ab-row{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:16px;}
    .ab-who{display:flex;flex-direction:column;min-width:0;}   /* name and role sit straight on top of each other */
    .ab-who .ab-company{color:${DARK};}   /* the company: body type (Medium), in the dark text colour */
    .ab-years{align-self:start;font-variant-numeric:tabular-nums;white-space:nowrap;}   /* on the company name's line */
    /* the contact links: dark text, grey on hover */
    .ab-link{color:${DARK};text-decoration:none;transition:color .2s;}
    .ab-link:hover{color:${MUTED};}
    /* Close: the site's Secondary button (32px pill, Stroke fill, button label type) */
    .ab-close{box-sizing:border-box;height:32px;margin:0;border:0;padding:6px 18px;border-radius:999px;display:inline-flex;
      align-items:center;background:${BUTTON};color:${DARK};text-decoration:none;white-space:nowrap;cursor:pointer;
      transition:background-color .2s,opacity ${M.close}ms ease;
      font-family:var(--ab-btn-family,${SEMI});font-weight:var(--ab-btn-weight,600);font-size:var(--ab-btn-size,13px);
      line-height:var(--ab-btn-lh,20px);letter-spacing:var(--ab-btn-ls,-0.1px);}
    .ab-close:hover{background:${BUTTON_HOVER};}
    .ab-close:focus-visible{outline:2px solid ${DARK};outline-offset:2px;}
    .ab-close{position:fixed;top:${MARGIN}px;right:${MARGIN}px;z-index:10003;opacity:0;}
    .ab-close.ab-show{opacity:1;}
    /* opened with the mouse or a link: no rings until Tab is pressed (!important and more specific than the lightbox's
       site-wide ring, which is !important too) */
    .ab-close.ab-quiet:focus-visible,.ab-link.ab-quiet:focus-visible{outline:none !important;}
    /* the page stays put behind the sheet: lock the page's own scroll (html) only. Locking body too would make it a
       scroll box of its own, and Framer's sticky Hero would jump to its top. The gutter keeps the scrollbar's space */
    html.ab-open{overflow:hidden !important;scrollbar-gutter:stable;}
  `;
  document.head.appendChild(css);

  const visible = list => [...list].find(e => e.offsetWidth > 0);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };

  // the Hero's About button: a Framer link or button whose label is TRIGGER, or any link to #about
  const isTrigger = n => n instanceof Element && (n.matches(`a[href$="${HASH}"]`) ||
    (n.matches('a, button, [role="button"]') && n.textContent.trim() === TRIGGER));
  const triggerOf = target => {
    for (let n = target; n && n !== document.body; n = n.parentElement) if (isTrigger(n)) return n;
    return null;
  };

  // type, corners and colours come from the page, read each time the sheet opens
  function syncStyles() {
    const root = document.documentElement.style, set = (k, v) => { if (v) root.setProperty(k, v); };
    const copy = (prefix, node) => {
      if (!node) return;
      const t = getComputedStyle(node);
      set(`--ab-${prefix}-family`, t.fontFamily); set(`--ab-${prefix}-weight`, t.fontWeight);
      set(`--ab-${prefix}-size`, t.fontSize); set(`--ab-${prefix}-lh`, t.lineHeight); set(`--ab-${prefix}-ls`, t.letterSpacing);
    };
    const hero = visible(document.querySelectorAll('[data-framer-name="Hero"]'));
    const paras = hero ? [...hero.querySelectorAll('p')].filter(p => p.offsetWidth && !p.closest('[data-framer-name="Button"]')) : [];
    copy('body', paras.find(p => p.textContent.trim().length > 40));                     // the bio
    copy('btn', visible(document.querySelectorAll('[data-framer-name="Button"] p')));
    // the cards' corners and padding: the first wide frame in the White colour style
    const card = [...document.querySelectorAll('[data-framer-name]')].find(c => c.offsetWidth >= Math.min(500, innerWidth * .8) &&
      getComputedStyle(c).backgroundColor === getComputedStyle(probe).backgroundColor);
    if (card) {
      const s = getComputedStyle(card);
      set('--ab-radius', s.borderTopLeftRadius);
      const shape = s.getPropertyValue('corner-shape');
      if (shape) set('--ab-corner', shape);
      const pad = parseFloat(s.paddingTop);
      if (pad) set('--ab-pad', pad + 'px');
    }
    // the homepage images' frame
    const frame = visible(document.querySelectorAll('[data-framer-name="Image Frame"]'));
    if (frame) {
      const s = getComputedStyle(frame), a = getComputedStyle(frame, '::after');
      set('--ab-frame-radius', s.borderTopLeftRadius); set('--ab-frame-bg', s.backgroundColor);
      const shape = s.getPropertyValue('corner-shape');
      if (shape) set('--ab-frame-corner', shape);
      if (parseFloat(a.borderTopWidth)) set('--ab-frame-line', `${a.borderTopWidth} ${a.borderTopColor}`);
    }
  }
  // an element in the White colour style, to compare the cards' computed fill with
  const probe = el('div');
  probe.style.cssText = `position:fixed;width:0;height:0;visibility:hidden;pointer-events:none;background:${WHITE}`;
  document.body.append(probe);

  const avatarOf = () => {
    const hero = visible(document.querySelectorAll('[data-framer-name="Hero"]'));
    return hero && visible([...hero.querySelectorAll('img')].filter(i => i.offsetWidth <= 64));
  };

  function build() {
    const backdrop = el('div', 'ab-backdrop');
    const wrap = el('div', 'ab-wrap');
    const sheet = el('section', 'ab-sheet');
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', `About ${CONTENT.name}`);   // the name isn't shown, so it labels the dialog
    sheet.tabIndex = -1;

    const head = el('div', 'ab-head');
    const face = avatarOf();
    if (CONTENT.photo) {
      const f = el('div', 'ab-photo'), img = el('img');
      img.alt = CONTENT.photoAlt || ''; img.src = CONTENT.photo; img.decoding = 'async';
      f.append(img); head.append(f);
    } else if (face) {
      const a = el('div', 'ab-avatar'), img = el('img');
      img.alt = ''; img.src = face.currentSrc || face.src;
      a.append(img); head.append(a);
    }
    const who = el('div', 'ab-intro');
    if (CONTENT.role) who.append(el('p', 'ab-body', CONTENT.role));
    const bio = el('div', 'ab-bio');
    CONTENT.bio.forEach(t => bio.append(el('p', 'ab-body', t)));
    // the bio's last paragraph: "Reach out by email or LinkedIn."
    const ways = [];
    if (CONTENT.email) {
      const a = el('a', 'ab-link', 'email'); a.href = 'mailto:' + CONTENT.email; ways.push(a);
    }
    if (CONTENT.linkedin) {
      const a = el('a', 'ab-link', 'LinkedIn'); a.href = CONTENT.linkedin; a.target = '_blank'; a.rel = 'noopener'; ways.push(a);
    }
    const reach = el('p', 'ab-body');
    if (ways.length) {
      reach.append(CONTENT.email ? 'Reach out by ' : 'Reach out on ', ...ways.flatMap((a, i) => i ? [' or ', a] : [a]), '.');
      bio.append(reach);
    }
    who.append(bio);
    head.append(who);

    const list = el('ul', 'ab-list');
    CONTENT.work.forEach(w => {
      const li = el('li'), row = el('div', 'ab-row');
      const text = el('div', 'ab-who');
      text.append(el('span', 'ab-body ab-company', w.company), el('span', 'ab-body', w.role));
      row.append(text, el('span', 'ab-body ab-years', w.years));
      li.append(row); list.append(li);
    });

    sheet.append(head, el('div', 'ab-divider'), list);
    wrap.append(sheet);
    backdrop.append(wrap);

    const close = el('button', 'ab-close', 'Close');
    close.type = 'button';
    return { backdrop, wrap, sheet, close };
  }

  let open = null;   // { backdrop, sheet, close, from }

  function openSheet(from = null, viaPointer = false) {
    if (open) return;
    syncStyles();
    const ui = build();
    document.body.append(ui.backdrop, ui.close);
    document.documentElement.classList.add('ab-open');
    open = { ...ui, from };
    ui.close.classList.toggle('ab-quiet', viaPointer);
    ui.sheet.querySelectorAll('a').forEach(a => a.classList.toggle('ab-quiet', viaPointer));
    ui.close.focus({ preventScroll: true });
    const t = REDUCED ? 0 : M.open;
    ui.backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: REDUCED ? 150 : t, easing: 'ease', fill: 'forwards' });
    ui.sheet.animate([{ opacity: 0, transform: `translateY(${M.rise}px) scale(.98)` }, { opacity: 1, transform: 'none' }],
      { duration: t, easing: M.ease, fill: 'backwards' });
    requestAnimationFrame(() => ui.close.classList.add('ab-show'));
    swipeToClose(ui);
  }

  // phones and tablets, as in the lightbox: swipe the sheet down to close it. Only from the top of the sheet's scroll,
  // so a swipe down further in still scrolls back up. The sheet follows the finger; past 100px it closes from there,
  // otherwise it springs back
  function swipeToClose({ backdrop, sheet }) {
    let t = null;
    backdrop.addEventListener('touchstart', e => {
      t = e.touches.length === 1 ? { y: e.touches[0].clientY, x: e.touches[0].clientX, top: backdrop.scrollTop, dy: 0, on: false } : null;
    }, { passive: true });
    backdrop.addEventListener('touchmove', e => {
      if (!t || e.touches.length !== 1) return;
      const dy = e.touches[0].clientY - t.y, dx = e.touches[0].clientX - t.x;
      if (!t.on) {
        if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
        // a drag down that starts at the top of the scroll, more down than sideways: the sheet's; anything else scrolls
        if (t.top > 0 || dy <= 0 || Math.abs(dx) > Math.abs(dy)) { t = null; return; }
        t.on = true; t.y = e.touches[0].clientY;
      }
      e.preventDefault();   // no scroll bounce underneath while the sheet follows the finger
      const down = Math.max(0, e.touches[0].clientY - t.y), now = performance.now();
      // the finger's speed (px/ms), smoothed over the last few moves, so the close can carry on at it
      if (t.at) t.v = 0.6 * ((down - t.dy) / Math.max(1, now - t.at)) + 0.4 * (t.v || 0);
      t.dy = down; t.at = now;
      sheet.style.translate = `0 ${down}px`;
    }, { passive: false });
    const end = () => {
      if (!t || !t.on) { t = null; return; }
      const { dy, v = 0 } = t;
      t = null;
      if (dy > 100) { closeSheet({ dy, v }); return; }   // carries on down from where the finger let go
      sheet.style.translate = '';
      sheet.animate([{ translate: `0 ${dy}px` }, { translate: '0 0' }], { duration: REDUCED ? 1 : 150, easing: M.ease });
    };
    backdrop.addEventListener('touchend', end, { passive: true });
    backdrop.addEventListener('touchcancel', end, { passive: true });
  }

  function closeSheet(swipe = null) {
    if (!open) return;
    const { backdrop, sheet, close, from } = open;
    open = null;
    document.documentElement.classList.remove('ab-open');
    close.classList.remove('ab-show');
    if (location.hash === HASH) history.replaceState(history.state, '', location.pathname + location.search);
    // keyboard use: focus goes back to the About button; opened with the mouse: just let go of it
    if (from && from.isConnected && !close.classList.contains('ab-quiet')) from.focus({ preventScroll: true });
    else close.blur();
    const t = REDUCED ? 0 : M.close;
    const done = () => { backdrop.remove(); close.remove(); };
    if (swipe && !REDUCED) {
      // after a swipe: the sheet keeps going down at the finger's speed and eases out as it fades, like a flick. The
      // easing starts at 2.25× the average speed (.72 / .32), so this distance makes its first frames match the finger
      const far = Math.min(innerHeight, Math.max(80, swipe.v * t / 2.25));
      sheet.style.translate = '';
      sheet.animate([{ translate: `0 ${swipe.dy}px` }, { translate: `0 ${swipe.dy + far}px` }], { duration: t, easing: M.ease, fill: 'forwards' });
      sheet.animate([{ opacity: 1 }, { opacity: 0 }], { duration: t, easing: M.ease, fill: 'forwards' });   // fades as it moves, so it never rests visible
    } else {
      sheet.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateY(${M.rise / 2}px) scale(.98)` }],
        { duration: t || 1, easing: M.ease, fill: 'forwards' });
    }
    backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: REDUCED ? 150 : t, easing: 'ease', fill: 'forwards' })
      .finished.then(done, done);
  }

  // event delegation: Framer re-renders the Hero, so nothing is bound to the button directly. On window, in the
  // capture phase, so it runs before the lightbox's own handlers on document: while the sheet is open, pointer events
  // stop here, and the lightbox never sees the images under the grey (no zoom cursor, no zooming in on close)
  addEventListener('pointerover', e => { if (open) e.stopPropagation(); }, true);
  addEventListener('click', e => {
    if (open) {
      e.stopPropagation();
      if (e.target === open.close) { e.preventDefault(); closeSheet(); return; }
      // the grey around the sheet closes; links inside the sheet go where they point
      if (e.target === open.backdrop || e.target === open.wrap) { e.preventDefault(); closeSheet(); }
      return;
    }
    const t = triggerOf(e.target);
    if (!t) return;
    e.preventDefault(); e.stopPropagation();   // Framer's own link handling stays out of it
    openSheet(t, e.detail > 0);
  }, true);

  addEventListener('keydown', e => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
    if (e.key !== 'Tab') return;
    // keep focus in the sheet: Close, then the sheet's links, round and round. Tab brings the rings back
    e.preventDefault();
    open.close.classList.remove('ab-quiet');
    open.sheet.querySelectorAll('a').forEach(a => a.classList.remove('ab-quiet'));
    const stops = [open.close, ...open.sheet.querySelectorAll('a')];
    const i = stops.indexOf(document.activeElement);
    stops[(i < 0 ? 0 : i + (e.shiftKey ? -1 : 1) + stops.length) % stops.length].focus({ preventScroll: true });
  });

  // a link to the sheet from elsewhere (/#about): open once the page has drawn
  const fromHash = () => { if (location.hash === HASH && !open) openSheet(null, true); };   // quiet: no focus ring until Tab
  if (document.readyState === 'complete') requestAnimationFrame(fromHash);
  else addEventListener('load', () => requestAnimationFrame(fromHash), { once: true });
  addEventListener('hashchange', fromHash);
})();
