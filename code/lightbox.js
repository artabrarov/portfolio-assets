/*  Image lightbox for arthurabrarov.com
    Loaded on the live site from GitHub Pages (code/lightbox.min.js) through one script tag in
    Framer: Site Settings, General, Custom Code, end of body. Edit this file, rebuild the .min.js, push.
    Click a large image to open it full screen, zooming from where it sits; click, Esc or scroll closes it.
    Images stay in Framer: the full screen view asks Framer's image server for a bigger version. */
(() => {
  if (window.__lightbox) return;           // run once, even with Framer's page transitions
  window.__lightbox = true;

  const PAGES = ['/', ''];                 // paths where images zoom
  const MIN_SIZE = 200;                    // px: smaller images (avatar, logos) don't zoom
  const MARGIN = 32;                       // px around the image when open
  const EASE = 'cubic-bezier(.2,.8,.2,1)';
  const TIME = 420;                        // ms
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BACKDROP = 'var(--token-152a03bd-74bc-479f-a914-107adfcad8e6,#f4f4f4)';   // the page background colour style

  const css = document.createElement('style');
  css.textContent = `
    .lb-zoomable{cursor:zoom-in;}
    .lb-backdrop{position:fixed;inset:0;z-index:10001;background:${BACKDROP};opacity:0;cursor:zoom-out;}
    .lb-img{position:fixed;z-index:10002;margin:0;object-fit:cover;cursor:zoom-out;will-change:left,top,width,height;
      box-shadow:0 24px 80px rgba(0,0,0,.12);}
  `;
  document.head.appendChild(css);

  const onPage = () => PAGES.includes(location.pathname);
  const zoomable = el => el instanceof HTMLImageElement && onPage() && !el.closest('a, .fx-av, .fx-world, .lb-img') &&
    el.offsetWidth >= MIN_SIZE && el.offsetHeight >= MIN_SIZE / 2;

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
  function targetRect(img) {
    const ratio = (img.naturalWidth / img.naturalHeight) || (img.offsetWidth / img.offsetHeight);
    let w = innerWidth - MARGIN * 2, h = w / ratio;
    if (h > innerHeight - MARGIN * 2) { h = innerHeight - MARGIN * 2; w = h * ratio; }
    return { left: (innerWidth - w) / 2, top: (innerHeight - h) / 2, width: w, height: h };
  }
  const px = r => ({ left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });

  let open = null;   // { src, clone, backdrop, radius }

  function openImage(img) {
    if (open) return;
    const from = img.getBoundingClientRect();
    const radius = getComputedStyle(img).borderRadius;
    const backdrop = document.createElement('div');
    backdrop.className = 'lb-backdrop';
    const clone = document.createElement('img');
    clone.className = 'lb-img';
    clone.alt = img.alt;
    clone.src = img.currentSrc || img.src;
    clone.setAttribute('role', 'dialog');
    clone.setAttribute('aria-label', img.alt || 'Image, full screen');
    Object.assign(clone.style, px(from), { borderRadius: radius });
    document.body.append(backdrop, clone);
    img.style.visibility = 'hidden';
    open = { src: img, clone, backdrop, radius };

    const to = targetRect(img);
    const time = REDUCED ? 0 : TIME;
    clone.animate([{ ...px(from), borderRadius: radius }, { ...px(to), borderRadius: '12px' }],
      { duration: time, easing: EASE, fill: 'forwards' });
    backdrop.animate([{ opacity: 0 }, { opacity: 0.94 }], { duration: time || 150, easing: 'ease', fill: 'forwards' });

    // swap in the sharper version once it has loaded
    const big = new Image();
    big.onload = () => { if (open && open.clone === clone) clone.src = big.src; };
    big.src = bigSrc(img);
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
    const done = () => { clone.remove(); backdrop.remove(); src.style.visibility = ''; };
    backdrop.animate([{ opacity: 0.94 }, { opacity: 0 }], { duration: time || 150, easing: 'ease', fill: 'forwards' });
    if (to) clone.animate([{ ...current, borderRadius: '12px' }, { ...px(to), borderRadius: radius }],
      { duration: time, easing: EASE, fill: 'forwards' }).finished.then(done, done);
    else clone.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' }).finished.then(done, done);
  }

  // event delegation: Framer re-renders images, so nothing is bound to them directly
  document.addEventListener('pointerover', e => {
    const t = e.target;
    if (t instanceof HTMLImageElement) t.classList.toggle('lb-zoomable', zoomable(t));
  }, { passive: true });
  document.addEventListener('click', e => {
    if (open) { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (!zoomable(e.target)) return;
    e.preventDefault();
    openImage(e.target);
  }, true);
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  addEventListener('wheel', () => close(), { passive: true });
  addEventListener('scroll', () => close(), { passive: true });
  addEventListener('resize', () => {
    if (!open) return;
    open.clone.getAnimations().forEach(a => a.cancel());
    Object.assign(open.clone.style, px(targetRect(open.src)), { borderRadius: '12px' });
  });
})();
