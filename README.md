# Skier ⛷️

The simplest static site generator there is!

## Why?

Static site generators of today are all so complex! What if you just want to be able to take a bunch of HTML and CSS, and generate a site from them? With things like partials, variable setting, and asset copying and that's it?

What if you then want to extend the functionality for your own purposes, but without it being needlessly difficult?

Then gather speed going downhill with skier, and create a static site with the minimum of fuss, ready to deploy... anywhere!

## What does Skier do?

Out the box, skier enables you to:

 - Define pages and partials in HTML with [Mustache templating](https://github.com/janl/mustache.js)
 - Define styles in CSS
 - Define variables for use in pages, generated via JS or TS
 - Have a collection of assets (ie images, scripts)
 - Define your own processes to happen when building
 - Generate a static site combining all of these together

With extensions, skier can additionally:

(🚧 denotes extension in development, not yet available)

 - Define styles in SASS 🚧
 - Generate repeating pages, like articles for a blog in HTML or Markdown 🚧
 - Generate an RSS feed 🚧
 - Generate a sitemap 🚧
 - Generate a changelog 🚧
 - Enable webmentions 🚧
 - Generate favicons 🚧
 - Generate social sharing metadata 🚧

## How does it do it?

With plain ol' TypeScript (transpiled to JavaScript). Nothing crazy, fancy, or complicated.

## What will Skier never do?

Anything vaguely complex - for that, define your own process to extend its functionality. That could be things like smart image generation (lazy loading, webp conversion etc), or actual interaction functionality.

## Why use Skier?

If you want to keep life (and your website) simple. You just want to write some HTML and CSS, and have a website that's easy to maintain.

## How to use Skier?

See the [examples](/examples), or the docs (coming soon). It all starts with a `skier.config.js`, though.
