/*  Reveal: the site's opening animation, on every page (arthurabrarov.com, since Nov 10, 2026).
    Loaded at the end of <head> (Framer → Site Settings → Custom Code), so it can hide things before the first paint.
    As a page opens:
      - the header's items rise 12px and fade in, one after another: the logo, the Home button, then each title and
        paragraph on its own (wrappers such as Text and Column are seen through);
      - each Surface in Body, then each Image Frame, Image or Video Frame in its Media, rises 20px and fades in:
        the ones on screen right after the header, the rest as you scroll to them. Anything you jump past shows at once.
    The footer is left alone (the sticky layout uncovers it).
    Motion after emilkowal.ski's rules: one strong ease-out, cubic-bezier(.165,.84,.44,1); a small blur clearing as
    things rise (4px on surfaces and media, 2px on the header); and one timing on every page, first or not: the header
    0.5s, 50ms apart; surfaces and media 0.45s, 45ms apart, from 0.15s in. (Nov 10, 2026: a full reveal on the first
    page of a visit, 0.6–0.7s, and a quick one after it, 0.25–0.3s, felt inconsistent; this is halfway between.)
    Framer builds a page in steps and swaps elements while it does, so this uses CSS animations with a start time rather
    than transitions: each revealed spot (page + position) remembers when its reveal began, and an element swapped in
    there carries on from that moment instead of jumping. Header items that turn up late reveal at once; nothing is
    left hidden. If this file fails to load, nothing is hidden at all.
    Depends on Framer layer names: Header Content, Body, Surface, Media, Image Frame, Image, Video Frame. Renaming one
    turns the animation off for it (harmless). ?intro=off turns it off for the visit, ?intro=on back on.
    Between Home, /lab and /about (the header switch's tabs) only the body reveals; the header stays as it is.
    Reduced motion: no animation. */
(() => {
  const asked = new URLSearchParams(location.search).get('intro');
  try { if (asked) sessionStorage.setItem('intro', asked); } catch (e) {}
  let intro = asked;
  try { intro = intro || sessionStorage.getItem('intro'); } catch (e) {}
  if (intro === 'off') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const s = (sec) => sec.toFixed(3) + 's';
  const T = { HEAD_STEP: 0.05, HEAD_DUR: 0.5, HEAD_START: 0.05,      // header items
             BODY_DUR: 0.45, BODY_STEP: 0.045, BODY_START: 0.15 };  // surfaces and media; the opening's start, after the header's
  const ease = 'cubic-bezier(.165,.84,.44,1)';                     // strong ease-out (emilkowal.ski's drawer curve)
  const blur = 1;

  // header items, one per piece of content: the logo, the Home button, each title and paragraph. Wrappers are seen
  // through, so every column reveals the same way whatever its grouping (Apron's Role groups its title with the first
  // paragraph, About groups the two paragraphs): "Text" and Home's "Column" wrappers, and Framer's unnamed layout
  // wrappers (display: contents, round the Home button), which can't animate themselves.
  const HC = '[data-framer-name="Header Content"] > *';
  const WRAP = '[data-framer-name="Text"], [data-framer-name="Column"]';
  const HEAD = [
    `${HC} > [data-framer-name]:not(${WRAP})`,
    `${HC} > :is(${WRAP}) > [data-framer-name]:not(${WRAP})`,
    `${HC} > [data-framer-name="Column"] > [data-framer-name="Text"] > *`,
    `${HC} > :not([data-framer-name]):not(.fx-shop):not(.fx-score) > *`,
  ].join(', ');
  // the emoji game's own pieces in the header (its shop and coin balance) are the game's to animate, never the reveal's
  const GAME = '.fx-shop, .fx-score';
  const IN = '[data-framer-name="Body"]';
  const BODY = ['Surface', 'Image Frame', 'Video Frame'].map((n) => `${IN} [data-framer-name="${n}"]`)
    .concat('[data-framer-name="Media"] [data-framer-name="Image"]').join(', ');
  const ALL = HEAD + ', ' + BODY;

  const style = document.createElement('style');
  style.id = 'reveal';
  style.textContent = `
@keyframes rv-head { from { opacity: 0; transform: translateY(12px); filter: blur(${2 * blur}px); } }
@keyframes rv-body { from { opacity: 0; transform: translateY(20px); filter: blur(${4 * blur}px); } }
html.rv :is(${HEAD}):not(${GAME}):not([data-rv]), html.rv :is(${BODY}):not([data-rv]) { opacity: 0; }
html.rv :is(${HEAD}):not(${GAME})[data-rv=""] { animation: rv-head ${s(T.HEAD_DUR)} ${ease} var(--rv-delay, 0s) backwards; }
html.rv :is(${BODY})[data-rv=""] { animation: rv-body ${s(T.BODY_DUR)} ${ease} var(--rv-delay, 0s) backwards; }
`;
  document.head.appendChild(style);
  document.documentElement.classList.add('rv');

  const visible = (el) => el.offsetWidth > 0 || el.offsetHeight > 0;
  const list = () => [...document.querySelectorAll(ALL)].filter((el) => !el.matches(GAME));
  const DONE_MS = T.HEAD_DUR * 1000 + 100;   // longer than any reveal
  const isHead = (el) => el.matches(HEAD);
  const at = new Map();            // "path#position" -> when its reveal starts (performance.now(), ms)
  const key = (i) => location.pathname + '#' + i;
  const watched = new WeakSet();
  let io = null, opened = null, quietHead = false;
  // Home, /lab and /about are the tabs of the header's Work · Lab · About switch and share one header, so moving
  // between them only reveals the body: the header stays put, as a tab switch should (Nov 10, 2026)
  const TAB = /^\/(lab|about)?\/?$/;

  // mark each element whose spot has a start time, with the delay that makes it play from the right moment
  const sync = () => {
    if (opened !== location.pathname && document.querySelector('[data-framer-name="Header Content"]')) open();
    const now = performance.now();
    list().forEach((el, i) => {
      const k = key(i);
      // a header item that arrived after the page opened reveals now rather than staying hidden
      if (!at.has(k) && isHead(el) && opened === location.pathname) at.set(k, quietHead ? now - 10000 : now);
      if (at.has(k)) {
        const d = ((at.get(k) - now) / 1000).toFixed(3) + 's';
        // a spot whose reveal is long over just shows (data-rv="done": no animation at all)
        if (!el.hasAttribute('data-rv')) { el.style.setProperty('--rv-delay', d); el.setAttribute('data-rv', now - at.get(k) > DONE_MS ? 'done' : ''); }
      } else if (io && !watched.has(el)) { watched.add(el); io.observe(el); }
    });
  };
  // give a batch start times, top to bottom, each a step after the last, from `wait` seconds from now
  const reveal = (els, wait, step) => {
    const all = list(), now = performance.now();
    els.filter((el) => all.includes(el))
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left)
      .forEach((el, i) => { const k = key(all.indexOf(el)); if (!at.has(k)) at.set(k, now + (wait + i * step) * 1000); });
  };
  // a page opens (first load, or Framer moved to another page): the header in sequence, then what's on screen
  function open() {
    const from = opened;
    opened = location.pathname;
    quietHead = from !== null && TAB.test(from) && TAB.test(opened);
    for (const k of [...at.keys()]) if (k.startsWith(opened + '#')) at.delete(k);   // a page seen before plays again
    list().forEach((el) => el.removeAttribute('data-rv'));
    const all = list().filter(visible);
    if (quietHead) { const now = performance.now(); all.filter(isHead).forEach((el) => at.set(key(list().indexOf(el)), now - 10000)); }
    else reveal(all.filter(isHead), T.HEAD_START, T.HEAD_STEP);
    const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight * 0.95 && r.bottom > 0; };
    reveal(all.filter((el) => !isHead(el) && onScreen(el)), T.BODY_START, T.BODY_STEP);
  }

  // once an element's reveal has played, retire it: hiding and showing it again (the game hides the intro while you
  // play, Framer re-renders things) would otherwise restart the animation
  document.addEventListener('animationend', (e) => {
    if (/^rv-/.test(e.animationName) && e.target.getAttribute && e.target.getAttribute('data-rv') === '') e.target.setAttribute('data-rv', 'done');
  }, true);
  const begin = () => {
    io = new IntersectionObserver((entries) => {
      const seen = entries.filter((e) => e.isIntersecting && e.target.isConnected && !e.target.hasAttribute('data-rv')).map((e) => e.target);
      seen.forEach((el) => io.unobserve(el));
      if (!seen.length) return;
      // anything scrolled past (a fast scroll, a jump) shows at once instead of waiting above the screen
      const now = performance.now();
      list().forEach((el, i) => { if (!at.has(key(i)) && el.getBoundingClientRect().bottom < 0) at.set(key(i), now - 10000); });
      reveal(seen, 0, T.BODY_STEP);
      sync();
    }, { rootMargin: '0px 0px -8% 0px' });
    sync();
    new MutationObserver(sync).observe(document.body, { childList: true, subtree: true });
  };

  // start once the text can draw in its real font (nothing reflows mid-animation), but never wait long
  let go = false;
  const start = () => { if (go) return; go = true; begin(); };
  const ready = () => { (document.fonts ? document.fonts.ready : Promise.resolve()).then(start); setTimeout(start, 600); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
