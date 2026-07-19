import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import { NextSeo } from "next-seo";
import slug from "rehype-slug";
import { Footer } from "../components/Footer";
import ProgressBar from "../components/ProgressBar";
import { TableOfContents } from "../components/TableOfContents";
import { NyenrodeLogo } from "../components/NyenrodeLogo";
import { fileToMdx, THESIS_PATH } from "../utils/mdxUtils";
import {
    blog,
    header,
    headerAuthor,
    headerAvatar,
    headerPrimary,
    headerSecondary,
    headerMeta,
    description as descriptionClass,
    homeLink,
    topActions,
    nyenrodeLogo,
    downloadBanner,
    downloadBannerCopy,
    downloadBannerLabel,
    downloadBannerTitle,
    downloadBannerHint,
    downloadBannerVisual,
} from "../styles/blog.module.scss";

const SITE_URL = "https://thesis.daanluttik.nl";

const formatDate = (isoDate) => {
    if (!isoDate) return "";
    // Prefer DD-MM-YYYY to match daanluttik.nl blog posts
    const m = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return isoDate;
};

export const getStaticProps = async () => {
    const thesis = await fileToMdx(THESIS_PATH, "thesis.mdx", [], [slug]);

    return {
        props: {
            source: thesis.source,
            frontMatter: thesis.frontMatter,
            readingTime: thesis.readingTime,
        },
    };
};

export default function Index({ source, frontMatter, readingTime }) {
    const title =
        frontMatter.title ||
        "Creating value with agentic AI in marketing";
    const subtitle = frontMatter.subtitle || "";
    const author = frontMatter.author || "Daan Luttik";
    const date = formatDate(frontMatter.date);
    const description =
        frontMatter.description ||
        "MBA thesis by Daan Luttik on how marketing managers create value with agentic AI.";
    const pageTitle = `${title} — Daan Luttik`;
    const ogImageUrl = `${SITE_URL}/img/og.jpg`;
    const ogImageAlt = `${title} — MBA thesis by ${author} at Nyenrode Business Universiteit`;

    return (
        <>
            <Head>
                <title>{pageTitle}</title>
                <link rel="icon" type="image/svg+xml" href="/img/favicon.svg" />
            </Head>
            <NextSeo
                title={pageTitle}
                description={description}
                canonical={SITE_URL}
                openGraph={{
                    url: SITE_URL,
                    title: pageTitle,
                    description,
                    type: "article",
                    siteName: "Daan Luttik — MBA Thesis",
                    locale: "en_US",
                    images: [
                        {
                            url: ogImageUrl,
                            width: 1200,
                            height: 630,
                            alt: ogImageAlt,
                            type: "image/jpeg",
                        },
                    ],
                    article: {
                        publishedTime: frontMatter.date || undefined,
                        authors: [author],
                        tags: [
                            "agentic AI",
                            "marketing",
                            "MBA",
                            "Nyenrode",
                            "grounded theory",
                        ],
                    },
                }}
                twitter={{
                    cardType: "summary_large_image",
                }}
                additionalMetaTags={[
                    {
                        name: "author",
                        content: author,
                    },
                ]}
            />
            <ProgressBar />
            <TableOfContents />
            <div className={blog}>
                <div className={topActions}>
                    <a href="https://daanluttik.nl" className={homeLink}>
                        👈 daanluttik.nl
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
                            alt={author}
                            className={headerAvatar}
                        />
                        <div>
                            <div className={headerPrimary}>{author}</div>
                            <div className={headerSecondary}>{date}</div>
                        </div>
                    </div>
                    <div className={headerMeta}>
                        <div className={headerPrimary}>MBA thesis</div>
                        <div className={headerSecondary}>{readingTime}</div>
                    </div>
                </div>
                <a
                    href="/thesis-daan-luttik-mba.pdf"
                    className={downloadBanner}
                    download="Thesis - Daan Luttik - MBA.pdf"
                >
                    <div className={downloadBannerCopy}>
                        <span className={downloadBannerLabel}>PDF</span>
                        <span className={downloadBannerTitle}>
                            Download the thesis
                        </span>
                        <span className={downloadBannerHint}>
                            Full document · ready to print
                        </span>
                    </div>
                    <div className={downloadBannerVisual} aria-hidden="true">
                        <img
                            src="/media/page.jpg"
                            alt=""
                            width={420}
                            height={594}
                        />
                    </div>
                </a>
                <h1
                    style={{
                        fontWeight: "800",
                        marginTop: "0",
                        marginBottom: "0pt",
                        textAlign: "center",
                    }}
                >
                    {title}
                </h1>
                {subtitle ? (
                    <p
                        className={descriptionClass}
                        style={{ textAlign: "center" }}
                    >
                        {subtitle}
                    </p>
                ) : null}
                <main>
                    <MDXRemote {...source} />
                </main>
                <Footer showDivider={true} />
            </div>
        </>
    );
}
