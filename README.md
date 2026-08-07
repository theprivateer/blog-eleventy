# Phil Stephens - Eleventy Static Site

My [personal website](https://philstephens.com) built with Eleventy. Successor of a [Laravel-powered custom CMS](https://github.com/theprivateer/blog).

The Markdown files in `src/content` are the source of truth. Eleventy turns them into a static site while preserving the Laravel site's public URLs, Kelp UI presentation, feeds, sitemap, pagination, category archives, and legacy post redirects.

## Overview

The site contains four content types:

| Type | Source | Published URL |
| --- | --- | --- |
| Posts | `src/content/posts/*.md` | `/blog/{slug}/` |
| Notes | `src/content/notes/*.md` | `/notes/{slug}/` |
| Pages | `src/content/pages/*.md` | `/{slug}/` |
| Categories | `src/content/categories/*.md` | `/category/{slug}/` |

Directory data files translate content fields such as `published_at`, `category_id`, and `draft` into Eleventy dates, collections, and permalinks. Pages can use Eleventy's native `layout` frontmatter when they need presentation beyond the standard page layout.

The frontend is a direct Nunjucks translation of the original Blade views. It loads Kelp UI v1 from its CDN, uses Inclusive Sans, and retains the original utility classes, sizes, spacing, colours, and inline SVGs. Pages containing fenced code blocks load Prism and its Twilight theme from cdnjs; Prism's autoloader fetches only the language grammars required by that page.

## Information architecture

### Primary routes

| Route | Purpose |
| --- | --- |
| `/` | Homepage content and five most recent posts |
| `/blog/` | Paginated post archive |
| `/blog/page/{number}/` | Additional post archive pages |
| `/blog/{slug}/` | Individual post |
| `/notes/` | Paginated notes archive |
| `/notes/page/{number}/` | Additional notes archive pages |
| `/notes/{slug}/` | Individual note |
| `/category/{slug}/` | Posts belonging to a category |
| `/{page}/` | Standalone content page |
| `/resume/` | Resume using its dedicated, headerless layout |

Legacy `/posts` and `/posts/{slug}` paths are represented by static redirect pages and hosting rules that point to their `/blog` equivalents.

### Feeds and discovery

Posts and notes each provide RSS, Atom, and JSON feeds at the original extensionless routes:

- `/feed/posts/rss`
- `/feed/posts/atom`
- `/feed/posts/json`
- `/feed/notes/rss`
- `/feed/notes/atom`
- `/feed/notes/json`

The build also generates `/sitemap.xml` and copies `robots.txt`, `_redirects`, and `_headers` into the output directory. `_headers` supplies the appropriate content types for extensionless feeds on hosts that support this convention.

### Drafts

Pages with `draft: true` remain in `src/content/pages` but are excluded from collections and generated output. The clean step removes the entire previous output directory before every build so an older published file cannot survive after its source becomes a draft.

### Project structure

```text
.
├── eleventy.config.js        # Collections, filters, global data and build configuration
├── scripts/
│   └── clean-output.js       # Guarded removal of the generated _site directory
├── src/
│   ├── _data/                # Global build data
│   ├── _includes/            # Shared Nunjucks fragments and inline SVG markup
│   ├── _layouts/             # Base, post, note, page and resume layouts
│   ├── assets/               # Static assets copied into the build
│   ├── content/              # Posts, notes, pages and categories in Markdown
│   ├── blog.njk              # Paginated post archive
│   ├── notes.njk             # Paginated notes archive
│   ├── categories.njk        # Category archive generator
│   ├── index.njk             # Homepage
│   ├── feed-*.njk            # RSS, Atom and JSON feed templates
│   └── sitemap.njk           # XML sitemap template
├── tests/
│   └── site.test.js          # Generated-site checks
└── _site/                    # Generated output; never edit directly
```

## Getting started

### Requirements

- Node.js 22 or newer (22.22.3 is pinned in `.nvmrc`)
- npm

Install dependencies:

```bash
npm install
```

Start the Eleventy development server with file watching:

```bash
npm run dev
```

Eleventy prints the local preview URL when the server starts. It normally uses `http://localhost:8080`, or the next available port if that port is occupied.

Create a production build:

```bash
npm run build
```

The command cleans `_site` and then writes the complete static site there.

## Working with content

Add or edit Markdown in the relevant `src/content` directory. Posts, notes, pages, and categories all use the same filename format:

```text
{slug}.md
```

Post ordering comes from `published_at` frontmatter, while note ordering comes from `created_at`. Filenames do not participate in chronological ordering.

Bare `http://` and `https://` URLs in Markdown content are automatically rendered as clickable links. Use normal Markdown link syntax when the displayed text should differ from the URL.

Useful frontmatter fields include:

- Posts: `title`, `published_at`, `category_id`, `created_at`, `updated_at`, and `metadata`.
- Notes: `title`, optional external `link`, `created_at`, and `updated_at`.
- Pages: `title`, `layout`, `draft`, `updated_at`, and `metadata`.
- Categories: `id`, `title`, and `metadata`.

Set `draft: true` on a page to keep its source without publishing it. Pages use `page.njk` by default. The résumé selects `resume.njk`, while the Now page selects `now.njk` to add its original Kelp callout beneath the page content.

Content images live in `src/assets/images` and use site-root-relative Markdown paths:

```markdown
![Alternative text](/assets/images/example.webp)
```

Give every content image concise alternative text that communicates its purpose in the surrounding article. Content images are stored as WebP files. Eleventy copies them unchanged to `_site/assets/images` during each build, so content does not depend on the former `assets.philstephens.com` bucket or require image processing during deployment.

## Testing

Run the complete build and test suite:

```bash
npm test
```

The tests build from a clean output directory and verify that:

- every migrated post, note, and category route is generated;
- key pages and all six feed files exist;
- draft pages are not published;
- content image references are local and every source image is copied into the build;
- site-level Nunjucks variables are fully rendered;
- internal links resolve to generated files, apart from explicitly recorded historical links whose source targets no longer exist.

For an additional XML check when `xmllint` is available:

```bash
for file in \
  _site/feed/posts/rss \
  _site/feed/posts/atom \
  _site/feed/notes/rss \
  _site/feed/notes/atom \
  _site/sitemap.xml
do
  xmllint --noout "$file"
done
```

Do not run a second standalone build while `npm run dev` is actively rebuilding the same `_site` directory. Stop the development server before running `npm test` or `npm run build`.
