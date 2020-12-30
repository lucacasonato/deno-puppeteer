import puppeteer from "../mod.ts";

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto("https://news.ycombinator.com", { waitUntil: "networkidle2" });
await page.pdf({ path: "hn.pdf", format: "a4" });

await browser.close();
