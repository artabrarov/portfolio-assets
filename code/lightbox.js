/*  Image lightbox for arthurabrarov.com
    Loaded on the live site from GitHub Pages (code/lightbox.min.js) through one script tag in
    Framer: Site Settings, General, Custom Code, end of body. Edit this file, rebuild the .min.js, push.
    Click (or tap) a large image or video to open it full screen, zooming from where it sits.
    Computers: the left and right arrow keys, or a two-finger swipe sideways, move through the page's images and videos;
    pinch on a trackpad to zoom in, and two fingers then pan. Clicking the background, Close, Esc or scrolling closes it.
    Phones and tablets, as in Photos: swipe sideways to move, pinch to zoom and drag to look around, swipe down or tap
    the background or Close to close.
    Keyboard: Tab reaches each image and video, Enter or Space opens it, and focus returns to it on close.
    Media stays in Framer: images open in a bigger version from Framer's image server, videos keep playing from where they were.
    Also here, as it runs on every page: one keyboard focus ring for the whole site. */
(() => {
  if (window.__lightbox) return;           // run once, even with Framer's page transitions
  window.__lightbox = true;

  const SKIP = ['/sites'];                 // pages (and their subpages) where media doesn't zoom: the /sites cards are links
  const MIN_SIZE = 80;                     // px: smaller images and videos (avatar, logos) don't zoom
  const RADIUS = '24px';                   // corner of media whose rounding comes from a mask (Framer's squircles)
  const PHONE = matchMedia('(max-width: 599px)').matches;
  const MARGIN = PHONE ? 16 : 32;          // px between the open media and the screen edges; the buttons sit the same distance in
  const TOP = MARGIN + 32 + 16;            // px above the media: the buttons (32px tall) and a 16px gap
  // motion, in ms: soft but quick, in step with the rest of the site (was 400 / 350 / 380 ms; before that 420 / 336 / 280 ms,
  // 48px, on .2,.8,.2,1).
  // window.__lbMotion (set by the local preview's ?motion= switch) can override any of these
  const M = Object.assign({
    ease: 'cubic-bezier(.32,.72,0,1)',   // a smooth glide that lands softly
    open: 300,          // zoom from the page to full screen
    close: 250,         // and back
    fadeOut: 220,       // close when the item is off screen: fade and shrink in place
    bgIn: 300, bgOut: 250,   // the white background, in step with the image
    slide: 280, shift: 24,   // arrows: the cross-slide between items, and how far they drift (px)
    controls: 250,      // the counter, arrows and Close fading in and out
  }, window.__lbMotion || {});
  const EASE = M.ease;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // behind open media: the page dimmed with 30% black and softly blurred (the same as behind the About drawer)
  const DIM = 'rgba(0,0,0,.3)', BLUR = 'blur(8px)';
  const MAX_ZOOM = 4;                      // a pinch zooms open media up to 4×
  const DARK = 'var(--token-5bd8d564-6722-4f00-b75b-168ab9b708da,#1f1f1f)';   // the site's colour styles
  const FILL = 'var(--token-3a13a808-b14e-4572-b32b-40a978401861,#f4f4f4)';
  const TYPE = '"Instrument Sans Variable","Instrument Sans",sans-serif';   // fallback before the page's styles are read
  const FILL_HOVER = 'var(--token-561f0f19-24cd-4e69-b381-b29adb2edb7f,#e9e7e7)';   // the buttons' hover colour

  const css = document.createElement('style');
  css.textContent = `
    .lb-zoomable{cursor:zoom-in !important;}   /* !important: Framer's Video component sets cursor:auto inline */
    /* fallback for media whose rounded frame isn't found: the ring inside the edge, where the frame can't clip it */
    [data-lb-key]:focus-visible{outline:2px solid ${DARK} !important;outline-offset:-2px;}
    /* the whole site's keyboard focus ring, as the lightbox's buttons: 2px in the dark text colour, 2px off the edge,
       following the element's corners (pills stay pills; plain text links get a slight rounding). Keyboard only */
    :where(a, button, [role="button"]):not([class*="lb-"]):not([data-lb-key]):focus-visible{
      outline:2px solid ${DARK} !important;outline-offset:2px !important;}
    :where(a:not([class*="lb-"])):focus-visible{border-radius:4px;}
    a.framer-text:focus-visible{--framer-link-text-background-radius:4px;--framer-link-hover-text-background-radius:4px;}   /* Framer's text links take their corner from these */
    a.aa-ring-tile:focus-visible{border-radius:12px;}   /* a logo tile (≈10px corners, drawn in its image): the ring's corners, 2px further out */
    .aa-ring-room{overflow:visible !important;}         /* a frame that would cut the ring off, while the ring shows */
    /* an image or video: the same ring, drawn round its rounded frame (focus stays on the media) */
    .aa-ring-frame.aa-ring-frame{outline:2px solid ${DARK} !important;outline-offset:2px !important;}
    [data-lb-key].aa-ring-moved:focus-visible{outline:none !important;}
    .lb-media:focus{outline:none;}
    .lb-backdrop{position:fixed;inset:0;z-index:10001;background:${DIM};backdrop-filter:${BLUR};-webkit-backdrop-filter:${BLUR};
      opacity:0;cursor:zoom-out;}
    .lb-media{position:fixed;z-index:10002;margin:0;object-fit:cover;cursor:zoom-out;will-change:left,top,width,height;
      transform-origin:0 0;}
    .lb-media.lb-media{cursor:default;}   /* open media is for looking (and pinching); the white around it closes */
    /* top left: ← counter →, top right: Close. All look like the site's buttons: 32px tall, grey fill, dark text */
    .lb-count,.lb-close,.lb-arrow{box-sizing:border-box;height:32px;margin:0;border:0;
      border-radius:999px;background:${FILL};color:${DARK};white-space:nowrap;transition:opacity ${M.controls}ms ease,background-color .2s;
      /* type copied from the page's Framer styles by syncType(); the values after the commas are fallbacks */
      font-family:var(--lb-text-family,${TYPE});font-size:var(--lb-size,14px);line-height:var(--lb-lh,20px);
      letter-spacing:var(--lb-ls,normal);font-weight:var(--lb-text-weight,460);font-variation-settings:var(--lb-text-wght,"wght" 460);}
    .lb-count,.lb-close{padding:6px 18px;}
    .lb-nav{position:fixed;top:${MARGIN}px;left:50%;translate:-50% 0;z-index:10003;display:flex;gap:8px;opacity:0;transition:opacity ${M.controls}ms ease;}
    /* phones: ← counter → at the bottom, within reach of a thumb (above the home indicator) */
    ${PHONE ? `.lb-nav{top:auto;bottom:calc(${MARGIN}px + env(safe-area-inset-bottom,0px));}` : ''}
    /* top left: the logo of the company the current item belongs to */
    .lb-logo{position:fixed;top:${MARGIN}px;left:${MARGIN}px;z-index:10003;width:32px;height:32px;overflow:hidden;opacity:0;
      pointer-events:none;transition:opacity ${M.controls}ms ease;}
    .lb-logo img{display:block;width:100%;height:100%;object-fit:cover;}
    /* a logo that links somewhere on the page (Home's card logos go to their case studies) does too */
    a.lb-logo{pointer-events:auto;cursor:pointer;transition:opacity ${M.controls}ms ease,scale .2s ease;}
    a.lb-logo:hover{scale:1.06;}
    a.lb-logo:focus-visible{outline:2px solid ${DARK};outline-offset:2px;}
    /* a logo made of an image tile with text on it (Lab: an emoji on a tile) */
    .lb-logo span{position:absolute;inset:0;display:grid;place-items:center;line-height:1;}
    .lb-logo.lb-show{opacity:1;}
    /* next to the logo: the section of the page the current item belongs to (Apron: Bills, Expenses…), in the counter's
       type (paragraph font at the button size), so the top row reads as one */
    .lb-section{position:fixed;top:${MARGIN}px;z-index:10003;height:32px;display:flex;align-items:center;white-space:nowrap;
      color:${DARK};opacity:0;pointer-events:none;transition:opacity ${M.controls}ms ease;
      font-family:var(--lb-text-family,${TYPE});font-weight:var(--lb-text-weight,460);font-variation-settings:var(--lb-text-wght,"wght" 460);
      font-size:var(--lb-size,14px);line-height:var(--lb-lh,20px);letter-spacing:var(--lb-ls,normal);}
    .lb-section.lb-show{opacity:1;}
    .lb-count{pointer-events:none;font-variant-numeric:tabular-nums;text-align:center;}   /* paragraph style */
    .lb-arrow{width:32px;padding:0;display:grid;place-items:center;cursor:pointer;}
    .lb-arrow svg{display:block;width:16px;height:16px;}   /* Instance Kit's arrow-left / arrow-right */
    .lb-arrow:disabled{opacity:.4;cursor:default;}
    .lb-close{position:fixed;top:${MARGIN}px;right:${MARGIN}px;z-index:10003;opacity:0;cursor:pointer;font-family:var(--lb-btn-family,${TYPE});
      font-weight:var(--lb-btn-weight,560);font-variation-settings:var(--lb-btn-wght,"wght" 560);}   /* button label style */
    .lb-close:hover,.lb-arrow:hover:not(:disabled){background:${FILL_HOVER};}
    .lb-close:focus-visible,.lb-arrow:focus-visible{outline:2px solid ${DARK};outline-offset:2px;}
    .lb-quiet:focus-visible,a.lb-logo.lb-quiet:focus-visible{outline:none;}   /* opened with the mouse: no rings until Tab is pressed */
    .lb-nav.lb-show,.lb-close.lb-show{opacity:1;}
  `;
  document.head.appendChild(css);

  const onPage = () => !SKIP.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  const isMedia = el => el instanceof HTMLImageElement || el instanceof HTMLVideoElement;
  const zoomable = el => isMedia(el) && onPage() && !el.closest('a, button, .fx-av, .fx-world, .lb-media') &&
    el.offsetWidth >= MIN_SIZE && el.offsetHeight >= MIN_SIZE;
  // the zoomable image or video under the pointer, also when a layer without content sits on top of it
  function mediaAt(e) {
    if (zoomable(e.target)) return e.target;
    if (!(e.target instanceof Element) || e.target.closest('a, button, input, [role="button"]')) return null;
    return document.elementsFromPoint(e.clientX, e.clientY).find(zoomable) || null;
  }
  const ratioOf = el => (el.naturalWidth / el.naturalHeight) || (el.videoWidth / el.videoHeight) || (el.offsetWidth / el.offsetHeight);
  // the media's own box and the ancestors that share it (Framer adds zero-size wrappers in between: skip those)
  function* sameBox(el) {
    const r = el.getBoundingClientRect();
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const q = n.getBoundingClientRect();
      if (!q.width && !q.height) continue;
      if (Math.abs(q.width - r.width) > 2 || Math.abs(q.height - r.height) > 2) return;
      yield n;
    }
  }
  // the visible corner: the media's own rounding, an ancestor's, or RADIUS for masked shapes
  function radiusOf(el) {
    for (const n of sameBox(el)) {
      const s = getComputedStyle(n);
      if (parseFloat(s.borderTopLeftRadius)) return s.borderTopLeftRadius;
      if (s.clipPath !== 'none' || s.maskImage !== 'none' || s.webkitMaskImage && s.webkitMaskImage !== 'none') return RADIUS;
    }
    return '0px';
  }
  // a transparent image sitting in a Framer card (a frame with a fill, a stroke and rounded corners): the card's
  // look, so the lightbox can draw it behind the image. Read from the page, so it follows the colour styles
  function cardOf(el) {
    for (const n of sameBox(el)) {
      if (n === el) continue;
      const s = getComputedStyle(n);
      if (s.backgroundColor === 'rgba(0, 0, 0, 0)' || s.backgroundColor === 'transparent') continue;
      const a = getComputedStyle(n, '::after');   // Framer draws a frame's stroke on ::after
      const line = parseFloat(a.borderTopWidth) ? `${a.borderTopWidth} ${a.borderTopColor}`
        : parseFloat(s.borderTopWidth) ? `${s.borderTopWidth} ${s.borderTopColor}` : '';
      return { bg: s.backgroundColor, line };
    }
    return null;
  }

  // Framer serves scaled-down images (?scale-down-to=1024); ask for one big enough for this screen
  function bigSrc(img) {
    try {
      const url = new URL(img.currentSrc || img.src);
      if (!url.hostname.endsWith('framerusercontent.com')) return url.href;
      const need = Math.max(innerWidth, innerHeight) * Math.min(devicePixelRatio || 1, 2);
      url.searchParams.set('scale-down-to', need > 2048 ? '4096' : '2048');
      return url.href;
    } catch (e) { return img.currentSrc || img.src; }
  }

  // where the open image sits: as large as fits between the controls, centred
  // the space the navigation takes at the bottom on phones (with the home indicator's safe area)
  let safeProbe = null;
  function bottomRoom() {
    if (!PHONE || allMedia().length < 2) return MARGIN;
    if (!safeProbe) {
      safeProbe = document.createElement('div');
      safeProbe.style.cssText = 'position:fixed;left:0;bottom:0;width:0;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none';
      document.body.append(safeProbe);
    }
    return MARGIN + 32 + 16 + safeProbe.offsetHeight;
  }
  function targetRect(el) {
    const ratio = ratioOf(el), room = innerHeight - TOP - bottomRoom();
    let w = innerWidth - MARGIN * 2, h = w / ratio;
    if (h > room) { h = room; w = h * ratio; }
    return { left: (innerWidth - w) / 2, top: TOP + (room - h) / 2, width: w, height: h };
  }
  const px = r => ({ left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });

  let open = null;   // { src, clone, backdrop, radius, y }

  // the full screen copy of an image or video
  function makeClone(el) {
    const video = el instanceof HTMLVideoElement;
    const clone = document.createElement(video ? 'video' : 'img');
    clone.className = 'lb-media';
    if (video) {
      Object.assign(clone, { muted: true, loop: el.loop, playsInline: true, autoplay: true, poster: el.poster });
      clone.src = el.currentSrc || el.src;
      const start = el.currentTime;
      // carry on from the page clip's frame, and once the clip's real shape is known, settle on it
      clone.addEventListener('loadedmetadata', () => {
        try { clone.currentTime = start; } catch (e) {}
        if (open && open.clone === clone && !clone.getAnimations().some(a => a.playState === 'running')) fit();
      }, { once: true });
    } else {
      clone.alt = el.alt;
      // a page image Framer hasn't loaded yet (lazy, further down): go straight for the sharp one, which may already be on its way
      clone.src = el.complete && el.naturalWidth ? el.currentSrc || el.src : bigSrc(el);
    }
    // draw the card behind a transparent image (its fill, and its stroke as an inset line that follows the corners)
    const card = cardOf(el);
    if (card) {
      clone.style.backgroundColor = card.bg;
      if (card.line) clone.style.boxShadow = `inset 0 0 0 ${card.line}`;
    }
    clone.setAttribute('role', 'dialog');
    clone.setAttribute('aria-modal', 'true');
    clone.tabIndex = -1;
    clone.setAttribute('aria-label', el.alt || (video ? 'Video, full screen' : 'Image, full screen'));
    return clone;
  }
  // swap in the sharper version of an image once it has loaded (straight away if it was preloaded)
  const loaded = new Set();
  function sharpen(el, clone) {
    if (clone instanceof HTMLVideoElement) return;
    const src = bigSrc(el);
    if (loaded.has(src)) { clone.src = src; return; }
    const big = new Image();
    big.onload = () => { loaded.add(src); if (open && open.clone === clone && !clone.dataset.full) clone.src = src; };
    big.src = src;
  }
  // start loading the sharp versions either side, so the arrow keys show them crisp at once; for a video, build its full
  // screen copy ahead and let it buffer (Framer doesn't load clips that haven't been on screen), and drop ones no longer next door
  const ready = new Map();   // page video → its buffering full screen copy
  function preloadAround(el) {
    const list = allMedia(), i = list.indexOf(el), near = [list[i - 1], list[i + 1]];
    ready.forEach((clone, v) => { if (!near.includes(v)) { clone.removeAttribute('src'); clone.load(); ready.delete(v); } });
    near.forEach(n => {
      if (n instanceof HTMLVideoElement) {
        if (!ready.has(n)) { const clone = makeClone(n); clone.preload = 'auto'; clone.autoplay = false; ready.set(n, clone); }
        return;
      }
      if (!(n instanceof HTMLImageElement)) return;
      const src = bigSrc(n);
      if (loaded.has(src)) return;
      const img = new Image();
      img.onload = () => loaded.add(src);
      img.src = src;
    });
  }

  // top left, when there's more than one to browse: ← "4 / 13" → (the arrows dim at either end); top right: Close
  const nav = document.createElement('div');
  nav.className = 'lb-nav';
  const arrow = (label, d) => {
    const b = document.createElement('button');
    b.className = 'lb-arrow'; b.type = 'button'; b.setAttribute('aria-label', label);
    b.innerHTML = `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="${d}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    return b;
  };
  // paths from Instance Kit's Icons (arrow-left.svg, arrow-right.svg)
  const prevBtn = arrow('Previous', 'M12.6667 7.99998H3.33333M7.99999 3.33331L3.33333 7.99998L7.99999 12.6666');
  const nextBtn = arrow('Next', 'M3.33333 8.00004H12.6667M7.99999 12.6667L12.6667 8.00004L7.99999 3.33337');
  const count = document.createElement('div');
  count.className = 'lb-count';
  count.setAttribute('aria-live', 'polite');
  nav.append(prevBtn, count, nextBtn);
  const closeBtn = document.createElement('button');
  closeBtn.className = 'lb-close';
  closeBtn.type = 'button';
  closeBtn.textContent = 'Close';
  // the counter and Close take their type from the page's Framer styles: Close copies a button label, the counter
  // a paragraph's font at the button size. Read each time the lightbox opens, so changes in Framer carry over
  function syncType() {
    const visible = list => [...list].find(e => e.offsetWidth > 0);
    const label = visible(document.querySelectorAll('[data-framer-name="Button"] p'));
    const para = visible([...document.querySelectorAll('p')].filter(p => !p.closest('[data-framer-name="Button"]') && p.textContent.trim().length > 20));
    const root = document.documentElement.style, set = (k, v) => { if (v) root.setProperty(k, v); };
    if (label) {
      const t = getComputedStyle(label);
      set('--lb-btn-family', t.fontFamily); set('--lb-btn-weight', t.fontWeight); set('--lb-btn-wght', t.fontVariationSettings);
      set('--lb-size', t.fontSize); set('--lb-lh', t.lineHeight); set('--lb-ls', t.letterSpacing);
    }
    if (para) {
      const t = getComputedStyle(para);
      set('--lb-text-family', t.fontFamily); set('--lb-text-weight', t.fontWeight); set('--lb-text-wght', t.fontVariationSettings);
    }
  }
  function showClose() {
    if (!closeBtn.isConnected) document.body.append(closeBtn);
    requestAnimationFrame(() => closeBtn.classList.add('lb-show'));
  }
  function showCount(el) {
    const list = allMedia(), i = list.indexOf(el);
    if (list.length < 2 || i < 0) { nav.classList.remove('lb-show'); return; }
    if (!nav.isConnected) document.body.append(nav);
    // a fixed width, sized for the widest number on this page ("88 / 88"), so the arrows never shift as it counts
    const wide = String(list.length).replace(/\d/g, '8');
    if (count.dataset.wide !== wide) {
      count.style.width = '';
      count.textContent = `${wide} / ${wide}`;
      count.style.width = Math.ceil(count.getBoundingClientRect().width) + 'px';
      count.dataset.wide = wide;
    }
    count.textContent = `${i + 1} / ${list.length}`;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === list.length - 1;
    requestAnimationFrame(() => nav.classList.add('lb-show'));
  }
  // the company logo, top left: the nearest small image around the item (the card's logo on Home, the company's
  // logo on a case study), skipping the game's avatar. Into another company's items, it slides like the images
  const LOGO_SHIFT = 8;   // px: the logo's slide, shorter than the images' (it's only 32px wide)
  let logo = null;        // the logo on screen
  // the company logo nearest the item: a small image, or a small filled tile with text on it (Lab: an emoji on a tile)
  const small = e => e.offsetWidth >= 16 && e.offsetWidth <= 48 && e.offsetHeight >= 16 && e.offsetHeight <= 48 &&
    !e.closest('.fx-av, .fx-world, [class^="lb-"], [data-framer-name="Button"]');
  const isTile = e => !(e instanceof HTMLImageElement) && Math.abs(e.offsetWidth - e.offsetHeight) <= 2 && !e.querySelector('img') &&
    e.textContent.trim() && getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)';
  function logoOf(el) {
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const c = [...n.querySelectorAll('img')].find(i => i !== el && small(i)) ||
        [...n.querySelectorAll('div')].find(t => small(t) && isTile(t));
      if (c) return c;
    }
    return null;
  }
  // what identifies a logo (the same logo stays put while browsing): an image's address, or a tile's fill and text
  const logoKey = src => src instanceof HTMLImageElement ? src.currentSrc || src.src :
    'tile:' + getComputedStyle(src).backgroundColor + ':' + src.textContent.trim();
  function makeLogo(src, url) {
    const link = src.closest('a[href]');
    const d = document.createElement(link ? 'a' : 'div');
    d.className = 'lb-logo'; d.dataset.src = url;
    if (link) {   // e.g. "./apron" → "Apron case study"
      d.href = link.href;
      const name = decodeURIComponent(new URL(link.href).pathname.split('/').filter(Boolean).pop() || '');
      const label = name ? name[0].toUpperCase() + name.slice(1) + ' case study' : 'Open';
      d.setAttribute('aria-label', label); d.title = label;
      if (closeBtn.classList.contains('lb-quiet')) d.classList.add('lb-quiet');   // same focus-ring state as the buttons
    } else d.setAttribute('aria-hidden', 'true');
    d.style.borderRadius = radiusOf(src);
    // Framer's corner smoothing (a squircle) is CSS corner-shape on the layer with the rounding: copy it too
    for (const n of sameBox(src)) {
      const st = getComputedStyle(n);
      if (st.borderRadius === '0px') continue;
      const shape = st.getPropertyValue('corner-shape');
      if (shape && !/^round/.test(shape)) d.style.setProperty('corner-shape', shape);
      break;
    }
    if (src instanceof HTMLImageElement) {
      const img = document.createElement('img'); img.alt = ''; img.src = url; d.append(img);
    } else d.style.backgroundColor = getComputedStyle(src).backgroundColor;   // a tile: its own fill
    // text laid over the logo's image in the same box (an emoji on a tile): copy it, scaled from the page's size
    let box = src;
    for (const n of sameBox(src)) box = n;
    const t = [...box.querySelectorAll('*')].find(e => e !== src && e.childElementCount === 0 && e.textContent.trim());
    if (t) {
      const span = document.createElement('span');
      span.textContent = t.textContent.trim();
      span.style.fontSize = parseFloat(getComputedStyle(t).fontSize) * 32 / box.getBoundingClientRect().width + 'px';
      d.append(span);
    }
    document.body.append(d);
    return d;
  }
  const fadeIn = d => { d.getBoundingClientRect(); d.classList.add('lb-show'); };   // reflow first, so the fade runs
  function showLogo(el, dir = 0) {
    const src = logoOf(el), url = src ? logoKey(src) : '';
    if (!url) { if (logo) logo.classList.remove('lb-show'); return; }
    if (logo && logo.dataset.src === url) { fadeIn(logo); return; }
    const old = logo, shown = old && old.classList.contains('lb-show');
    logo = makeLogo(src, url);
    if (shown && dir && !REDUCED) {   // another company while browsing: the old logo slides out as the new one slides in
      const shift = LOGO_SHIFT * dir, o = { duration: M.slide, easing: EASE, fill: 'forwards' };
      logo.classList.add('lb-show');
      logo.animate([{ opacity: 0, translate: `${shift}px 0` }, { opacity: 1, translate: '0 0' }], { ...o, fill: 'backwards' });
      old.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `${-shift}px 0` }], o)
        .finished.then(() => old.remove(), () => old.remove());
    } else {
      if (old) old.remove();
      fadeIn(logo);
    }
  }
  // mouse opens hide focus rings on the buttons until Tab is pressed
  const setQuiet = on => [closeBtn, prevBtn, nextBtn, logo].forEach(b => b && b.classList.toggle('lb-quiet', on));

  // the section label: which part of the page the current item sits in. Per page, either Framer layer name → label,
  // or a list of labels for the page's cards in order (where cards share a layer name, as on Joompay)
  const SECTIONS = {
    '/apron': { 'Platform': 'Bills', 'Expense management': 'Expenses', 'Apron Capture': 'Capture', 'App': 'Mobile app',
      'Design System': 'Design system' },
    '/joompay': ['Product', 'Brand'],
    '/redmadrobot': { 'Rostelecom': 'Rostelecom Key', 'Concepts': 'Concepts' },
  };
  let section = null;
  function sectionOf(el) {
    const map = SECTIONS[location.pathname.replace(/\/$/, '')];
    if (!map) return '';
    if (Array.isArray(map)) {   // the cards: the page's wide white frames, top to bottom
      const cards = [...document.querySelectorAll('[data-framer-name]')].filter(c => c.offsetWidth >= 500 &&
        getComputedStyle(c).backgroundColor === 'rgb(255, 255, 255)');
      return map[cards.findIndex(c => c.contains(el))] || '';
    }
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement)
      if (n.dataset && map[n.dataset.framerName]) return map[n.dataset.framerName];
    return '';
  }
  // 12px right of the logo (or at the margin without one); hidden where it would run into what's next to it
  function placeSection(d) {
    const left = logo && logo.dataset.src ? MARGIN + 32 + 12 : MARGIN;
    d.style.left = left + 'px';
    // the next thing along the top row: the counter on computers, Close on phones (their counter is at the bottom)
    const r = PHONE ? closeBtn.getBoundingClientRect() : nav.isConnected && allMedia().length > 1 ? nav.getBoundingClientRect() : null;
    d.style.visibility = r && r.width && left + d.offsetWidth > r.left - 12 ? 'hidden' : '';
  }
  function showSection(el, dir = 0) {
    const text = sectionOf(el);
    if (!text) { if (section) section.classList.remove('lb-show'); return; }
    if (section && section.textContent === text) { placeSection(section); fadeIn(section); return; }
    const old = section, shown = old && old.classList.contains('lb-show');
    section = document.createElement('div');
    section.className = 'lb-section';
    section.textContent = text;
    document.body.append(section);
    placeSection(section);
    if (shown && dir && !REDUCED) {   // another section while browsing: slides across like the logo
      const shift = LOGO_SHIFT * dir, o = { duration: M.slide, easing: EASE, fill: 'forwards' };
      section.classList.add('lb-show');
      section.animate([{ opacity: 0, translate: `${shift}px 0` }, { opacity: 1, translate: '0 0' }], { ...o, fill: 'backwards' });
      old.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `${-shift}px 0` }], o)
        .finished.then(() => old.remove(), () => old.remove());
    } else {
      if (old) old.remove();
      fadeIn(section);
    }
  }

  function openMedia(el, viaPointer = false) {
    if (open) return;
    const from = el.getBoundingClientRect();
    const radius = radiusOf(el);
    const backdrop = document.createElement('div');
    backdrop.className = 'lb-backdrop';
    const clone = makeClone(el), video = clone instanceof HTMLVideoElement;
    Object.assign(clone.style, px(from), { borderRadius: radius });
    document.body.append(backdrop, clone);
    syncType();
    showClose();
    setQuiet(viaPointer);
    closeBtn.focus({ preventScroll: true });
    el.style.opacity = '0';
    open = { src: el, clone, backdrop, radius, y: scrollY, z: 1, tx: 0, ty: 0 };
    addEventListener('wheel', onWheel, { passive: false });
    TOUCH.forEach(([t, f, o]) => addEventListener(t, f, o));

    const to = targetRect(video && clone.videoWidth ? clone : el);
    const time = REDUCED ? 0 : M.open;
    clone.animate([{ ...px(from), borderRadius: radius }, { ...px(to), borderRadius: '12px' }],
      { duration: time, easing: EASE, fill: 'forwards' });
    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: REDUCED ? 150 : M.bgIn, easing: 'ease', fill: 'forwards' });
    sharpen(el, clone);
    showCount(el);
    showLogo(el);
    showSection(el);
    preloadAround(el);
  }

  // every zoomable image and video on the page, top to bottom (zoomable skips Framer's hidden copies for other breakpoints)
  const allMedia = () => [...document.querySelectorAll('img, video')].filter(zoomable);
  // arrow keys: slide to the previous or next one; stops at either end
  // the item dir steps away (±1), if there is one
  const neighbour = dir => open && allMedia()[allMedia().indexOf(open.src) + dir];
  // the full screen copy of an item, in place and on the page (a video's copy may already be buffering)
  function takeClone(next) {
    let clone = ready.get(next);
    if (clone) { ready.delete(next); if (next.currentTime) try { clone.currentTime = next.currentTime; } catch (e) {} clone.autoplay = true; clone.play().catch(() => {}); }
    else clone = makeClone(next);
    Object.assign(clone.style, px(targetRect(next)), { borderRadius: '12px' });
    document.body.append(clone);
    return clone;
  }
  // the lightbox moves on to next, shown by clone (the previous copy is the caller's to animate away and remove)
  function adopt(next, clone, dir) {
    const { src: prev, clone: old } = open;
    // hand the playhead back to the page clip being left, and show it again
    if (old instanceof HTMLVideoElement) try { prev.currentTime = old.currentTime; } catch (e) {}
    prev.style.opacity = '';
    // the page stays still while browsing: closing flies back if this one is on screen, and fades out otherwise
    next.style.opacity = '0';
    open = { ...open, src: next, clone, radius: radiusOf(next), z: 1, tx: 0, ty: 0 };
    sharpen(next, clone);
    showCount(next);
    showLogo(next, dir);
    showSection(next, dir);
    preloadAround(next);
  }
  function step(dir) {
    if (!open) return false;
    const next = neighbour(dir);
    if (!next) return false;
    const old = open.clone, clone = takeClone(next);
    adopt(next, clone, dir);
    const time = REDUCED ? 0 : M.slide, shift = M.shift * dir;
    flatten(old);
    old.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `${-shift}px 0` }],
      { duration: time || 1, easing: EASE, fill: 'forwards' }).finished.then(() => old.remove(), () => old.remove());
    clone.animate([{ opacity: 0, translate: `${shift}px 0` }, { opacity: 1, translate: '0 0' }],
      { duration: time || 1, easing: EASE, fill: 'backwards' });
    return true;
  }

  // places the open media at its full screen size, without animating (on resize, or once a video knows its shape)
  function fit() {
    if (!open) return;
    const { clone, src } = open;
    clone.getAnimations().forEach(a => a.cancel());
    clone.style.transform = '';
    Object.assign(open, { z: 1, tx: 0, ty: 0 });
    Object.assign(clone.style, px(targetRect(clone.videoWidth ? clone : src)), { borderRadius: '12px' });
  }

  // zoom: a transform on top of the open image's own box, so the open, close and slide animations stay as they are
  const boxOf = () => targetRect(open.clone.videoWidth ? open.clone : open.src);
  // keep the zoomed image covering the screen (or centred, when it's narrower than the screen in that direction)
  function clampPan(size, start, t, view) {
    if (size <= view - MARGIN * 2) return (view - size) / 2 - start;
    return Math.min(MARGIN - start, Math.max(view - MARGIN - size - start, t));
  }
  function applyZoom() {
    const { clone, z } = open, b = boxOf();
    open.tx = z === 1 ? 0 : clampPan(b.width * z, b.left, open.tx, innerWidth);
    open.ty = z === 1 ? 0 : clampPan(b.height * z, b.top, open.ty, innerHeight);
    clone.style.transform = z === 1 ? '' : `translate(${open.tx}px,${open.ty}px) scale(${z})`;
    if (z > 1) fullRes();
  }
  // zoom to z, keeping the point under (x, y) where it is
  function zoomAt(z, x, y) {
    const b = boxOf(), old = open.z;
    z = Math.min(MAX_ZOOM, Math.max(1, z));
    if (z < 1.02) z = 1;
    open.tx = x - b.left - (x - b.left - open.tx) * (z / old);
    open.ty = y - b.top - (y - b.top - open.ty) * (z / old);
    open.z = z;
    applyZoom();
  }
  // the full size original from Framer's image server, once zooming in
  function fullRes() {
    const { clone, src } = open;
    if (clone.dataset.full || !(clone instanceof HTMLImageElement)) return;
    clone.dataset.full = '1';
    let url;
    try { url = new URL(src.currentSrc || src.src); } catch (e) { return; }
    if (!url.hostname.endsWith('framerusercontent.com')) return;
    url.searchParams.delete('scale-down-to');
    const big = new Image();
    big.onload = () => { if (open && open.clone === clone) clone.src = url.href; };
    big.src = url.href;
  }
  // the open media's current spot on screen, zoom included, as its plain position (before it flies back or slides away)
  function flatten(el) {
    const r = px(el.getBoundingClientRect());
    el.getAnimations().forEach(a => a.cancel());
    Object.assign(el.style, { transform: '', translate: '' }, r);   // translate: a touch drag in progress
    return r;
  }
  // a pinch arrives as ctrl + wheel (Chrome, Firefox) or as gesture events (Safari); two fingers pan once zoomed in;
  // a plain scroll while not zoomed closes, as before
  let gesture = null, lastZoom = 0, swipe = null;
  const SWIPE = 40;   // px of sideways scroll that make a swipe
  function onWheel(e) {
    if (!open) return;
    if (e.ctrlKey) {   // a pinch: never the browser's own page zoom while the lightbox is open
      e.preventDefault();
      if (gesture) return;
      lastZoom = performance.now();
      zoomAt(open.z * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
    } else if (open.z > 1) {
      e.preventDefault();
      lastZoom = performance.now();
      open.tx -= e.deltaX; open.ty -= e.deltaY;
      applyZoom();
    } else if (performance.now() - lastZoom < 400) e.preventDefault();   // the tail of a pinch back out: don't close
    else {
      // a two-finger swipe sideways moves to the next or previous item, once per swipe; a scroll up or down closes,
      // as before. After a swipe the trackpad keeps sending its coasting (momentum) for a second or so, and a new
      // swipe often starts before that ends: coasting only slows down, so a sharp rise in speed is the next swipe
      const now = performance.now(), ax = Math.abs(e.deltaX);
      const fresh = () => ({ x: 0, y: 0, done: false, low: Infinity, at: 0 });
      if (!swipe || now - swipe.t > 250) swipe = fresh();
      else if (swipe.done) {
        swipe.low = Math.min(swipe.low, ax);
        if (now - swipe.at > 150 && ax > swipe.low * 2 && ax > swipe.low + 6) swipe = fresh();
      }
      swipe.t = now; swipe.x += e.deltaX; swipe.y += e.deltaY;
      if (Math.abs(swipe.x) > Math.abs(swipe.y)) {
        e.preventDefault();   // also keeps the browser from going back a page
        if (!swipe.done && Math.abs(swipe.x) > SWIPE) { swipe.done = true; swipe.at = now; step(swipe.x > 0 ? 1 : -1); }
      } else if (!swipe.done) close();   // a swipe's coasting can drift a little vertical: don't close on that
    }
  }
  addEventListener('gesturestart', e => {
    if (!open) return;
    e.preventDefault();
    if (!touch) gesture = { z: open.z };   // on a touch screen the touch events below do the zooming
  });
  addEventListener('gesturechange', e => {
    if (!open || !gesture) return;
    e.preventDefault(); lastZoom = performance.now();
    zoomAt(gesture.z * e.scale, e.clientX, e.clientY);
  });
  addEventListener('gestureend', e => { if (open) e.preventDefault(); gesture = null; });

  // touch (phones and tablets), as in Photos: swipe sideways to move, swipe down to close, pinch to zoom and drag to
  // look around once zoomed in. The open media follows the finger. A tap still arrives as a click: the background and
  // Close close, the media itself does nothing
  let touch = null;
  const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  function onTouchStart(e) {
    if (!open) return;
    const t = e.touches;
    if (t.length === 2) touch = { pinch: true, d: dist(t[0], t[1]) || 1, z: open.z };
    else if (t.length === 1) touch = { x: t[0].clientX, y: t[0].clientY, tx: open.tx, ty: open.ty, dx: 0, dy: 0, moved: false };
  }
  function onTouchMove(e) {
    if (!open || !touch) return;
    e.preventDefault();   // the page stays put underneath, and the browser doesn't zoom it
    const t = e.touches;
    if (touch.pinch) {
      if (t.length === 2) zoomAt(touch.z * dist(t[0], t[1]) / touch.d, (t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2);
      return;
    }
    const dx = t[0].clientX - touch.x, dy = t[0].clientY - touch.y;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) touch.moved = true;
    if (open.z > 1) { open.tx = touch.tx + dx; open.ty = touch.ty + dy; applyZoom(); return; }
    // not zoomed: sideways, a filmstrip (the neighbour rides in beside it, a screen width apart, as in Photos);
    // down, the media follows the finger towards closing
    const now = performance.now();
    touch.vx = (dx - (touch.dx || 0)) / Math.max(1, now - (touch.t || now - 16)); touch.t = now;
    touch.dx = dx; touch.dy = dy;
    const side = Math.abs(dx) > Math.abs(dy);
    const dir = dx < 0 ? 1 : -1;
    if (touch.peek && (!side || touch.peek.dir !== dir)) { touch.peek.clone.remove(); touch.peek = null; }
    if (side && !touch.peek && Math.abs(dx) > 4) {
      const next = neighbour(dir);
      if (next) touch.peek = { dir, next, clone: takeClone(next) };
    }
    if (!side) { open.clone.style.translate = `0 ${Math.max(0, dy)}px`; return; }
    // at the first or last item there's nothing beside it: the drag gives way, like a rubber band
    open.clone.style.translate = `${touch.peek ? dx : dx * 0.35}px 0`;
    if (touch.peek) touch.peek.clone.style.translate = `${dx + dir * (innerWidth + STRIP_GAP)}px 0`;
  }
  const STRIP_GAP = 16;   // px between items in the touch filmstrip
  function onTouchEnd(e) {
    if (!open || !touch) return;
    if (e.touches.length) {   // one finger of a pinch lifted: carry on as a drag from here
      if (touch.pinch && e.touches.length === 1) touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: open.tx, ty: open.ty, dx: 0, dy: 0, moved: true };
      return;
    }
    const { dx = 0, dy = 0, vx = 0, moved, pinch, peek } = touch;
    touch = null;
    if (pinch || open.z > 1 || !moved) { if (peek) peek.clone.remove(); return; }
    const clone = open.clone, side = Math.abs(dx) > Math.abs(dy), time = REDUCED ? 1 : 200;
    const slide = (el, from, to, opts = {}) => {
      el.style.translate = '';
      return el.animate([{ translate: `${from}px 0` }, { translate: `${to}px 0` }], { duration: time, easing: EASE, ...opts });
    };
    if (side && peek) {
      const far = peek.dir * (innerWidth + STRIP_GAP);
      // far enough, or flicked: glide on to the neighbour; otherwise both spring back
      if (Math.abs(dx) > innerWidth * 0.25 || (Math.abs(dx) > 30 && Math.abs(vx) > 0.4 && Math.sign(vx) === Math.sign(dx))) {
        slide(clone, dx, -far, { fill: 'forwards' }).finished.then(() => clone.remove(), () => clone.remove());
        slide(peek.clone, dx + far, 0);
        adopt(peek.next, peek.clone, peek.dir);
      } else {
        slide(clone, dx, 0);
        slide(peek.clone, dx + far, far, { fill: 'forwards' }).finished.then(() => peek.clone.remove(), () => peek.clone.remove());
      }
      return;
    }
    if (peek) peek.clone.remove();
    if (!side && dy > 100) { close(); return; }
    // not far enough (or the first or last item): back into place
    const from = clone.style.translate || '0 0';
    clone.style.translate = '';
    clone.animate([{ translate: from }, { translate: '0 0' }], { duration: REDUCED ? 1 : 150, easing: EASE });
  }
  const TOUCH = [['touchstart', onTouchStart, { passive: true }], ['touchmove', onTouchMove, { passive: false }],
    ['touchend', onTouchEnd, { passive: true }], ['touchcancel', onTouchEnd, { passive: true }]];


  function close() {
    if (!open) return;
    const { src, clone, backdrop, radius } = open;
    open = null;
    ready.forEach(c => { c.removeAttribute('src'); c.load(); }); ready.clear();
    nav.classList.remove('lb-show');
    if (logo) logo.classList.remove('lb-show');
    if (section) section.classList.remove('lb-show');
    closeBtn.classList.remove('lb-show');
    // fly back only to a spot that's on screen (after browsing with the arrows it may not be)
    const r = src.isConnected ? src.getBoundingClientRect() : null;
    const to = r && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth ? r : null;
    const time = REDUCED ? 0 : M.close;
    removeEventListener('wheel', onWheel);
    TOUCH.forEach(([t, f]) => removeEventListener(t, f)); touch = null;
    const current = flatten(clone);
    clone.style.borderRadius = '12px';
    const done = () => {
      // hand the video's playhead back, so the page clip carries on from the same frame
      if (clone instanceof HTMLVideoElement && src.isConnected) try { src.currentTime = clone.currentTime; } catch (e) {}
      clone.remove(); backdrop.remove(); src.style.opacity = '';
    };
    // keyboard use (opened with Enter, or Tab pressed): focus goes straight back to where the lightbox was, so Tab
    // carries on from there. Opened with the mouse: just let go of focus, so Esc doesn't leave a ring on the image
    if (!closeBtn.classList.contains('lb-quiet') && src.isConnected && src.hasAttribute(KEY)) src.focus({ preventScroll: true });
    else closeBtn.blur();
    backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: REDUCED ? 150 : M.bgOut, easing: 'ease', fill: 'forwards' });
    if (to) clone.animate([{ ...current, borderRadius: '12px' }, { ...px(to), borderRadius: radius }],
      { duration: time, easing: EASE, fill: 'forwards' }).finished.then(done, done);
    else clone.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.96 }],
      { duration: REDUCED ? 150 : M.fadeOut, easing: EASE, fill: 'forwards' }).finished.then(done, done);
  }

  // keyboard: every zoomable image and video gets a Tab stop and a button role. Framer re-renders the page and
  // swaps breakpoint copies, so this re-runs whenever the page changes (once per frame at most)
  const KEY = 'data-lb-key';
  function markFocusable() {
    document.querySelectorAll('img, video').forEach(el => {
      const on = zoomable(el), mine = el.hasAttribute(KEY);
      if (on && !mine && !el.hasAttribute('tabindex')) {
        el.setAttribute(KEY, '');
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', el instanceof HTMLVideoElement ? 'Open video full screen'
          : el.alt ? `${el.alt}, open full screen` : 'Open image full screen');
      } else if (!on && mine) {
        ['tabindex', 'role', 'aria-label', KEY].forEach(a => el.removeAttribute(a));
      }
    });
  }
  let marking = false;
  const queueMark = () => { if (!marking) { marking = true; requestAnimationFrame(() => { marking = false; markFocusable(); }); } };
  new MutationObserver(queueMark).observe(document.body, { childList: true, subtree: true });
  addEventListener('resize', queueMark);
  queueMark();

  // event delegation: Framer re-renders images, so nothing is bound to them directly
  let hovered = null;
  document.addEventListener('pointerover', e => {
    if (open) return;
    const m = mediaAt(e);
    if (hovered && hovered !== e.target) hovered.classList.remove('lb-zoomable');
    hovered = m ? e.target : null;
    if (hovered) hovered.classList.add('lb-zoomable');
  }, { passive: true });
  document.addEventListener('click', e => {
    if (open && e.target instanceof Element && e.target.closest('a.lb-logo')) return;   // the logo's link: let it go there
    if (open && e.target instanceof Element && e.target.closest('.lb-nav')) {   // the arrows step; the counter does nothing
      e.preventDefault(); e.stopPropagation();
      const b = e.target.closest('.lb-arrow');
      if (b && !b.disabled) step(b === prevBtn ? -1 : 1);
      return;
    }
    if (open) {
      e.preventDefault(); e.stopPropagation();
      if (e.target !== open.clone) close();   // the open image or video itself: nothing
      return;
    }
    const m = mediaAt(e);
    if (!m) return;
    e.preventDefault();
    openMedia(m, true);
  }, true);
  addEventListener('keydown', e => {
    if (!open) {
      const el = document.activeElement;
      if ((e.key === 'Enter' || e.key === ' ') && el && el.hasAttribute(KEY) && zoomable(el)) { e.preventDefault(); openMedia(el); }
      return;
    }
    // Tab is the key that moves focus, so it brings the ring back; the arrows and Esc leave it hidden
    if (e.key === 'Tab') {   // keep focus in the lightbox, cycling ← → Close
      e.preventDefault(); setQuiet(false);
      const linkLogo = logo && logo.tagName === 'A' && logo.classList.contains('lb-show') ? [logo] : [];
      const stops = [...linkLogo, ...[prevBtn, nextBtn, closeBtn].filter(b => b.isConnected && !b.disabled && (b === closeBtn || nav.classList.contains('lb-show')))];
      const i = stops.indexOf(document.activeElement);
      const to = stops[(i < 0 ? 0 : i + (e.shiftKey ? -1 : 1) + stops.length) % stops.length];
      (i < 0 ? closeBtn : to).focus({ preventScroll: true });
    }
    else if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });
  // only a real scroll closes it: the page nudges itself by a few px while images further down load
  addEventListener('scroll', () => { if (open && Math.abs(scrollY - open.y) > 40) close(); }, { passive: true });
  addEventListener('resize', fit);

  // the focus ring sits 4px outside (2px offset + 2px ring); Framer rows that clip their content cut it off when a button
  // or logo sits at their edge (Home's logos and View buttons). While a ring shows, those frames stop clipping. And a
  // small image-only link (a logo tile) gets ring corners that match the tile's
  const RING = 4;
  let ringed = [];
  const clearRing = () => {
    ringed.forEach(([n, c]) => n.classList.remove(c)); ringed = [];
  };
  const mark = (n, c) => { n.classList.add(c); ringed.push([n, c]); };
  function makeRoom(target) {
    const r = target.getBoundingClientRect();
    for (let n = target.parentElement; n && n !== document.body; n = n.parentElement) {
      if (getComputedStyle(n).overflow === 'visible') continue;
      const q = n.getBoundingClientRect();
      if (r.top - q.top < RING || r.left - q.left < RING || q.right - r.right < RING || q.bottom - r.bottom < RING) mark(n, 'aa-ring-room');
    }
  }
  document.addEventListener('focusin', e => {
    const el = e.target;
    clearRing();
    if (!(el instanceof Element) || !el.matches(':focus-visible')) return;   // keyboard focus only, as the ring
    if (el.matches('[data-lb-key]')) {
      // the rounded frame that gives the media its corners (the media itself, or a wrapper of the same size)
      const box = [...sameBox(el)].find(n => getComputedStyle(n).borderRadius !== '0px');
      if (!box) return;
      mark(box, 'aa-ring-frame');
      if (box !== el) mark(el, 'aa-ring-moved');
      makeRoom(box);
      return;
    }
    if (!el.matches('a, button, [role="button"]') || el.matches('[class*="lb-"]')) return;
    if (el.matches('a') && el.offsetWidth <= 48 && el.offsetHeight <= 48 && el.querySelector('img')) mark(el, 'aa-ring-tile');
    makeRoom(el);
  });
  document.addEventListener('focusout', clearRing);
})();
