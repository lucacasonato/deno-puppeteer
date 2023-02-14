/// <reference types="./puppeteer-core.d.ts" />
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
import { initializePuppeteer } from "./initializePuppeteer.js";
export * from "./common/NetworkConditions.js";
export * from "./common/QueryHandler.js";
export * from "./common/DeviceDescriptors.js";
export * from "./common/Errors.js";
const puppeteer = initializePuppeteer("puppeteer-core");
export const {
  connect,
  createBrowserFetcher,
  defaultArgs,
  executablePath,
  launch,
} = puppeteer;
export default puppeteer;
//# sourceMappingURL=puppeteer-core.js.map
