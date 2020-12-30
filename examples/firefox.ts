import puppeteer from "../mod.ts";

const browser = await puppeteer.launch({ product: "firefox", headless: false });
const page = await browser.newPage();
await page.goto("https://example.com");
await page.screenshot({ path: "example.png" });

await browser.close();
