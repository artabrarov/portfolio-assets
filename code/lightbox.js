/*  Image lightbox for arthurabrarov.com
    Loaded on the live site from GitHub Pages (code/lightbox.min.js) through one script tag in
    Framer: Site Settings, General, Custom Code, end of body. Edit this file, rebuild the .min.js, push.
    On computers (not phones or tablets), click a large image or video to open it full screen, zooming from where it sits; click, Esc or scroll closes it.
    Media stays in Framer: images open in a bigger version from Framer's image server, videos keep playing from where they were. */
(() => {
  if (window.__lightbox) return;           // run once, even with Framer's page transitions
  window.__lightbox = true;

  const SKIP = ['/sites'];                 // pages (and their subpages) where media doesn't zoom: the /sites cards are links
  const MIN_SIZE = 80;                     // px: smaller images and videos (avatar, logos) don't zoom
  const RADIUS = '24px';                   // corner of media whose rounding comes from a mask (Framer's squircles)
  const MARGIN = 32;                       // px around the image when open
  const EASE = 'cubic-bezier(.2,.8,.2,1)';
  const TIME = 420;                        // ms
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOUSE = matchMedia('(hover: hover) and (pointer: fine)');   // phones and tablets: off, media stays as it is
  const BACKDROP = 0.3;                    // opacity of the black overlay behind open media

  const css = document.createElement('style');
  css.textContent = `
    .lb-zoomable{cursor:zoom-in !important;}   /* !important: Framer's Video component sets cursor:auto inline */
    .lb-backdrop{position:fixed;inset:0;z-index:10001;background:#000;opacity:0;cursor:zoom-out;}
    .lb-media{position:fixed;z-index:10002;margin:0;object-fit:cover;cursor:zoom-out;will-change:left,top,width,height;
      box-shadow:0 24px 80px rgba(0,0,0,.12);}
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
  // the visible corner: the media's own rounding, an ancestor's, or RADIUS for masked shapes
  function radiusOf(el) {
    const r = el.getBoundingClientRect();
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const q = n.getBoundingClientRect();
      if (Math.abs(q.width - r.width) > 2 || Math.abs(q.height - r.height) > 2) break;
      const s = getComputedStyle(n);
      if (parseFloat(s.borderTopLeftRadius)) return s.borderTopLeftRadius;
      if (s.clipPath !== 'none' || s.maskImage !== 'none' || s.webkitMaskImage && s.webkitMaskImage !== 'none') return RADIUS;
    }
    return '0px';
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

  // where the open image sits: as large as fits on screen, centred, never bigger than the file
  function targetRect(el) {
    const ratio = ratioOf(el);
    let w = innerWidth - MARGIN * 2, h = w / ratio;
    if (h > innerHeight - MARGIN * 2) { h = innerHeight - MARGIN * 2; w = h * ratio; }
    return { left: (innerWidth - w) / 2, top: (innerHeight - h) / 2, width: w, height: h };
  }
  const px = r => ({ left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });

  let open = null;   // { src, clone, backdrop, radius }

  function openMedia(el) {
    if (open) return;
    const from = el.getBoundingClientRect();
    const radius = radiusOf(el);
    const backdrop = document.createElement('div');
    backdrop.className = 'lb-backdrop';
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
    clone.setAttribute('role', 'dialog');
    clone.setAttribute('aria-label', el.alt || (video ? 'Video, full screen' : 'Image, full screen'));
    Object.assign(clone.style, px(from), { borderRadius: radius });
    document.body.append(backdrop, clone);
    el.style.visibility = 'hidden';
    open = { src: el, clone, backdrop, radius, y: scrollY };

    const to = targetRect(video && clone.videoWidth ? clone : el);
    const time = REDUCED ? 0 : TIME;
    clone.animate([{ ...px(from), borderRadius: radius }, { ...px(to), borderRadius: '12px' }],
      { duration: time, easing: EASE, fill: 'forwards' });
    backdrop.animate([{ opacity: 0 }, { opacity: BACKDROP }], { duration: time || 150, easing: 'ease', fill: 'forwards' });

    if (video) return;
    // swap in the sharper version once it has loaded
    const big = new Image();
    big.onload = () => { if (open && open.clone === clone) clone.src = big.src; };
    big.src = bigSrc(el);
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
    const to = src.isConnected ? src.getBoundingClientRect() : null;
    const time = REDUCED ? 0 : TIME * 0.8;
    const current = px(clone.getBoundingClientRect());
    clone.getAnimations().forEach(a => a.cancel());
    Object.assign(clone.style, current, { borderRadius: '12px' });
    const done = () => {
      // hand the video's playhead back, so the page clip carries on from the same frame
      if (clone instanceof HTMLVideoElement && src.isConnected) try { src.currentTime = clone.currentTime; } catch (e) {}
      clone.remove(); backdrop.remove(); src.style.visibility = '';
    };
    backdrop.animate([{ opacity: BACKDROP }, { opacity: 0 }], { duration: time || 150, easing: 'ease', fill: 'forwards' });
    if (to) clone.animate([{ ...current, borderRadius: '12px' }, { ...px(to), borderRadius: radius }],
      { duration: time, easing: EASE, fill: 'forwards' }).finished.then(done, done);
    else clone.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' }).finished.then(done, done);
  }

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
    openMedia(m);
  }, true);
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  addEventListener('wheel', () => close(), { passive: true });
  // only a real scroll closes it: the page nudges itself by a few px while images further down load
  addEventListener('scroll', () => { if (open && Math.abs(scrollY - open.y) > 40) close(); }, { passive: true });
  addEventListener('resize', fit);
})();
