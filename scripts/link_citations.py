"""Generate linked References section and linkify inline citations from references.bib."""

from __future__ import annotations

import re
import shutil
from pathlib import Path

import bibtexparser
from bibtexparser.bparser import BibTexParser
from bibtexparser.customization import convert_to_unicode

ROOT = Path(__file__).resolve().parents[1]
BIB_SRC = Path(r"c:\workspace\thesis-shareable\latex\references.bib")
BIB_DST = ROOT / "content" / "references.bib"
MDX_PATH = ROOT / "content" / "thesis.mdx"


def clean(value: str | None) -> str:
    if not value:
        return ""
    text = value.replace("\\&", "&").replace("\\%", "%")
    text = text.replace("``", '"').replace("''", '"')
    text = re.sub(r"[{}]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def parse_authors(author_field: str) -> list[str]:
    return [clean(p) for p in re.split(r"\s+and\s+", author_field.strip()) if clean(p)]


def last_name(author: str) -> str:
    if "," in author:
        return author.split(",", 1)[0].strip()
    tokens = author.split()
    return tokens[-1] if tokens else author


def format_author_list(authors: list[str]) -> str:
    formatted: list[str] = []
    for a in authors:
        if "," in a:
            ln, rest = a.split(",", 1)
            rest = rest.strip()
            # Ensure initials end with periods: "B" -> "B." ; "D. B" stays
            if rest and not rest.endswith("."):
                parts = rest.split()
                parts = [p if p.endswith(".") else f"{p}." for p in parts]
                rest = " ".join(parts)
            formatted.append(f"{ln.strip()}, {rest}" if rest else ln.strip())
        else:
            formatted.append(a)

    if len(formatted) == 1:
        return formatted[0]
    if len(formatted) == 2:
        return f"{formatted[0]}, & {formatted[1]}"
    return ", ".join(formatted[:-1]) + f", & {formatted[-1]}"


def target_url(entry: dict) -> str | None:
    doi = clean(entry.get("doi"))
    if doi:
        doi = doi.removeprefix("https://doi.org/")
        return f"https://doi.org/{doi}"
    url = clean(entry.get("url"))
    return url or None


def format_entry_apa(entry: dict) -> str:
    authors = parse_authors(entry.get("author", "Unknown"))
    author_str = format_author_list(authors)
    year = clean(entry.get("year", "n.d."))
    title = clean(entry.get("title"))
    entry_type = entry.get("ENTRYTYPE", "misc").lower()

    journal = clean(entry.get("journal"))
    volume = clean(entry.get("volume"))
    number = clean(entry.get("number"))
    pages = clean(entry.get("pages")).replace("--", "–").replace("-", "–")
    publisher = clean(entry.get("publisher"))

    if entry_type in {"book", "online"} and not journal:
        title_part = f"<em>{title}</em>."
    else:
        title_part = f"{title}."

    bits = [f"{author_str} ({year}). {title_part}"]

    if journal:
        venue = f"<em>{journal}</em>"
        if volume:
            venue += f", <em>{volume}</em>"
            if number:
                venue += f"({number})"
        if pages:
            venue += f", {pages}"
        bits.append(venue + ".")
    elif publisher:
        bits.append(publisher + ".")

    return " ".join(bits)


def cite_labels(entry: dict) -> dict[str, str]:
    authors = parse_authors(entry.get("author", "Unknown"))
    year = clean(entry.get("year"))
    lasts = [last_name(a) for a in authors]

    if len(lasts) == 1:
        paren = f"{lasts[0]}, {year}"
        narrative = f"{lasts[0]} ({year})"
        narrative_and = narrative
    elif len(lasts) == 2:
        paren = f"{lasts[0]} & {lasts[1]}, {year}"
        narrative = f"{lasts[0]} & {lasts[1]} ({year})"
        narrative_and = f"{lasts[0]} and {lasts[1]} ({year})"
    else:
        paren = f"{lasts[0]} et al., {year}"
        narrative = f"{lasts[0]} et al. ({year})"
        narrative_and = narrative

    return {
        "paren": paren,
        "paren_first": f"{lasts[0]}, {year}",
        "narrative": narrative,
        "narrative_and": narrative_and,
        "year": year,
        "first": lasts[0],
    }


def load_bib() -> list[dict]:
    if BIB_SRC.exists():
        shutil.copy2(BIB_SRC, BIB_DST)
    # bibtexparser 1.x drops non-standard types like @online unless registered
    raw = BIB_DST.read_text(encoding="utf-8")
    raw = re.sub(r"@online\b", "@misc", raw, flags=re.I)
    parser = BibTexParser(common_strings=True)
    parser.customization = convert_to_unicode
    db = bibtexparser.loads(raw, parser=parser)
    entries = list(db.entries)
    entries.sort(
        key=lambda e: (
            last_name(parse_authors(e.get("author", "Z"))[0]).lower(),
            e.get("year", ""),
            e["ID"],
        )
    )
    return entries


def build_ref_section(entries: list[dict]) -> str:
    lines = ["# 7. References", ""]
    for entry in entries:
        key = entry["ID"]
        apa = format_entry_apa(entry).replace("{", "\\{").replace("}", "\\}")
        url = target_url(entry)
        if url:
            lines.append(
                f'<p className="ref-entry" id="ref-{key}">'
                f'<a href="{url}" target="_blank" rel="noopener noreferrer">{apa}</a>'
                f"</p>"
            )
        else:
            lines.append(f'<p className="ref-entry" id="ref-{key}">{apa}</p>')
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def build_lookups(entries: list[dict]) -> tuple[dict[str, str], dict[tuple[str, str], str]]:
    by_label: dict[str, str] = {}
    first_year: dict[tuple[str, str], str] = {}

    for entry in entries:
        key = entry["ID"]
        labels = cite_labels(entry)
        for name in ("paren", "narrative", "narrative_and"):
            by_label.setdefault(labels[name], key)
        # first-author-only only if not already claimed by a 1-author work
        by_label.setdefault(labels["paren_first"], key)
        first_year.setdefault((labels["first"].lower(), labels["year"]), key)

    return by_label, first_year


def linkify_body(body: str, entries: list[dict]) -> str:
    by_label, first_year = build_lookups(entries)
    labels_sorted = sorted(by_label.keys(), key=len, reverse=True)

    def md_link(label: str) -> str:
        return f"[{label}](#ref-{by_label[label]})"

    # 1) Narrative citations (contain parentheses with year)
    for label in labels_sorted:
        if "(" not in label:
            continue
        body = body.replace(label, md_link(label))

    # Protect existing links
    protected: list[str] = []

    def protect(match: re.Match[str]) -> str:
        protected.append(match.group(0))
        return f"\x00P{len(protected) - 1}\x00"

    body = re.sub(r"\[[^\]]+\]\(#ref-[^)]+\)", protect, body)

    # 2) Parenthetical citation groups
    def replace_paren_group(match: re.Match[str]) -> str:
        inner = match.group(1)
        if not re.search(r"19\d{2}|20\d{2}", inner):
            return match.group(0)

        parts = [p.strip() for p in inner.split(";")]
        linked_parts: list[str] = []

        for part in parts:
            prefix = ""
            core = part
            eg = re.match(r"^(e\.g\.,?\s*)(.+)$", part, flags=re.I)
            if eg:
                prefix = eg.group(1)
                core = eg.group(2).strip()

            page = ""
            page_m = re.match(r"^(.+?)(,\s*pp?\.\s*[\d–\-]+)$", core)
            if page_m:
                core = page_m.group(1).strip()
                page = page_m.group(2)

            if core in by_label:
                linked_parts.append(f"{prefix}{md_link(core)}{page}")
                continue

            # Match known paren labels as prefix (unlikely)
            found = False
            for label in labels_sorted:
                if "(" in label:
                    continue
                if core == label:
                    linked_parts.append(f"{prefix}{md_link(label)}{page}")
                    found = True
                    break
            if found:
                continue

            # Fallback: FirstAuthor … Year
            m = re.match(
                r"^([A-Za-zÄÖÜäöüÅåÁÉÍÓÚáéíóú\-']+(?:\s+et\s+al\.)?)"
                r"(?:\s*&\s*[A-Za-zÄÖÜäöüÅåÁÉÍÓÚáéíóú\-']+)?"
                r",\s*(\d{4})$",
                core,
            )
            if m:
                first = m.group(1).replace(" et al.", "").strip().split()[0]
                key = first_year.get((first.lower(), m.group(2)))
                if key:
                    linked_parts.append(f"{prefix}[{core}](#ref-{key}){page}")
                    continue

            linked_parts.append(part)

        return "(" + "; ".join(linked_parts) + ")"

    body = re.sub(r"\(([^()\n]{3,220})\)", replace_paren_group, body)

    for i, val in enumerate(protected):
        body = body.replace(f"\x00P{i}\x00", val)

    return body


def main() -> None:
    entries = load_bib()
    print(f"Loaded {len(entries)} bib entries")

    mdx = MDX_PATH.read_text(encoding="utf-8")
    if mdx.startswith("\ufeff"):
        mdx = mdx.lstrip("\ufeff")

    # If already linked from a previous run, strip links in body first for idempotency
    ref_start = mdx.find("# 7. References")
    appendix_start = mdx.find("# Appendix A.")
    if ref_start < 0 or appendix_start < 0:
        raise SystemExit("Could not find References or Appendix A headings")

    body = mdx[:ref_start]
    after = mdx[appendix_start:]

    # Unwrap existing citation links so re-runs are safe
    body = re.sub(r"\[([^\]]+)\]\(#ref-[^)]+\)", r"\1", body)

    body = linkify_body(body, entries)
    ref_section = build_ref_section(entries)

    out = body.rstrip() + "\n\n" + ref_section + "\n" + after.lstrip()
    MDX_PATH.write_text(out, encoding="utf-8")

    cite_links = len(re.findall(r"\]\(#ref-", body))
    print(f"Wrote {MDX_PATH}")
    print(f"Inline citation links: {cite_links}")
    print(f"Reference entries: {len(entries)}")

    # Report unlinked paren cites that look academic
    samples = re.findall(r"\(([^)]*\d{4}[^)]*)\)", body)
    unlinked = [s for s in samples if "](#ref-" not in s and re.search(r"[A-Za-z].*\d{4}", s)]
    if unlinked:
        print(f"Possibly unlinked citation groups ({len(unlinked)}):")
        for s in unlinked[:15]:
            print(f"  ({s})")


if __name__ == "__main__":
    main()
