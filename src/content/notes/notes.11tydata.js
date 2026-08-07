function slugFromStem(stem) {
  return stem.split("/").at(-1);
}

export default {
  layout: "note.njk",
  eleventyComputed: {
    permalink: (data) => `/notes/${slugFromStem(data.page.filePathStem)}/index.html`,
    date: (data) => data.created_at,
  },
};
