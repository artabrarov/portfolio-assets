import { useState } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

/**
 * One quiet line: "Reading Behave by Robert Sapolsky".
 * Hovering the title lifts a small book cover out from behind it.
 * Cover: upload one, or leave it empty and set the ISBN to load it from Open Library.
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function NowReading(props) {
    const { label, title, author, link, cover, isbn, showCover, coverWidth,
        textColor, subColor, font, style } = props
    const [on, setOn] = useState(false)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const src = cover?.src ?? cover ?? (isbn ? `https://covers.openlibrary.org/b/isbn/${String(isbn).replace(/[^0-9X]/gi, "")}-M.jpg` : "")
    const hasCover = showCover && !!src

    const Title: any = link ? "a" : "span"
    const enter = (e) => { if (e.pointerType !== "touch") setOn(true) }
    const leave = () => setOn(false)

    return (
        <div style={{ ...style, ...font, color: subColor, whiteSpace: "nowrap", width: "max-content" }}>
            {label && <span>{label} </span>}
            <Title
                {...(link ? { href: link, target: "_blank", rel: "noopener noreferrer" } : {})}
                onPointerEnter={enter}
                onPointerLeave={leave}
                style={{
                    position: "relative", display: "inline-block", color: textColor, textDecoration: "none",
                    cursor: link ? "pointer" : "default",
                }}
            >
                {title}
                {hasCover && !isCanvas && (
                    <img
                        src={src}
                        alt=""
                        aria-hidden
                        draggable={false}
                        style={{
                            position: "absolute", left: "50%", bottom: "100%", marginBottom: 8,
                            width: coverWidth, height: "auto", borderRadius: 3,
                            boxShadow: "0 1px 2px rgba(0,0,0,.12), 0 8px 20px rgba(0,0,0,.14)",
                            pointerEvents: "none", zIndex: 5,
                            transformOrigin: "50% 100%",
                            opacity: on ? 1 : 0,
                            transform: on
                                ? "translate(-50%, 0) rotate(-4deg) scale(1)"
                                : "translate(-50%, 10px) rotate(0deg) scale(.85)",
                            transition: on
                                ? "opacity .2s ease, transform .45s cubic-bezier(.3,1.5,.5,1)"
                                : "opacity .15s ease, transform .25s ease-in",
                        }}
                    />
                )}
            </Title>
            {author && <span> by {author}</span>}
        </div>
    )
}

NowReading.defaultProps = {
    label: "Reading",
    title: "Behave",
    author: "Robert Sapolsky",
    link: "https://openlibrary.org/isbn/9781594205071",
    isbn: "9781594205071",
    showCover: true,
    coverWidth: 64,
    textColor: "#1F1F1F",
    subColor: "#686870",
    font: { fontSize: 16, lineHeight: "24px" },
}

addPropertyControls(NowReading, {
    label: { type: ControlType.String, title: "Label" },
    title: { type: ControlType.String, title: "Title" },
    author: { type: ControlType.String, title: "Author" },
    link: { type: ControlType.Link, title: "Link" },
    showCover: { type: ControlType.Boolean, title: "Cover on Hover" },
    cover: { type: ControlType.ResponsiveImage, title: "Cover", hidden: (p) => !p.showCover },
    isbn: { type: ControlType.String, title: "ISBN", placeholder: "used when no cover is set", hidden: (p) => !p.showCover },
    coverWidth: { type: ControlType.Number, title: "Cover Width", min: 32, max: 160, step: 1, unit: "px", hidden: (p) => !p.showCover },
    font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif" },
    textColor: { type: ControlType.Color, title: "Title Color" },
    subColor: { type: ControlType.Color, title: "Text Color" },
})
