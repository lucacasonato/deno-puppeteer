/** @internal */
export declare const source =
  '"use strict";\nvar __defProp = Object.defineProperty;\nvar __getOwnPropDesc = Object.getOwnPropertyDescriptor;\nvar __getOwnPropNames = Object.getOwnPropertyNames;\nvar __hasOwnProp = Object.prototype.hasOwnProperty;\nvar __export = (target, all) => {\n  for (var name in all)\n    __defProp(target, name, { get: all[name], enumerable: true });\n};\nvar __copyProps = (to, from, except, desc) => {\n  if (from && typeof from === "object" || typeof from === "function") {\n    for (let key of __getOwnPropNames(from))\n      if (!__hasOwnProp.call(to, key) && key !== except)\n        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });\n  }\n  return to;\n};\nvar __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);\nvar __accessCheck = (obj, member, msg) => {\n  if (!member.has(obj))\n    throw TypeError("Cannot " + msg);\n};\nvar __privateGet = (obj, member, getter) => {\n  __accessCheck(obj, member, "read from private field");\n  return getter ? getter.call(obj) : member.get(obj);\n};\nvar __privateAdd = (obj, member, value) => {\n  if (member.has(obj))\n    throw TypeError("Cannot add the same private member more than once");\n  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);\n};\nvar __privateSet = (obj, member, value, setter) => {\n  __accessCheck(obj, member, "write to private field");\n  setter ? setter.call(obj, value) : member.set(obj, value);\n  return value;\n};\n\n// src/injected/injected.ts\nvar injected_exports = {};\n__export(injected_exports, {\n  IntervalPoller: () => IntervalPoller,\n  MutationPoller: () => MutationPoller,\n  RAFPoller: () => RAFPoller\n});\nmodule.exports = __toCommonJS(injected_exports);\n\n// src/common/Errors.ts\nvar CustomError = class extends Error {\n  constructor(message) {\n    super(message);\n    this.name = this.constructor.name;\n    Error.captureStackTrace(this, this.constructor);\n  }\n};\nvar TimeoutError = class extends CustomError {\n};\nvar ProtocolError = class extends CustomError {\n  constructor() {\n    super(...arguments);\n    this.originalMessage = "";\n  }\n};\nvar errors = Object.freeze({\n  TimeoutError,\n  ProtocolError\n});\n\n// src/util/DeferredPromise.ts\nfunction createDeferredPromise() {\n  let isResolved = false;\n  let isRejected = false;\n  let resolver = (_) => {\n  };\n  let rejector = (_) => {\n  };\n  const taskPromise = new Promise((resolve, reject) => {\n    resolver = resolve;\n    rejector = reject;\n  });\n  return Object.assign(taskPromise, {\n    resolved: () => {\n      return isResolved;\n    },\n    finished: () => {\n      return isResolved || isRejected;\n    },\n    resolve: (value) => {\n      isResolved = true;\n      resolver(value);\n    },\n    reject: (err) => {\n      isRejected = true;\n      rejector(err);\n    }\n  });\n}\n\n// src/util/assert.ts\nvar assert = (value, message) => {\n  if (!value) {\n    throw new Error(message);\n  }\n};\n\n// src/injected/Poller.ts\nvar _fn, _root, _observer, _promise;\nvar MutationPoller = class {\n  constructor(fn, root) {\n    __privateAdd(this, _fn, void 0);\n    __privateAdd(this, _root, void 0);\n    __privateAdd(this, _observer, void 0);\n    __privateAdd(this, _promise, void 0);\n    __privateSet(this, _fn, fn);\n    __privateSet(this, _root, root);\n  }\n  async start() {\n    const promise = __privateSet(this, _promise, createDeferredPromise());\n    const result = await __privateGet(this, _fn).call(this);\n    if (result) {\n      promise.resolve(result);\n      return result;\n    }\n    __privateSet(this, _observer, new MutationObserver(async () => {\n      const result2 = await __privateGet(this, _fn).call(this);\n      if (!result2) {\n        return;\n      }\n      promise.resolve(result2);\n      await this.stop();\n    }));\n    __privateGet(this, _observer).observe(__privateGet(this, _root), {\n      childList: true,\n      subtree: true,\n      attributes: true\n    });\n    return __privateGet(this, _promise);\n  }\n  async stop() {\n    assert(__privateGet(this, _promise), "Polling never started.");\n    if (!__privateGet(this, _promise).finished()) {\n      __privateGet(this, _promise).reject(new Error("Polling stopped"));\n    }\n    if (__privateGet(this, _observer)) {\n      __privateGet(this, _observer).disconnect();\n    }\n  }\n  result() {\n    assert(__privateGet(this, _promise), "Polling never started.");\n    return __privateGet(this, _promise);\n  }\n};\n_fn = new WeakMap();\n_root = new WeakMap();\n_observer = new WeakMap();\n_promise = new WeakMap();\nvar _fn2, _promise2;\nvar RAFPoller = class {\n  constructor(fn) {\n    __privateAdd(this, _fn2, void 0);\n    __privateAdd(this, _promise2, void 0);\n    __privateSet(this, _fn2, fn);\n  }\n  async start() {\n    const promise = __privateSet(this, _promise2, createDeferredPromise());\n    const result = await __privateGet(this, _fn2).call(this);\n    if (result) {\n      promise.resolve(result);\n      return result;\n    }\n    const poll = async () => {\n      if (promise.finished()) {\n        return;\n      }\n      const result2 = await __privateGet(this, _fn2).call(this);\n      if (!result2) {\n        window.requestAnimationFrame(poll);\n        return;\n      }\n      promise.resolve(result2);\n      await this.stop();\n    };\n    window.requestAnimationFrame(poll);\n    return __privateGet(this, _promise2);\n  }\n  async stop() {\n    assert(__privateGet(this, _promise2), "Polling never started.");\n    if (!__privateGet(this, _promise2).finished()) {\n      __privateGet(this, _promise2).reject(new Error("Polling stopped"));\n    }\n  }\n  result() {\n    assert(__privateGet(this, _promise2), "Polling never started.");\n    return __privateGet(this, _promise2);\n  }\n};\n_fn2 = new WeakMap();\n_promise2 = new WeakMap();\nvar _fn3, _ms, _interval, _promise3;\nvar IntervalPoller = class {\n  constructor(fn, ms) {\n    __privateAdd(this, _fn3, void 0);\n    __privateAdd(this, _ms, void 0);\n    __privateAdd(this, _interval, void 0);\n    __privateAdd(this, _promise3, void 0);\n    __privateSet(this, _fn3, fn);\n    __privateSet(this, _ms, ms);\n  }\n  async start() {\n    const promise = __privateSet(this, _promise3, createDeferredPromise());\n    const result = await __privateGet(this, _fn3).call(this);\n    if (result) {\n      promise.resolve(result);\n      return result;\n    }\n    __privateSet(this, _interval, setInterval(async () => {\n      const result2 = await __privateGet(this, _fn3).call(this);\n      if (!result2) {\n        return;\n      }\n      promise.resolve(result2);\n      await this.stop();\n    }, __privateGet(this, _ms)));\n    return __privateGet(this, _promise3);\n  }\n  async stop() {\n    assert(__privateGet(this, _promise3), "Polling never started.");\n    if (!__privateGet(this, _promise3).finished()) {\n      __privateGet(this, _promise3).reject(new Error("Polling stopped"));\n    }\n    if (__privateGet(this, _interval)) {\n      clearInterval(__privateGet(this, _interval));\n    }\n  }\n  result() {\n    assert(__privateGet(this, _promise3), "Polling never started.");\n    return __privateGet(this, _promise3);\n  }\n};\n_fn3 = new WeakMap();\n_ms = new WeakMap();\n_interval = new WeakMap();\n_promise3 = new WeakMap();\n';
