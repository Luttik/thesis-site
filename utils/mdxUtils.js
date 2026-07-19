import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { serialize } from "next-mdx-remote/serialize";

export const CONTENT_PATH = path.join(process.cwd(), "content");
export const THESIS_PATH = path.join(CONTENT_PATH, "thesis.mdx");
export const EMAIL_PATH = path.join(CONTENT_PATH, "email.mdx");

export const fileToMdx = async (
    filePath,
    fileName,
    remarkPlugins,
    rehypePlugins,
) => {
    const source = fs.readFileSync(filePath);
    const { content, data } = matter(source);

    const renderedMdx = await serialize(content, {
        blockJS: false,
        mdxOptions: {
            format: "mdx",
            remarkPlugins: remarkPlugins ? remarkPlugins : [],
            rehypePlugins: rehypePlugins ? rehypePlugins : [],
        },
        scope: data,
    });

    return {
        frontMatter: data,
        fileName,
        filePath,
        readingTime: readingTime(content).text,
        source: renderedMdx,
    };
};
