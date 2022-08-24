/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Browser } from "../../vendor/puppeteer-core/puppeteer/common/Browser.js";
import { BrowserRunner } from "./BrowserRunner.ts";
import { ChromeArgOptions, LaunchOptions } from "./LaunchOptions.ts";
import { BrowserConnectOptions } from "../../vendor/puppeteer-core/puppeteer/common/BrowserConnector.js";
import { Product } from "../../vendor/puppeteer-core/puppeteer/common/Product.js";
import {
  existsSync,
  pathJoin,
  pathResolve,
} from "../../vendor/puppeteer-core/vendor/std.ts";
import { BrowserFetcher } from "./BrowserFetcher.ts";

/**
 * Describes a launcher - a class that is able to create and launch a browser instance.
 * @public
 */
export interface ProductLauncher {
  launch(object: LaunchOptions & BrowserConnectOptions): Promise<Browser>;
  executablePath: () => string;
  defaultArgs(object: {}): string[];
  product: Product;
}

/**
 * @internal
 */
class ChromeLauncher implements ProductLauncher {
  _preferredRevision: string;

  constructor(preferredRevision: string) {
    this._preferredRevision = preferredRevision;
  }

  async launch(
    options: LaunchOptions & ChromeArgOptions & BrowserConnectOptions = {},
  ): Promise<Browser> {
    const {
      ignoreDefaultArgs = false,
      args = [],
      executablePath = null,
      env = Deno.env.toObject(),
      ignoreHTTPSErrors = false,
      defaultViewport = { width: 800, height: 600 },
      slowMo = 0,
      timeout = 30000,
      dumpio = false,
    } = options;

    const profilePath = pathJoin(
      await Deno.makeTempDir(),
      "puppeteer_dev_chrome_profile-",
    );
    await Deno.mkdir(profilePath, { recursive: true });
    const chromeArguments = [];
    if (!ignoreDefaultArgs) chromeArguments.push(...this.defaultArgs(options));
    else if (Array.isArray(ignoreDefaultArgs)) {
      chromeArguments.push(
        ...this.defaultArgs(options).filter(
          (arg) => !ignoreDefaultArgs.includes(arg),
        ),
      );
    } else chromeArguments.push(...args);

    let temporaryUserDataDir = undefined;

    if (
      !chromeArguments.some((argument) =>
        argument.startsWith("--remote-debugging-")
      )
    ) {
      chromeArguments.push("--remote-debugging-port=0");
    }
    if (!chromeArguments.some((arg) => arg.startsWith("--user-data-dir"))) {
      temporaryUserDataDir = await Deno.makeTempDir({ dir: profilePath });
      chromeArguments.push(`--user-data-dir=${temporaryUserDataDir}`);
    }

    let chromeExecutable = executablePath;
    if ((Deno.build.arch as string) === "arm64") {
      chromeExecutable = "/usr/bin/chromium-browser";
    } else if (!executablePath) {
      const { missingText, executablePath } = await resolveExecutablePath(this);
      if (missingText) throw new Error(missingText);
      chromeExecutable = executablePath;
    }

    const runner = new BrowserRunner(
      chromeExecutable!,
      chromeArguments,
      temporaryUserDataDir,
    );
    runner.start({
      env,
      dumpio,
    });

    try {
      const connection = await runner.setupConnection({
        timeout,
        slowMo,
        preferredRevision: this._preferredRevision,
      });
      const browser = await Browser._create(
        "chrome",
        connection,
        [],
        ignoreHTTPSErrors,
        defaultViewport,
        runner.proc,
        runner.close.bind(runner),
      );
      await browser.waitForTarget((t) => t.type() === "page");
      return browser;
    } catch (error) {
      runner.kill();
      throw error;
    }
  }

  /**
   * @param {!Launcher.ChromeArgOptions=} options
   * @returns {!Array<string>}
   */
  defaultArgs(options: ChromeArgOptions = {}): string[] {
    const chromeArguments = [
      "--disable-background-networking",
      "--enable-features=NetworkService,NetworkServiceInProcess",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-breakpad",
      "--disable-client-side-phishing-detection",
      "--disable-component-extensions-with-background-pages",
      "--disable-default-apps",
      "--disable-dev-shm-usage",
      "--disable-extensions",
      "--disable-features=Translate",
      "--disable-hang-monitor",
      "--disable-ipc-flooding-protection",
      "--disable-popup-blocking",
      "--disable-prompt-on-repost",
      "--disable-renderer-backgrounding",
      "--disable-sync",
      "--force-color-profile=srgb",
      "--metrics-recording-only",
      "--no-first-run",
      "--enable-automation",
      "--password-store=basic",
      "--use-mock-keychain",
      // TODO(sadym): remove '--enable-blink-features=IdleDetection'
      // once IdleDetection is turned on by default.
      "--enable-blink-features=IdleDetection",
    ];
    const {
      devtools = false,
      headless = !devtools,
      args = [],
      userDataDir = null,
    } = options;
    if (userDataDir) {
      chromeArguments.push(`--user-data-dir=${pathResolve(userDataDir)}`);
    }
    if (devtools) chromeArguments.push("--auto-open-devtools-for-tabs");
    if (headless) {
      chromeArguments.push("--headless", "--hide-scrollbars", "--mute-audio");
    }
    if (args.every((arg) => arg.startsWith("-"))) {
      chromeArguments.push("about:blank");
    }
    chromeArguments.push(...args);
    return chromeArguments;
  }

  executablePath(): string {
    return resolveExecutablePath(this).executablePath;
  }

  get product(): Product {
    return "chrome";
  }
}

/**
 * @internal
 */
class FirefoxLauncher implements ProductLauncher {
  _preferredRevision: string;

  constructor(preferredRevision: string) {
    this._preferredRevision = preferredRevision;
  }

  async launch(
    options:
      & LaunchOptions
      & ChromeArgOptions
      & BrowserConnectOptions
      & {
        extraPrefsFirefox?: { [x: string]: unknown };
      } = {},
  ): Promise<Browser> {
    const {
      ignoreDefaultArgs = false,
      args = [],
      executablePath = null,
      env = Deno.env.toObject(),
      ignoreHTTPSErrors = false,
      defaultViewport = { width: 800, height: 600 },
      slowMo = 0,
      timeout = 30000,
      extraPrefsFirefox = {},
    } = options;

    const firefoxArguments = [];
    if (!ignoreDefaultArgs) firefoxArguments.push(...this.defaultArgs(options));
    else if (Array.isArray(ignoreDefaultArgs)) {
      firefoxArguments.push(
        ...this.defaultArgs(options).filter(
          (arg) => !ignoreDefaultArgs.includes(arg),
        ),
      );
    } else firefoxArguments.push(...args);

    if (
      !firefoxArguments.some((argument) =>
        argument.startsWith("--remote-debugging-")
      )
    ) {
      firefoxArguments.push("--remote-debugging-port=0");
    }

    let temporaryUserDataDir = undefined;

    if (
      !firefoxArguments.includes("-profile") &&
      !firefoxArguments.includes("--profile")
    ) {
      temporaryUserDataDir = await this._createProfile(extraPrefsFirefox);
      firefoxArguments.push("--profile");
      firefoxArguments.push(temporaryUserDataDir);
    }

    await this._updateRevision();
    let firefoxExecutable = executablePath;
    if (!executablePath) {
      const { missingText, executablePath } = resolveExecutablePath(this);
      if (missingText) throw new Error(missingText);
      firefoxExecutable = executablePath;
    }

    const runner = new BrowserRunner(
      firefoxExecutable!,
      firefoxArguments,
      temporaryUserDataDir,
    );
    runner.start({
      env,
    });

    try {
      const connection = await runner.setupConnection({
        timeout,
        slowMo,
        preferredRevision: this._preferredRevision,
      });
      const browser = await Browser._create(
        "firefox",
        connection,
        [],
        ignoreHTTPSErrors,
        defaultViewport,
        runner.proc,
        runner.close.bind(runner),
      );
      await browser.waitForTarget((t) => t.type() === "page");
      return browser;
    } catch (error) {
      runner.kill();
      throw error;
    }
  }

  executablePath(): string {
    return resolveExecutablePath(this).executablePath;
  }

  async _updateRevision(): Promise<void> {
    // replace 'latest' placeholder with actual downloaded revision
    if (this._preferredRevision === "latest") {
      const browserFetcher = new BrowserFetcher({
        product: this.product,
      });
      const localRevisions = await browserFetcher.localRevisions();
      if (localRevisions[0]) this._preferredRevision = localRevisions[0];
    }
  }

  get product(): Product {
    return "firefox";
  }

  defaultArgs(options: ChromeArgOptions = {}): string[] {
    const firefoxArguments = ["--no-remote", "--foreground"];
    if (Deno.build.os == "windows") {
      firefoxArguments.push("--wait-for-browser");
    }
    const {
      devtools = false,
      headless = !devtools,
      args = [],
      userDataDir = null,
    } = options;
    if (userDataDir) {
      firefoxArguments.push("--profile");
      firefoxArguments.push(userDataDir);
    }
    if (headless) firefoxArguments.push("--headless");
    if (devtools) firefoxArguments.push("--devtools");
    if (args.every((arg) => arg.startsWith("-"))) {
      firefoxArguments.push("about:blank");
    }
    firefoxArguments.push(...args);
    return firefoxArguments;
  }

  async _createProfile(extraPrefs: { [x: string]: unknown }): Promise<string> {
    const profilePath = pathJoin(
      await Deno.makeTempDir(),
      "puppeteer_dev_firefox_profile-",
    );
    await Deno.mkdir(profilePath, { recursive: true });
    const prefsJS: string[] = [];
    const userJS = [];
    const server = "dummy.test";
    const defaultPreferences = {
      // Make sure Shield doesn't hit the network.
      "app.normandy.api_url": "",
      // Disable Firefox old build background check
      "app.update.checkInstallTime": false,
      // Disable automatically upgrading Firefox
      "app.update.disabledForTesting": true,

      // Increase the APZ content response timeout to 1 minute
      "apz.content_response_timeout": 60000,

      // Prevent various error message on the console
      // jest-puppeteer asserts that no error message is emitted by the console
      "browser.contentblocking.features.standard":
        "-tp,tpPrivate,cookieBehavior0,-cm,-fp",

      // Enable the dump function: which sends messages to the system
      // console
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1543115
      "browser.dom.window.dump.enabled": true,
      // Disable topstories
      "browser.newtabpage.activity-stream.feeds.system.topstories": false,
      // Always display a blank page
      "browser.newtabpage.enabled": false,
      // Background thumbnails in particular cause grief: and disabling
      // thumbnails in general cannot hurt
      "browser.pagethumbnails.capturing_disabled": true,

      // Disable safebrowsing components.
      "browser.safebrowsing.blockedURIs.enabled": false,
      "browser.safebrowsing.downloads.enabled": false,
      "browser.safebrowsing.malware.enabled": false,
      "browser.safebrowsing.passwords.enabled": false,
      "browser.safebrowsing.phishing.enabled": false,

      // Disable updates to search engines.
      "browser.search.update": false,
      // Do not restore the last open set of tabs if the browser has crashed
      "browser.sessionstore.resume_from_crash": false,
      // Skip check for default browser on startup
      "browser.shell.checkDefaultBrowser": false,

      // Disable newtabpage
      "browser.startup.homepage": "about:blank",
      // Do not redirect user when a milstone upgrade of Firefox is detected
      "browser.startup.homepage_override.mstone": "ignore",
      // Start with a blank page about:blank
      "browser.startup.page": 0,

      // Do not allow background tabs to be zombified on Android: otherwise for
      // tests that open additional tabs: the test harness tab itself might get
      // unloaded
      "browser.tabs.disableBackgroundZombification": false,
      // Do not warn when closing all other open tabs
      "browser.tabs.warnOnCloseOtherTabs": false,
      // Do not warn when multiple tabs will be opened
      "browser.tabs.warnOnOpen": false,

      // Disable the UI tour.
      "browser.uitour.enabled": false,
      // Turn off search suggestions in the location bar so as not to trigger
      // network connections.
      "browser.urlbar.suggest.searches": false,
      // Disable first run splash page on Windows 10
      "browser.usedOnWindows10.introURL": "",
      // Do not warn on quitting Firefox
      "browser.warnOnQuit": false,

      // Defensively disable data reporting systems
      "datareporting.healthreport.documentServerURI":
        `http://${server}/dummy/healthreport/`,
      "datareporting.healthreport.logging.consoleEnabled": false,
      "datareporting.healthreport.service.enabled": false,
      "datareporting.healthreport.service.firstRun": false,
      "datareporting.healthreport.uploadEnabled": false,

      // Do not show datareporting policy notifications which can interfere with tests
      "datareporting.policy.dataSubmissionEnabled": false,
      "datareporting.policy.dataSubmissionPolicyBypassNotification": true,

      // DevTools JSONViewer sometimes fails to load dependencies with its require.js.
      // This doesn't affect Puppeteer but spams console (Bug 1424372)
      "devtools.jsonview.enabled": false,

      // Disable popup-blocker
      "dom.disable_open_during_load": false,

      // Enable the support for File object creation in the content process
      // Required for |Page.setFileInputFiles| protocol method.
      "dom.file.createInChild": true,

      // Disable the ProcessHangMonitor
      "dom.ipc.reportProcessHangs": false,

      // Disable slow script dialogues
      "dom.max_chrome_script_run_time": 0,
      "dom.max_script_run_time": 0,

      // Only load extensions from the application and user profile
      // AddonManager.SCOPE_PROFILE + AddonManager.SCOPE_APPLICATION
      "extensions.autoDisableScopes": 0,
      "extensions.enabledScopes": 5,

      // Disable metadata caching for installed add-ons by default
      "extensions.getAddons.cache.enabled": false,

      // Disable installing any distribution extensions or add-ons.
      "extensions.installDistroAddons": false,

      // Disabled screenshots extension
      "extensions.screenshots.disabled": true,

      // Turn off extension updates so they do not bother tests
      "extensions.update.enabled": false,

      // Turn off extension updates so they do not bother tests
      "extensions.update.notifyUser": false,

      // Make sure opening about:addons will not hit the network
      "extensions.webservice.discoverURL":
        `http://${server}/dummy/discoveryURL`,

      // Force disable Fission until the Remote Agent is compatible
      "fission.autostart": false,

      // Allow the application to have focus even it runs in the background
      "focusmanager.testmode": true,
      // Disable useragent updates
      "general.useragent.updates.enabled": false,
      // Always use network provider for geolocation tests so we bypass the
      // macOS dialog raised by the corelocation provider
      "geo.provider.testing": true,
      // Do not scan Wifi
      "geo.wifi.scan": false,
      // No hang monitor
      "hangmonitor.timeout": 0,
      // Show chrome errors and warnings in the error console
      "javascript.options.showInConsole": true,

      // Disable download and usage of OpenH264: and Widevine plugins
      "media.gmp-manager.updateEnabled": false,
      // Prevent various error message on the console
      // jest-puppeteer asserts that no error message is emitted by the console
      "network.cookie.cookieBehavior": 0,

      // Do not prompt for temporary redirects
      "network.http.prompt-temp-redirect": false,

      // Disable speculative connections so they are not reported as leaking
      // when they are hanging around
      "network.http.speculative-parallel-limit": 0,

      // Do not automatically switch between offline and online
      "network.manage-offline-status": false,

      // Make sure SNTP requests do not hit the network
      "network.sntp.pools": server,

      // Disable Flash.
      "plugin.state.flash": 0,

      "privacy.trackingprotection.enabled": false,

      // Enable Remote Agent
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1544393
      "remote.enabled": true,

      // Don't do network connections for mitm priming
      "security.certerrors.mitm.priming.enabled": false,
      // Local documents have access to all other local documents,
      // including directory listings
      "security.fileuri.strict_origin_policy": false,
      // Do not wait for the notification button security delay
      "security.notification_enable_delay": 0,

      // Ensure blocklist updates do not hit the network
      "services.settings.server": `http://${server}/dummy/blocklist/`,

      // Do not automatically fill sign-in forms with known usernames and
      // passwords
      "signon.autofillForms": false,
      // Disable password capture, so that tests that include forms are not
      // influenced by the presence of the persistent doorhanger notification
      "signon.rememberSignons": false,

      // Disable first-run welcome page
      "startup.homepage_welcome_url": "about:blank",

      // Disable first-run welcome page
      "startup.homepage_welcome_url.additional": "",

      // Disable browser animations (tabs, fullscreen, sliding alerts)
      "toolkit.cosmeticAnimations.enabled": false,

      // Prevent starting into safe mode after application crashes
      "toolkit.startup.max_resumed_crashes": -1,
    };

    Object.assign(defaultPreferences, extraPrefs);
    for (const [key, value] of Object.entries(defaultPreferences)) {
      userJS.push(
        `user_pref(${JSON.stringify(key)}, ${JSON.stringify(value)});`,
      );
    }
    await Deno.writeTextFile(
      pathJoin(profilePath, "user.js"),
      userJS.join("\n"),
    );
    await Deno.writeTextFile(
      pathJoin(profilePath, "prefs.js"),
      prefsJS.join("\n"),
    );
    return profilePath;
  }
}

function resolveExecutablePath(
  launcher: ChromeLauncher | FirefoxLauncher,
): { executablePath: string; missingText?: string } {
  const executablePath = Deno.env.get("PUPPETEER_EXECUTABLE_PATH");
  if (executablePath) {
    const missingText = !existsSync(executablePath)
      ? "Tried to use PUPPETEER_EXECUTABLE_PATH env variable to launch browser but did not find any executable at: " +
        executablePath
      : undefined;
    return { executablePath, missingText };
  }
  const downloadPath = Deno.env.get("PUPPETEER_DOWNLOAD_PATH");
  const browserFetcher = new BrowserFetcher({
    product: launcher.product,
    path: downloadPath,
  });
  if (launcher.product === "chrome") {
    const revision = Deno.env.get("PUPPETEER_CHROMIUM_REVISION");
    if (revision) {
      const revisionInfo = browserFetcher.revisionInfo(revision);
      const missingText = !revisionInfo.local
        ? "Tried to use PUPPETEER_CHROMIUM_REVISION env variable to launch browser but did not find executable at: " +
          revisionInfo.executablePath
        : undefined;
      return { executablePath: revisionInfo.executablePath, missingText };
    }
  }

  const revisionInfo = browserFetcher.revisionInfo(launcher._preferredRevision);
  const missingText = !revisionInfo.local
    ? `Could not find browser revision ${launcher._preferredRevision}. Run "PUPPETEER_PRODUCT=${launcher.product} deno run -A --unstable ${new URL(
      "../../vendor/puppeteer-core/puppeteer/../../../install.ts",
      import.meta.url,
    )}" to download a supported browser binary.`
    : undefined;
  return { executablePath: revisionInfo.executablePath, missingText };
}

/**
 * @internal
 */
export default function Launcher(
  preferredRevision: string,
  product?: string,
): ProductLauncher {
  // puppeteer-core doesn't take into account PUPPETEER_* env variables.
  if (!product) product = Deno.env.get("PUPPETEER_PRODUCT");
  switch (product) {
    case "firefox":
      return new FirefoxLauncher(preferredRevision);
    case "chrome":
    default:
      if (typeof product !== "undefined" && product !== "chrome") {
        /* The user gave us an incorrect product name
         * we'll default to launching Chrome, but log to the console
         * to let the user know (they've probably typoed).
         */
        console.warn(
          `Warning: unknown product name ${product}. Falling back to chrome.`,
        );
      }
      return new ChromeLauncher(preferredRevision);
  }
}
