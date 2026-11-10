/*  Reveal: the site's opening animation, on every page (arthurabrarov.com, since Nov 10, 2026).
    Loaded at the end of <head> (Framer → Site Settings → Custom Code), so it can hide things before the first paint.
    As a page opens:
      - the header's items rise 12px and fade in, one after another (Header Content > column > item);
      - each Surface in Body, then each Image Frame, Image or Video Frame in its Media, rises 20px and fades in:
        the ones on screen right after the header, the rest as you scroll to them. Anything you jump past shows at once.
    The footer is left alone (the sticky layout uncovers it).
    Motion after emilkowal.ski's rules: one strong ease-out, cubic-bezier(.165,.84,.44,1); a small blur clearing as
    things rise (4px on surfaces and media, 2px on the header); and only the first page of a visit gets the full reveal
    (0.6–0.7s, 60–70ms apart): pages opened after it play a quick one (0.25–0.3s, 30ms apart), since a reveal on every
    click soon feels slow.
    Framer builds a page in steps and swaps elements while it does, so this uses CSS animations with a start time rather
    than transitions: each revealed spot (page + position) remembers when its reveal began, and an element swapped in
    there carries on from that moment instead of jumping. Header items that turn up late reveal at once; nothing is
    left hidden. If this file fails to load, nothing is hidden at all.
    Depends on Framer layer names: Header Content, Body, Surface, Media, Image Frame, Image, Video Frame. Renaming one
    turns the animation off for it (harmless). ?intro=off turns it off for the visit, ?intro=on back on.
    Reduced motion: no animation. */
(() => {
  const asked = new URLSearchParams(location.search).get('intro');
  try { if (asked) sessionStorage.setItem('intro', asked); } catch (e) {}
  let intro = asked;
  try { intro = intro || sessionStorage.getItem('intro'); } catch (e) {}
  if (intro === 'off') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const s = (sec) => sec.toFixed(3) + 's';
  const FULL = { HEAD_STEP: 0.07, HEAD_DUR: 0.7, HEAD_START: 0.1,    // header items
                 BODY_DUR: 0.6, BODY_STEP: 0.06, BODY_START: 0.3 };  // surfaces and media; the opening's start, after the header's
  const QUICK = { HEAD_STEP: 0.03, HEAD_DUR: 0.25, HEAD_START: 0,    // pages opened after the first
                  BODY_DUR: 0.3, BODY_STEP: 0.03, BODY_START: 0.05 };
  let T = FULL;
  const ease = 'cubic-bezier(.165,.84,.44,1)';                     // strong ease-out (emilkowal.ski's drawer curve)
  const blur = 1;

  const HEAD = '[data-framer-name="Header Content"] > * > *';
  const IN = '[data-framer-name="Body"]';
  const BODY = ['Surface', 'Image Frame', 'Video Frame'].map((n) => `${IN} [data-framer-name="${n}"]`)
    .concat('[data-framer-name="Media"] [data-framer-name="Image"]').join(', ');
  const ALL = HEAD + ', ' + BODY;

  const style = document.createElement('style');
  style.id = 'reveal';
  style.textContent = `
@keyframes rv-head { from { opacity: 0; transform: translateY(12px); filter: blur(${2 * blur}px); } }
@keyframes rv-body { from { opacity: 0; transform: translateY(20px); filter: blur(${4 * blur}px); } }
html.rv :is(${HEAD}):not(.fx-score):not([data-rv]), html.rv :is(${BODY}):not([data-rv]) { opacity: 0; }
html.rv :is(${HEAD})[data-rv] { animation: rv-head ${s(FULL.HEAD_DUR)} ${ease} var(--rv-delay, 0s) backwards; }
html.rv :is(${BODY})[data-rv] { animation: rv-body ${s(FULL.BODY_DUR)} ${ease} var(--rv-delay, 0s) backwards; }
html.rv.rv-quick :is(${HEAD})[data-rv] { animation-duration: ${s(QUICK.HEAD_DUR)}; }
html.rv.rv-quick :is(${BODY})[data-rv] { animation-duration: ${s(QUICK.BODY_DUR)}; }
`;
  document.head.appendChild(style);
  document.documentElement.classList.add('rv');

  const visible = (el) => el.offsetWidth > 0 || el.offsetHeight > 0;
  const list = () => [...document.querySelectorAll(ALL)].filter((el) => !el.classList.contains('fx-score'));
  const isHead = (el) => el.matches(HEAD);
  const at = new Map();            // "path#position" -> when its reveal starts (performance.now(), ms)
  const key = (i) => location.pathname + '#' + i;
  const watched = new WeakSet();
  let io = null, opened = null;

  // mark each element whose spot has a start time, with the delay that makes it play from the right moment
  const sync = () => {
    if (opened !== location.pathname && document.querySelector('[data-framer-name="Header Content"]')) open();
    const now = performance.now();
    list().forEach((el, i) => {
      const k = key(i);
      // a header item that arrived after the page opened reveals now rather than staying hidden
      if (!at.has(k) && isHead(el) && opened === location.pathname) at.set(k, now);
      if (at.has(k)) {
        const d = ((at.get(k) - now) / 1000).toFixed(3) + 's';
        if (!el.hasAttribute('data-rv')) { el.style.setProperty('--rv-delay', d); el.setAttribute('data-rv', ''); }
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
    if (opened !== null) { T = QUICK; document.documentElement.classList.add('rv-quick'); }
    opened = location.pathname;
    for (const k of [...at.keys()]) if (k.startsWith(opened + '#')) at.delete(k);   // a page seen before plays again
    list().forEach((el) => el.removeAttribute('data-rv'));
    const all = list().filter(visible);
    reveal(all.filter(isHead), T.HEAD_START, T.HEAD_STEP);
    const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight * 0.95 && r.bottom > 0; };
    reveal(all.filter((el) => !isHead(el) && onScreen(el)), T.BODY_START, T.BODY_STEP);
  }

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
