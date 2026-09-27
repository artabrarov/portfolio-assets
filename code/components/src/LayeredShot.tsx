import { useRef, useState } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

/**
 * Site screenshot in two layers: a background and a floating browser window.
 * On hover the window tilts toward the cursor, lifts, and catches the light;
 * the background drifts the other way for a bit of depth.
 * Window placement matches the screenshot guidelines (1536×900 window on a 1994×1120 canvas).
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function LayeredShot(props) {
    const { background, window: win, radius, squircle, smoothing, tilt, lift, parallax, glare, foil, shadow, style } = props
    const ref = useRef<HTMLDivElement>(null)
    const [p, setP] = useState({ x: 0.5, y: 0.5, on: false })
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const move = (e: React.PointerEvent) => {
        if (isCanvas || e.pointerType === "touch" || !ref.current) return
        const r = ref.current.getBoundingClientRect()
        setP({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, on: true })
    }
    const leave = () => setP({ x: 0.5, y: 0.5, on: false })

    // window box as a share of the canvas (from the guidelines)
    const W = 1536 / 1994, H = 900 / 1120
    const dx = p.x - 0.5, dy = p.y - 0.5
    const rx = p.on ? -dy * tilt * 2 : 0
    const ry = p.on ? dx * tilt * 2 : 0
    const ease = p.on ? "transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease" : "transform .7s cubic-bezier(.2,.8,.2,1), box-shadow .7s ease"

    // squircle corners: CSS corner-shape where supported (Chrome/Edge), otherwise a slightly smaller round corner
    const cornerShapeOK = typeof CSS !== "undefined" && CSS.supports?.("corner-shape", "superellipse(2)")
    const corners = squircle
        ? cornerShapeOK
            ? { borderRadius: radius, cornerShape: `superellipse(${smoothing})` }
            : { borderRadius: radius * 0.71 }
        : { borderRadius: radius }

    const bgSrc = background?.src ?? background
    const winSrc = win?.src ?? win

    return (
        <div
            ref={ref}
            onPointerMove={move}
            onPointerLeave={leave}
            style={{ ...style, position: "relative", width: "100%", height: "100%", overflow: "hidden", perspective: 1200, ...corners } as any}
        >
            {bgSrc && (
                <img
                    src={bgSrc}
                    alt=""
                    draggable={false}
                    style={{
                        position: "absolute", inset: "-3%", width: "106%", height: "106%", objectFit: "cover",
                        transform: `translate(${p.on ? -dx * parallax : 0}%, ${p.on ? -dy * parallax : 0}%)`,
                        transition: ease,
                    }}
                />
            )}
            <div
                style={{
                    position: "absolute",
                    left: `${((1 - W) / 2) * 100}%`, top: `${((1 - H) / 2) * 100}%`,
                    width: `${W * 100}%`, height: `${H * 100}%`,
                    // corner radius scales with the rendered window (14px at 1536 wide)
                    borderRadius: "0.91% / 1.56%",
                    transform: `rotateX(${rx}deg) rotateY(${ry}deg) scale(${p.on ? 1 + lift / 100 : 1})`,
                    boxShadow: `${-ry * 1.5}px ${p.on ? 22 : 14}px ${p.on ? 40 : 26}px rgba(0,0,0,${p.on ? shadow * 1.4 : shadow})`,
                    transition: ease,
                    willChange: "transform",
                }}
            >
                {winSrc && (
                    <img src={winSrc} alt="" draggable={false}
                        style={{ display: "block", width: "100%", height: "100%", borderRadius: "inherit" }} />
                )}
                {/* light that follows the cursor */}
                <div style={{
                    position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none",
                    background: `radial-gradient(circle at ${p.x * 100}% ${p.y * 100}%, rgba(255,255,255,${glare}), rgba(255,255,255,0) 55%)`,
                    mixBlendMode: "soft-light", opacity: p.on ? 1 : 0, transition: "opacity .4s ease",
                }} />
                {/* holographic foil */}
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
        </div>
    )
}

LayeredShot.defaultProps = {
    radius: 24,
    squircle: true,
    smoothing: 1.6,
    tilt: 5,
    lift: 3,
    parallax: 2,
    glare: 0.35,
    foil: 0.1,
    shadow: 0.25,
    width: 508,
    height: 285,
}

addPropertyControls(LayeredShot, {
    background: { type: ControlType.ResponsiveImage, title: "Background" },
    window: { type: ControlType.ResponsiveImage, title: "Window" },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 80, step: 1, unit: "px" },
    squircle: { type: ControlType.Boolean, title: "Squircle" },
    smoothing: {
        type: ControlType.Number, title: "Smoothing", min: 1, max: 4, step: 0.1,
        hidden: (p) => !p.squircle,
    },
    tilt: { type: ControlType.Number, title: "Tilt", min: 0, max: 15, step: 0.5, unit: "°" },
    lift: { type: ControlType.Number, title: "Lift", min: 0, max: 10, step: 0.5, unit: "%" },
    parallax: { type: ControlType.Number, title: "Parallax", min: 0, max: 6, step: 0.5, unit: "%" },
    glare: { type: ControlType.Number, title: "Glare", min: 0, max: 1, step: 0.05 },
    foil: { type: ControlType.Number, title: "Foil", min: 0, max: 0.5, step: 0.01 },
    shadow: { type: ControlType.Number, title: "Shadow", min: 0, max: 0.8, step: 0.05 },
})
