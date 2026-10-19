/*  Image lightbox for arthurabrarov.com
    Loaded on the live site from GitHub Pages (code/lightbox.min.js) through one script tag in
    Framer: Site Settings, General, Custom Code, end of body. Edit this file, rebuild the .min.js, push.
    On computers (not phones or tablets), click a large image or video to open it full screen, zooming from where it sits;
    the left and right arrow keys move through the page's images and videos; click, Esc or scroll closes it.
    Keyboard: Tab reaches each image and video, Enter or Space opens it, and focus returns to it on close.
    Media stays in Framer: images open in a bigger version from Framer's image server, videos keep playing from where they were. */
(() => {
  if (window.__lightbox) return;           // run once, even with Framer's page transitions
  window.__lightbox = true;

  const SKIP = ['/sites'];                 // pages (and their subpages) where media doesn't zoom: the /sites cards are links
  const MIN_SIZE = 80;                     // px: smaller images and videos (avatar, logos) don't zoom
  const RADIUS = '24px';                   // corner of media whose rounding comes from a mask (Framer's squircles)
  const MARGIN = 32;                       // px between the open media and the screen edges; the buttons sit the same distance in
  const TOP = MARGIN + 32 + 16;            // px above the media: the buttons (32px tall) and a 16px gap
  const EASE = 'cubic-bezier(.2,.8,.2,1)';
  const TIME = 420;                        // ms
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOUSE = matchMedia('(hover: hover) and (pointer: fine)');   // phones and tablets: off, media stays as it is
  const OVERLAY = '#fff';                  // behind open media: solid white, no effects
  const DARK = 'var(--token-5bd8d564-6722-4f00-b75b-168ab9b708da,#1f1f1f)';   // the site's colour styles
  const FILL = 'var(--token-3a13a808-b14e-4572-b32b-40a978401861,#f4f4f4)';
  const TYPE = '"Instrument Sans Variable","Instrument Sans",sans-serif';   // fallback before the page's styles are read
  const FILL_HOVER = 'var(--token-561f0f19-24cd-4e69-b381-b29adb2edb7f,#e9e7e7)';   // the buttons' hover colour

  const css = document.createElement('style');
  css.textContent = `
    .lb-zoomable{cursor:zoom-in !important;}   /* !important: Framer's Video component sets cursor:auto inline */
    /* the ring sits inside the edge: Framer's card frames clip anything drawn outside */
    [data-lb-key]:focus-visible{outline:3px solid #1f1f1f !important;outline-offset:-3px;}
    .lb-media:focus{outline:none;}
    .lb-backdrop{position:fixed;inset:0;z-index:10001;background:${OVERLAY};opacity:0;cursor:zoom-out;}
    .lb-media{position:fixed;z-index:10002;margin:0;object-fit:cover;cursor:zoom-out;will-change:left,top,width,height;}
    /* counter (top left) and Close (top right) look like the site's buttons: 32px tall, 18px sides, grey fill, dark text */
    .lb-count,.lb-close{position:fixed;top:${MARGIN}px;z-index:10003;box-sizing:border-box;height:32px;padding:6px 18px;margin:0;border:0;
      border-radius:999px;background:${FILL};color:${DARK};white-space:nowrap;opacity:0;transition:opacity .25s ease,background-color .2s;
      /* type copied from the page's Framer styles by syncType(); the values after the commas are fallbacks */
      font-family:var(--lb-text-family,${TYPE});font-size:var(--lb-size,14px);line-height:var(--lb-lh,20px);
      letter-spacing:var(--lb-ls,normal);font-weight:var(--lb-text-weight,460);font-variation-settings:var(--lb-text-wght,"wght" 460);}
    .lb-count{left:${MARGIN}px;pointer-events:none;font-variant-numeric:tabular-nums;}   /* paragraph style */
    .lb-close{right:${MARGIN}px;cursor:pointer;font-family:var(--lb-btn-family,${TYPE});
      font-weight:var(--lb-btn-weight,560);font-variation-settings:var(--lb-btn-wght,"wght" 560);}   /* button label style */
    .lb-close:hover{background:${FILL_HOVER};}
    .lb-close:focus-visible{outline:2px solid ${DARK};outline-offset:2px;}
    .lb-close.lb-quiet:focus-visible{outline:none;}   /* opened with the mouse: no ring until Tab is pressed */
    .lb-count.lb-show,.lb-close.lb-show{opacity:1;}
  `;
  document.head.appendChild(css);

  const onPage = () => MOUSE.matches && !SKIP.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
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
  function targetRect(el) {
    const ratio = ratioOf(el), room = innerHeight - TOP - MARGIN;
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
      clone.src = el.currentSrc || el.src;
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
    big.onload = () => { loaded.add(src); if (open && open.clone === clone) clone.src = src; };
    big.src = src;
  }
  // start loading the sharp versions either side, so the arrow keys show them crisp at once
  function preloadAround(el) {
    const list = allMedia(), i = list.indexOf(el);
    [list[i - 1], list[i + 1]].forEach(n => {
      if (!(n instanceof HTMLImageElement)) return;
      const src = bigSrc(n);
      if (loaded.has(src)) return;
      const img = new Image();
      img.onload = () => loaded.add(src);
      img.src = src;
    });
  }

  // the counter ("4 / 13", top left, only when there's more than one to browse) and the Close button (top right)
  const count = document.createElement('div');
  count.className = 'lb-count';
  count.setAttribute('aria-live', 'polite');
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
    if (list.length < 2 || i < 0) { count.classList.remove('lb-show'); return; }
    if (!count.isConnected) document.body.append(count);
    count.textContent = `${i + 1} / ${list.length}`;
    requestAnimationFrame(() => count.classList.add('lb-show'));
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
    closeBtn.classList.toggle('lb-quiet', viaPointer);
    closeBtn.focus({ preventScroll: true });
    el.style.opacity = '0';
    open = { src: el, clone, backdrop, radius, y: scrollY };

    const to = targetRect(video && clone.videoWidth ? clone : el);
    const time = REDUCED ? 0 : TIME;
    clone.animate([{ ...px(from), borderRadius: radius }, { ...px(to), borderRadius: '12px' }],
      { duration: time, easing: EASE, fill: 'forwards' });
    backdrop.animate([{ opacity: 0 }, { opacity: 1 }], { duration: time || 150, easing: 'ease', fill: 'forwards' });
    sharpen(el, clone);
    showCount(el);
    preloadAround(el);
  }

  // every zoomable image and video on the page, top to bottom (zoomable skips Framer's hidden copies for other breakpoints)
  const allMedia = () => [...document.querySelectorAll('img, video')].filter(zoomable);
  // arrow keys: slide to the previous or next one; stops at either end
  function step(dir) {
    if (!open) return;
    const list = allMedia(), next = list[list.indexOf(open.src) + dir];
    if (!next) return;
    const { src: prev, clone: old } = open;
    // hand the playhead back to the page clip being left, and show it again
    if (old instanceof HTMLVideoElement) try { prev.currentTime = old.currentTime; } catch (e) {}
    prev.style.opacity = '';
    // the page stays still while browsing: closing flies back if this one is on screen, and fades out otherwise
    const clone = makeClone(next);
    Object.assign(clone.style, px(targetRect(next)), { borderRadius: '12px' });
    document.body.append(clone);
    next.style.opacity = '0';
    open = { ...open, src: next, clone, radius: radiusOf(next) };
    const time = REDUCED ? 0 : 280, shift = 48 * dir;
    const at = px(old.getBoundingClientRect());
    old.getAnimations().forEach(a => a.cancel());
    Object.assign(old.style, at);
    old.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `${-shift}px 0` }],
      { duration: time || 1, easing: EASE, fill: 'forwards' }).finished.then(() => old.remove(), () => old.remove());
    clone.animate([{ opacity: 0, translate: `${shift}px 0` }, { opacity: 1, translate: '0 0' }],
      { duration: time || 1, easing: EASE, fill: 'backwards' });
    sharpen(next, clone);
    showCount(next);
    preloadAround(next);
  }

  // places the open media at its full screen size, without animating (on resize, or once a video knows its shape)
  function fit() {
    if (!open) return;
    const { clone, src } = open;
    clone.getAnimations().forEach(a => a.cancel());
    Object.assign(clone.style, px(targetRect(clone.videoWidth ? clone : src)), { borderRadius: '12px' });
  }

  function close() {
    if (!open) return;
    const { src, clone, backdrop, radius } = open;
    open = null;
    count.classList.remove('lb-show');
    closeBtn.classList.remove('lb-show');
    // fly back only to a spot that's on screen (after browsing with the arrows it may not be)
    const r = src.isConnected ? src.getBoundingClientRect() : null;
    const to = r && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth ? r : null;
    const time = REDUCED ? 0 : TIME * 0.8;
    const current = px(clone.getBoundingClientRect());
    clone.getAnimations().forEach(a => a.cancel());
    Object.assign(clone.style, current, { borderRadius: '12px' });
    const done = () => {
      // hand the video's playhead back, so the page clip carries on from the same frame
      if (clone instanceof HTMLVideoElement && src.isConnected) try { src.currentTime = clone.currentTime; } catch (e) {}
      clone.remove(); backdrop.remove(); src.style.opacity = '';
    };
    // keyboard use (opened with Enter, or Tab pressed): focus goes straight back to where the lightbox was, so Tab
    // carries on from there. Opened with the mouse: just let go of focus, so Esc doesn't leave a ring on the image
    if (!closeBtn.classList.contains('lb-quiet') && src.isConnected && src.hasAttribute(KEY)) src.focus({ preventScroll: true });
    else closeBtn.blur();
    backdrop.animate([{ opacity: 1 }, { opacity: 0 }], { duration: time || 150, easing: 'ease', fill: 'forwards' });
    if (to) clone.animate([{ ...current, borderRadius: '12px' }, { ...px(to), borderRadius: radius }],
      { duration: time, easing: EASE, fill: 'forwards' }).finished.then(done, done);
    else clone.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.96 }],
      { duration: REDUCED ? 150 : 240, easing: EASE, fill: 'forwards' }).finished.then(done, done);
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
    if (open) { e.preventDefault(); e.stopPropagation(); close(); return; }
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
    if (e.key === 'Tab') { e.preventDefault(); closeBtn.classList.remove('lb-quiet'); closeBtn.focus({ preventScroll: true }); }   // keep focus in the lightbox
    else if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });
  addEventListener('wheel', () => close(), { passive: true });
  // only a real scroll closes it: the page nudges itself by a few px while images further down load
  addEventListener('scroll', () => { if (open && Math.abs(scrollY - open.y) > 40) close(); }, { passive: true });
  addEventListener('resize', fit);
})();
