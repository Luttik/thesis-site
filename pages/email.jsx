import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import { NextSeo } from "next-seo";
import { Footer } from "../components/Footer";
import { NyenrodeLogo } from "../components/NyenrodeLogo";
import { fileToMdx, EMAIL_PATH } from "../utils/mdxUtils";
import {
    blog,
    header,
    headerAuthor,
    headerAvatar,
    headerPrimary,
    headerSecondary,
    headerMeta,
    homeLink,
    topActions,
    nyenrodeLogo,
} from "../styles/blog.module.scss";
import {
    page,
    toolbar,
    toolbarCopy,
    toolbarLabel,
    toolbarHint,
    copyButton,
    previewLabel,
    previewFrame,
    subjectRow,
    subjectValue,
    emailShell,
} from "../styles/email.module.scss";

const SITE_URL = "https://thesis.daanluttik.nl";
const PDF_URL = `${SITE_URL}/thesis-daan-luttik-mba.pdf`;
const LINKEDIN_URL = "https://www.linkedin.com/in/daanluttik/";
const DEFAULT_SUBJECT =
    "Thank you, my MBA thesis (and what we learned) is online";

export const getStaticProps = async () => {
    const email = await fileToMdx(EMAIL_PATH, "email.mdx");
    return {
        props: {
            source: email.source,
            frontMatter: email.frontMatter,
        },
    };
};

// -- Image loading / rasterizing (canvas needs the browser, so this all runs client-side) --

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load ${src}`));
        img.src = src;
    });
}

function canvasToJpeg(canvas, quality = 0.84) {
    return canvas.toDataURL("image/jpeg", quality);
}

/** Compress a photo for Gmail paste (remote URLs often 404 / strip badly). */
async function imageToEmailJpeg(src, maxWidth, quality = 0.84) {
    const img = await loadImage(src);
    const scale = Math.min(1, maxWidth / img.naturalWidth);
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvasToJpeg(canvas, quality);
}

/** Rasterize the thesis model SVG for Gmail (SVG is unreliable in email). */
async function renderModelJpeg() {
    const img = await loadImage("/media/thesis-model.svg");
    const maxWidth = 1100;
    const naturalW = img.naturalWidth || 570;
    const naturalH = img.naturalHeight || 631;
    const scale = Math.min(1, maxWidth / naturalW);
    const width = Math.round(naturalW * scale);
    const height = Math.round(naturalH * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvasToJpeg(canvas, 0.9);
}

/** Flatten the site PDF banner so Gmail cannot strip the castle background. */
async function renderPdfBannerJpeg() {
    const width = 1200;
    const height = 320;
    const [castle, page] = await Promise.all([
        loadImage("/media/background-castle.jpg"),
        loadImage("/media/page.jpg"),
    ]);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Cover-style castle crop
    const coverScale = Math.max(width / castle.naturalWidth, height / castle.naturalHeight);
    const cw = castle.naturalWidth * coverScale;
    const ch = castle.naturalHeight * coverScale;
    ctx.drawImage(
        castle,
        (width - cw) / 2,
        (height - ch) / 2 - height * 0.08,
        cw,
        ch,
    );

    // Navy gradient overlay (matches site banner)
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "rgba(6, 24, 48, 0.90)");
    gradient.addColorStop(0.42, "rgba(8, 32, 64, 0.74)");
    gradient.addColorStop(1, "rgba(10, 40, 80, 0.38)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Copy
    ctx.fillStyle = "#8ec8f0";
    ctx.font = "600 22px 'DM Sans', Helvetica, Arial, sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText("PDF", 56, 100);

    ctx.fillStyle = "#ffffff";
    ctx.font = "600 42px Georgia, 'Times New Roman', serif";
    ctx.fillText("Download the thesis", 56, 160);

    ctx.fillStyle = "rgba(245, 248, 252, 0.82)";
    ctx.font = "400 26px 'DM Sans', Helvetica, Arial, sans-serif";
    ctx.fillText("Full document · ready to print", 56, 206);

    // Page preview on the right
    const pageW = 190;
    const pageH = (page.naturalHeight / page.naturalWidth) * pageW;
    const pageX = width - pageW - 70;
    const pageY = (height - pageH) / 2 + 8;

    ctx.save();
    ctx.translate(pageX + pageW / 2, pageY + pageH / 2);
    ctx.rotate((3 * Math.PI) / 180);
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 10;
    ctx.drawImage(page, -pageW / 2, -pageH / 2, pageW, pageH);
    ctx.restore();

    return canvasToJpeg(canvas, 0.86);
}

async function prepareEmailAssets() {
    const [avatar, og, model, pdfBanner] = await Promise.all([
        imageToEmailJpeg("/img/daan-250x.jpg", 96, 0.88),
        imageToEmailJpeg("/img/og.jpg", 1200, 0.82),
        renderModelJpeg(),
        renderPdfBannerJpeg(),
    ]);
    return { avatar, og, model, pdfBanner };
}

// -- Gmail-safe MDX components --
// content/email.mdx is authored as plain prose; these components translate it into
// the inline-styled, table-based markup Gmail needs. Edit the copy in the .mdx file,
// edit the look here.

const EmailAssetsContext = createContext(null);
const useEmailAssets = () => useContext(EmailAssetsContext);

const linkStyle = {
    color: "#007bcd",
    fontWeight: 600,
    textDecoration: "underline",
};

function EmailParagraph({ children }) {
    return (
        <p style={{ margin: "0 0 14px 0", fontSize: 16, lineHeight: 1.7, color: "#222222" }}>
            {children}
        </p>
    );
}

function EmailHeading({ children }) {
    return (
        <p
            style={{
                margin: "28px 0 10px 0",
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1.35,
                color: "#111111",
            }}
        >
            {children}
        </p>
    );
}

function EmailLink({ href, children }) {
    return (
        <a href={href} style={linkStyle}>
            {children}
        </a>
    );
}

function EmailStrong({ children }) {
    return <strong style={{ color: "#111111", fontWeight: 700 }}>{children}</strong>;
}

function EmailList({ children }) {
    return (
        <table
            role="presentation"
            cellPadding={0}
            cellSpacing={0}
            border={0}
            width="100%"
            style={{ margin: "4px 0 22px 0" }}
        >
            <tbody>{children}</tbody>
        </table>
    );
}

function EmailListItem({ children }) {
    return (
        <tr>
            <td
                valign="top"
                style={{
                    padding: "0 10px 10px 0",
                    width: 22,
                    fontSize: 16,
                    lineHeight: 1.7,
                    color: "#007bcd",
                    fontWeight: 700,
                    border: 0,
                }}
            >
                •
            </td>
            <td style={{ padding: "0 0 10px 0", fontSize: 16, lineHeight: 1.7, color: "#222222", border: 0 }}>
                {children}
            </td>
        </tr>
    );
}

function EmailHeader() {
    const assets = useEmailAssets();
    return (
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ margin: "0 0 20px 0" }}>
            <tbody>
                <tr>
                    <td valign="middle" style={{ padding: 0, border: 0 }}>
                        <img
                            src={assets.avatar}
                            width="48"
                            height="48"
                            alt="Daan Luttik"
                            style={{ display: "block", borderRadius: 48, border: 0, outline: "none" }}
                        />
                    </td>
                    <td valign="middle" style={{ padding: "0 0 0 12px", border: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, color: "#111111" }}>
                            Daan Luttik
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.35, color: "#666666" }}>
                            MBA thesis · Nyenrode Business Universiteit
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

function EmailOgImage() {
    const assets = useEmailAssets();
    return (
        <div style={{ margin: "8px 0 20px 0" }}>
            <a href={SITE_URL} style={{ textDecoration: "none", display: "block" }}>
                <img
                    src={assets.og}
                    width="600"
                    alt="Creating value with agentic AI in marketing: The view from marketing management"
                    style={{ display: "block", width: "100%", maxWidth: 600, height: "auto", border: 0, borderRadius: 10, outline: "none" }}
                />
            </a>
            <p style={{ margin: "10px 0 0 0", fontSize: 15, lineHeight: 1.4, textAlign: "center" }}>
                <a href={SITE_URL} style={linkStyle}>
                    Open the thesis site
                </a>
            </p>
        </div>
    );
}

function EmailModelFigure() {
    const assets = useEmailAssets();
    return (
        <div style={{ margin: "8px 0 20px 0", textAlign: "center" }}>
            <img
                src={assets.model}
                width="360"
                alt="Figure 1. How managerial interventions drive value creation using agentic AI."
                style={{ display: "block", width: "100%", maxWidth: 360, height: "auto", margin: "0 auto", border: 0, outline: "none" }}
            />
            <p style={{ margin: "10px 0 0 0", fontSize: 13, lineHeight: 1.4, textAlign: "center", color: "#666666", fontStyle: "italic" }}>
                How managerial interventions drive value creation using agentic AI
            </p>
        </div>
    );
}

function EmailTheme({ title, children }) {
    return (
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} width="100%" style={{ margin: "0 0 18px 0" }}>
            <tbody>
                <tr>
                    <td style={{ padding: 0, border: 0 }}>
                        <p style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 700, lineHeight: 1.4, color: "#111111" }}>
                            {title}
                        </p>
                        {children}
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

function EmailPdfBanner() {
    const assets = useEmailAssets();
    return (
        <div style={{ margin: "14px 0 20px 0" }}>
            <a href={PDF_URL} style={{ textDecoration: "none", display: "block" }}>
                <img
                    src={assets.pdfBanner}
                    width="600"
                    alt="Download the thesis PDF"
                    style={{ display: "block", width: "100%", maxWidth: 600, height: "auto", border: 0, borderRadius: 10, outline: "none" }}
                />
            </a>
            <p style={{ margin: "10px 0 0 0", fontSize: 15, lineHeight: 1.4, textAlign: "center" }}>
                <a href={PDF_URL} style={linkStyle}>
                    Download the PDF
                </a>
            </p>
        </div>
    );
}

function EmailSignOff() {
    return (
        <div style={{ margin: "18px 0 0 0" }}>
            <p style={{ margin: "0 0 4px 0", fontSize: 16, lineHeight: 1.7, color: "#222222" }}>Best,</p>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, fontWeight: 600, color: "#111111" }}>Daan Luttik</p>
            <p style={{ margin: "10px 0 0 0", fontSize: 13, lineHeight: 1.5, color: "#666666" }}>
                <a href={SITE_URL} style={{ color: "#007bcd", textDecoration: "none", fontWeight: 500 }}>
                    thesis.daanluttik.nl
                </a>
                {"\u00a0\u00b7\u00a0"}
                <a href="https://daanluttik.nl" style={{ color: "#007bcd", textDecoration: "none", fontWeight: 500 }}>
                    daanluttik.nl
                </a>
                {"\u00a0\u00b7\u00a0"}
                <a href={LINKEDIN_URL} style={{ color: "#007bcd", textDecoration: "none", fontWeight: 500 }}>
                    LinkedIn
                </a>
            </p>
        </div>
    );
}

const emailMdxComponents = {
    p: EmailParagraph,
    h2: EmailHeading,
    a: EmailLink,
    strong: EmailStrong,
    ul: EmailList,
    li: EmailListItem,
    Header: EmailHeader,
    OgImage: EmailOgImage,
    ModelFigure: EmailModelFigure,
    Theme: EmailTheme,
    PdfBanner: EmailPdfBanner,
    SignOff: EmailSignOff,
};

/** The outer, Gmail-safe table shell. Everything inside comes from content/email.mdx. */
function EmailBody({ source, assets }) {
    return (
        <EmailAssetsContext.Provider value={assets}>
            <table
                role="presentation"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                width="100%"
                style={{
                    width: "100%",
                    maxWidth: 600,
                    border: 0,
                    borderCollapse: "collapse",
                    fontFamily: "'DM Sans',Helvetica,Arial,sans-serif",
                    color: "#111111",
                    background: "transparent",
                }}
            >
                <tbody>
                    <tr>
                        <td style={{ padding: 0, border: 0 }}>
                            <MDXRemote {...source} components={emailMdxComponents} />
                        </td>
                    </tr>
                </tbody>
            </table>
        </EmailAssetsContext.Provider>
    );
}

// -- Deriving the plain-text fallback from the same rendered HTML, so the two never drift --

function htmlToPlainText(html) {
    let text = html;

    text = text.replace(/<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_match, href, label) => {
        const cleanLabel = label.replace(/<[^>]+>/g, "").trim();
        // An image-only anchor (no text label) is a standalone block link; keep it on its own line.
        if (!cleanLabel || cleanLabel === href) return `${href}\n`;
        return `${cleanLabel} (${href})`;
    });

    text = text.replace(/<img[^>]*>/gi, "");
    text = text.replace(/<\/td>/gi, " ");
    text = text.replace(/<\/(tr|p|div|h[1-6])>/gi, "\n");
    text = text.replace(/<(br|hr)\s*\/?>/gi, "\n");
    text = text.replace(/<[^>]+>/g, "");

    text = text
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'");

    text = text.replace(/•/g, "-");

    text = text
        .split("\n")
        .map((line) => line.replace(/[ \t]+$/, "").replace(/^[ \t]+/, ""))
        .join("\n");
    text = text.replace(/\n{3,}/g, "\n\n").trim();

    return text;
}

async function copyEmailToClipboard(html) {
    const plainBlob = new Blob([htmlToPlainText(html)], { type: "text/plain" });
    const htmlBlob = new Blob([html], { type: "text/html" });

    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
            new ClipboardItem({
                "text/plain": plainBlob,
                "text/html": htmlBlob,
            }),
        ]);
        return;
    }

    const container = document.createElement("div");
    container.setAttribute("contenteditable", "true");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.innerHTML = html;
    document.body.appendChild(container);

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(container);
    selection.removeAllRanges();
    selection.addRange(range);
    const ok = document.execCommand("copy");
    selection.removeAllRanges();
    document.body.removeChild(container);

    if (!ok) {
        throw new Error("Copy command failed");
    }
}

export default function EmailPage({ source, frontMatter }) {
    const [assets, setAssets] = useState(null);
    const [assetsError, setAssetsError] = useState("");
    const [copied, setCopied] = useState(false);
    const [subjectCopied, setSubjectCopied] = useState(false);
    const [error, setError] = useState("");
    const previewRef = useRef(null);

    const subject = frontMatter?.subject || DEFAULT_SUBJECT;

    useEffect(() => {
        let cancelled = false;
        prepareEmailAssets()
            .then((next) => {
                if (!cancelled) setAssets(next);
            })
            .catch((err) => {
                console.error(err);
                if (!cancelled) {
                    setAssetsError(
                        "Could not prepare email images. Refresh the page and try again.",
                    );
                }
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleCopy = useCallback(async () => {
        setError("");
        if (!assets || !previewRef.current) {
            setError(assetsError || "Images are still preparing. Try again in a moment.");
            return;
        }
        try {
            await copyEmailToClipboard(previewRef.current.innerHTML);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2500);
        } catch (err) {
            console.error(err);
            setError(
                "Could not copy automatically. Select the email preview and copy manually (Ctrl+C).",
            );
        }
    }, [assets, assetsError]);

    const handleCopySubject = useCallback(async () => {
        setError("");
        try {
            await navigator.clipboard.writeText(subject);
            setSubjectCopied(true);
            window.setTimeout(() => setSubjectCopied(false), 2500);
        } catch (err) {
            console.error(err);
            setError("Could not copy the subject line.");
        }
    }, [subject]);

    const pageTitle = "Thesis email · Daan Luttik";
    const description =
        "Copy-ready email announcing the MBA thesis on creating value with agentic AI in marketing.";

    return (
        <>
            <Head>
                <title>{pageTitle}</title>
                <link rel="icon" type="image/svg+xml" href="/img/favicon.svg" />
                <meta name="robots" content="noindex,nofollow" />
            </Head>
            <NextSeo
                title={pageTitle}
                description={description}
                noindex
                nofollow
                canonical={`${SITE_URL}/email`}
            />
            <div className={`${blog} ${page}`}>
                <div className={topActions}>
                    <a href="/" className={homeLink}>
                        👈 Back to thesis
                    </a>
                    <a
                        href="https://www.nyenrode.nl"
                        className={nyenrodeLogo}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Nyenrode Business Universiteit"
                    >
                        <NyenrodeLogo />
                    </a>
                </div>

                <div className={header}>
                    <div className={headerAuthor}>
                        <img
                            src="/img/daan-250x.jpg"
                            alt="Daan Luttik"
                            className={headerAvatar}
                        />
                        <div>
                            <div className={headerPrimary}>Daan Luttik</div>
                            <div className={headerSecondary}>Email draft</div>
                        </div>
                    </div>
                    <div className={headerMeta}>
                        <div className={headerPrimary}>Share thesis</div>
                        <div className={headerSecondary}>Gmail-ready</div>
                    </div>
                </div>

                <h1
                    style={{
                        fontWeight: "800",
                        marginTop: "0",
                        marginBottom: "0.35rem",
                        textAlign: "center",
                    }}
                >
                    Thesis announcement email
                </h1>
                <p
                    style={{
                        textAlign: "center",
                        fontStyle: "italic",
                        marginTop: 0,
                        marginBottom: "1.5rem",
                        color: "var(--color-text-muted)",
                    }}
                >
                    Preview below, then copy into Gmail
                </p>

                <div className={toolbar}>
                    <div className={toolbarCopy}>
                        <span className={toolbarLabel}>Clipboard</span>
                        <span className={toolbarHint}>
                            {error ||
                                assetsError ||
                                (assets
                                    ? "Copy the subject, then the body, and paste into a new Gmail message."
                                    : "Preparing embedded images for Gmail…")}
                        </span>
                    </div>
                    <div
                        style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                    >
                        <button
                            type="button"
                            className={copyButton}
                            data-copied={subjectCopied ? "true" : "false"}
                            onClick={handleCopySubject}
                            style={{
                                background: subjectCopied ? undefined : "#1a3a5c",
                            }}
                        >
                            {subjectCopied ? "Subject copied" : "Copy subject"}
                        </button>
                        <button
                            type="button"
                            className={copyButton}
                            data-copied={copied ? "true" : "false"}
                            onClick={handleCopy}
                            disabled={!assets}
                        >
                            {copied ? "Body copied" : "Copy body for Gmail"}
                        </button>
                    </div>
                </div>

                <p className={previewLabel}>Email preview</p>
                <div className={previewFrame}>
                    <div className={subjectRow}>
                        Subject:{" "}
                        <span className={subjectValue}>{subject}</span>
                    </div>
                    {assets ? (
                        <div className={emailShell} ref={previewRef}>
                            <EmailBody source={source} assets={assets} />
                        </div>
                    ) : (
                        <p
                            className={subjectRow}
                            style={{ textAlign: "center", marginTop: "2rem" }}
                        >
                            {assetsError || "Preparing preview…"}
                        </p>
                    )}
                </div>

                <Footer showDivider={false} />
            </div>
        </>
    );
}
