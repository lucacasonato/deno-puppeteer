import { PuppeteerDeno } from "./deno/Puppeteer.ts";
import { PUPPETEER_REVISIONS } from "./revisions.js";
import { Product } from "./common/Product.js";

export const initializePuppeteerDeno = (): PuppeteerDeno => {
  const puppeteerRootDirectory = Deno.cwd();

  const preferredRevision = PUPPETEER_REVISIONS.chromium;

  return new PuppeteerDeno({
    projectRoot: puppeteerRootDirectory,
    preferredRevision,
    isPuppeteerCore: true,
    productName: undefined,
  });
};
