# deno-puppeteer

<img src="./logo.png" height="200" align="right">

###### [API](https://github.com/puppeteer/puppeteer/blob/v9.0.2/docs/api.md)

A fork of [Puppeteer](https://pptr.dev/) running on Deno.

> Puppeteer is a library which provides a high-level API to control Chrome,
> Chromium, or Firefox Nightly over the DevTools Protocol. Puppeteer runs
> headless by default, but can be configured to run full (non-headless) Chrome
> or Chromium.

Most things that you can do manually in the browser can be done using Puppeteer!
Here are a few examples to get you started:

- Generate screenshots and PDFs of pages.
- Crawl a SPA (Single-Page Application) and generate pre-rendered content (i.e.
  "SSR" (Server-Side Rendering)).
- Automate form submission, UI testing, keyboard input, etc.
- Create an up-to-date, automated testing environment. Run your tests directly
  in the latest version of Chrome using the latest JavaScript and browser
  features.
- Capture a timeline trace of your site to help diagnose performance issues.
- Test Chrome Extensions.

## Getting Started

### Installation

To use Puppeteer, import it like so:

```ts
import puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";
```

Puppeteer can use any recent version of Chromium or Firefox Nightly, but this
version of Puppeteer is only validated against a specific version. To cache
these versions in the Puppeteer cache, run the commands below.

```shell
PUPPETEER_PRODUCT=chrome deno run -A --unstable https://deno.land/x/puppeteer@9.0.2/install.ts
PUPPETEER_PRODUCT=firefox deno run -A --unstable https://deno.land/x/puppeteer@9.0.2/install.ts
```

You can find all of the supported environment variables to customize
installation
[in the Puppeteer docs](https://pptr.dev/#?product=Puppeteer&version=v5.5.0&show=api-environment-variables).

## Examples
See examples: https://github.com/lucacasonato/deno-puppeteer/tree/main/examples 

## FAQ

### How does deno-puppeteer compare to the Node version?

`deno-puppeteer` effectively runs a regular version of Puppeteer, except for
some minor changes to make it compatible with Deno.

The most noticable difference is likely that instead of some methods taking /
returning Node `Buffer`, they take / return `Uint8Array`.

Other than this, the documentation on https://pptr.dev generally applies.

### How to run in Docker?

An example Dockerfile can be found in this repository. It will install all
necessary dependencies, and shows how to run the ./examples/docker.js.

It is just meant as a jumping off point - customize it as you wish.
