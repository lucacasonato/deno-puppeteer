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
import { CDPSession } from "./Connection.js";
import { Protocol } from "../../vendor/devtools-protocol/types/protocol.d.ts";
import { CommonEventEmitter } from "./EventEmitter.js";
export declare const debugError: (...args: unknown[]) => void;
declare function getExceptionMessage(
  exceptionDetails: Protocol.Runtime.ExceptionDetails,
): string;
declare function valueFromRemoteObject(
  remoteObject: Protocol.Runtime.RemoteObject,
): any;
declare function releaseObject(
  client: CDPSession,
  remoteObject: Protocol.Runtime.RemoteObject,
): Promise<void>;
/**
 * @public
 */
export interface PuppeteerEventListener {
  emitter: CommonEventEmitter;
  eventName: string | symbol;
  handler: (...args: any[]) => void;
}
declare function addEventListener(
  emitter: CommonEventEmitter,
  eventName: string | symbol,
  handler: (...args: any[]) => void,
): PuppeteerEventListener;
declare function removeEventListeners(
  listeners: Array<{
    emitter: CommonEventEmitter;
    eventName: string | symbol;
    handler: (...args: any[]) => void;
  }>,
): void;
declare function isString(obj: unknown): obj is string;
declare function isNumber(obj: unknown): obj is number;
declare function waitForEvent<T>(
  emitter: CommonEventEmitter,
  eventName: string | symbol,
  predicate: (event: T) => Promise<boolean> | boolean,
  timeout: number,
  abortPromise: Promise<Error>,
): Promise<T>;
declare function evaluationString(
  fun: Function | string,
  ...args: unknown[]
): string;
declare function pageBindingInitString(type: string, name: string): string;
declare function pageBindingDeliverResultString(
  name: string,
  seq: number,
  result: unknown,
): string;
declare function pageBindingDeliverErrorString(
  name: string,
  seq: number,
  message: string,
  stack: string,
): string;
declare function pageBindingDeliverErrorValueString(
  name: string,
  seq: number,
  value: unknown,
): string;
declare function makePredicateString(
  predicate: Function,
  predicateQueryHandler?: Function,
): string;
declare function waitWithTimeout<T>(
  promise: Promise<T>,
  taskName: string,
  timeout: number,
): Promise<T>;
declare function getReadableStreamAsUint8Array(
  readableStream: ReadableStream,
  path?: string,
): Promise<Uint8Array | null>;
declare function getReadableStreamFromProtocolStream(
  client: CDPSession,
  handle: string,
): Promise<ReadableStream>;
export declare const helper: {
  evaluationString: typeof evaluationString;
  pageBindingInitString: typeof pageBindingInitString;
  pageBindingDeliverResultString: typeof pageBindingDeliverResultString;
  pageBindingDeliverErrorString: typeof pageBindingDeliverErrorString;
  pageBindingDeliverErrorValueString: typeof pageBindingDeliverErrorValueString;
  makePredicateString: typeof makePredicateString;
  getReadableStreamAsUint8Array: typeof getReadableStreamAsUint8Array;
  getReadableStreamFromProtocolStream: typeof getReadableStreamFromProtocolStream;
  waitWithTimeout: typeof waitWithTimeout;
  waitForEvent: typeof waitForEvent;
  isString: typeof isString;
  isNumber: typeof isNumber;
  addEventListener: typeof addEventListener;
  removeEventListeners: typeof removeEventListeners;
  valueFromRemoteObject: typeof valueFromRemoteObject;
  getExceptionMessage: typeof getExceptionMessage;
  releaseObject: typeof releaseObject;
};
export {};
