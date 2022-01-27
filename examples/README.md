# Examples
> For more examples, see https://github.com/lucacasonato/deno-puppeteer/tree/main/examples 

Puppeteer will be familiar to people using other browser testing frameworks. You
create an instance of `Browser`, open pages, and then manipulate them with
Puppeteer's API.

## Launch browser
Puppeteer could launch not only **existed install browser** on you os or **cached browser**

### Specify existed browser
**If you want to use existed browser**. 
For example, to use local chrome on Mac OSX, specify `executablePath` like this:

```js
import puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";

const browser = await puppeteer.launch({
    // You can browse `chrome://version/` in chrome, and find `executableFilePath`
    // Refer to: https://stackoverflow.com/questions/59786319
    executablePath: "/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome",
});
```

### Specify cached browser
To use cached browser like chrome
``` 
PUPPETEER_PRODUCT=chrome deno run -A --unstable any.ts
```

If you havn't installed cached browser, install it like this:

```shell
PUPPETEER_PRODUCT=chrome deno run -A --unstable https://deno.land/x/puppeteer@9.0.2/install.ts
PUPPETEER_PRODUCT=firefox deno run -A --unstable https://deno.land/x/puppeteer@9.0.2/install.ts
```


## Screenshot

**Example** - navigating to https://example.com and saving a screenshot as
_example.png_:

Save file as **example.js**

```js
import puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto("https://example.com");
await page.screenshot({ path: "example.png" });

await browser.close();
```

Execute script on the command line

```bash
deno run -A --unstable example.js
```

## Create a PDF
Puppeteer sets an initial page size to 800×600px, which defines the screenshot
size. The page size can be customized with
[`Page.setViewport()`](https://github.com/puppeteer/puppeteer/blob/v5.5.0/docs/api.md#pagesetviewportviewport).

**Example** - create a PDF.

Save file as **hn.js**

```js
import puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto("https://news.ycombinator.com", {
  waitUntil: "networkidle2",
});
await page.pdf({ path: "hn.pdf", format: "A4" });

await browser.close();
```

Execute script on the command line

```bash
deno run -A --unstable hn.js
```

See
[`Page.pdf()`](https://github.com/puppeteer/puppeteer/blob/v5.5.0/docs/api.md#pagepdfoptions)
for more information about creating pdfs.


## Evaluate browser script 
**Example** - evaluate script in the context of the page

Save file as **get-dimensions.js**

```js
import puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto("https://example.com");

// Get the "viewport" of the page, as reported by the page.
const dimensions = await page.evaluate(() => {
  return {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
    deviceScaleFactor: window.devicePixelRatio,
  };
});

console.log("Dimensions:", dimensions);

await browser.close();
```

Execute script on the command line

```bash
deno run -A --unstable get-dimensions.js
```
