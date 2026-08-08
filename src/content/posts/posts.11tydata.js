function slugFromStem(stem) {
  return stem.split("/").at(-1);
}

export default {
  layout: "post.njk",
  contentType: "post",
  eleventyComputed: {
    permalink: (data) => `/blog/${slugFromStem(data.page.filePathStem)}/index.html`,
    date: (data) => data.published_at,
    description: (data) => data.metadata?.description ?? data.intro ?? undefined,
  },
};
