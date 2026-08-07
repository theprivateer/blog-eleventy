const SITE_URL = "https://philstephens.com";

function contentSlug(item) {
  return item.fileSlug;
}

function byDateDescending(a, b) {
  return new Date(b.data.published_at ?? b.data.created_at) - new Date(a.data.published_at ?? a.data.created_at);
}

function xmlEscape(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export default function (eleventyConfig) {
  eleventyConfig.configureErrorReporting({ allowMissingExtensions: true });
  eleventyConfig.amendLibrary("md", (markdown) => markdown.set({ linkify: true }));
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });

  eleventyConfig.addWatchTarget("src/assets/");

  eleventyConfig.addCollection("posts", (collectionApi) =>
    collectionApi.getFilteredByGlob("src/content/posts/*.md").sort(byDateDescending),
  );

  eleventyConfig.addCollection("notes", (collectionApi) =>
    collectionApi.getFilteredByGlob("src/content/notes/*.md").sort(byDateDescending),
  );

  eleventyConfig.addCollection("pages", (collectionApi) =>
    collectionApi.getFilteredByGlob("src/content/pages/*.md").filter((page) => !page.data.draft),
  );

  eleventyConfig.addCollection("categories", (collectionApi) =>
    collectionApi.getFilteredByGlob("src/content/categories/*.md").sort((a, b) =>
      a.data.title.localeCompare(b.data.title),
    ),
  );

  eleventyConfig.addFilter("contentSlug", contentSlug);
  eleventyConfig.addFilter("limit", (items, count) => items.slice(0, count));
  eleventyConfig.addFilter("startsWith", (value, prefix) => String(value).startsWith(prefix));
  eleventyConfig.addFilter("absoluteUrl", (url) => new URL(url, SITE_URL).toString());
  eleventyConfig.addFilter("xmlEscape", xmlEscape);
  eleventyConfig.addFilter("jsonStringify", (value) => JSON.stringify(value, null, 2));
  eleventyConfig.addFilter("readableDate", (value, includeWeekday = false) =>
    new Intl.DateTimeFormat("en-AU", {
      ...(includeWeekday ? { weekday: "long" } : {}),
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Australia/Brisbane",
    }).format(new Date(value)),
  );
  eleventyConfig.addFilter("rfc3339Date", (value) => new Date(value).toISOString());
  eleventyConfig.addFilter("rfc822Date", (value) => new Date(value).toUTCString());
  eleventyConfig.addFilter("hostname", (url) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  });
  eleventyConfig.addFilter("pageBySlug", (pages, slug) =>
    pages.find((page) => page.fileSlug === slug),
  );
  eleventyConfig.addFilter("categoryById", (categories, id) =>
    categories.find((category) => Number(category.data.id) === Number(id)),
  );
  eleventyConfig.addFilter("postsForCategory", (posts, id) =>
    posts.filter((post) => Number(post.data.category_id) === Number(id)),
  );

  eleventyConfig.addGlobalData("site", {
    name: "Phil Stephens",
    url: SITE_URL,
    language: "en-AU",
    description: "Personal website of Phil Stephens",
    author: {
      name: "Phil Stephens",
      email: "hello@philstephens.com",
    },
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data",
      output: "_site",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: false,
    templateFormats: ["md", "njk", "11ty.js"],
  };
}
