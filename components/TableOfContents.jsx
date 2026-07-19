import { useEffect, useId, useRef, useState } from "react";
import styles from "../styles/TableOfContents.module.scss";

/**
 * Floating TOC: always lists chapters (h1); expands h2 subchapters
 * only for the chapter currently in view.
 *
 * Wide viewports: fixed side rail.
 * Narrow viewports: chapter pill that opens a dropdown.
 */
export function TableOfContents() {
    const [chapters, setChapters] = useState([]);
    const [activeChapterId, setActiveChapterId] = useState(null);
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [compactOpen, setCompactOpen] = useState(false);
    const elementsRef = useRef(new Map());
    const compactRef = useRef(null);
    const dropdownId = useId();

    useEffect(() => {
        const main = document.querySelector("main");
        if (!main) return undefined;

        const headingEls = [...main.querySelectorAll("h1[id], h2[id]")];
        if (headingEls.length === 0) return undefined;

        const tree = [];
        const elMap = new Map();
        let current = null;

        for (const el of headingEls) {
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

    useEffect(() => {
        if (!compactOpen) return undefined;

        const onPointerDown = (event) => {
            if (
                compactRef.current &&
                !compactRef.current.contains(event.target)
            ) {
                setCompactOpen(false);
            }
        };

        const onKeyDown = (event) => {
            if (event.key === "Escape") setCompactOpen(false);
        };

        const onResize = () => {
            if (window.matchMedia("(min-width: 1360px)").matches) {
                setCompactOpen(false);
            }
        };

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        window.addEventListener("resize", onResize);

        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("resize", onResize);
        };
    }, [compactOpen]);

    if (chapters.length === 0) return null;

    const activeChapter =
        chapters.find((chapter) => chapter.id === activeChapterId) ??
        chapters[0];

    const closeCompact = () => setCompactOpen(false);

    const renderList = (onNavigate) => (
        <ol className={styles.chapters}>
            {chapters.map((chapter) => {
                const isActive = chapter.id === activeChapterId;
                const showSections = isActive && chapter.sections.length > 0;
                const highlightChapter = isActive && !activeSectionId;

                return (
                    <li
                        key={chapter.id}
                        className={isActive ? styles.chapterActive : undefined}
                    >
                        <a
                            href={`#${chapter.id}`}
                            className={styles.chapterLink}
                            aria-current={
                                highlightChapter ? "location" : undefined
                            }
                            onClick={onNavigate}
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
                                                section.id === activeSectionId
                                                    ? styles.sectionActive
                                                    : styles.sectionLink
                                            }
                                            aria-current={
                                                section.id === activeSectionId
                                                    ? "location"
                                                    : undefined
                                            }
                                            onClick={onNavigate}
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
    );

    return (
        <>
            <nav className={styles.toc} aria-label="Table of contents">
                {renderList()}
            </nav>

            <div className={styles.compact} ref={compactRef}>
                <button
                    type="button"
                    className={styles.pill}
                    aria-expanded={compactOpen}
                    aria-controls={dropdownId}
                    aria-label="Table of contents"
                    onClick={() => setCompactOpen((open) => !open)}
                >
                    <span className={styles.frost} aria-hidden="true" />
                    <span className={styles.pillChapter}>
                        {activeChapter.text}
                    </span>
                    <span
                        className={
                            compactOpen ? styles.chevronOpen : styles.chevron
                        }
                        aria-hidden="true"
                    />
                </button>

                {compactOpen ? (
                    <nav
                        id={dropdownId}
                        className={styles.dropdown}
                        aria-label="Table of contents"
                    >
                        <span className={styles.frost} aria-hidden="true" />
                        <div className={styles.dropdownInner}>
                            {renderList(closeCompact)}
                        </div>
                    </nav>
                ) : null}
            </div>
        </>
    );
}
