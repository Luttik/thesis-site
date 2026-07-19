import { useId, useState } from "react";
import {
    wrap,
    marker,
    note,
    noteOpen,
    noteNumber,
} from "../styles/Sidenote.module.scss";

/**
 * A footnote rendered close to its reference: a small superscript marker
 * that, on narrow screens, expands inline right below the reference when
 * tapped, and on wide screens sits permanently in the margin next to the
 * text (a Tufte-CSS-style sidenote) so readers never have to jump to the
 * bottom of the page.
 */
export const Sidenote = ({ number, children }) => {
    const [open, setOpen] = useState(false);
    const noteId = useId();

    return (
        <span className={wrap}>
            <sup>
                <button
                    type="button"
                    className={marker}
                    aria-expanded={open}
                    aria-controls={noteId}
                    onClick={() => setOpen((isOpen) => !isOpen)}
                >
                    {number}
                </button>
            </sup>
            <span id={noteId} className={open ? noteOpen : note}>
                <span className={noteNumber}>{number}</span>
                {children}
            </span>
        </span>
    );
};
