// Stand-ins for "react" and "framer" inside components that are loaded from a URL.
// The Framer wrapper file calls register({ React, Framer }) with the real ones; until then
// property controls are queued and ControlType values are placeholders resolved at that point.
let deps = null
const queue = []
const CT = Symbol("ControlType")
const resolveCT = (v) => {
  if (v && typeof v === "object" && v[CT]) return deps.Framer.ControlType[v[CT]]
  if (Array.isArray(v)) return v.map(resolveCT)
  if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype) {
    const o = {}; for (const k in v) o[k] = resolveCT(v[k]); return o
  }
  return v
}
export function register(d) {
  if (deps) return
  deps = d
  queue.splice(0).forEach(([c, p]) => d.Framer.addPropertyControls(c, resolveCT(p)))
}
const R = () => deps.React
export const __h = (...a) => R().createElement(...a)
export const __F = new Proxy({}, { get: () => undefined })
// react
export const useState = (...a) => R().useState(...a)
export const useEffect = (...a) => R().useEffect(...a)
export const useLayoutEffect = (...a) => R().useLayoutEffect(...a)
export const useRef = (...a) => R().useRef(...a)
export const useMemo = (...a) => R().useMemo(...a)
export const useCallback = (...a) => R().useCallback(...a)
export default new Proxy({}, { get: (_, k) => R()[k] })
// framer
export const ControlType = new Proxy({}, { get: (_, k) => ({ [CT]: k }) })
export const addPropertyControls = (c, p) => (deps ? deps.Framer.addPropertyControls(c, resolveCT(p)) : queue.push([c, p]))
export const RenderTarget = {
  current: () => deps.Framer.RenderTarget.current(),
  get canvas() { return deps.Framer.RenderTarget.canvas },
  get preview() { return deps.Framer.RenderTarget.preview },
  get export() { return deps.Framer.RenderTarget.export },
  get thumbnail() { return deps.Framer.RenderTarget.thumbnail },
}
