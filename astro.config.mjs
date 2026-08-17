import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import remarkBreaks from "remark-breaks";

export default defineConfig({
    site: "https://xa0s333.github.io",

    markdown: {
        processor: unified({
            remarkPlugins: [remarkBreaks],
        }),
    },
});