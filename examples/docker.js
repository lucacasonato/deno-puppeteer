import puppeteer from "../mod.ts";

const browser = await puppeteer.launch({
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
  ],
});
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
