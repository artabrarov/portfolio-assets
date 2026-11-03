/*  Coffee: the bags of coffee Arthur drinks, full screen like the lightbox. They stand in a line, newest in the
    middle and older ones to its left, each with its name and roaster under it; scroll, swipe or drag to move along
    it. Click a bag (or anywhere in its column, labels included) to zoom in: it flies to the middle while the rest
    fade where they are, with "<coffee> by <roaster>" and Arthur's review under it, and the lightbox's ‹ n / N ›
    switcher at the top. Zoomed in, dragging turns the bag round (tipping it only slightly up and down), it leans a
    little towards the pointer, and ‹ ›, ← → or a swipe slide to the next one. A click outside or Esc goes back to
    the line; there, a click outside, Close or Esc closes it, and Back works too.
    Opens from any link to #coffee (the footer's Coffee link) or when a page is opened at #coffee.
    The bags are built here, not modelled: a block-bottom bag or a stand-up pouch of the bag's real size, with photos
    of each face wrapped on. The list is coffee/coffees.json next to this script's code/ folder, each bag's faces
    are coffee/<slug>/<face>.webp; adding a coffee is a push, with no Framer step. three.js loads on first open.
    Styles come from Framer: colour styles (as CSS tokens); the text styles Title and Paragraph, read from the page
    each time it opens (the zoomed-in caption), and Title Large and Paragraph Large for the labels, read the same
    way if the page uses them, otherwise Title and Paragraph at their size (19/28); Close and the switcher are the
    lightbox's own buttons (its classes, styled by lightbox.js). */
(() => {
  if (window.__coffee) return;
  window.__coffee = true;
  const BASE = new URL('../coffee/', document.currentScript?.src || location.href).href;
  const THREE_URL = 'https://esm.sh/three@0.169.0';
  const ROOM_URL = 'https://esm.sh/three@0.169.0/examples/jsm/environments/RoomEnvironment.js';
  const HASH = '#coffee';
  const UNIT = 24;      // cm per scene unit
  const REST = -29;     // each bag's resting turn in degrees (or its own `rest`): the front and a bit of its right side
  const FRONT = 0.5;    // how much of the window's height a bag zoomed in takes
  const TILT = 0.2;     // the most a bag tips up or down while dragged, in radians (about 11°)
  const LEAN_Y = 0.22, LEAN_P = 0.12; // how far a bag zoomed in leans towards the pointer (radians, at the window's edge)
  // opening: how much smaller and how far round to the side bags start, over the lightbox's own 300ms and easing
  const INTRO_SCALE = 0.86, INTRO_TURN = 0.9, INTRO_MS = 300, EASE = [0.32, 0.72, 0, 1];
  // the site's colour styles (Framer tokens), with their values as fallbacks
  const C = {
    page: 'var(--token-152a03bd-74bc-479f-a914-107adfcad8e6, #f6f5f2)',   // Background (the count's fill, as in the lightbox)
    bg: 'var(--token-772df573-5188-456c-a0aa-cb8aab4df26b, #fffffd)',     // White
    text: 'var(--token-5bd8d564-6722-4f00-b75b-168ab9b708da, #2e261c)',   // Black
    muted: 'var(--token-615fb88e-2b97-4a94-a05e-5dc74036ced2, #726555)',  // Dark Grey
  };
  // the site's Framer text styles, by id (data-styles-preset), and what to use when the page doesn't have one
  const STYLES = {
    title: { id: 'JKwDHhFaI', size: '15px', line: '24px', weight: 525 },          // Title
    paragraph: { id: 'QRxj038Jb', size: '15px', line: '24px', weight: 425 },      // Paragraph
    titleLarge: { id: 'qfI2n2Dvt', from: 'title', size: '19px', line: '28px' },   // Title Large
    paragraphLarge: { id: 'mnEcxcKo_', from: 'paragraph', size: '19px', line: '28px' }, // Paragraph Large
  };

  let ui = null, opened = false, pushed = false;

  // ---------- page wiring ----------

  const isCoffeeLink = (a) => {
    try { const u = new URL(a.href, location.href); return u.hash === HASH && u.origin === location.origin; } catch (e) { return false; }
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || !isCoffeeLink(a) || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    e.stopPropagation();
    open(true);
  }, true);
  addEventListener('popstate', () => { if (location.hash === HASH) open(false); else if (opened) close(false); });
  // opened at #coffee: wait for Framer to finish building the page, or it clears #overlay
  if (location.hash === HASH) {
    const go = () => setTimeout(() => location.hash === HASH && open(false), 300);
    document.readyState === 'complete' ? go() : addEventListener('load', go, { once: true });
  }

  function open(push) {
    if (opened) return;
    opened = true;
    if (push) { history.pushState({ coffee: 1 }, '', HASH); pushed = true; }
    if (!ui) ui = build();
    ui.show();
  }
  function close(back = true) {
    if (!opened) return;
    opened = false;
    ui.hide();
    if (back && pushed) history.back();
    else if (back) history.replaceState(null, '', location.pathname + location.search);
    pushed = false;
  }

  // ---------- text styles, read from the page ----------

  // a text style's look, from an element that uses it on this page, or from its fallback
  function textStyle(name) {
    const s = STYLES[name];
    const el = document.querySelector(`[data-styles-preset="${s.id}"]`);
    if (el) {
      const t = getComputedStyle(el);
      return {
        family: t.fontFamily, size: t.fontSize, line: t.lineHeight, weight: t.fontWeight, spacing: t.letterSpacing,
        variation: t.fontVariationSettings, features: t.fontFeatureSettings,
      };
    }
    const base = s.from ? textStyle(s.from) : {
      family: '"Inter Variable","Inter Variable Placeholder",Inter,sans-serif', spacing: '0.01em',
      variation: `"opsz" 14,"wght" ${s.weight}`, features: '"blwf","cv03","cv04","cv09","cv11","liga" 0', weight: s.weight,
    };
    return { ...base, size: s.size, line: s.line };
  }
  const css = (t, color) => `font-family:${t.family};font-size:${t.size};line-height:${t.line};font-weight:${t.weight};`
    + `letter-spacing:${t.spacing};font-variation-settings:${t.variation};font-feature-settings:${t.features};color:${color}`;

  // ---------- the overlay ----------

  const ICON_PREV = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M9 12L5 8L9 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_NEXT = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M7 12L11 8L7 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function build() {
    const style = document.createElement('style');
    const paint = () => {
      const title = textStyle('title'), para = textStyle('paragraph');
      const tl = textStyle('titleLarge'), pl = textStyle('paragraphLarge');
      style.textContent = `
.cf-root{position:fixed;inset:0;z-index:10002;background:${C.bg};opacity:0;visibility:hidden;
  transition:opacity .25s ease,visibility 0s linear .25s;-webkit-font-smoothing:antialiased;overscroll-behavior:contain;touch-action:none}
.cf-root:focus{outline:none}
.cf-root.cf-on{opacity:1;visibility:visible;transition:opacity .25s ease}
.cf-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.cf-caption{position:absolute;bottom:32px;left:50%;transform:translateX(-50%);width:min(440px,calc(100% - 48px));text-align:center;
  transition:opacity .2s ease;pointer-events:none}
.cf-caption.cf-out{opacity:0}
.cf-title{${css(title, C.text)}}
.cf-by{color:${C.muted}}
.cf-review{${css(para, C.muted)};margin:2px 0 0;text-wrap:pretty}
.cf-labels{position:absolute;inset:0;pointer-events:none}
.cf-label{position:absolute;left:0;top:0;white-space:nowrap;text-align:center;transition:opacity .15s ease}
.cf-name{${css(tl, C.text)}}
.cf-roaster{${css(pl, C.muted)};margin-top:4px}
@media (max-width:600px){.cf-caption{bottom:16px}}`;
    };
    paint();
    document.head.appendChild(style);

    const root = document.createElement('div');
    root.className = 'cf-root';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Coffee');
    root.tabIndex = -1;
    root.innerHTML = `<canvas class="cf-canvas"></canvas>
      <div class="cf-labels" aria-hidden="true"></div>
      <div class="lb-nav"><button class="lb-arrow" type="button" aria-label="Previous">${ICON_PREV}</button><div class="lb-count" aria-live="polite"></div><button class="lb-arrow" type="button" aria-label="Next">${ICON_NEXT}</button></div>
      <div class="cf-caption" aria-live="polite"><div class="cf-title"></div><p class="cf-review"></p></div>
      <button class="lb-close lb-show" type="button">Close</button>`;
    const canvas = root.querySelector('canvas');
    const caption = root.querySelector('.cf-caption');
    const labels = root.querySelector('.cf-labels');
    // zoomed in, Close steps aside: a click around the bag (or Esc) goes back to the line, then Close closes
    const closer = root.querySelector('.lb-close');
    closer.addEventListener('click', () => close());
    const nav = root.querySelector('.lb-nav'), count = nav.querySelector('.lb-count');
    const [prev, next] = nav.querySelectorAll('.lb-arrow');
    prev.addEventListener('click', () => scene && scene.step(-1));
    next.addEventListener('click', () => scene && scene.step(1));
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); if (!(scene && scene.unfocus())) close(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); scene && scene.step(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); scene && scene.step(1); }
    });

    let scene = null, lastFocus = null, htmlOverflow = '', removeT = 0;
    const ready = Promise.all([
      import(THREE_URL), import(ROOM_URL),
      fetch(BASE + 'coffees.json', { cache: 'no-cache' }).then((r) => r.json()),
    ]).then(([THREE, room, data]) => {
      const list = (data.coffees || []).filter((c) => c.slug).sort((a, b) => String(a.date).localeCompare(String(b.date)));
      scene = createScene(THREE, room.RoomEnvironment, canvas, labels, list, (focus) => {
        showCaption(focus >= 0 ? list[focus] : null);
        nav.classList.toggle('lb-show', list.length > 1 && focus >= 0);
        closer.classList.toggle('lb-show', focus < 0);
        if (focus >= 0) count.textContent = `${focus + 1} / ${list.length}`;
        prev.disabled = focus <= 0;
        next.disabled = focus >= list.length - 1;
      }, () => close());
      return scene;
    }).catch((e) => { console.warn('Coffee could not load', e); });

    let shown;
    function showCaption(c) {
      if (c === shown) return;
      const first = shown === undefined;
      shown = c;
      const fill = () => {
        if (!c) return;
        // "Church Street by 15grams": the coffee and its roaster in Black, "by" in Dark Grey
        const t = caption.querySelector('.cf-title');
        t.textContent = '';
        const by = document.createElement('span');
        by.className = 'cf-by';
        by.textContent = ' by ';
        t.append(c.name || '', ...(c.roaster ? [by, c.roaster] : []));
        caption.querySelector('.cf-review').textContent = c.review || '';
        caption.classList.remove('cf-out');
      };
      clearTimeout(showCaption.t);
      if (!c) return caption.classList.add('cf-out');
      if (first) return fill();
      caption.classList.add('cf-out');
      showCaption.t = setTimeout(fill, 160);
    }

    return {
      show() {
        // inside Framer's #overlay while open, so the lightbox stands down as it does for Framer's own overlays
        clearTimeout(removeT);
        paint();
        (document.getElementById('overlay') || document.body).appendChild(root);
        root.getBoundingClientRect();
        lastFocus = document.activeElement;
        htmlOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        root.classList.add('cf-on');
        root.focus({ preventScroll: true });
        ready.then((s) => s && s.start());
      },
      hide() {
        root.classList.remove('cf-on');
        clearTimeout(removeT);
        removeT = setTimeout(() => !opened && root.remove(), 300);
        document.documentElement.style.overflow = htmlOverflow;
        scene && scene.stop();
        lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
      },
    };
  }

  // ---------- the 3D scene ----------

  // onState(focus): the bag zoomed in changed (-1: none); onOutside: a click on nothing on the line
  function createScene(THREE, RoomEnvironment, canvas, labelsEl, list, onState, onOutside) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.85;
    const key = new THREE.DirectionalLight(0xfffaf2, 1.3);
    key.position.set(-2.5, 3, 4);
    const rim = new THREE.DirectionalLight(0xfff1e0, 0.5);
    rim.position.set(3, 2, -3);
    scene.add(key, rim);
    const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 100);
    const loader = new THREE.TextureLoader().setCrossOrigin('anonymous');
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const ray = new THREE.Raycaster();
    const v3 = new THREE.Vector3();
    const n = list.length;
    const ease = bezier(...EASE);

    // each bag turns freely to the sides (yaw) and tips only a little up and down (pitch, within TILT)
    const euler = new THREE.Euler(0, 0, 0, 'XYZ');
    const orient = (b) => b.pivot.quaternion.setFromEuler(euler.set(b.pitch + b.leanP, b.yaw + b.leanY, 0));
    const H0 = 1; // every bag is sized to this, so the frame suits them all
    const fitOf = (b) => H0 / Math.max(b.H, b.W * 0.8, b.D * 0.8);

    // focus: the bag zoomed in (-1: none); pos: where the line is scrolled to (a float index, the newest last)
    let focus = -1, pos = n - 1, target = pos, hover = null, pointerX = 0.5, pointerY = 0.5;
    let raf = 0, running = false, dirty = true, placed = false, introAt = -1, drag = null;

    const bags = list.map(makeBag);
    // the name and roaster under each bag on the line
    const labels = list.map((c) => {
      const el = document.createElement('div'), name = document.createElement('div'), roaster = document.createElement('div');
      el.className = 'cf-label'; name.className = 'cf-name'; roaster.className = 'cf-roaster';
      name.textContent = c.name || '';
      roaster.textContent = c.roaster || '';
      el.append(name, roaster);
      el.style.opacity = '0';
      labelsEl.appendChild(el);
      return el;
    });

    function makeBag(c) {
      const b = c.bag || {};
      const W = (b.w ?? 13) / UNIT, H = (b.h ?? 20) / UNIT, D = (b.d ?? 7) / UNIT;
      const geo = b.shape === 'box'
        ? box(THREE, W, H, D, (b.seal ?? 2) / UNIT, b.taper ?? 0.6)
        : pouch(THREE, W, H, D, (b.seal ?? 2.8) / UNIT);
      const finish = FINISH[b.finish] || FINISH.matte;
      const plain = new THREE.Color(b.color || '#d9d2c3');
      const faces = new Set(c.faces || ['front', 'back']);
      const dir = BASE + encodeURIComponent(c.slug) + '/';
      const mat = (face, extra = {}) => {
        const m = new THREE.MeshPhysicalMaterial({ ...finish, color: plain, ...extra });
        if (faces.has(face)) loader.load(dir + face + '.webp', (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = maxAniso;
          m.map = t; m.color.set(0xffffff); m.alphaTest = face === 'front' || face === 'back' ? 0.5 : 0;
          m.needsUpdate = true;
          bags.forEach((t2) => { t2.faded = undefined; }); // the new texture takes the current fade
          dirty = true;
          kick();
        });
        return m;
      };
      // the bag turns about its middle (`pivot` holds its orientation), so its body sits half its height down
      const pivot = new THREE.Group(), body = new THREE.Group(), holder = new THREE.Group();
      body.position.y = -H / 2;
      body.add(new THREE.Mesh(geo.front, mat('front')));
      body.add(new THREE.Mesh(geo.back, mat('back')));
      geo.sides.forEach((g, k) => body.add(new THREE.Mesh(g, mat(k ? 'left' : 'right'))));
      body.add(new THREE.Mesh(geo.bottom, mat('bottom', { side: THREE.DoubleSide })));
      pivot.add(body);
      holder.add(pivot);
      scene.add(holder);
      const rest = THREE.MathUtils.degToRad(c.rest ?? REST);
      const bag = { c, W, H, D, holder, pivot, rest, yaw: rest, pitch: 0, leanY: 0, leanP: 0, spin: 0, cur: null };
      orient(bag);
      return bag;
    }

    // ---- where each bag should be: x, y, z, its scale and opacity; the loop eases each one there ----
    const view = () => { const h = H0 / FRONT; return { h, w: h * camera.aspect }; };
    // its place on the line (its name and roaster are pinned under it)
    const spot = (i) => {
      const size = view().h * 0.26;
      return { x: (i - pos) * size * 1.45, y: H0 / 2 + view().h * 0.03, z: 0, size, gap: size * 1.45 };
    };
    const slide = () => view().w * 0.3; // how far bags slide when switching with ‹ ›
    const focused = () => (focus >= 0 ? bags[focus] : null);
    function goal(b, i) {
      if (focus >= 0 && i === focus) return { x: 0, y: H0 / 2, z: 0, s: fitOf(b), o: 1 };
      // switched away from with ‹ ›: it slides out the other way as it fades
      if (focus >= 0 && b.away) return { x: -b.away * slide(), y: H0 / 2, z: 0, s: fitOf(b), o: 0 };
      // zooming in, the others stay where they are and fade out, quickly
      const g = spot(i), grow = focus < 0 && hover === b ? 1.06 : 1;
      return { x: g.x, y: g.y, z: g.z, s: fitOf(b) * g.size * grow / H0, o: focus >= 0 ? 0 : 1 };
    }
    // a bag's opacity, on all its materials (each bag has its own)
    function fade(b, o) {
      if (b.faded === o) return;
      b.faded = o;
      b.pivot.traverse((m) => {
        if (!m.isMesh) return;
        const was = m.material.transparent;
        m.material.transparent = o < 1;
        m.material.opacity = o;
        m.material.depthWrite = o >= 1;
        if (was !== m.material.transparent) m.material.needsUpdate = true;
      });
    }
    function layout() {
      let moving = false;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      bags.forEach((b, i) => {
        const t = goal(b, i);
        if (!b.cur || !placed) b.cur = { ...t };
        if (b.snap) { b.cur = { ...t, o: 0 }; b.snap = false; } // back to its place unseen, then fades in
        // scrolling the line moves its bags at once; easing is for zooming in and out
        const direct = focus < 0 && !b.flying;
        if (b.flying && Math.abs(t.x - b.cur.x) + Math.abs(t.y - b.cur.y) + Math.abs(t.s - b.cur.s) < 2e-3) b.flying = false;
        for (const k of ['x', 'y', 'z', 's', 'o']) {
          if (direct && k === 'x') { b.cur.x = t.x; continue; }
          const d = t[k] - b.cur[k];
          if (Math.abs(d) > 1e-3) { b.cur[k] += d * (k === 'o' ? 0.45 : 0.16); moving = true; } else b.cur[k] = t[k];
        }
        b.holder.position.set(b.cur.x, b.cur.y, b.cur.z);
        b.holder.scale.setScalar(Math.max(b.cur.s, 1e-4));
        fade(b, b.cur.o);
        b.holder.visible = b.cur.s > 0.002 && b.cur.o > 0.01 && Math.abs(b.cur.x) < view().w;
        // its name and roaster, pinned under its place on the line, so they fade where they are
        const g = spot(i);
        v3.set(g.x, g.y - g.size / 2 - 0.14, g.z).project(camera);
        labels[i].style.transform = `translate(${((v3.x + 1) / 2) * w}px, ${((1 - v3.y) / 2) * h}px) translate(-50%, 0)`;
        labels[i].style.opacity = focus < 0 && Math.abs(g.x) < view().w ? '1' : '0';
      });
      placed = true;
      // opening: each bag grows from a little smaller and turns from its side into its rest
      if (introAt >= 0) {
        const t = Math.min(1, (performance.now() - introAt) / INTRO_MS), k = ease(t);
        if (t >= 1) introAt = -1;
        bags.forEach((b, i) => {
          if (b === focused()) return;
          b.holder.scale.setScalar(Math.max(goal(b, i).s * (INTRO_SCALE + (1 - INTRO_SCALE) * k), 1e-4));
          if (hover !== b && !(drag && drag.on === b)) { b.yaw = b.rest - INTRO_TURN * (1 - k); orient(b); }
        });
        moving = true;
      }
      return moving;
    }

    function frameCamera() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // a bag zoomed in (sized to H0) takes FRONT of the height, in the middle of the window
      const fit = H0 / FRONT;
      const dist = fit / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      camera.position.set(0, H0 / 2 + dist * 0.12, dist);
      camera.lookAt(0, H0 / 2, 0);
      camera.updateProjectionMatrix();
      dirty = true;
    }

    // ---- input: dragging the bag zoomed in turns it; on the line, drag and scroll move along it ----
    const turn = (b, dx, dy) => {
      b.yaw += dx;
      b.pitch = Math.max(-TILT, Math.min(TILT, b.pitch + dy));
      orient(b);
    };
    const hit = (e) => {
      const r = canvas.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const found = ray.intersectObjects(bags.filter((b) => b.holder.visible).map((b) => b.pivot), true)[0];
      for (let o = found && found.object; o; o = o.parent) { const b = bags.find((t) => t.pivot === o); if (b) return b; }
      // on the line, each bag is a whole column, as on pengzhe.ng: from just above it to under its name and
      // roaster, as wide as the space between bags, so a click on its labels opens it too
      if (focus < 0) {
        const px = e.clientX - r.left, py = e.clientY - r.top;
        for (let i = 0; i < n; i++) {
          if (!bags[i].holder.visible) continue;
          const g = spot(i), wide = g.gap * 0.46;
          const tl = v3.set(g.x - wide, g.y + g.size / 2 + 0.04, g.z).project(camera).clone();
          const br = v3.set(g.x + wide, g.y, g.z).project(camera);
          const x0 = ((tl.x + 1) / 2) * r.width, x1 = ((br.x + 1) / 2) * r.width, y0 = ((1 - tl.y) / 2) * r.height;
          const lab = labels[i].getBoundingClientRect(), y1 = lab.height ? lab.bottom - r.top + 8 : ((1 - br.y) / 2) * r.height;
          if (px >= x0 && px <= x1 && py >= y0 && py <= y1) return bags[i];
        }
      }
      return null;
    };
    canvas.addEventListener('pointerdown', (e) => {
      if (e.button) return;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      const b = hit(e);
      drag = { on: b, turning: b && b === focused(), x: e.clientX, y: e.clientY, moved: 0 };
      if (drag.turning) { b.spin = 0; canvas.style.cursor = 'grabbing'; }
      kick();
    });
    canvas.addEventListener('pointermove', (e) => {
      const cr = canvas.getBoundingClientRect();
      pointerX = (e.clientX - cr.left) / cr.width;
      pointerY = (e.clientY - cr.top) / cr.height;
      if (!drag) {
        const b = hit(e);
        if (hover !== b) { hover = b; dirty = true; }
        // the bag zoomed in can be grabbed and turned; one on the line opens with a click
        canvas.style.cursor = !b ? '' : b === focused() ? 'grab' : 'zoom-in';
        kick();
        return;
      }
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.turning) {
        turn(drag.on, dx * 0.011, dy * 0.011);
        drag.on.spin = dx * 0.011;
      } else if (focus < 0) {
        target = pos = clampPos(pos - dx / (spot(0).gap * canvas.clientHeight / view().h));
      }
      dirty = true;
      kick();
    });
    const up = () => {
      if (!drag) return;
      const d = drag;
      drag = null;
      canvas.style.cursor = '';
      if (!d.turning && d.moved < 6) {
        if (d.on) focusOn(bags.indexOf(d.on));
        // a click on nothing goes back from a bag zoomed in; on the line it closes, like the lightbox
        else if (!unfocus()) onOutside();
      }
      kick();
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    let wheelSum = 0, wheelT = 0, wheelLock = false, wheelAt = 0, wheelLow = 0, wheelDir = 0;
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (focus < 0) {
        // the line follows the trackpad exactly, and stays wherever it's left
        target = pos = clampPos(pos + d / 300);
        dirty = true;
      } else {
        // zoomed in, one swipe moves one bag. After a step, the rest of that swipe and its momentum are ignored;
        // momentum only ever slows down, so a sudden speed-up (or a change of direction) is a new swipe
        const a = Math.abs(d), now = performance.now();
        clearTimeout(wheelT);
        wheelT = setTimeout(() => { wheelLock = false; wheelSum = 0; }, 160);
        if (wheelLock) {
          wheelLow = Math.min(wheelLow, a);
          if (now - wheelAt > 120 && (a > Math.max(4, wheelLow * 2.5) || Math.sign(d) !== wheelDir)) { wheelLock = false; wheelSum = 0; }
        }
        if (!wheelLock) {
          wheelSum += d;
          if (Math.abs(wheelSum) > 50) {
            wheelDir = Math.sign(wheelSum);
            step(wheelDir);
            wheelLock = true; wheelSum = 0; wheelAt = now; wheelLow = a;
          }
        }
      }
      kick();
    }, { passive: false });
    const clampPos = (p) => Math.max(0, Math.min(n - 1, p));

    let lastFocus = null;
    const report = () => { if (focus !== lastFocus) { lastFocus = focus; onState(focus); } };
    function focusOn(i) {
      if (i < 0 || i >= n || i === focus) return;
      bags[i].away = 0;
      if (focused()) focused().spin = 0;
      focus = i;
      report();
      kick();
    }
    function unfocus() {
      if (focus < 0) return false;
      bags.forEach((t) => { if (t.away) { t.away = 0; t.snap = true; } });
      if (Math.abs(focus - pos) > 1.5) target = focus;
      if (!focused().away) focused().flying = true; // it flies back to its place
      focus = -1;
      report();
      kick();
      return true;
    }
    // switching with ‹ ›, ← → or a swipe: the next one slides in from the side it's on, like the lightbox
    function step(d) {
      if (focus < 0) { target = clampPos(Math.round(target) + d); kick(); return; }
      const i = clampPos(focus + d);
      if (i === focus) return;
      const out = focused();
      out.away = d; out.spin = 0;
      const b = bags[i];
      b.away = 0;
      b.cur = { x: d * slide(), y: H0 / 2, z: 0, s: fitOf(b), o: 0 };
      b.yaw = b.rest; b.pitch = 0; b.leanY = b.leanP = 0; orient(b);
      focus = i;
      report();
      kick();
    }

    // ---- loop: runs while anything moves, then stops ----
    function tick() {
      raf = 0;
      if (!running) return;
      let moving = false;
      if (!drag || drag.turning) {
        const d = target - pos;
        if (Math.abs(d) > 0.0005) { pos += d * 0.14; moving = true; } else pos = target;
      }
      bags.forEach((b) => {
        if (drag && drag.turning && drag.on === b) return;
        // let go, it keeps turning a little and levels out
        if (Math.abs(b.spin) > 0.0003) { b.yaw += b.spin; b.spin *= 0.94; moving = true; }
        if (Math.abs(b.pitch) > 0.0005) { b.pitch *= 0.88; moving = true; } else b.pitch = 0;
        // on the line, a bag turns back to its rest the short way round; hovered, it turns to face you (its front
        // square on), following the pointer only slightly
        if (b !== focused() && Math.abs(b.spin) <= 0.0003) {
          const aim = hover === b && focus < 0 ? (pointerX - 0.5) * 0.25 : b.rest;
          const d = Math.atan2(Math.sin(aim - b.yaw), Math.cos(aim - b.yaw));
          if (Math.abs(d) > 0.002) { b.yaw += d * 0.1; moving = true; }
        }
        // zoomed in, it leans a little towards the pointer
        const leaning = b === focused() && !(drag && drag.turning);
        const ly = leaning ? (pointerX - 0.5) * 2 * LEAN_Y : 0, lp = leaning ? (pointerY - 0.5) * 2 * LEAN_P : 0;
        if (Math.abs(ly - b.leanY) + Math.abs(lp - b.leanP) > 1e-4) {
          b.leanY += (ly - b.leanY) * 0.08;
          b.leanP += (lp - b.leanP) * 0.08;
          moving = true;
        }
        orient(b);
      });
      if (layout()) moving = true;
      if (moving || dirty || drag) {
        renderer.render(scene, camera);
        dirty = false;
      }
      if (moving || drag) kick();
    }
    const kick = () => { if (running && !raf) raf = requestAnimationFrame(tick); };
    const onResize = () => { frameCamera(); kick(); };

    return {
      start() {
        running = true;
        // it always opens on the line, with nothing zoomed in and the newest in the middle
        if (focus >= 0) {
          focus = -1;
          pos = target = n - 1;
          bags.forEach((t) => { t.away = 0; t.spin = 0; t.pitch = 0; t.leanY = t.leanP = 0; });
          placed = false;
        }
        // opening: each bag starts turned towards its side and a little smaller, then settles into its rest
        introAt = performance.now();
        bags.forEach((t) => { t.yaw = t.rest - INTRO_TURN; t.spin = 0; orient(t); });
        addEventListener('resize', onResize);
        frameCamera();
        lastFocus = null;
        report();
        kick();
      },
      stop() {
        running = false;
        removeEventListener('resize', onResize);
        cancelAnimationFrame(raf);
        raf = 0;
      },
      step, unfocus,
    };
  }

  // a CSS cubic-bezier easing, as a function of time 0–1
  function bezier(x1, y1, x2, y2) {
    const f = (a, b, t) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
    return (x) => {
      let lo = 0, hi = 1, t = x;
      for (let k = 0; k < 24; k++) { t = (lo + hi) / 2; if (f(x1, x2, t) < x) lo = t; else hi = t; }
      return f(y1, y2, t);
    };
  }

  // ---------- bag shapes ----------

  const FINISH = {
    matte: { roughness: 0.68 },
    kraft: { roughness: 0.92 },
    glossy: { roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 },
    foil: { roughness: 0.35, metalness: 0.55 },
  };
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  // a faint wrinkle so the bag doesn't look inflated
  const crinkle = (u, v) => Math.sin(u * 17 + v * 5) * Math.sin(v * 23 - u * 7) * 0.6 + Math.sin(u * 41 + v * 37) * 0.4;

  // a surface from fn(u, v) -> [x, y, z, s, t]; flip turns its faces the other way
  function grid(THREE, nx, ny, fn, flip) {
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const [x, y, z, s, t] = fn(i / nx, j / ny);
      pos.push(x, y, z); uv.push(s, t);
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      if (flip) idx.push(a, d, b, a, c, d); else idx.push(a, b, d, a, d, c);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  // block-bottom bag: a box whose depth narrows towards a flat seal at the top (taper: the depth left
  // just under the seal), with the side gussets folding in as it narrows
  function box(THREE, W, H, D, seal, taper) {
    const vt = 1 - seal / H;
    const depth = (v) => (v >= vt ? 0 : (D / 2) * (1 - (1 - taper) * v / vt) * Math.sqrt(1 - smooth(vt - 0.05, vt, v)));
    const face = (side) => (u, v) => {
      const full = 1 + 0.06 * Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(v / vt, 1));
      const z = side * (0.001 + depth(v) * full + D * 0.01 * crinkle(u, v) * Math.sin(Math.PI * u) * (v < vt ? 1 : 0));
      return [(u - 0.5) * W, v * H, z, side > 0 ? u : 1 - u, v];
    };
    // the gusset's texture is its full depth by its height to the seal; the narrowing crops it
    const gusset = (sx) => (w, v) => {
      const z0 = 0.001 + depth(v);
      const fold = (D / 2 - depth(v)) * 0.8 * (1 - Math.abs(2 * w - 1));
      const z = sx * (0.5 - w) * 2 * z0;
      return [sx * (W / 2 - fold), v * H, z, 0.5 - sx * z / D, Math.min(v / vt, 1)];
    };
    const bottom = new THREE.PlaneGeometry(W, D).rotateX(Math.PI / 2);
    return {
      front: grid(THREE, 36, 80, face(1)), back: grid(THREE, 36, 80, face(-1), true),
      sides: [grid(THREE, 16, 80, gusset(1)), grid(THREE, 16, 80, gusset(-1))], bottom,
    };
  }

  // stand-up pouch: full at the bottom gusset, thinning to a flat heat seal at the top
  function pouch(THREE, W, H, D, seal) {
    const vs = 1 - seal / H, e = 0.012;
    const thick = (v) => (v >= vs ? 0 : Math.pow(1 - smooth(0.22, vs, v), 0.75));
    const across = (u) => { const x = (u - e) / (1 - 2 * e); return x <= 0 || x >= 1 ? 0 : Math.pow(Math.sin(Math.PI * x), 0.45); };
    const face = (side) => (u, v) => {
      const t = thick(v), a = across(u);
      const z = side * (0.001 + (D / 2) * t * a * (1 + 0.035 * crinkle(u, v)));
      return [(u - 0.5) * W * (1 - 0.06 * t), v * H, z, side > 0 ? u : 1 - u, v];
    };
    const nx = 48, pos = [], idx = [];
    for (let i = 0; i <= nx; i++) { const [x, , z] = face(1)(i / nx, 0); pos.push(x, 0, z, x, 0, -z); }
    for (let i = 0; i < nx; i++) { const a = 2 * i; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const bottom = new THREE.BufferGeometry();
    bottom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    bottom.setIndex(idx);
    bottom.computeVertexNormals();
    return { front: grid(THREE, nx, 72, face(1)), back: grid(THREE, nx, 72, face(-1), true), sides: [], bottom };
  }
})();
