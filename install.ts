import puppeteer from "./mod.ts";
import { PUPPETEER_REVISIONS } from "./vendor/puppeteer-core/puppeteer/revisions.js";
import ProgressBar from "https://deno.land/x/progress@v1.1.4/mod.ts";

/** Logging verbosity. */
export type LogLevel = "default" | "minimal";

/**
 * Options to use when downloading.
 */
export interface InstallOptions {
  /** Print log messages. */
  enableLog?: boolean;
  /** Which logs to print. */
  logLevel?: LogLevel;
  /** Browser to install. */
  product?: "chrome" | "firefox";
  /** Chrome or Firefox version to install. */
  revision?: string;
}

const DEFAULT_OPTIONS: InstallOptions = {
  enableLog: true,
  logLevel: "default",
  product: "chrome",
};

/**
 * Install and cache a suitable browser to use for puppeteer.
 *
 * @param options Install options.
 */
export async function installPuppeteer(
  options: InstallOptions = DEFAULT_OPTIONS,
) {
  const logLevel = options.logLevel || "default";
  let product = Deno.env.get("PUPPETEER_PRODUCT") || options.product;
  if (product != "chrome" && product != "firefox") {
    if (product != undefined && options.enableLog && logLevel === "default") {
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

  const revisionInfo = fetcher.revisionInfo(revision);
  if (revisionInfo.local) {
    if (options.enableLog && logLevel === "default") {
      console.log(`Already downloaded at ${revisionInfo.executablePath}`);
    }
  } else {
    if (options.enableLog && logLevel === "minimal") {
      console.log(`Downloading ${product}`);
    }

    let progressBar: ProgressBar;
    const newRevisionInfo = await fetcher.download(
      revisionInfo.revision,
      (current, total) => {
        if (!options.enableLog || (options.enableLog && logLevel === "minimal")) {
          return;
        }
        if (!progressBar) {
          progressBar = new ProgressBar({
            total,
          });
        }
        if (!(progressBar as any).isCompleted) {
          progressBar.render(current);
        } else if (options.enableLog && logLevel === "default") {
          console.log("Done downloading. Installing now.");
        }
      },
    );
    if (options.enableLog && logLevel === "default") {
      console.log(
        `Downloaded ${newRevisionInfo.product} ${newRevisionInfo.revision} to ${newRevisionInfo.executablePath} from ${newRevisionInfo.url}`,
      );
    }
  }
}

if (import.meta.main) {
  await installPuppeteer();
  Deno.exit(0);
}
