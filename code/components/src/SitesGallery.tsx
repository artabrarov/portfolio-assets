import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

/**
 * The whole /sites gallery in one component.
 * Each card is a layered screenshot (background + floating browser window) with the hover effect,
 * linking to the site. Images load from github.com/artabrarov/portfolio-assets via jsDelivr.
 * To add a site: put `<domain>-bg.jpg` and `<domain>-window.png` in the repo's /sites folder
 * and add the domain to the Sites list.
 * Video sites (listed in Videos) use `<domain>-poster.png` as the still and play `<domain>-window.mp4` on hover.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */

const DEFAULT_SITES = [
    "gunnargray.com", "luyuhang.net", "tikhon.io", "nelson.co", "mek.gallery", "ryo.lu",
    "fh.design", "adrien.website", "calebwu.ca", "aaronjackson.studio", "ample.studio",
    "chloemaillot.fr", "danielgbright.com", "emilkowal.ski", "jakubantalik.com",
    "lausandoval.com", "kennylopez.com", "mayagao.com", "timvandamme.com", "works.pm",
    "ruarishephard.co.uk",
].join("\n")

const DEFAULT_VIDEOS = [
    "mek.gallery", "tikhon.io", "ruarishephard.co.uk",
    "lausandoval.com", "ample.studio", "calebwu.ca", "gunnargray.com",
].join("\n")

const toList = (v) => String(v || "")
    .split(/[\n,]+/)
    .map((s) => s.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
    .filter(Boolean)

export default function SitesGallery(props) {
    const { sites, videos, columns, gap, source, newTab, style } = props
    const videoSet = new Set(toList(videos))
    // one watcher for all cards: whatever scrolls into view together appears top-to-bottom,
    // the first after Start Delay, each next one Stagger later
    const reg = useRef<any>(null)
    if (!reg.current) reg.current = { items: new Map(), next: 0, first: true, io: null }
    useEffect(() => {
        const r = reg.current
        if (typeof IntersectionObserver === "undefined") return
        r.io = new IntersectionObserver((entries) => {
            const now = performance.now() / 1000
            entries
                .filter((e) => e.isIntersecting)
                .map((e) => r.items.get(e.target))
                .filter(Boolean)
                .sort((a, b) => a.index - b.index)
                .forEach((item) => {
                    r.io.unobserve(item.el)
                    r.items.delete(item.el)
                    const start = Math.max(now + (r.first ? props.startDelay : 0), r.next)
                    r.first = false
                    r.next = start + props.stagger
                    item.show(start - now)
                })
        }, { rootMargin: "0px 0px -5% 0px" })
        r.items.forEach((item) => r.io.observe(item.el))
        return () => r.io.disconnect()
    }, [])
    const list = toList(sites)

    return (
        <div
            style={{
                ...style,
                width: "100%",
                display: "grid",
                gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`,
                gap,
            }}
        >
            {list.map((d, i) => (
                <Shot
                    key={d}
                    index={i}
                    domain={d}
                    bg={`${source}/${d}-bg.jpg`}
                    win={videoSet.has(d) ? `${source}/${d}-poster.png` : `${source}/${d}-window.png`}
                    video={videoSet.has(d) ? `${source}/${d}-window.mp4` : ""}
                    newTab={newTab}
                    reg={reg.current}
                    {...props}
                />
            ))}
        </div>
    )
}

function Shot({ domain, bg, win, video, newTab, reg, index, radius, squircle, smoothing, tilt, lift, parallax, glare, foil, shadow,
    appear, startDelay, stagger, duration, offsetY, ease: appearEase }) {
    const ref = useRef<HTMLAnchorElement>(null)
    const [p, setP] = useState({ x: 0.5, y: 0.5, on: false })
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // appear one by one as cards come into view
    const [shown, setShown] = useState(!appear || isCanvas)
    const [delay, setDelay] = useState(0)
    useEffect(() => {
        const el = ref.current
        if (shown || !el) return
        const item = {
            el, index,
            show: (d: number) => { setDelay(d); setShown(true) },   // the transition is already set, so this animates at once
        }
        reg.items.set(el, item)
        if (reg.io) reg.io.observe(el)
        return () => { reg.items.delete(el); reg.io && reg.io.unobserve(el) }
    }, [shown])

    // video sites: play while hovered, fade back to the still (its first frame) when the pointer leaves
    const vid = useRef<HTMLVideoElement>(null)
    const [playing, setPlaying] = useState(false)
    const startVideo = (e: React.PointerEvent) => {
        const v = vid.current
        if (!v || isCanvas || e.pointerType === "touch") return
        v.play().then(() => setPlaying(true)).catch(() => {})
    }
    const stopVideo = () => {
        const v = vid.current
        if (!v) return
        setPlaying(false)
        setTimeout(() => { if (ref.current?.matches(":hover")) return; v.pause(); v.currentTime = 0 }, 350)
    }

    const move = (e: React.PointerEvent) => {
        if (isCanvas || e.pointerType === "touch" || !ref.current) return
        const r = ref.current.getBoundingClientRect()
        setP({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, on: true })
    }
    const leave = () => setP({ x: 0.5, y: 0.5, on: false })

    // window box as a share of the canvas (1536×900 window on a 1994×1120 canvas)
    const W = 1536 / 1994, H = 900 / 1120
    const dx = p.x - 0.5, dy = p.y - 0.5
    const rx = p.on ? -dy * tilt * 2 : 0
    const ry = p.on ? dx * tilt * 2 : 0
    const ease = p.on
        ? "transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease"
        : "transform .7s cubic-bezier(.2,.8,.2,1), box-shadow .7s ease"

    // squircle corners where supported (Chrome/Edge), otherwise a slightly smaller round corner
    const cornerShapeOK = typeof CSS !== "undefined" && CSS.supports?.("corner-shape", "superellipse(2)")
    const corners = squircle
        ? cornerShapeOK
            ? { borderRadius: radius, cornerShape: `superellipse(${smoothing})` }
            : { borderRadius: radius * 0.71 }
        : { borderRadius: radius }

    return (
        <a
            ref={ref}
            href={`https://${domain}/`}
            target={newTab ? "_blank" : undefined}
            rel={newTab ? "noopener noreferrer" : undefined}
            aria-label={domain}
            onPointerMove={move}
            onPointerEnter={startVideo}
            onPointerLeave={() => { leave(); stopVideo() }}
            style={{
                position: "relative", display: "block", width: "100%", aspectRatio: "1994 / 1120",
                overflow: "hidden", perspective: 1200, ...corners,
                opacity: shown ? 1 : 0,
                translate: shown ? "0 0" : `0 ${offsetY}px`,
                transition: appear && !isCanvas
                    ? `opacity ${duration}s cubic-bezier(${appearEase}) ${delay}s, translate ${duration}s cubic-bezier(${appearEase}) ${delay}s`
                    : undefined,
                willChange: shown ? undefined : "opacity, translate",
            } as any}
        >
            <img
                src={bg}
                alt=""
                loading="lazy"
                draggable={false}
                style={{
                    position: "absolute", inset: "-3%", width: "106%", height: "106%", objectFit: "cover",
                    transform: `translate(${p.on ? -dx * parallax : 0}%, ${p.on ? -dy * parallax : 0}%)`,
                    transition: ease,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    left: `${((1 - W) / 2) * 100}%`, top: `${((1 - H) / 2) * 100}%`,
                    width: `${W * 100}%`, height: `${H * 100}%`,
                    borderRadius: "0.91% / 1.56%",
                    transform: `rotateX(${rx}deg) rotateY(${ry}deg) scale(${p.on ? 1 + lift / 100 : 1})`,
                    boxShadow: `${-ry * 1.5}px ${p.on ? 22 : 14}px ${p.on ? 40 : 26}px rgba(0,0,0,${p.on ? shadow * 1.4 : shadow})`,
                    transition: ease,
                    willChange: "transform",
                }}
            >
                <img src={win} alt={domain} loading="lazy" draggable={false}
                    style={{ display: "block", width: "100%", height: "100%", borderRadius: "inherit" }} />
                {video && !isCanvas && (
                    <video
                        ref={vid}
                        src={video}
                        muted
                        loop
                        playsInline
                        preload="none"
                        aria-hidden
                        style={{
                            position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
                            borderRadius: "inherit", pointerEvents: "none",
                            opacity: playing ? 1 : 0, transition: "opacity .3s ease",
                        }}
                    />
                )}
                <div style={{
                    position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none",
                    background: `radial-gradient(circle at ${p.x * 100}% ${p.y * 100}%, rgba(255,255,255,${glare}), rgba(255,255,255,0) 55%)`,
                    mixBlendMode: "soft-light", opacity: p.on ? 1 : 0, transition: "opacity .4s ease",
                }} />
                {foil > 0 && (
                    <div style={{
                        position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none", overflow: "hidden",
                        opacity: p.on ? 1 : 0, transition: "opacity .4s ease",
                    }}>
                        <div style={{
                            position: "absolute", inset: "-50%",
                            background: `conic-gradient(from ${(p.x + p.y) * 180}deg at ${p.x * 100}% ${p.y * 100}%, #ff6ec7, #ffd36e, #8affc1, #6ec8ff, #b28aff, #ff6ec7)`,
                            mixBlendMode: "color-dodge", opacity: foil, filter: "blur(24px)",
                        }} />
                    </div>
                )}
            </div>
        </a>
    )
}

SitesGallery.defaultProps = {
    sites: DEFAULT_SITES,
    videos: DEFAULT_VIDEOS,
    source: "https://cdn.jsdelivr.net/gh/artabrarov/portfolio-assets@main/sites",
    columns: 1,
    gap: 16,
    newTab: true,
    radius: 24,
    squircle: true,
    smoothing: 1.6,
    tilt: 5,
    lift: 3,
    parallax: 2,
    glare: 0.35,
    foil: 0.1,
    shadow: 0.25,
    appear: true,
    startDelay: 0.3,
    stagger: 0.1,
    duration: 0.6,
    offsetY: 5,
    ease: "0.44, 0, 0.56, 1",
    width: 509,
}

addPropertyControls(SitesGallery, {
    sites: { type: ControlType.String, title: "Sites", displayTextArea: true, placeholder: "one domain per line" },
    videos: { type: ControlType.String, title: "Videos", displayTextArea: true, placeholder: "domains that play a clip on hover" },
    columns: { type: ControlType.Number, title: "Columns", min: 1, max: 4, step: 1, displayStepper: true },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 64, step: 1, unit: "px" },
    newTab: { type: ControlType.Boolean, title: "New Tab" },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 80, step: 1, unit: "px" },
    squircle: { type: ControlType.Boolean, title: "Squircle" },
    smoothing: { type: ControlType.Number, title: "Smoothing", min: 1, max: 4, step: 0.1, hidden: (p) => !p.squircle },
    tilt: { type: ControlType.Number, title: "Tilt", min: 0, max: 15, step: 0.5, unit: "°" },
    lift: { type: ControlType.Number, title: "Lift", min: 0, max: 10, step: 0.5, unit: "%" },
    parallax: { type: ControlType.Number, title: "Parallax", min: 0, max: 6, step: 0.5, unit: "%" },
    glare: { type: ControlType.Number, title: "Glare", min: 0, max: 1, step: 0.05 },
    foil: { type: ControlType.Number, title: "Foil", min: 0, max: 0.5, step: 0.01 },
    shadow: { type: ControlType.Number, title: "Shadow", min: 0, max: 0.8, step: 0.05 },
    appear: { type: ControlType.Boolean, title: "Appear" },
    startDelay: { type: ControlType.Number, title: "Start Delay", min: 0, max: 3, step: 0.05, unit: "s", hidden: (p) => !p.appear },
    stagger: { type: ControlType.Number, title: "Stagger", min: 0, max: 1, step: 0.02, unit: "s", hidden: (p) => !p.appear },
    duration: { type: ControlType.Number, title: "Duration", min: 0.1, max: 2, step: 0.05, unit: "s", hidden: (p) => !p.appear },
    offsetY: { type: ControlType.Number, title: "Offset Y", min: 0, max: 60, step: 1, unit: "px", hidden: (p) => !p.appear },
    ease: { type: ControlType.String, title: "Bezier", hidden: (p) => !p.appear },
    source: { type: ControlType.String, title: "Image Source" },
})
