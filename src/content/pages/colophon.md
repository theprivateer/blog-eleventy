---
title: Colophon
draft: false
created_at: 2026-01-05T14:39:05+10:00
updated_at: 2026-08-07T22:48:17+10:00
metadata:
    title: null
    description: 'A static Eleventy site built from Markdown, styled with Kelp UI and deployed to Cloudflare Workers & Pages.'
---

This site is built with [Eleventy](https://www.11ty.dev), a lightweight static site generator.

Posts, notes, pages and categories are plain Markdown files stored alongside the site code. Eleventy combines them with a small collection of Nunjucks layouts to generate the complete site, including archives, pagination, feeds and the sitemap.

There is no database, runtime CMS or separate asset store. Content images live in the same repository as WebP files and are copied directly into the generated site.

The frontend uses the [Kelp](https://kelpui.com) HTML-first UI library and [Inclusive Sans](https://fonts.google.com/specimen/Inclusive+Sans). Pages containing code samples load [Prism](https://prismjs.com) with its Twilight theme; other pages do not load the syntax-highlighting assets.

Each commit produces a directory of static HTML and assets, which is built and deployed by [Cloudflare Workers & Pages](https://pages.cloudflare.com). The domain is registered through GoDaddy, with DNS managed by Cloudflare.

This site has [no tracking](https://themarkup.org/blacklight?location=eu&device=desktop&force=false&url=philstephens.com) and uses [less than 0.01g](https://www.websitecarbon.com/website/philstephens-com/) of CO<sub>2</sub> per visit.
