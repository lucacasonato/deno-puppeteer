import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.82.0/testing/asserts.ts";
import puppeteer, { Browser } from "./mod.ts";

function browserTest(
  name: string,
  fn: (browser: Browser) => void | Promise<void>
) {
  Deno.test(name, async () => {
    let browser: Browser | undefined = undefined;
    try {
      browser = await puppeteer.launch();
      await fn(browser);
    } finally {
      if (browser) await browser.close();
    }
  });
}

browserTest("hello world", async (browser) => {
  const page = await browser.newPage();
  await page.goto("https://example.com", { waitUntil: "domcontentloaded" });
  const h1 = await page.$("h1");
  assert(h1);
  assertEquals(await h1.evaluate((e: any) => e.innerText), "Example Domain");
});
