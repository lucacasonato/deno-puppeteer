import puppeteer from "./mod.ts";
import { PUPPETEER_REVISIONS } from "./vendor/puppeteer-core/puppeteer/revisions.js";
import { InstallOptions } from "./install.ts";

const DEFAULT_OPTIONS: InstallOptions = {
  enableLog: true,
  product: "chrome",
};

/**
 * Remove a cached revision.
 *
 * @param options Uninstall options.
 */
export async function uninstallPuppeteer(
  options: InstallOptions = DEFAULT_OPTIONS,
) {
  let product = Deno.env.get("PUPPETEER_PRODUCT") || options.product;
  if (product != "chrome" && product != "firefox") {
    if (product != undefined && options.enableLog) {
      console.warn(`Unknown product '${product}', falling back to 'chrome'.`);
    }
    product = "chrome";
  }
  const fetcher = puppeteer.createBrowserFetcher({ product });
  let revision;
  if (product == "chrome") {
    revision = Deno.env.get("PUPPETEER_CHROMIUM_REVISION") ||
      options.revision ||
      PUPPETEER_REVISIONS.chromium;
  } else if (product == "firefox") {
    puppeteer._preferredRevision = options.revision ||
      PUPPETEER_REVISIONS.firefox;
    const req = await fetch(
      "https://product-details.mozilla.org/1.0/firefox_versions.json",
    );
    const versions = await req.json();
    revision = versions.FIREFOX_NIGHTLY;
    if (!versions.FIREFOX_NIGHTLY) {
      throw new Error("Firefox version not found");
    }
  }

  await fetcher.remove(revision);
}

if (import.meta.main) {
  await uninstallPuppeteer();
}
