import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const outputDirectory = path.resolve("_site");

async function filesBelow(directory) {
  const entries = await readdir(directory);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    if ((await stat(fullPath)).isDirectory()) {
      files.push(...await filesBelow(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

test("build creates every migrated content route", async () => {
  const files = await filesBelow(outputDirectory);
  const htmlFiles = files.filter((file) => file.endsWith(".html"));
  const postPages = htmlFiles.filter((file) => file.includes(`${path.sep}blog${path.sep}`) && !file.includes(`${path.sep}page${path.sep}`));
  const notePages = htmlFiles.filter((file) => file.includes(`${path.sep}notes${path.sep}`) && !file.includes(`${path.sep}page${path.sep}`));
  const categoryPages = htmlFiles.filter((file) => file.includes(`${path.sep}category${path.sep}`));

  assert.equal(postPages.length, 115, "114 posts plus the blog index");
  assert.equal(notePages.length, 40, "39 notes plus the notes index");
  assert.equal(categoryPages.length, 5);
});

test("key routes and all feed formats exist", async () => {
  const expected = [
    "index.html",
    "about/index.html",
    "blog/index.html",
    "notes/index.html",
    "now/index.html",
    "resume/index.html",
    "sitemap.xml",
    "feed/posts/rss",
    "feed/posts/atom",
    "feed/posts/json",
    "feed/notes/rss",
    "feed/notes/atom",
    "feed/notes/json",
  ];

  for (const relativePath of expected) {
    assert.ok((await stat(path.join(outputDirectory, relativePath))).isFile(), relativePath);
  }

  JSON.parse(await readFile(path.join(outputDirectory, "feed/posts/json"), "utf8"));
  JSON.parse(await readFile(path.join(outputDirectory, "feed/notes/json"), "utf8"));
});

test("draft pages are retained as source but not published", async () => {
  for (const slug of ["blogroll", "podroll", "reading"]) {
    await assert.rejects(stat(path.join(outputDirectory, slug, "index.html")));
  }
});

test("post and note filenames contain only their slug", async () => {
  const timestampPrefix = /^\d{4}-\d{2}-\d{2}T/;

  for (const directory of ["src/content/posts", "src/content/notes"]) {
    const markdownFiles = (await readdir(path.resolve(directory))).filter((file) => file.endsWith(".md"));
    assert.ok(markdownFiles.length > 0);
    assert.equal(markdownFiles.some((file) => timestampPrefix.test(file)), false, directory);
  }
});

test("content omits legacy Laravel presentation frontmatter", async () => {
  const contentDirectory = path.resolve("src/content");
  const markdownFiles = (await filesBelow(contentDirectory)).filter((file) => file.endsWith(".md"));

  for (const file of markdownFiles) {
    const markdown = await readFile(file, "utf8");
    const relativePath = path.relative(contentDirectory, file);

    assert.doesNotMatch(markdown, /^(?:template|use_builder|blocks):/m, relativePath);
  }
});

test("page-specific Eleventy layouts preserve their presentation", async () => {
  const nowSource = await readFile(path.resolve("src/content/pages/now.md"), "utf8");
  const resumeSource = await readFile(path.resolve("src/content/pages/resume.md"), "utf8");
  const nowPage = await readFile(path.join(outputDirectory, "now/index.html"), "utf8");
  const resumePage = await readFile(path.join(outputDirectory, "resume/index.html"), "utf8");

  assert.match(nowSource, /^layout: now\.njk$/m);
  assert.match(resumeSource, /^layout: resume\.njk$/m);
  assert.match(nowPage, /Derek Sivers' now page movement/);
  assert.match(resumePage, /<main class="container-l">/);
  assert.doesNotMatch(resumePage, /<header class="container">/);
});

test("archives are ordered by frontmatter dates rather than filenames", async () => {
  const blog = await readFile(path.join(outputDirectory, "blog/index.html"), "utf8");
  const notes = await readFile(path.join(outputDirectory, "notes/index.html"), "utf8");

  assert.ok(blog.indexOf("I Ran My First Marathon") < blog.indexOf("Inline code-comments as a defence against AI-led cognitive debt"));
  assert.ok(notes.indexOf("Gravity") < notes.indexOf("Counselors"));
});

test("metadata title overrides only the document title", async () => {
  const page = await readFile(path.join(outputDirectory, "about/index.html"), "utf8");
  const fallbackPage = await readFile(path.join(outputDirectory, "contact/index.html"), "utf8");

  assert.match(page, /<title>Phil Stephens \| About Me<\/title>/);
  assert.match(page, /<h1>About<\/h1>/);
  assert.match(fallbackPage, /<title>Phil Stephens \| Contact<\/title>/);
});

test("bare Markdown URLs become clickable links", async () => {
  const followPage = await readFile(path.join(outputDirectory, "follow/index.html"), "utf8");

  assert.match(followPage, /<a href="https:\/\/philstephens\.com\/feed\/posts\/rss">https:\/\/philstephens\.com\/feed\/posts\/rss<\/a>/);
  assert.match(followPage, /<a href="https:\/\/github\.com\/theprivateer">https:\/\/github\.com\/theprivateer<\/a>/);
});

test("code pages load Prism with the Twilight theme on demand", async () => {
  const codePage = await readFile(path.join(outputDirectory, "blog/adding-reading-time-to-a-jigsaw-blog/index.html"), "utf8");
  const contentPage = await readFile(path.join(outputDirectory, "about/index.html"), "utf8");

  assert.match(codePage, /class="language-php"/);
  assert.match(codePage, /prism\/1\.30\.0\/themes\/prism-twilight\.min\.css/);
  assert.match(codePage, /prism\/1\.30\.0\/components\/prism-core\.min\.js/);
  assert.match(codePage, /prism\/1\.30\.0\/plugins\/autoloader\/prism-autoloader\.min\.js/);
  assert.doesNotMatch(contentPage, /cdnjs\.cloudflare\.com\/ajax\/libs\/prism/);
});

test("content images have alt text and local images are copied into the built site", async () => {
  const contentDirectory = path.resolve("src/content");
  const sourceImageDirectory = path.resolve("src/assets/images");
  const builtImageDirectory = path.join(outputDirectory, "assets/images");
  const markdownFiles = (await filesBelow(contentDirectory)).filter((file) => file.endsWith(".md"));
  const referencedImages = new Set();

  for (const file of markdownFiles) {
    const markdown = await readFile(file, "utf8");
    const relativePath = path.relative(contentDirectory, file);

    assert.doesNotMatch(markdown, /https?:\/\/assets\.philstephens\.com\//, relativePath);

    for (const match of markdown.matchAll(/!\[([^\]]*)\]\(([^)\s"'<>]+)\)/g)) {
      assert.ok(match[1].trim(), `image alt text: ${relativePath}`);

      if (match[2].startsWith("/assets/images/")) {
        referencedImages.add(match[2].slice("/assets/images/".length));
      }
    }
  }

  assert.ok(referencedImages.size > 0, "at least one local content image is referenced");

  for (const image of referencedImages) {
    assert.equal(path.extname(image), ".webp", `modern image format: ${image}`);
    assert.ok((await stat(path.join(sourceImageDirectory, image))).isFile(), `source image: ${image}`);
    assert.ok((await stat(path.join(builtImageDirectory, image))).isFile(), `built image: ${image}`);
  }

  const sourceImages = (await filesBelow(sourceImageDirectory)).map((file) => path.relative(sourceImageDirectory, file));
  const builtImages = (await filesBelow(builtImageDirectory)).map((file) => path.relative(builtImageDirectory, file));

  assert.deepEqual(builtImages.sort(), sourceImages.sort());
});

test("rendered HTML contains no unresolved site template variables", async () => {
  const files = (await filesBelow(outputDirectory)).filter((file) => file.endsWith(".html"));

  for (const file of files) {
    const html = await readFile(file, "utf8");
    assert.doesNotMatch(html, /\{\{\s*(site|page|collections|pagination|content|build)\b/, path.relative(outputDirectory, file));
    assert.doesNotMatch(html, /\{%\s*(include|extends|for|if)\b/, path.relative(outputDirectory, file));
    assert.match(html, /<!doctype html>/i, path.relative(outputDirectory, file));
  }
});

test("internal links resolve to generated files", async () => {
  const files = (await filesBelow(outputDirectory)).filter((file) => file.endsWith(".html"));
  const missing = [];
  const knownHistoricalLinks = new Set([
    "/blogroll",
    "/blogroll.opml",
    "/reading",
    "/subscriptions.xml",
    "/slashes",
  ]);

  for (const file of files) {
    const html = await readFile(file, "utf8");
    const links = [...html.matchAll(/href="(\/[^"]*)"/g)].map((match) => match[1]);

    for (const link of links) {
      const pathname = link.split(/[?#]/, 1)[0];
      if (!pathname) {
        continue;
      }

      if (knownHistoricalLinks.has(pathname.replace(/\/$/, ""))) {
        continue;
      }

      const exactTarget = pathname.slice(1);
      const relativeTarget = pathname === "/"
        ? "index.html"
        : path.extname(pathname)
          ? exactTarget
          : `${exactTarget.replace(/\/$/, "")}/index.html`;

      try {
        await stat(path.join(outputDirectory, exactTarget));
      } catch {
        try {
          await stat(path.join(outputDirectory, relativeTarget));
        } catch {
          missing.push(`${path.relative(outputDirectory, file)} -> ${pathname}`);
        }
      }
    }
  }

  assert.deepEqual([...new Set(missing)].sort(), []);
});
