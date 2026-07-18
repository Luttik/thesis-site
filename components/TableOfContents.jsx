import { useEffect, useRef, useState } from "react";
import styles from "../styles/TableOfContents.module.scss";

/**
 * Floating TOC: always lists chapters (h1); expands h2 subchapters
 * only for the chapter currently in view.
 */
export function TableOfContents() {
    const [chapters, setChapters] = useState([]);
    const [activeChapterId, setActiveChapterId] = useState(null);
    const [activeSectionId, setActiveSectionId] = useState(null);
    const elementsRef = useRef(new Map());

    useEffect(() => {
        const main = document.querySelector("main");
        if (!main) return undefined;

        const headingEls = [...main.querySelectorAll("h1[id], h2[id]")];
        if (headingEls.length === 0) return undefined;

        // First content heading is Foreword (page title lives outside MDX)
        const relevant = headingEls;
        const tree = [];
        const elMap = new Map();
        let current = null;

        for (const el of relevant) {
            elMap.set(el.id, el);
            if (el.tagName === "H1") {
                current = {
                    id: el.id,
                    text: el.textContent.trim(),
                    sections: [],
                };
                tree.push(current);
            } else if (el.tagName === "H2" && current) {
                current.sections.push({
                    id: el.id,
                    text: el.textContent.trim(),
                });
            }
        }

        elementsRef.current = elMap;
        setChapters(tree);

        const TOP_OFFSET = 96;

        const updateActive = () => {
            const y = window.scrollY + TOP_OFFSET;
            let chapter = tree[0] ?? null;

            for (const ch of tree) {
                const el = elMap.get(ch.id);
                if (el && el.offsetTop <= y) chapter = ch;
                else break;
            }
            if (!chapter) return;

            setActiveChapterId(chapter.id);

            let sectionId = null;
            for (const sec of chapter.sections) {
                const el = elMap.get(sec.id);
                if (el && el.offsetTop <= y) sectionId = sec.id;
                else break;
            }
            setActiveSectionId(sectionId);
        };

        updateActive();
        window.addEventListener("scroll", updateActive, { passive: true });
        window.addEventListener("resize", updateActive);

        return () => {
            window.removeEventListener("scroll", updateActive);
            window.removeEventListener("resize", updateActive);
        };
    }, []);

    if (chapters.length === 0) return null;

    return (
        <nav className={styles.toc} aria-label="Table of contents">
            <div className={styles.label}>Contents</div>
            <ol className={styles.chapters}>
                {chapters.map((chapter) => {
                    const isActive = chapter.id === activeChapterId;
                    const showSections =
                        isActive && chapter.sections.length > 0;

                    return (
                        <li
                            key={chapter.id}
                            className={
                                isActive ? styles.chapterActive : undefined
                            }
                        >
                            <a
                                href={`#${chapter.id}`}
                                className={styles.chapterLink}
                                aria-current={isActive ? "location" : undefined}
                            >
                                {chapter.text}
                            </a>
                            {showSections ? (
                                <ol className={styles.sections}>
                                    {chapter.sections.map((section) => (
                                        <li key={section.id}>
                                            <a
                                                href={`#${section.id}`}
                                                className={
                                                    section.id ===
                                                    activeSectionId
                                                        ? styles.sectionActive
                                                        : styles.sectionLink
                                                }
                                                aria-current={
                                                    section.id ===
                                                    activeSectionId
                                                        ? "location"
                                                        : undefined
                                                }
                                            >
                                                {section.text}
                                            </a>
                                        </li>
                                    ))}
                                </ol>
                            ) : null}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
