import fs from "fs";

const path = "public/img/nyenrode-logo.svg";
let svg = fs.readFileSync(path, "utf8");

// Idempotent cleanup
svg = svg.replace(/<rect width="1004" height="192" fill="#F5F5F5"\/>\n?/, "");
svg = svg.replaceAll('fill="#05004B"', 'fill="currentColor"');
svg = svg.replace(/\s*(aria-hidden|focusable)="[^"]*"/g, "");
svg = svg.replace(
    /^<svg\b/,
    '<svg aria-hidden="true" focusable="false"',
);

fs.writeFileSync(path, svg);

const component = `const LOGO_SVG = ${JSON.stringify(svg)};

export function NyenrodeLogo({ className }) {
    return (
        <span
            className={className}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: LOGO_SVG }}
        />
    );
}
`;

fs.writeFileSync("components/NyenrodeLogo.jsx", component);
console.log(
    "ok",
    (svg.match(/currentColor/g) || []).length,
    "fills; aria count",
    (svg.match(/aria-hidden/g) || []).length,
);
