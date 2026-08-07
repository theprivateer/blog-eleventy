const listingPages = new Set(["home", "blog", "notes"]);

export default {
  layout: "page.njk",
  eleventyComputed: {
    permalink: (data) => data.draft || listingPages.has(data.page.fileSlug)
      ? false
      : `/${data.page.fileSlug}/index.html`,
    description: (data) => data.metadata?.description ?? undefined,
  },
};
