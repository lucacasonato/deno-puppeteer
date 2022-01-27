import puppeteer from "../mod.ts";
import {
  ensureDir,
  ensureDirSync,
} from "https://deno.land/std@0.122.0/fs/mod.ts";


const browser = await puppeteer.launch({
    // You can browse `chrome://version/` in chrome, and find `executableFilePath`
    executablePath: "/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome",
    headless: false,
    args: ["--start-maximized",],
});
const page = await browser.newPage();
await page.goto("https://example.com");

const outputFile = "./tmp/test.png";
ensureDir("./tmp"); 
await page.screenshot({ path: outputFile });
console.log("screenshot file:", outputFile);

await browser.close();
