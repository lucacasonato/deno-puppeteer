import puppeteer from "./mod.ts";
import { PUPPETEER_REVISIONS } from "./vendor/puppeteer-core/puppeteer/revisions.js";
import ProgressBar from "https://deno.land/x/progress@v1.1.4/mod.ts";

let product = Deno.env.get("PUPPETEER_PRODUCT");
if (product != "chrome" && product != "firefox") {
  if (product != undefined) {
    console.warn(`Unknown product '${product}', falling back to 'chrome'.`);
  }
  product = "chrome";
}
const fetcher = puppeteer.createBrowserFetcher({ product });
let revision;
if (product == "chrome") {
  revision = Deno.env.get("PUPPETEER_CHROMIUM_REVISION") ||
    PUPPETEER_REVISIONS.chromium;
} else if (product == "firefox") {
  puppeteer._preferredRevision = PUPPETEER_REVISIONS.firefox;
  const req = await fetch(
    "https://product-details.mozilla.org/1.0/firefox_versions.json",
  );
  const versions = await req.json();
  revision = versions.FIREFOX_NIGHTLY;
  if (!versions.FIREFOX_NIGHTLY) {
    throw new Error("Firefox version not found");
  }
}

const revisionInfo = fetcher.revisionInfo(revision);
if (revisionInfo.local) {
  console.log(`Already downloaded at ${revisionInfo.executablePath}`);
} else {
  let progressBar: ProgressBar;
  const newRevisionInfo = await fetcher.download(
    revisionInfo.revision,
    (current, total) => {
      if (!progressBar) {
        progressBar = new ProgressBar({
          total,
        });
      }
      if (!(progressBar as any).isCompleted) {
        progressBar.render(current);
      } else {
        console.log("Done downloading. Installing now.");
      }
    },
  );
  console.log(
    `Downloaded ${newRevisionInfo.product} ${newRevisionInfo.revision} to ${newRevisionInfo.executablePath} from ${newRevisionInfo.url}`,
  );
}
