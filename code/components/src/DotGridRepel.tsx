import { useEffect, useRef } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

/**
 * Dot grid that springs away from the cursor, heats up near it,
 * and sends out a ripple on click.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function DotGridRepel(props) {
    const {
        spacing,
        dotSize,
        color,
        activeColor,
        radius,
        strength,
        stiffness,
        damping,
        grow,
        ripple,
        rippleSpeed,
        rippleStrength,
        emojiReact,
        background,
        style,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const wrapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const wrap = wrapRef.current
        if (!canvas || !wrap) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const isEditor = RenderTarget.current() === RenderTarget.canvas
        const reduced = window.matchMedia?.(
            "(prefers-reduced-motion: reduce)"
        ).matches

        const base = toRGB(ctx, color)
        const hot = toRGB(ctx, activeColor)

        type Dot = {
            x: number
            y: number
            ox: number
            oy: number
            vx: number
            vy: number
            heat: number
        }
        let dots: Dot[] = []
        let w = 0
        let h = 0
        let dpr = 1
        let raf = 0
        let running = false
        let visible = true
        const mouse = { x: -9999, y: -9999, active: false }
        const ripples: { x: number; y: number; t: number }[] = []

        const build = () => {
            const rect = wrap.getBoundingClientRect()
            w = rect.width
            h = rect.height
            dpr = window.devicePixelRatio || 1
            canvas.width = w * dpr
            canvas.height = h * dpr
            canvas.style.width = w + "px"
            canvas.style.height = h + "px"

            dots = []
            const cols = Math.floor(w / spacing)
            const rows = Math.floor(h / spacing)
            const offX = (w - (cols - 1) * spacing) / 2
            const offY = spacing / 2 // anchored to the top: when the height changes, rows are added/removed at the bottom instead of every dot shifting
            for (let r = 0; r < rows; r++)
                for (let c = 0; c < cols; c++)
                    dots.push({
                        x: offX + c * spacing,
                        y: offY + r * spacing,
                        ox: 0,
                        oy: 0,
                        vx: 0,
                        vy: 0,
                        heat: 0,
                    })
            render(performance.now())
        }

        const render = (now: number) => {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, w, h)
            let busy = mouse.active || ripples.length > 0

            // emojis from EmojiAvatar part the dots
            const near: { x: number; y: number; reach: number; push: number }[] = []
            if (emojiReact) {
                const rect = canvas.getBoundingClientRect()
                for (const b of (window as any).__fxEmoji || []) {
                    const r = b.d / 2
                    const reach = r + 28
                    const x = b.x - rect.left
                    const y = b.y - rect.top
                    if (x < -reach || y < -reach || x > w + reach || y > h + reach) continue
                    near.push({ x, y, reach, push: r * 0.55 + 8 })
                }
            }

            for (const d of dots) {
                let fx = 0
                let fy = 0
                let heat = 0

                for (const o of near) {
                    const ex = d.x - o.x
                    const ey = d.y - o.y
                    const ed = Math.hypot(ex, ey) || 0.0001
                    if (ed < o.reach) {
                        const k = (1 - ed / o.reach) ** 1.5
                        fx += (ex / ed) * k * o.push
                        fy += (ey / ed) * k * o.push
                        heat = Math.max(heat, k * 0.9)
                    }
                }

                if (mouse.active) {
                    const dx = d.x - mouse.x
                    const dy = d.y - mouse.y
                    const dist = Math.hypot(dx, dy) || 0.0001
                    if (dist < radius) {
                        const k = (1 - dist / radius) ** 2
                        fx += (dx / dist) * k * strength
                        fy += (dy / dist) * k * strength
                        heat = k
                    }
                }

                for (const rp of ripples) {
                    const age = (now - rp.t) / 1000
                    const ring = age * rippleSpeed
                    const rx = d.x - rp.x
                    const ry = d.y - rp.y
                    const rd = Math.hypot(rx, ry) || 0.0001
                    const band = 1 - Math.abs(rd - ring) / 40
                    if (band > 0) {
                        const fade = Math.max(0, 1 - age / 1.4)
                        fx += (rx / rd) * band * rippleStrength * fade
                        fy += (ry / rd) * band * rippleStrength * fade
                        heat = Math.max(heat, band * fade * 0.8)
                    }
                }

                // spring toward target offset
                d.vx = (d.vx + (fx - d.ox) * stiffness) * damping
                d.vy = (d.vy + (fy - d.oy) * stiffness) * damping
                d.ox += d.vx
                d.oy += d.vy
                d.heat += (heat - d.heat) * 0.2

                if (
                    Math.abs(d.ox) > 0.05 ||
                    Math.abs(d.oy) > 0.05 ||
                    d.heat > 0.01
                )
                    busy = true

                const t = d.heat
                ctx.fillStyle = mix(base, hot, t)
                ctx.beginPath()
                ctx.arc(
                    d.x + d.ox,
                    d.y + d.oy,
                    dotSize / 2 + t * grow,
                    0,
                    Math.PI * 2
                )
                ctx.fill()
            }

            while (ripples.length && now - ripples[0].t > 1500) ripples.shift()
            return busy
        }

        // Only animate while something is moving and the grid is on screen
        const loop = (now: number) => {
            const busy = render(now)
            if (busy && visible) raf = requestAnimationFrame(loop)
            else running = false
        }
        const wake = () => {
            if (running || !visible || reduced) return
            running = true
            raf = requestAnimationFrame(loop)
        }

        const onMove = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect()
            mouse.x = e.clientX - rect.left
            mouse.y = e.clientY - rect.top
            mouse.active =
                mouse.x >= -radius &&
                mouse.y >= -radius &&
                mouse.x <= rect.width + radius &&
                mouse.y <= rect.height + radius
            if (mouse.active) wake()
        }
        const onLeave = () => {
            mouse.active = false
            wake()
        }
        const onDown = (e: PointerEvent) => {
            if (!ripple) return
            const rect = canvas.getBoundingClientRect()
            ripples.push({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                t: performance.now(),
            })
            wake()
        }

        build()
        const ro = new ResizeObserver(build)
        ro.observe(wrap)
        const io = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting
            if (visible) wake()
        })
        io.observe(wrap)

        if (!isEditor) {
            window.addEventListener("pointermove", onMove, { passive: true })
            window.addEventListener("pointerdown", onDown)
            document.addEventListener("pointerleave", onLeave)
            if (emojiReact) window.addEventListener("fx-emoji-tick", wake)
        }

        return () => {
            cancelAnimationFrame(raf)
            ro.disconnect()
            io.disconnect()
            window.removeEventListener("fx-emoji-tick", wake)
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerdown", onDown)
            document.removeEventListener("pointerleave", onLeave)
        }
    }, [
        spacing,
        dotSize,
        color,
        activeColor,
        radius,
        strength,
        stiffness,
        damping,
        grow,
        ripple,
        rippleSpeed,
        rippleStrength,
        emojiReact,
    ])

    return (
        <div
            ref={wrapRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                background,
                overflow: "hidden",
            }}
        >
            <canvas ref={canvasRef} style={{ display: "block" }} />
        </div>
    )
}

/* Resolve any CSS colour (hex, rgb(a), Framer token "var(--x, #fff)") to RGB */
function toRGB(ctx: CanvasRenderingContext2D, input: string) {
    let c = input || "#000"
    const v = c.match(/var\([^,]+,\s*(.+)\)$/)
    if (v) c = v[1]
    ctx.fillStyle = "#000"
    ctx.fillStyle = c
    const s = String(ctx.fillStyle)
    if (s.startsWith("#")) {
        const n = parseInt(s.slice(1), 16)
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]
    }
    const m = s.match(/[\d.]+/g)?.map(Number) || [0, 0, 0, 1]
    return [m[0], m[1], m[2], m[3] ?? 1]
}

function mix(a: number[], b: number[], t: number) {
    const r = Math.round(a[0] + (b[0] - a[0]) * t)
    const g = Math.round(a[1] + (b[1] - a[1]) * t)
    const bl = Math.round(a[2] + (b[2] - a[2]) * t)
    const al = a[3] + (b[3] - a[3]) * t
    return `rgba(${r},${g},${bl},${al})`
}

DotGridRepel.defaultProps = {
    spacing: 18,
    dotSize: 2,
    color: "#C4C4C4",
    activeColor: "#141414",
    radius: 110,
    strength: 14,
    stiffness: 0.18,
    damping: 0.72,
    grow: 1.6,
    ripple: true,
    rippleSpeed: 420,
    rippleStrength: 10,
    emojiReact: true,
    background: "transparent",
    width: 1200,
    height: 300,
}

addPropertyControls(DotGridRepel, {
    spacing: { type: ControlType.Number, title: "Spacing", min: 6, max: 60, step: 1 },
    dotSize: { type: ControlType.Number, title: "Dot Size", min: 1, max: 10, step: 0.5 },
    color: { type: ControlType.Color, title: "Color" },
    activeColor: { type: ControlType.Color, title: "Active" },
    radius: { type: ControlType.Number, title: "Radius", min: 20, max: 400, step: 5 },
    strength: { type: ControlType.Number, title: "Push", min: 0, max: 100, step: 1 },
    stiffness: { type: ControlType.Number, title: "Stiffness", min: 0.02, max: 0.5, step: 0.01 },
    damping: { type: ControlType.Number, title: "Damping", min: 0.3, max: 0.95, step: 0.01 },
    grow: { type: ControlType.Number, title: "Grow", min: 0, max: 6, step: 0.1 },
    ripple: { type: ControlType.Boolean, title: "Click Ripple" },
    rippleSpeed: {
        type: ControlType.Number, title: "Ripple Speed", min: 100, max: 1200, step: 10,
        hidden: (p) => !p.ripple,
    },
    rippleStrength: {
        type: ControlType.Number, title: "Ripple Push", min: 0, max: 40, step: 1,
        hidden: (p) => !p.ripple,
    },
    emojiReact: { type: ControlType.Boolean, title: "Emoji React" },
    background: { type: ControlType.Color, title: "Background" },
})
