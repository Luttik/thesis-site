const path = require("path");
const fs = require("fs");

function getAllMdxFiles(dir) {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...getAllMdxFiles(fullPath));
        } else if (/\.mdx?$/.test(entry.name)) {
            files.push(fullPath);
        }
    }
    return files;
}

class WatchMdxFilesPlugin {
    apply(compiler) {
        compiler.hooks.afterCompile.tap(
            "WatchMdxFilesPlugin",
            (compilation) => {
                const contentDir = path.join(process.cwd(), "content");
                compilation.contextDependencies.add(contentDir);
                for (const file of getAllMdxFiles(contentDir)) {
                    compilation.fileDependencies.add(file);
                }
            },
        );
    }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["rehype-slug"],
};

if (process.env.NODE_ENV === "development") {
    nextConfig.webpack = (config) => {
        config.plugins.push(new WatchMdxFilesPlugin());
        return config;
    };
}

module.exports = nextConfig;
