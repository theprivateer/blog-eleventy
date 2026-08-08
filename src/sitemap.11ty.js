function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function itemDate(item) {
  return item?.data?.updated_at
    ?? item?.data?.published_at
    ?? item?.data?.created_at
    ?? item?.date;
}

function latestDate(items) {
  return items.reduce((latest, item) => {
    const value = itemDate(item);
    const date = value ? new Date(value) : undefined;

    return date && !Number.isNaN(date.valueOf()) && (!latest || date > latest)
      ? date
      : latest;
  }, undefined);
}

function normaliseDate(value) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString();
}

export const data = {
  permalink: "/sitemap.xml",
  eleventyExcludeFromCollections: true,
};

export default function ({ collections, site }) {
  const entries = new Map();
  const add = (path, lastModified) => entries.set(new URL(path, site.url).toString(), normaliseDate(lastModified));

  for (const item of [...collections.posts, ...collections.notes]) {
    add(item.url, itemDate(item));
  }

  for (const category of collections.categories) {
    add(`/category/${category.fileSlug}/`, itemDate(category));
  }

  for (const page of collections.pages) {
    if (page.url) {
      add(page.url, itemDate(page));
    }
  }

  const home = collections.pages.find((page) => page.fileSlug === "home");
  add("/", itemDate(home));

  const addArchivePages = (section, items, pageSize) => {
    const modified = latestDate(items);
    const pageCount = Math.ceil(items.length / pageSize);

    for (let page = 1; page <= pageCount; page += 1) {
      add(page === 1 ? `/${section}/` : `/${section}/page/${page}/`, modified);
    }
  };

  addArchivePages("blog", collections.posts, 15);
  addArchivePages("notes", collections.notes, 15);

  const urls = [...entries].sort(([a], [b]) => a.localeCompare(b));
  const body = urls.map(([url, lastModified]) => [
    "  <url>",
    `    <loc>${xmlEscape(url)}</loc>${lastModified ? `\n    <lastmod>${lastModified}</lastmod>` : ""}`,
    "  </url>",
  ].join("\n")).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}
