import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import { NextSeo } from "next-seo";
import slug from "rehype-slug";
import { Footer } from "../components/Footer";
import ProgressBar from "../components/ProgressBar";
import { TableOfContents } from "../components/TableOfContents";
import { fileToMdx, THESIS_PATH } from "../utils/mdxUtils";
import { blog, header, description as descriptionClass, homeLink, topActions, downloadButton } from "../styles/blog.module.scss";

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
    const supervisor = frontMatter.supervisor || "S. (Stefanie) Beninger";
    const date = formatDate(frontMatter.date);
    const description =
        frontMatter.description ||
        "MBA thesis by Daan Luttik on how marketing managers create value with agentic AI.";
    const pageTitle = `${title} — Daan Luttik`;

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
                }}
            />
            <ProgressBar />
            <TableOfContents />
            <div className={blog}>
                <h1 style={{ fontWeight: "800", marginBottom: "0pt" }}>
                    {title}
                </h1>
                {subtitle ? (
                    <p className={descriptionClass}>{subtitle}</p>
                ) : null}
                <div className={topActions}>
                    <a href="https://daanluttik.nl" className={homeLink}>
                        👈 daanluttik.nl
                    </a>
                    <a
                        href="/thesis-daan-luttik-mba.pdf"
                        className={downloadButton}
                        download="Thesis - Daan Luttik - MBA.pdf"
                    >
                        Download PDF
                    </a>
                </div>
                <div className={header}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <img
                            src="/img/daan-250x.jpg"
                            alt={author}
                            style={{
                                width: "3em",
                                height: "3em",
                                borderRadius: "3em",
                                marginRight: "8pt",
                            }}
                        />
                        <div>
                            <div
                                style={{
                                    fontWeight: "500",
                                    fontSize: "1.1em",
                                }}
                            >
                                {author}
                            </div>
                            <div>{date}</div>
                            <div
                                style={{
                                    color: "var(--color-text-muted)",
                                    fontSize: "0.9em",
                                }}
                            >
                                Supervised by {supervisor}
                            </div>
                        </div>
                    </div>
                    <div>{readingTime}</div>
                </div>
                <main>
                    <MDXRemote {...source} />
                </main>
                <Footer showDivider={true} />
            </div>
        </>
    );
}
