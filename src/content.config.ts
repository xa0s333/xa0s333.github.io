import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const writeups = defineCollection({
    loader: glob({
        pattern: "**/*.md",
        base: "./src/content/writeups",
    }),
});

const pages = defineCollection({
    loader: glob({
        pattern: "**/*.md",
        base: "./src/content/pages",
    }),
});

export const collections = {
    writeups,
    pages,
};