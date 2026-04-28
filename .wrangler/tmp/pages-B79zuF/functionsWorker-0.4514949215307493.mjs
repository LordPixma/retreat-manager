var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// ../.wrangler/tmp/bundle-kiG2rO/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
var init_strip_cf_connecting_ip_header = __esm({
  "../.wrangler/tmp/bundle-kiG2rO/strip-cf-connecting-ip-header.js"() {
    "use strict";
    __name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        return Reflect.apply(target, thisArg, [
          stripCfConnectingIPHeader.apply(null, argArray)
        ]);
      }
    });
  }
});

// ../node_modules/unenv/dist/runtime/_internal/utils.mjs
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
var init_utils = __esm({
  "../node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
    __name(notImplementedClass, "notImplementedClass");
  }
});

// ../node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance;
var init_performance = __esm({
  "../node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
      name: "node",
      entryType: "node",
      startTime: 0,
      duration: 0,
      nodeStart: 0,
      v8Start: 0,
      bootstrapComplete: 0,
      environment: 0,
      loopStart: 0,
      loopExit: 0,
      idleTime: 0,
      uvMetricsInfo: {
        loopCount: 0,
        events: 0,
        eventsWaiting: 0
      },
      detail: void 0,
      toJSON() {
        return this;
      }
    };
    PerformanceEntry = class {
      __unenv__ = true;
      detail;
      entryType = "event";
      name;
      startTime;
      constructor(name, options) {
        this.name = name;
        this.startTime = options?.startTime || _performanceNow();
        this.detail = options?.detail;
      }
      get duration() {
        return _performanceNow() - this.startTime;
      }
      toJSON() {
        return {
          name: this.name,
          entryType: this.entryType,
          startTime: this.startTime,
          duration: this.duration,
          detail: this.detail
        };
      }
    };
    __name(PerformanceEntry, "PerformanceEntry");
    PerformanceMark = /* @__PURE__ */ __name(class PerformanceMark2 extends PerformanceEntry {
      entryType = "mark";
      constructor() {
        super(...arguments);
      }
      get duration() {
        return 0;
      }
    }, "PerformanceMark");
    PerformanceMeasure = class extends PerformanceEntry {
      entryType = "measure";
    };
    __name(PerformanceMeasure, "PerformanceMeasure");
    PerformanceResourceTiming = class extends PerformanceEntry {
      entryType = "resource";
      serverTiming = [];
      connectEnd = 0;
      connectStart = 0;
      decodedBodySize = 0;
      domainLookupEnd = 0;
      domainLookupStart = 0;
      encodedBodySize = 0;
      fetchStart = 0;
      initiatorType = "";
      name = "";
      nextHopProtocol = "";
      redirectEnd = 0;
      redirectStart = 0;
      requestStart = 0;
      responseEnd = 0;
      responseStart = 0;
      secureConnectionStart = 0;
      startTime = 0;
      transferSize = 0;
      workerStart = 0;
      responseStatus = 0;
    };
    __name(PerformanceResourceTiming, "PerformanceResourceTiming");
    PerformanceObserverEntryList = class {
      __unenv__ = true;
      getEntries() {
        return [];
      }
      getEntriesByName(_name, _type) {
        return [];
      }
      getEntriesByType(type) {
        return [];
      }
    };
    __name(PerformanceObserverEntryList, "PerformanceObserverEntryList");
    Performance = class {
      __unenv__ = true;
      timeOrigin = _timeOrigin;
      eventCounts = /* @__PURE__ */ new Map();
      _entries = [];
      _resourceTimingBufferSize = 0;
      navigation = void 0;
      timing = void 0;
      timerify(_fn, _options) {
        throw createNotImplementedError("Performance.timerify");
      }
      get nodeTiming() {
        return nodeTiming;
      }
      eventLoopUtilization() {
        return {};
      }
      markResourceTiming() {
        return new PerformanceResourceTiming("");
      }
      onresourcetimingbufferfull = null;
      now() {
        if (this.timeOrigin === _timeOrigin) {
          return _performanceNow();
        }
        return Date.now() - this.timeOrigin;
      }
      clearMarks(markName) {
        this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type) {
        return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
      }
      getEntriesByType(type) {
        return this._entries.filter((e) => e.entryType === type);
      }
      mark(name, options) {
        const entry = new PerformanceMark(name, options);
        this._entries.push(entry);
        return entry;
      }
      measure(measureName, startOrMeasureOptions, endMark) {
        let start;
        let end;
        if (typeof startOrMeasureOptions === "string") {
          start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
          end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
        } else {
          start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
          end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
        }
        const entry = new PerformanceMeasure(measureName, {
          startTime: start,
          detail: {
            start,
            end
          }
        });
        this._entries.push(entry);
        return entry;
      }
      setResourceTimingBufferSize(maxSize) {
        this._resourceTimingBufferSize = maxSize;
      }
      addEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.addEventListener");
      }
      removeEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.removeEventListener");
      }
      dispatchEvent(event) {
        throw createNotImplementedError("Performance.dispatchEvent");
      }
      toJSON() {
        return this;
      }
    };
    __name(Performance, "Performance");
    PerformanceObserver = class {
      __unenv__ = true;
      _callback = null;
      constructor(callback) {
        this._callback = callback;
      }
      takeRecords() {
        return [];
      }
      disconnect() {
        throw createNotImplementedError("PerformanceObserver.disconnect");
      }
      observe(options) {
        throw createNotImplementedError("PerformanceObserver.observe");
      }
      bind(fn) {
        return fn;
      }
      runInAsyncScope(fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      asyncId() {
        return 0;
      }
      triggerAsyncId() {
        return 0;
      }
      emitDestroy() {
        return this;
      }
    };
    __name(PerformanceObserver, "PerformanceObserver");
    __publicField(PerformanceObserver, "supportedEntryTypes", []);
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});

// ../node_modules/unenv/dist/runtime/node/perf_hooks.mjs
var init_perf_hooks = __esm({
  "../node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_performance();
  }
});

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
var init_performance2 = __esm({
  "../node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    globalThis.performance = performance;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});

// ../node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default;
var init_noop = __esm({
  "../node_modules/unenv/dist/runtime/mock/noop.mjs"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
  }
});

// ../node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";
var _console, _ignoreErrors, _stderr, _stdout, log, info, trace, debug, table, error, warn, createTask, clear, count, countReset, dir, dirxml, group, groupEnd, groupCollapsed, profile, profileEnd, time, timeEnd, timeLog, timeStamp, Console, _times, _stdoutErrorHandler, _stderrErrorHandler;
var init_console = __esm({
  "../node_modules/unenv/dist/runtime/node/console.mjs"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_noop();
    init_utils();
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable();
    _stdout = new Writable();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
    _times = /* @__PURE__ */ new Map();
    _stdoutErrorHandler = noop_default;
    _stderrErrorHandler = noop_default;
  }
});

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole, assert, clear2, context, count2, countReset2, createTask2, debug2, dir2, dirxml2, error2, group2, groupCollapsed2, groupEnd2, info2, log2, profile2, profileEnd2, table2, time2, timeEnd2, timeLog2, timeStamp2, trace2, warn2, console_default;
var init_console2 = __esm({
  "../node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_console();
    workerdConsole = globalThis["console"];
    ({
      assert,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask2
      ),
      debug: debug2,
      dir: dir2,
      dirxml: dirxml2,
      error: error2,
      group: group2,
      groupCollapsed: groupCollapsed2,
      groupEnd: groupEnd2,
      info: info2,
      log: log2,
      profile: profile2,
      profileEnd: profileEnd2,
      table: table2,
      time: time2,
      timeEnd: timeEnd2,
      timeLog: timeLog2,
      timeStamp: timeStamp2,
      trace: trace2,
      warn: warn2
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler,
      _stdout,
      _stdoutErrorHandler,
      _times
    });
    console_default = workerdConsole;
  }
});

// ../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console = __esm({
  "../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console"() {
    init_console2();
    globalThis.console = console_default;
  }
});

// ../node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime;
var init_hrtime = __esm({
  "../node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
      const now = Date.now();
      const seconds = Math.trunc(now / 1e3);
      const nanos = now % 1e3 * 1e6;
      if (startTime) {
        let diffSeconds = seconds - startTime[0];
        let diffNanos = nanos - startTime[0];
        if (diffNanos < 0) {
          diffSeconds = diffSeconds - 1;
          diffNanos = 1e9 + diffNanos;
        }
        return [diffSeconds, diffNanos];
      }
      return [seconds, nanos];
    }, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
      return BigInt(Date.now() * 1e6);
    }, "bigint") });
  }
});

// ../node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
import { Socket } from "node:net";
var ReadStream;
var init_read_stream = __esm({
  "../node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ReadStream = class extends Socket {
      fd;
      constructor(fd) {
        super();
        this.fd = fd;
      }
      isRaw = false;
      setRawMode(mode) {
        this.isRaw = mode;
        return this;
      }
      isTTY = false;
    };
    __name(ReadStream, "ReadStream");
  }
});

// ../node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
import { Socket as Socket2 } from "node:net";
var WriteStream;
var init_write_stream = __esm({
  "../node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WriteStream = class extends Socket2 {
      fd;
      constructor(fd) {
        super();
        this.fd = fd;
      }
      clearLine(dir3, callback) {
        callback && callback();
        return false;
      }
      clearScreenDown(callback) {
        callback && callback();
        return false;
      }
      cursorTo(x, y, callback) {
        callback && typeof callback === "function" && callback();
        return false;
      }
      moveCursor(dx, dy, callback) {
        callback && callback();
        return false;
      }
      getColorDepth(env2) {
        return 1;
      }
      hasColors(count3, env2) {
        return false;
      }
      getWindowSize() {
        return [this.columns, this.rows];
      }
      columns = 80;
      rows = 24;
      isTTY = false;
    };
    __name(WriteStream, "WriteStream");
  }
});

// ../node_modules/unenv/dist/runtime/node/tty.mjs
var init_tty = __esm({
  "../node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});

// ../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";
var Process;
var init_process = __esm({
  "../node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tty();
    init_utils();
    Process = class extends EventEmitter {
      env;
      hrtime;
      nextTick;
      constructor(impl) {
        super();
        this.env = impl.env;
        this.hrtime = impl.hrtime;
        this.nextTick = impl.nextTick;
        for (const prop of [...Object.getOwnPropertyNames(Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
          const value = this[prop];
          if (typeof value === "function") {
            this[prop] = value.bind(this);
          }
        }
      }
      emitWarning(warning, type, code) {
        console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
      }
      emit(...args) {
        return super.emit(...args);
      }
      listeners(eventName) {
        return super.listeners(eventName);
      }
      #stdin;
      #stdout;
      #stderr;
      get stdin() {
        return this.#stdin ??= new ReadStream(0);
      }
      get stdout() {
        return this.#stdout ??= new WriteStream(1);
      }
      get stderr() {
        return this.#stderr ??= new WriteStream(2);
      }
      #cwd = "/";
      chdir(cwd2) {
        this.#cwd = cwd2;
      }
      cwd() {
        return this.#cwd;
      }
      arch = "";
      platform = "";
      argv = [];
      argv0 = "";
      execArgv = [];
      execPath = "";
      title = "";
      pid = 200;
      ppid = 100;
      get version() {
        return "";
      }
      get versions() {
        return {};
      }
      get allowedNodeEnvironmentFlags() {
        return /* @__PURE__ */ new Set();
      }
      get sourceMapsEnabled() {
        return false;
      }
      get debugPort() {
        return 0;
      }
      get throwDeprecation() {
        return false;
      }
      get traceDeprecation() {
        return false;
      }
      get features() {
        return {};
      }
      get release() {
        return {};
      }
      get connected() {
        return false;
      }
      get config() {
        return {};
      }
      get moduleLoadList() {
        return [];
      }
      constrainedMemory() {
        return 0;
      }
      availableMemory() {
        return 0;
      }
      uptime() {
        return 0;
      }
      resourceUsage() {
        return {};
      }
      ref() {
      }
      unref() {
      }
      umask() {
        throw createNotImplementedError("process.umask");
      }
      getBuiltinModule() {
        return void 0;
      }
      getActiveResourcesInfo() {
        throw createNotImplementedError("process.getActiveResourcesInfo");
      }
      exit() {
        throw createNotImplementedError("process.exit");
      }
      reallyExit() {
        throw createNotImplementedError("process.reallyExit");
      }
      kill() {
        throw createNotImplementedError("process.kill");
      }
      abort() {
        throw createNotImplementedError("process.abort");
      }
      dlopen() {
        throw createNotImplementedError("process.dlopen");
      }
      setSourceMapsEnabled() {
        throw createNotImplementedError("process.setSourceMapsEnabled");
      }
      loadEnvFile() {
        throw createNotImplementedError("process.loadEnvFile");
      }
      disconnect() {
        throw createNotImplementedError("process.disconnect");
      }
      cpuUsage() {
        throw createNotImplementedError("process.cpuUsage");
      }
      setUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
      }
      hasUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
      }
      initgroups() {
        throw createNotImplementedError("process.initgroups");
      }
      openStdin() {
        throw createNotImplementedError("process.openStdin");
      }
      assert() {
        throw createNotImplementedError("process.assert");
      }
      binding() {
        throw createNotImplementedError("process.binding");
      }
      permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
      report = {
        directory: "",
        filename: "",
        signal: "SIGUSR2",
        compact: false,
        reportOnFatalError: false,
        reportOnSignal: false,
        reportOnUncaughtException: false,
        getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
        writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
      };
      finalization = {
        register: /* @__PURE__ */ notImplemented("process.finalization.register"),
        unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
        registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
      };
      memoryUsage = Object.assign(() => ({
        arrayBuffers: 0,
        rss: 0,
        external: 0,
        heapTotal: 0,
        heapUsed: 0
      }), { rss: () => 0 });
      mainModule = void 0;
      domain = void 0;
      send = void 0;
      exitCode = void 0;
      channel = void 0;
      getegid = void 0;
      geteuid = void 0;
      getgid = void 0;
      getgroups = void 0;
      getuid = void 0;
      setegid = void 0;
      seteuid = void 0;
      setgid = void 0;
      setgroups = void 0;
      setuid = void 0;
      _events = void 0;
      _eventsCount = void 0;
      _exiting = void 0;
      _maxListeners = void 0;
      _debugEnd = void 0;
      _debugProcess = void 0;
      _fatalException = void 0;
      _getActiveHandles = void 0;
      _getActiveRequests = void 0;
      _kill = void 0;
      _preload_modules = void 0;
      _rawDebug = void 0;
      _startProfilerIdleNotifier = void 0;
      _stopProfilerIdleNotifier = void 0;
      _tickCallback = void 0;
      _disconnect = void 0;
      _handleQueue = void 0;
      _pendingMessage = void 0;
      _channel = void 0;
      _send = void 0;
      _linkedBinding = void 0;
    };
    __name(Process, "Process");
  }
});

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess, getBuiltinModule, exit, platform, nextTick, unenvProcess, abort, addListener, allowedNodeEnvironmentFlags, hasUncaughtExceptionCaptureCallback, setUncaughtExceptionCaptureCallback, loadEnvFile, sourceMapsEnabled, arch, argv, argv0, chdir, config, connected, constrainedMemory, availableMemory, cpuUsage, cwd, debugPort, dlopen, disconnect, emit, emitWarning, env, eventNames, execArgv, execPath, finalization, features, getActiveResourcesInfo, getMaxListeners, hrtime3, kill, listeners, listenerCount, memoryUsage, on, off, once, pid, ppid, prependListener, prependOnceListener, rawListeners, release, removeAllListeners, removeListener, report, resourceUsage, setMaxListeners, setSourceMapsEnabled, stderr, stdin, stdout, title, throwDeprecation, traceDeprecation, umask, uptime, version, versions, domain, initgroups, moduleLoadList, reallyExit, openStdin, assert2, binding, send, exitCode, channel, getegid, geteuid, getgid, getgroups, getuid, setegid, seteuid, setgid, setgroups, setuid, permission, mainModule, _events, _eventsCount, _exiting, _maxListeners, _debugEnd, _debugProcess, _fatalException, _getActiveHandles, _getActiveRequests, _kill, _preload_modules, _rawDebug, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, _disconnect, _handleQueue, _pendingMessage, _channel, _send, _linkedBinding, _process, process_default;
var init_process2 = __esm({
  "../node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    ({ exit, platform, nextTick } = getBuiltinModule(
      "node:process"
    ));
    unenvProcess = new Process({
      env: globalProcess.env,
      hrtime,
      nextTick
    });
    ({
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      finalization,
      features,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      on,
      off,
      once,
      pid,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert: assert2,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    } = unenvProcess);
    _process = {
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exit,
      finalization,
      features,
      getBuiltinModule,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      nextTick,
      on,
      off,
      once,
      pid,
      platform,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      // @ts-expect-error old API
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert: assert2,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    };
    process_default = _process;
  }
});

// ../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});

// _shared/auth.ts
function bufferToHex(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hexToBuffer(hex) {
  const matches = hex.match(/.{1,2}/g);
  if (!matches)
    return new Uint8Array(0);
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
}
function generateRandomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}
async function hashPassword(password) {
  const salt = generateRandomBytes(SALT_LENGTH);
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    HASH_LENGTH * 8
  );
  const saltHex = bufferToHex(salt);
  const hashHex = bufferToHex(derivedBits);
  return `$pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}
async function verifyPassword(password, storedHash) {
  if (storedHash.startsWith("$pbkdf2$")) {
    const parts = storedHash.split("$");
    if (parts.length !== 5)
      return false;
    const iterations = parseInt(parts[2]);
    const salt = hexToBuffer(parts[3]);
    const storedHashBytes = parts[4];
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256"
      },
      keyMaterial,
      HASH_LENGTH * 8
    );
    const computedHash = bufferToHex(derivedBits);
    return timingSafeEqual(computedHash, storedHashBytes);
  }
  if (storedHash.startsWith("$retreat$")) {
    const legacyHash = await legacyHashPassword(password);
    return timingSafeEqual(legacyHash, storedHash);
  }
  return false;
}
async function legacyHashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "retreat_portal_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = bufferToHex(hashBuffer);
  return "$retreat$" + hashHex;
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length)
    return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
async function createSignedToken(payload, secret) {
  const encoder = new TextEncoder();
  const tokenPayload = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_MS
  };
  const payloadStr = JSON.stringify(tokenPayload);
  const payloadBase64 = btoa(payloadStr);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadBase64)
  );
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${payloadBase64}.${signatureBase64}`.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
async function verifySignedToken(token, secret) {
  try {
    const normalizedToken = token.replace(/-/g, "+").replace(/_/g, "/");
    const parts = normalizedToken.split(".");
    if (parts.length !== 2)
      return null;
    const [payloadBase64, signatureBase64] = parts;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const paddedSignature = signatureBase64 + "=".repeat((4 - signatureBase64.length % 4) % 4);
    const signatureBytes = Uint8Array.from(atob(paddedSignature), (c) => c.charCodeAt(0));
    const paddedPayload = payloadBase64 + "=".repeat((4 - payloadBase64.length % 4) % 4);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(paddedPayload)
    );
    if (!isValid)
      return null;
    const payloadStr = atob(paddedPayload);
    const payload = JSON.parse(payloadStr);
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
async function generateAdminToken(user, role = "admin", secret) {
  const token = await createSignedToken(
    { type: "admin", user, role },
    secret || DEFAULT_SECRET
  );
  return token;
}
async function generateAttendeeToken(ref, secret) {
  const token = await createSignedToken(
    { type: "attendee", ref },
    secret || DEFAULT_SECRET
  );
  return token;
}
async function checkAdminAuth(request, secret) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");
  if (!token)
    return null;
  const payload = await verifySignedToken(
    token,
    secret || DEFAULT_SECRET
  );
  if (!payload || payload.type !== "admin")
    return null;
  return { user: payload.user, role: payload.role };
}
async function checkAttendeeAuth(request, secret) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");
  if (!token)
    return null;
  const payload = await verifySignedToken(
    token,
    secret || DEFAULT_SECRET
  );
  if (!payload || payload.type !== "attendee")
    return null;
  return { ref: payload.ref };
}
async function checkRateLimit(db, identifier, userType) {
  const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS;
  const resetTime = Date.now() + RATE_LIMIT_WINDOW_MS;
  try {
    const { results } = await db.prepare(`
      SELECT COUNT(*) as count FROM login_attempts
      WHERE identifier = ? AND user_type = ? AND attempt_time > ? AND success = 0
    `).bind(identifier, userType, windowStart).all();
    const failedAttempts = results[0].count;
    const remainingAttempts = Math.max(0, MAX_LOGIN_ATTEMPTS - failedAttempts);
    return {
      allowed: failedAttempts < MAX_LOGIN_ATTEMPTS,
      remainingAttempts,
      resetTime
    };
  } catch {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS, resetTime };
  }
}
async function recordLoginAttempt(db, identifier, userType, success, ipAddress) {
  try {
    await db.prepare(`
      INSERT INTO login_attempts (identifier, user_type, success, ip_address, attempt_time)
      VALUES (?, ?, ?, ?, ?)
    `).bind(identifier, userType, success ? 1 : 0, ipAddress || null, Date.now()).run();
    const dayAgo = Date.now() - 24 * 60 * 60 * 1e3;
    await db.prepare(`
      DELETE FROM login_attempts WHERE attempt_time < ?
    `).bind(dayAgo).run();
  } catch {
  }
}
async function clearRateLimit(db, identifier, userType) {
  try {
    await db.prepare(`
      DELETE FROM login_attempts
      WHERE identifier = ? AND user_type = ? AND success = 0
    `).bind(identifier, userType).run();
  } catch {
  }
}
function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Cache-Control": "no-cache"
    }
  });
}
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    }
  });
}
function needsPasswordUpgrade(storedHash) {
  return storedHash.startsWith("$retreat$");
}
var PBKDF2_ITERATIONS, SALT_LENGTH, HASH_LENGTH, TOKEN_EXPIRY_MS, RATE_LIMIT_WINDOW_MS, MAX_LOGIN_ATTEMPTS, DEFAULT_SECRET;
var init_auth = __esm({
  "_shared/auth.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    PBKDF2_ITERATIONS = 1e5;
    SALT_LENGTH = 16;
    HASH_LENGTH = 32;
    TOKEN_EXPIRY_MS = 8 * 60 * 60 * 1e3;
    RATE_LIMIT_WINDOW_MS = 15 * 60 * 1e3;
    MAX_LOGIN_ATTEMPTS = 5;
    DEFAULT_SECRET = "dev-secret-change-in-production-abc123";
    __name(bufferToHex, "bufferToHex");
    __name(hexToBuffer, "hexToBuffer");
    __name(generateRandomBytes, "generateRandomBytes");
    __name(hashPassword, "hashPassword");
    __name(verifyPassword, "verifyPassword");
    __name(legacyHashPassword, "legacyHashPassword");
    __name(timingSafeEqual, "timingSafeEqual");
    __name(createSignedToken, "createSignedToken");
    __name(verifySignedToken, "verifySignedToken");
    __name(generateAdminToken, "generateAdminToken");
    __name(generateAttendeeToken, "generateAttendeeToken");
    __name(checkAdminAuth, "checkAdminAuth");
    __name(checkAttendeeAuth, "checkAttendeeAuth");
    __name(checkRateLimit, "checkRateLimit");
    __name(recordLoginAttempt, "recordLoginAttempt");
    __name(clearRateLimit, "clearRateLimit");
    __name(createResponse, "createResponse");
    __name(handleCORS, "handleCORS");
    __name(needsPasswordUpgrade, "needsPasswordUpgrade");
  }
});

// _shared/errors.ts
function createErrorResponse(errorOrCode, message, status, requestId) {
  let responseBody;
  let responseStatus;
  let reqId;
  if (errorOrCode instanceof AppError) {
    responseBody = errorOrCode.toJSON();
    responseStatus = errorOrCode.status;
    reqId = errorOrCode.requestId;
  } else {
    responseBody = {
      error: message || "An error occurred",
      code: errorOrCode,
      details: { requestId }
    };
    responseStatus = status || errorStatusMap[errorOrCode] || 500;
    reqId = requestId;
  }
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (reqId) {
    headers["X-Request-ID"] = reqId;
  }
  return new Response(JSON.stringify(responseBody), {
    status: responseStatus,
    headers
  });
}
function generateRequestId() {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`;
}
function handleError(error3, requestId) {
  if (error3 instanceof AppError) {
    if (requestId) {
      error3.requestId = requestId;
    }
    return error3;
  }
  if (error3 instanceof Error) {
    if (error3.message.includes("UNIQUE constraint failed")) {
      return errors.conflict("Resource already exists", requestId);
    }
    if (error3.message.includes("FOREIGN KEY constraint failed")) {
      return errors.badRequest("Referenced resource does not exist", requestId);
    }
    if (error3.message.includes("NOT NULL constraint failed")) {
      return errors.badRequest("Required field is missing", requestId);
    }
    return errors.internal(error3.message, requestId);
  }
  return errors.internal("An unexpected error occurred", requestId);
}
var errorStatusMap, AppError, errors;
var init_errors = __esm({
  "_shared/errors.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    errorStatusMap = {
      ["VALIDATION_ERROR" /* VALIDATION_ERROR */]: 400,
      ["BAD_REQUEST" /* BAD_REQUEST */]: 400,
      ["UNAUTHORIZED" /* UNAUTHORIZED */]: 401,
      ["FORBIDDEN" /* FORBIDDEN */]: 403,
      ["NOT_FOUND" /* NOT_FOUND */]: 404,
      ["CONFLICT" /* CONFLICT */]: 409,
      ["RATE_LIMITED" /* RATE_LIMITED */]: 429,
      ["INTERNAL_ERROR" /* INTERNAL_ERROR */]: 500,
      ["DATABASE_ERROR" /* DATABASE_ERROR */]: 500,
      ["EXTERNAL_SERVICE_ERROR" /* EXTERNAL_SERVICE_ERROR */]: 502,
      ["SERVICE_UNAVAILABLE" /* SERVICE_UNAVAILABLE */]: 503
    };
    AppError = class extends Error {
      code;
      status;
      details;
      requestId;
      constructor(code, message, details, requestId) {
        super(message);
        this.name = "AppError";
        this.code = code;
        this.status = errorStatusMap[code];
        this.details = details;
        this.requestId = requestId;
      }
      toJSON() {
        return {
          error: this.message,
          code: this.code,
          details: {
            ...this.details,
            requestId: this.requestId
          }
        };
      }
    };
    __name(AppError, "AppError");
    errors = {
      validation: (fields, requestId) => new AppError("VALIDATION_ERROR" /* VALIDATION_ERROR */, "Validation failed", { fields }, requestId),
      unauthorized: (message = "Unauthorized", requestId) => new AppError("UNAUTHORIZED" /* UNAUTHORIZED */, message, void 0, requestId),
      forbidden: (message = "Forbidden", requestId) => new AppError("FORBIDDEN" /* FORBIDDEN */, message, void 0, requestId),
      notFound: (resource, requestId) => new AppError("NOT_FOUND" /* NOT_FOUND */, `${resource} not found`, void 0, requestId),
      conflict: (message, requestId) => new AppError("CONFLICT" /* CONFLICT */, message, void 0, requestId),
      badRequest: (message, requestId) => new AppError("BAD_REQUEST" /* BAD_REQUEST */, message, void 0, requestId),
      internal: (message = "Internal server error", requestId) => new AppError("INTERNAL_ERROR" /* INTERNAL_ERROR */, message, void 0, requestId),
      database: (message = "Database error", requestId) => new AppError("DATABASE_ERROR" /* DATABASE_ERROR */, message, void 0, requestId),
      rateLimited: (retryAfter, requestId) => new AppError("RATE_LIMITED" /* RATE_LIMITED */, "Rate limit exceeded", { retryAfter }, requestId),
      externalService: (service, requestId, details) => new AppError("EXTERNAL_SERVICE_ERROR" /* EXTERNAL_SERVICE_ERROR */, details ? `${service} error: ${details}` : `${service} service error`, void 0, requestId)
    };
    __name(createErrorResponse, "createErrorResponse");
    __name(generateRequestId, "generateRequestId");
    __name(handleError, "handleError");
  }
});

// api/admin/announcements/[id]/email.ts
async function onRequestOptions() {
  return handleCORS();
}
async function onRequestPost(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const announcementId = context2.params.id;
    if (!announcementId) {
      return createErrorResponse(errors.badRequest("Announcement ID is required", requestId));
    }
    const { results: announcements } = await context2.env.DB.prepare(`
      SELECT id, title, content, type, priority, target_audience, target_groups
      FROM announcements WHERE id = ?
    `).bind(announcementId).all();
    if (announcements.length === 0) {
      return createErrorResponse(errors.notFound("Announcement", requestId));
    }
    const announcement = announcements[0];
    let query = `
      SELECT DISTINCT a.id, a.name, a.email, a.ref_number,
             r.number as room_number, g.name as group_name
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.email IS NOT NULL AND a.email != ''
    `;
    const bindings = [];
    if (announcement.target_audience === "groups" && announcement.target_groups) {
      const targetGroups = JSON.parse(announcement.target_groups);
      const placeholders = targetGroups.map(() => "?").join(",");
      query += ` AND g.name IN (${placeholders})`;
      bindings.push(...targetGroups);
    } else if (announcement.target_audience === "vip") {
      query += ` AND g.name = 'VIP Group'`;
    }
    query += ` ORDER BY a.name`;
    const { results: attendees } = await context2.env.DB.prepare(query).bind(...bindings).all();
    if (attendees.length === 0) {
      return createErrorResponse(errors.badRequest("No attendees found matching announcement criteria", requestId));
    }
    if (!context2.env.RESEND_API_KEY || !context2.env.FROM_EMAIL) {
      console.error(`[${requestId}] Email configuration missing`);
      return createErrorResponse(errors.internal("Email system not configured", requestId));
    }
    const emailResults = await sendAnnouncementEmails(context2.env, {
      announcement,
      attendees,
      adminUser: admin.user || "Admin"
    });
    await context2.env.DB.prepare(`
      UPDATE announcements
      SET email_sent = 1, email_sent_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(announcementId).run();
    return createResponse({
      success: true,
      message: `Announcement emailed to ${emailResults.successful} attendees`,
      results: emailResults
    });
  } catch (error3) {
    console.error(`[${requestId}] Error sending announcement email:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function sendAnnouncementEmails(env2, options) {
  const { announcement, attendees, adminUser } = options;
  if (!env2.RESEND_API_KEY || !env2.FROM_EMAIL) {
    throw new Error("Email service not configured");
  }
  const results = { successful: 0, failed: 0, errors: [] };
  const batchSize = 10;
  for (let i = 0; i < attendees.length; i += batchSize) {
    const batch = attendees.slice(i, i + batchSize);
    await Promise.all(batch.map(async (attendee) => {
      try {
        const emailHtml = generateAnnouncementEmailTemplate({
          attendee,
          announcement,
          adminUser
        });
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env2.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: env2.FROM_EMAIL,
            to: [attendee.email],
            subject: `${announcement.title}`,
            html: emailHtml
          })
        });
        if (response.ok) {
          results.successful++;
        } else {
          const errorText = await response.text();
          results.failed++;
          results.errors.push(`${attendee.name}: ${errorText}`);
        }
      } catch (error3) {
        results.failed++;
        results.errors.push(`${attendee.name}: ${error3 instanceof Error ? error3.message : "Unknown error"}`);
      }
    }));
    if (i + batchSize < attendees.length) {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
    }
  }
  return results;
}
function generateAnnouncementEmailTemplate(options) {
  const { attendee, announcement, adminUser } = options;
  const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const getHeaderStyle = /* @__PURE__ */ __name((type) => {
    switch (type) {
      case "urgent":
        return "background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);";
      case "event":
        return "background: linear-gradient(135deg, #059669 0%, #047857 100%);";
      case "reminder":
        return "background: linear-gradient(135deg, #d97706 0%, #b45309 100%);";
      default:
        return "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);";
    }
  }, "getHeaderStyle");
  const getIcon = /* @__PURE__ */ __name((type) => {
    switch (type) {
      case "urgent":
        return "URGENT";
      case "event":
        return "EVENT";
      case "reminder":
        return "REMINDER";
      default:
        return "ANNOUNCEMENT";
    }
  }, "getIcon");
  const getPriorityBadge2 = /* @__PURE__ */ __name((priority) => {
    if (priority >= 4) {
      return '<span style="background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 500;">HIGH PRIORITY</span>';
    } else if (priority >= 3) {
      return '<span style="background: #d97706; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 500;">MEDIUM PRIORITY</span>';
    }
    return "";
  }, "getPriorityBadge");
  const attendeeDetails = [
    attendee.room_number ? `<div>Room: ${attendee.room_number}</div>` : "",
    attendee.group_name ? `<div>Group: ${attendee.group_name}</div>` : ""
  ].filter(Boolean).join("");
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <!-- Header -->
      <div style="${getHeaderStyle(announcement.type)} color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.8rem;">${announcement.title}</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Growth and Wisdom Retreat Portal</p>
        ${getPriorityBadge2(announcement.priority)}
      </div>

      <!-- Content -->
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Greeting -->
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #1f2937; margin: 0 0 0.5rem 0;">Hello ${attendee.name},</h3>
          <p style="color: #6b7280; margin: 0; font-size: 0.9rem;">Reference: ${attendee.ref_number}</p>
        </div>

        <!-- Announcement Badge -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 1rem; margin: 1.5rem 0;">
          <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
            <span style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 500; margin-right: 0.5rem;">${getIcon(announcement.type)}</span>
            <span style="color: #6b7280; font-size: 0.85rem;">${announcement.type.toUpperCase()}</span>
          </div>
        </div>

        <!-- Message Content -->
        <div style="background: #f9fafb; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #667eea; margin: 1.5rem 0;">
          <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${announcement.content}</div>
        </div>

        <!-- Attendee Info -->
        ${attendeeDetails ? `
        <div style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin: 1.5rem 0;">
          <h4 style="margin: 0 0 0.5rem 0; color: #92400e;">Your Details</h4>
          <div style="color: #d97706; font-size: 0.9rem;">
            ${attendeeDetails}
          </div>
        </div>
        ` : ""}

        <!-- Action Button for urgent announcements -->
        ${announcement.type === "urgent" || announcement.priority >= 4 ? `
        <div style="text-align: center; margin: 2rem 0;">
          <a href="https://retreat.cloverleafchristiancentre.org"
             style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
            View Full Details
          </a>
        </div>
        ` : ""}

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem;">
          <div style="color: #6b7280; font-size: 0.875rem;">
            <div style="margin-bottom: 1rem;">
              <strong>Need Help?</strong><br>
              Email: growthandwisdom@cloverleafworld.org<br>
              Support Hours: Monday - Friday, 9AM - 5PM
            </div>

            <div style="padding: 1rem; background: #f3f4f6; border-radius: 6px; text-align: center;">
              <div><strong>Announcement by:</strong> ${adminUser}</div>
              <div><strong>Date:</strong> ${currentDate}</div>
              <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #9ca3af;">
                Growth and Wisdom Retreat Portal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
var init_email = __esm({
  "api/admin/announcements/[id]/email.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    __name(onRequestOptions, "onRequestOptions");
    __name(onRequestPost, "onRequestPost");
    __name(sendAnnouncementEmails, "sendAnnouncementEmails");
    __name(generateAnnouncementEmailTemplate, "generateAnnouncementEmailTemplate");
  }
});

// _shared/validation.ts
function validate(data, schema) {
  const errors2 = {};
  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const value = data[fieldName];
    for (const validatorFn of fieldSchema.validators) {
      const error3 = validatorFn(value, fieldName);
      if (error3) {
        errors2[fieldName] = error3;
        break;
      }
    }
  }
  return {
    valid: Object.keys(errors2).length === 0,
    errors: errors2
  };
}
var validators, attendeeCreateSchema, attendeeUpdateSchema, roomCreateSchema, roomUpdateSchema, groupCreateSchema, groupUpdateSchema, announcementCreateSchema, announcementUpdateSchema, emailSendSchema, individualEmailSchema, loginSchema, adminLoginSchema, registrationSchema;
var init_validation = __esm({
  "_shared/validation.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    validators = {
      required: (value, fieldName) => {
        if (value === void 0 || value === null || typeof value === "string" && value.trim() === "") {
          return `${fieldName} is required`;
        }
        return null;
      },
      email: (value, fieldName) => {
        if (value === void 0 || value === null || value === "") {
          return null;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value !== "string" || !emailRegex.test(value)) {
          return `${fieldName} must be a valid email address`;
        }
        return null;
      },
      minLength: (min) => (value, fieldName) => {
        if (value === void 0 || value === null || value === "") {
          return null;
        }
        if (typeof value === "string" && value.length < min) {
          return `${fieldName} must be at least ${min} characters`;
        }
        return null;
      },
      maxLength: (max) => (value, fieldName) => {
        if (value === void 0 || value === null || value === "") {
          return null;
        }
        if (typeof value === "string" && value.length > max) {
          return `${fieldName} must be at most ${max} characters`;
        }
        return null;
      },
      enum: (allowedValues) => (value, fieldName) => {
        if (value === void 0 || value === null || value === "") {
          return null;
        }
        if (!allowedValues.includes(value)) {
          return `${fieldName} must be one of: ${allowedValues.join(", ")}`;
        }
        return null;
      },
      range: (min, max) => (value, fieldName) => {
        if (value === void 0 || value === null || value === "") {
          return null;
        }
        const num = Number(value);
        if (isNaN(num) || num < min || num > max) {
          return `${fieldName} must be between ${min} and ${max}`;
        }
        return null;
      },
      integer: (value, fieldName) => {
        if (value === void 0 || value === null || value === "") {
          return null;
        }
        if (!Number.isInteger(Number(value))) {
          return `${fieldName} must be an integer`;
        }
        return null;
      },
      positiveNumber: (value, fieldName) => {
        if (value === void 0 || value === null || value === "") {
          return null;
        }
        const num = Number(value);
        if (isNaN(num) || num < 0) {
          return `${fieldName} must be a positive number`;
        }
        return null;
      },
      array: (value, fieldName) => {
        if (value === void 0 || value === null) {
          return null;
        }
        if (!Array.isArray(value)) {
          return `${fieldName} must be an array`;
        }
        return null;
      },
      nonEmptyArray: (value, fieldName) => {
        if (value === void 0 || value === null) {
          return null;
        }
        if (!Array.isArray(value) || value.length === 0) {
          return `${fieldName} must be a non-empty array`;
        }
        return null;
      },
      date: (value, fieldName) => {
        if (value === void 0 || value === null || value === "") {
          return null;
        }
        if (typeof value !== "string") {
          return `${fieldName} must be a valid date string`;
        }
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return `${fieldName} must be a valid date`;
        }
        return null;
      },
      boolean: (value, fieldName) => {
        if (value === void 0 || value === null) {
          return null;
        }
        if (typeof value !== "boolean") {
          return `${fieldName} must be a boolean`;
        }
        return null;
      }
    };
    __name(validate, "validate");
    attendeeCreateSchema = {
      name: { validators: [validators.required, validators.maxLength(255)] },
      ref_number: { validators: [validators.required, validators.maxLength(50)] },
      password: { validators: [validators.required, validators.minLength(6)] },
      email: { validators: [validators.email], optional: true },
      phone: { validators: [validators.maxLength(50)], optional: true },
      first_name: { validators: [validators.maxLength(255)], optional: true },
      last_name: { validators: [validators.maxLength(255)], optional: true },
      date_of_birth: { validators: [validators.date], optional: true },
      payment_due: { validators: [validators.positiveNumber], optional: true },
      payment_status: {
        validators: [validators.enum(["pending", "partial", "paid", "overdue"])],
        optional: true
      },
      room_id: { validators: [validators.integer], optional: true },
      group_id: { validators: [validators.integer], optional: true }
    };
    attendeeUpdateSchema = {
      name: { validators: [validators.maxLength(255)], optional: true },
      ref_number: { validators: [validators.maxLength(50)], optional: true },
      email: { validators: [validators.email], optional: true },
      phone: { validators: [validators.maxLength(50)], optional: true },
      first_name: { validators: [validators.maxLength(255)], optional: true },
      last_name: { validators: [validators.maxLength(255)], optional: true },
      date_of_birth: { validators: [validators.date], optional: true },
      payment_due: { validators: [validators.positiveNumber], optional: true },
      payment_status: {
        validators: [validators.enum(["pending", "partial", "paid", "overdue"])],
        optional: true
      },
      room_id: { validators: [validators.integer], optional: true },
      group_id: { validators: [validators.integer], optional: true },
      password: { validators: [validators.minLength(6)], optional: true }
    };
    roomCreateSchema = {
      number: { validators: [validators.required, validators.maxLength(50)] },
      description: { validators: [validators.maxLength(500)], optional: true },
      capacity: { validators: [validators.integer, validators.range(1, 100)], optional: true },
      floor: { validators: [validators.maxLength(50)], optional: true },
      room_type: {
        validators: [validators.enum(["single", "double", "suite", "family", "standard"])],
        optional: true
      }
    };
    roomUpdateSchema = {
      number: { validators: [validators.maxLength(50)], optional: true },
      description: { validators: [validators.maxLength(500)], optional: true },
      capacity: { validators: [validators.integer, validators.range(1, 100)], optional: true },
      floor: { validators: [validators.maxLength(50)], optional: true },
      room_type: {
        validators: [validators.enum(["single", "double", "suite", "family", "standard"])],
        optional: true
      }
    };
    groupCreateSchema = {
      name: { validators: [validators.required, validators.maxLength(255)] },
      description: { validators: [validators.maxLength(1e3)], optional: true },
      max_members: { validators: [validators.integer, validators.range(1, 1e3)], optional: true }
    };
    groupUpdateSchema = {
      name: { validators: [validators.maxLength(255)], optional: true },
      description: { validators: [validators.maxLength(1e3)], optional: true },
      max_members: { validators: [validators.integer, validators.range(1, 1e3)], optional: true }
    };
    announcementCreateSchema = {
      title: { validators: [validators.required, validators.maxLength(255)] },
      content: { validators: [validators.required, validators.maxLength(1e4)] },
      type: {
        validators: [validators.enum(["general", "urgent", "event", "reminder"])],
        optional: true
      },
      priority: { validators: [validators.integer, validators.range(1, 5)], optional: true },
      is_active: { validators: [validators.boolean], optional: true },
      target_audience: {
        validators: [validators.enum(["all", "vip", "groups"])],
        optional: true
      },
      target_groups: { validators: [validators.array], optional: true },
      author_name: { validators: [validators.maxLength(255)], optional: true },
      starts_at: { validators: [validators.date], optional: true },
      expires_at: { validators: [validators.date], optional: true }
    };
    announcementUpdateSchema = {
      title: { validators: [validators.maxLength(255)], optional: true },
      content: { validators: [validators.maxLength(1e4)], optional: true },
      type: {
        validators: [validators.enum(["general", "urgent", "event", "reminder"])],
        optional: true
      },
      priority: { validators: [validators.integer, validators.range(1, 5)], optional: true },
      is_active: { validators: [validators.boolean], optional: true },
      target_audience: {
        validators: [validators.enum(["all", "vip", "groups"])],
        optional: true
      },
      target_groups: { validators: [validators.array], optional: true },
      starts_at: { validators: [validators.date], optional: true },
      expires_at: { validators: [validators.date], optional: true }
    };
    emailSendSchema = {
      subject: { validators: [validators.required, validators.maxLength(255)] },
      message: { validators: [validators.required, validators.maxLength(5e4)] },
      target_audience: {
        validators: [validators.enum(["all", "vip", "groups"])],
        optional: true
      },
      target_groups: { validators: [validators.array], optional: true },
      attendee_ids: { validators: [validators.array], optional: true },
      email_type: {
        validators: [validators.enum(["announcement", "urgent", "welcome", "payment", "reminder"])],
        optional: true
      }
    };
    individualEmailSchema = {
      attendee_id: { validators: [validators.required, validators.integer] },
      subject: { validators: [validators.required, validators.maxLength(255)] },
      message: { validators: [validators.required, validators.maxLength(5e4)] },
      email_type: {
        validators: [validators.enum(["announcement", "urgent", "welcome", "payment", "reminder"])],
        optional: true
      }
    };
    loginSchema = {
      ref: { validators: [validators.required] },
      password: { validators: [validators.required] }
    };
    adminLoginSchema = {
      user: { validators: [validators.required] },
      pass: { validators: [validators.required] }
    };
    registrationSchema = {
      name: { validators: [validators.required, validators.maxLength(255)] },
      email: { validators: [validators.required, validators.email, validators.maxLength(255)] },
      phone: { validators: [validators.maxLength(50)], optional: true },
      emergency_contact: { validators: [validators.maxLength(255)], optional: true },
      dietary_requirements: { validators: [validators.maxLength(500)], optional: true },
      special_requests: { validators: [validators.maxLength(1e3)], optional: true },
      preferred_room_type: {
        validators: [validators.enum(["single", "double", "suite", "family", "standard"])],
        optional: true
      },
      payment_option: {
        validators: [validators.required, validators.enum(["full", "installments", "sponsorship"])]
      }
    };
  }
});

// api/admin/email/individual.ts
async function onRequestOptions2() {
  return handleCORS();
}
async function onRequestPost2(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const body = await context2.request.json();
    const validation = validate(body, individualEmailSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }
    const { attendee_id, subject, message, email_type } = body;
    const { results: attendees } = await context2.env.DB.prepare(`
      SELECT a.*, r.number as room_number, g.name as group_name
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.id = ?
    `).bind(attendee_id).all();
    if (attendees.length === 0) {
      return createErrorResponse(errors.notFound("Attendee", requestId));
    }
    const attendee = attendees[0];
    if (!attendee.email) {
      return createErrorResponse(errors.badRequest("Attendee does not have an email address", requestId));
    }
    if (!context2.env.RESEND_API_KEY || !context2.env.FROM_EMAIL) {
      console.error(`[${requestId}] Email configuration missing`);
      return createErrorResponse(errors.internal("Email system not configured", requestId));
    }
    const emailContent = generateEmailContent({
      attendee,
      subject,
      message,
      email_type,
      adminUser: admin.user
    });
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context2.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: context2.env.FROM_EMAIL,
        to: [attendee.email],
        subject,
        html: emailContent
      })
    });
    if (response.ok) {
      const result = await response.json();
      return createResponse({
        success: true,
        message: "Email sent successfully",
        email_id: result.id
      });
    } else {
      const errorText = await response.text();
      console.error(`[${requestId}] Resend API error:`, errorText);
      return createErrorResponse(errors.externalService("Email service", requestId));
    }
  } catch (error3) {
    console.error(`[${requestId}] Email sending error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
function generateEmailContent(options) {
  const { attendee, message, email_type, adminUser } = options;
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.8rem;">Growth and Wisdom Retreat</h1>
        ${email_type === "urgent" ? '<p style="margin: 0.5rem 0 0 0; background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 20px; display: inline-block;">URGENT MESSAGE</p>' : ""}
      </div>

      <!-- Content -->
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Personal Greeting -->
        <div style="margin-bottom: 1.5rem;">
          <h2 style="color: #1f2937; margin: 0 0 0.5rem 0;">Dear ${attendee.name},</h2>
          <p style="color: #6b7280; margin: 0;">Reference: ${attendee.ref_number}</p>
        </div>

        <!-- Message Content -->
        <div style="color: #374151; line-height: 1.6; margin-bottom: 2rem;">
          ${message.split("\n").map((paragraph) => `<p style="margin: 0 0 1rem 0;">${paragraph}</p>`).join("")}
        </div>

        <!-- Attendee Info Box -->
        <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <h3 style="color: #1f2937; margin: 0 0 0.5rem 0; font-size: 1rem;">Your Retreat Information:</h3>
          <ul style="margin: 0; padding-left: 1.2rem; color: #374151;">
            ${attendee.room_number ? `<li>Room: ${attendee.room_number}</li>` : ""}
            ${attendee.group_name ? `<li>Group: ${attendee.group_name}</li>` : ""}
            ${attendee.payment_due > 0 ? `<li>Outstanding Balance: $${attendee.payment_due.toFixed(2)}</li>` : "<li>Payment: Fully Paid</li>"}
          </ul>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem;">
          <p style="color: #6b7280; font-size: 0.875rem; margin: 0;">
            This message was sent by ${adminUser || "Retreat Administration"}.
            If you have any questions, please contact the retreat coordinators.
          </p>
        </div>
      </div>
    </div>
  `;
}
var init_individual = __esm({
  "api/admin/email/individual.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_validation();
    init_errors();
    __name(onRequestOptions2, "onRequestOptions");
    __name(onRequestPost2, "onRequestPost");
    __name(generateEmailContent, "generateEmailContent");
  }
});

// _shared/email-helpers.ts
var headerStyles, typeIcons;
var init_email_helpers = __esm({
  "_shared/email-helpers.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    headerStyles = {
      urgent: "background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);",
      welcome: "background: linear-gradient(135deg, #059669 0%, #047857 100%);",
      payment: "background: linear-gradient(135deg, #d97706 0%, #b45309 100%);",
      reminder: "background: linear-gradient(135deg, #d97706 0%, #b45309 100%);",
      announcement: "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);",
      default: "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
    };
    typeIcons = {
      urgent: "\u{1F6A8}",
      welcome: "\u{1F389}",
      payment: "\u{1F4B3}",
      reminder: "\u23F0",
      announcement: "\u{1F4E2}",
      default: "\u{1F4E7}"
    };
  }
});

// api/admin/email/notifications.ts
async function onRequestOptions3() {
  return handleCORS();
}
async function onRequestPost3(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const { notification_type, attendee_id, custom_data } = await context2.request.json();
    if (!notification_type) {
      return createErrorResponse(errors.badRequest("Notification type is required", requestId));
    }
    const result = await sendNotification(context2.env, {
      notification_type,
      attendee_id,
      custom_data,
      admin_user: admin.user || "Admin"
    });
    return createResponse(result);
  } catch (error3) {
    console.error(`[${requestId}] Error sending notification:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function sendNotification(env2, options) {
  const { notification_type, attendee_id, custom_data, admin_user } = options;
  if (!env2.RESEND_API_KEY || !env2.FROM_EMAIL) {
    throw new Error("Email service not configured");
  }
  let attendees = [];
  let emailTemplate;
  switch (notification_type) {
    case "welcome":
      attendees = await getAttendeeById(env2.DB, attendee_id);
      emailTemplate = generateWelcomeEmail(attendees[0], custom_data);
      break;
    case "payment_reminder":
      if (attendee_id) {
        attendees = await getAttendeeById(env2.DB, attendee_id);
      } else {
        attendees = await getAttendeesWithOutstandingPayments(env2.DB);
      }
      emailTemplate = generatePaymentReminderEmail(attendees[0] || null, custom_data);
      break;
    case "announcement_urgent":
      attendees = await getAttendeesByAnnouncement(env2.DB, custom_data || {});
      emailTemplate = generateAnnouncementEmail(custom_data || {}, admin_user);
      break;
    case "room_assignment":
      attendees = await getAttendeeById(env2.DB, attendee_id);
      emailTemplate = generateRoomAssignmentEmail(attendees[0], custom_data);
      break;
    case "group_assignment":
      attendees = await getAttendeeById(env2.DB, attendee_id);
      emailTemplate = generateGroupAssignmentEmail(attendees[0], custom_data);
      break;
    default:
      throw new Error("Invalid notification type");
  }
  if (attendees.length === 0) {
    return { success: false, message: "No attendees found for notification" };
  }
  const results = { successful: 0, failed: 0, errors: [] };
  for (const attendee of attendees) {
    if (!attendee.email) {
      results.failed++;
      results.errors.push(`${attendee.name}: No email address`);
      continue;
    }
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env2.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: env2.FROM_EMAIL,
          to: [attendee.email],
          subject: emailTemplate.subject,
          html: emailTemplate.html || generateGenericTemplate(emailTemplate, attendee)
        })
      });
      if (response.ok) {
        results.successful++;
      } else {
        const errorText = await response.text();
        results.failed++;
        results.errors.push(`${attendee.name}: ${errorText}`);
      }
    } catch (error3) {
      results.failed++;
      results.errors.push(`${attendee.name}: ${error3.message}`);
    }
  }
  return {
    success: true,
    message: `Notification sent to ${results.successful} attendees`,
    results
  };
}
async function getAttendeeById(db, id) {
  const { results } = await db.prepare(`
    SELECT a.*, r.number as room_number, g.name as group_name
    FROM attendees a
    LEFT JOIN rooms r ON a.room_id = r.id
    LEFT JOIN groups g ON a.group_id = g.id
    WHERE a.id = ? AND a.email IS NOT NULL AND a.email != ''
  `).bind(id).all();
  return results;
}
async function getAttendeesWithOutstandingPayments(db) {
  const { results } = await db.prepare(`
    SELECT a.*, r.number as room_number, g.name as group_name
    FROM attendees a
    LEFT JOIN rooms r ON a.room_id = r.id
    LEFT JOIN groups g ON a.group_id = g.id
    WHERE a.payment_due > 0 AND a.email IS NOT NULL AND a.email != ''
    ORDER BY a.payment_due DESC
  `).all();
  return results;
}
async function getAttendeesByAnnouncement(db, announcementData) {
  let query = `
    SELECT DISTINCT a.*, r.number as room_number, g.name as group_name
    FROM attendees a
    LEFT JOIN rooms r ON a.room_id = r.id
    LEFT JOIN groups g ON a.group_id = g.id
    WHERE a.email IS NOT NULL AND a.email != ''
  `;
  const bindings = [];
  if (announcementData.target_audience === "groups" && announcementData.target_groups) {
    const targetGroups = announcementData.target_groups;
    const placeholders = targetGroups.map(() => "?").join(",");
    query += ` AND g.name IN (${placeholders})`;
    bindings.push(...targetGroups);
  } else if (announcementData.target_audience === "vip") {
    query += ` AND g.name = 'VIP Group'`;
  }
  const { results } = await db.prepare(query).bind(...bindings).all();
  return results;
}
function generateWelcomeEmail(attendee, customData) {
  return {
    subject: "Welcome to Growth and Wisdom Retreat - Your Login Details",
    message: `Welcome to the Growth and Wisdom Retreat portal!

Your account has been successfully created. Here are your login details:

Reference Number: ${attendee.ref_number}
Password: ${customData?.password || "[Password provided separately]"}

You can now access your dashboard to:
- View important announcements
- Check your room assignment
- Review payment details
- Connect with your group

${attendee.room_number ? `Your room assignment: ${attendee.room_number}` : ""}
${attendee.group_name ? `Your group: ${attendee.group_name}` : ""}

We're excited to have you join us for this transformative experience!`,
    email_type: "welcome"
  };
}
function generatePaymentReminderEmail(attendee, customData) {
  const dueAmount = attendee?.payment_due || customData?.amount || 0;
  return {
    subject: "Payment Reminder - Growth and Wisdom Retreat",
    message: `This is a friendly reminder about your outstanding payment for the Growth and Wisdom Retreat.

Amount Due: $${dueAmount.toFixed(2)}
Due Date: ${customData?.due_date || "As soon as possible"}

${customData?.payment_instructions || `To make your payment, please contact us at growthandwisdom@cloverleafworld.org or call us during business hours.

Payment can be made via:
- Bank transfer
- Check
- Credit card (over the phone)`}

Thank you for your prompt attention to this matter. We look forward to seeing you at the retreat!`,
    email_type: "payment"
  };
}
function generateAnnouncementEmail(announcementData, sender) {
  return {
    subject: `${announcementData.title}`,
    message: announcementData.content,
    email_type: announcementData.type || "announcement",
    sender
  };
}
function generateRoomAssignmentEmail(_attendee, customData) {
  return {
    subject: "Room Assignment - Growth and Wisdom Retreat",
    message: `Great news! Your room assignment has been confirmed.

Room Number: ${customData?.room_number}
${customData?.room_description ? `Description: ${customData.room_description}` : ""}

${customData?.notes || "Please bring any personal items you need for a comfortable stay. Check-in details will be provided closer to the retreat date."}

If you have any special accommodation needs, please contact us as soon as possible.`,
    email_type: "reminder"
  };
}
function generateGroupAssignmentEmail(_attendee, customData) {
  return {
    subject: "Group Assignment - Growth and Wisdom Retreat",
    message: `You've been assigned to a group for the Growth and Wisdom Retreat!

Group Name: ${customData?.group_name}
${customData?.group_description ? `Description: ${customData.group_description}` : ""}

${customData?.notes || "Your group will be a wonderful opportunity to connect with fellow attendees and share in meaningful discussions and activities."}

We encourage you to introduce yourself to your group members when you arrive at the retreat.`,
    email_type: "reminder"
  };
}
function generateGenericTemplate(templateData, attendee) {
  const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const headerStyle = headerStyles[templateData.email_type] || headerStyles.default;
  const icon = typeIcons[templateData.email_type] || typeIcons.announcement;
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <div style="${headerStyle} color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.8rem;">${icon} ${templateData.subject}</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Growth and Wisdom Retreat Portal</p>
      </div>

      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #1f2937; margin: 0 0 0.5rem 0;">Hello ${attendee.name}!</h3>
          <p style="color: #6b7280; margin: 0; font-size: 0.9rem;">Reference: ${attendee.ref_number}</p>
        </div>

        <div style="background: #f9fafb; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #667eea; margin: 1.5rem 0;">
          <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${templateData.message}</div>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem; color: #6b7280; font-size: 0.875rem; text-align: center;">
          <div style="padding: 1rem; background: #f3f4f6; border-radius: 6px;">
            <div><strong>Sent:</strong> ${currentDate}</div>
            <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #9ca3af;">Growth and Wisdom Retreat Portal</div>
          </div>
        </div>
      </div>
    </div>
  `;
}
var init_notifications = __esm({
  "api/admin/email/notifications.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_email_helpers();
    init_errors();
    __name(onRequestOptions3, "onRequestOptions");
    __name(onRequestPost3, "onRequestPost");
    __name(sendNotification, "sendNotification");
    __name(getAttendeeById, "getAttendeeById");
    __name(getAttendeesWithOutstandingPayments, "getAttendeesWithOutstandingPayments");
    __name(getAttendeesByAnnouncement, "getAttendeesByAnnouncement");
    __name(generateWelcomeEmail, "generateWelcomeEmail");
    __name(generatePaymentReminderEmail, "generatePaymentReminderEmail");
    __name(generateAnnouncementEmail, "generateAnnouncementEmail");
    __name(generateRoomAssignmentEmail, "generateRoomAssignmentEmail");
    __name(generateGroupAssignmentEmail, "generateGroupAssignmentEmail");
    __name(generateGenericTemplate, "generateGenericTemplate");
  }
});

// api/admin/email/send.ts
async function onRequestOptions4() {
  return handleCORS();
}
async function onRequestPost4(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const body = await context2.request.json();
    const validation = validate(body, emailSendSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }
    const {
      subject,
      message,
      target_audience = "all",
      target_groups,
      attendee_ids,
      email_type = "announcement"
    } = body;
    const attendees = await getTargetAttendees(context2.env.DB, {
      target_audience,
      target_groups,
      attendee_ids
    });
    if (attendees.length === 0) {
      return createErrorResponse(errors.badRequest("No attendees found matching the criteria", requestId));
    }
    const emailResults = await sendBulkEmails(context2.env, {
      attendees,
      subject,
      message,
      email_type,
      sender: "The Growth and Wisdom Retreat Team"
    });
    return createResponse({
      success: true,
      message: `Emails sent to ${emailResults.successful} attendees`,
      results: {
        total: attendees.length,
        successful: emailResults.successful,
        failed: emailResults.failed,
        errors: emailResults.errors
      }
    });
  } catch (error3) {
    console.error(`[${requestId}] Error sending bulk emails:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function getTargetAttendees(db, criteria) {
  let query = `
    SELECT DISTINCT a.id, a.name, a.email, a.ref_number,
           r.number as room_number, g.name as group_name
    FROM attendees a
    LEFT JOIN rooms r ON a.room_id = r.id
    LEFT JOIN groups g ON a.group_id = g.id
    WHERE a.email IS NOT NULL AND a.email != ''
  `;
  const bindings = [];
  if (criteria.attendee_ids && criteria.attendee_ids.length > 0) {
    const placeholders = criteria.attendee_ids.map(() => "?").join(",");
    query += ` AND a.id IN (${placeholders})`;
    bindings.push(...criteria.attendee_ids);
  } else if (criteria.target_audience === "groups" && criteria.target_groups && criteria.target_groups.length > 0) {
    const placeholders = criteria.target_groups.map(() => "?").join(",");
    query += ` AND g.name IN (${placeholders})`;
    bindings.push(...criteria.target_groups);
  } else if (criteria.target_audience === "vip") {
    query += ` AND g.name = 'VIP Group'`;
  }
  query += ` ORDER BY a.name`;
  const { results } = await db.prepare(query).bind(...bindings).all();
  return results;
}
async function sendBulkEmails(env2, emailData) {
  if (!env2.RESEND_API_KEY || !env2.FROM_EMAIL) {
    throw new Error("Email service not configured");
  }
  const { attendees, subject, message, email_type, sender } = emailData;
  const results = { successful: 0, failed: 0, errors: [] };
  const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const batchSize = 10;
  for (let i = 0; i < attendees.length; i += batchSize) {
    const batch = attendees.slice(i, i + batchSize);
    await Promise.all(batch.map(async (attendee) => {
      try {
        const emailHtml = generateEmailTemplate({
          attendee,
          subject,
          message,
          email_type,
          sender,
          currentDate
        });
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env2.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: env2.FROM_EMAIL,
            to: [attendee.email],
            subject,
            html: emailHtml
          })
        });
        if (response.ok) {
          results.successful++;
        } else {
          const errorText = await response.text();
          results.failed++;
          results.errors.push(`${attendee.name} (${attendee.email}): ${errorText}`);
        }
      } catch (error3) {
        results.failed++;
        results.errors.push(`${attendee.name} (${attendee.email}): ${error3.message}`);
      }
    }));
    if (i + batchSize < attendees.length) {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
    }
  }
  return results;
}
function generateEmailTemplate(options) {
  const { attendee, subject, message, email_type, sender, currentDate } = options;
  const headerStyle = headerStyles[email_type] || headerStyles.default;
  const icon = typeIcons[email_type] || typeIcons.announcement;
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <!-- Header -->
      <div style="${headerStyle} color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.8rem;">${icon} ${subject}</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Growth and Wisdom Retreat Portal</p>
      </div>

      <!-- Content -->
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Greeting -->
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: #1f2937; margin: 0 0 0.5rem 0;">Hello ${attendee.name}!</h3>
          <p style="color: #6b7280; margin: 0; font-size: 0.9rem;">Reference: ${attendee.ref_number}</p>
        </div>

        <!-- Message Content -->
        <div style="background: #f9fafb; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #667eea; margin: 1.5rem 0;">
          <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        </div>

        ${attendee.room_number || attendee.group_name ? `
        <div style="background: #fef3c7; padding: 1rem; border-radius: 6px; margin: 1.5rem 0;">
          <h4 style="margin: 0 0 0.5rem 0; color: #92400e;">Your Details</h4>
          <div style="color: #d97706; font-size: 0.9rem;">
            ${attendee.room_number ? `<div>Room: ${attendee.room_number}</div>` : ""}
            ${attendee.group_name ? `<div>Group: ${attendee.group_name}</div>` : ""}
          </div>
        </div>
        ` : ""}

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem;">
          <div style="padding: 1rem; background: #f3f4f6; border-radius: 6px; text-align: center;">
            <div><strong>Sent by:</strong> ${sender}</div>
            <div><strong>Date:</strong> ${currentDate}</div>
            <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #9ca3af;">
              Growth and Wisdom Retreat Portal
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
var init_send = __esm({
  "api/admin/email/send.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_validation();
    init_email_helpers();
    init_errors();
    __name(onRequestOptions4, "onRequestOptions");
    __name(onRequestPost4, "onRequestPost");
    __name(getTargetAttendees, "getTargetAttendees");
    __name(sendBulkEmails, "sendBulkEmails");
    __name(generateEmailTemplate, "generateEmailTemplate");
  }
});

// api/admin/groups/auto-create.ts
async function onRequestOptions5() {
  return handleCORS();
}
async function onRequestPost5(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const db = context2.env.DB;
    const { results: attendees } = await db.prepare(`
      SELECT id, name, group_id FROM attendees
      WHERE is_archived = 0 OR is_archived IS NULL
    `).all();
    const attendeeRows = attendees;
    const lastNameGroups = {};
    for (const attendee of attendeeRows) {
      const nameParts = attendee.name.trim().split(/\s+/);
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
      const normalised = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
      if (!lastNameGroups[normalised]) {
        lastNameGroups[normalised] = [];
      }
      lastNameGroups[normalised].push(attendee);
    }
    const familyGroups = Object.entries(lastNameGroups).filter(([, members]) => members.length >= 2);
    let groupsCreated = 0;
    let attendeesAssigned = 0;
    let groupsSkipped = 0;
    for (const [lastName, members] of familyGroups) {
      const groupName = `${lastName} Family`;
      const { results: existing } = await db.prepare(
        "SELECT id FROM groups WHERE name = ?"
      ).bind(groupName).all();
      let groupId;
      if (existing.length > 0) {
        groupId = existing[0].id;
        groupsSkipped++;
      } else {
        const result = await db.prepare(
          "INSERT INTO groups (name) VALUES (?)"
        ).bind(groupName).run();
        if (!result.success) {
          continue;
        }
        groupId = result.meta.last_row_id;
        groupsCreated++;
      }
      for (const attendee of members) {
        if (!attendee.group_id) {
          await db.prepare(
            "UPDATE attendees SET group_id = ? WHERE id = ?"
          ).bind(groupId, attendee.id).run();
          attendeesAssigned++;
        }
      }
    }
    return createResponse({
      message: `Auto-group complete: ${groupsCreated} groups created, ${attendeesAssigned} attendees assigned`,
      groups_created: groupsCreated,
      groups_existing: groupsSkipped,
      attendees_assigned: attendeesAssigned,
      families_found: familyGroups.length
    });
  } catch (error3) {
    console.error(`[${requestId}] Auto-create groups error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_auto_create = __esm({
  "api/admin/groups/auto-create.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    __name(onRequestOptions5, "onRequestOptions");
    __name(onRequestPost5, "onRequestPost");
  }
});

// ../node_modules/stripe/esm/utils.js
function isOptionsHash(o) {
  return o && typeof o === "object" && OPTIONS_KEYS.some((prop) => Object.prototype.hasOwnProperty.call(o, prop));
}
function queryStringifyRequestData(data, _apiMode) {
  return stringifyRequestData(data);
}
function encodeQueryValue(value) {
  return encodeURIComponent(value).replace(/!/g, "%21").replace(/\*/g, "%2A").replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/'/g, "%27").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function valueToString(value) {
  if (value instanceof Date) {
    return Math.floor(value.getTime() / 1e3).toString();
  }
  if (value === null) {
    return "";
  }
  return String(value);
}
function stringifyRequestData(data) {
  const pairs = [];
  function encode(key, value) {
    if (value === void 0) {
      return;
    }
    if (value === null || typeof value !== "object" || value instanceof Date) {
      pairs.push(encodeQueryValue(key) + "=" + encodeQueryValue(valueToString(value)));
      return;
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (value[i] !== void 0) {
          encode(key + "[" + i + "]", value[i]);
        }
      }
      return;
    }
    for (const k of Object.keys(value)) {
      encode(key + "[" + k + "]", value[k]);
    }
  }
  __name(encode, "encode");
  if (typeof data === "object" && data !== null) {
    for (const key of Object.keys(data)) {
      encode(key, data[key]);
    }
  }
  return pairs.join("&");
}
function isValidEncodeUriComponentType(value) {
  return ["number", "string", "boolean"].includes(typeof value);
}
function extractUrlParams(path) {
  const params = path.match(/\{\w+\}/g);
  if (!params) {
    return [];
  }
  return params.map((param) => param.replace(/[{}]/g, ""));
}
function getDataFromArgs(args) {
  if (!Array.isArray(args) || !args[0] || typeof args[0] !== "object") {
    return {};
  }
  if (!isOptionsHash(args[0])) {
    return args.shift();
  }
  const argKeys = Object.keys(args[0]);
  const optionKeysInArgs = argKeys.filter((key) => OPTIONS_KEYS.includes(key));
  if (optionKeysInArgs.length > 0 && optionKeysInArgs.length !== argKeys.length) {
    emitWarning2(`Options found in arguments (${optionKeysInArgs.join(", ")}). Did you mean to pass an options object? See https://github.com/stripe/stripe-node/wiki/Passing-Options.`);
  }
  return {};
}
function getOptionsFromArgs(args) {
  const opts = {
    host: null,
    headers: {},
    settings: {},
    streaming: false
  };
  if (args.length > 0) {
    const arg = args[args.length - 1];
    if (typeof arg === "string") {
      opts.authenticator = createApiKeyAuthenticator(args.pop());
    } else if (isOptionsHash(arg)) {
      const params = Object.assign({}, args.pop());
      const extraKeys = Object.keys(params).filter((key) => !OPTIONS_KEYS.includes(key));
      if (extraKeys.length) {
        emitWarning2(`Invalid options found (${extraKeys.join(", ")}); ignoring.`);
      }
      if (params.apiKey) {
        opts.authenticator = createApiKeyAuthenticator(params.apiKey);
      }
      if (params.idempotencyKey) {
        opts.headers["Idempotency-Key"] = params.idempotencyKey;
      }
      if (params.stripeAccount) {
        opts.headers["Stripe-Account"] = params.stripeAccount;
      }
      if (params.stripeContext) {
        if (opts.headers["Stripe-Account"]) {
          throw new Error("Can't specify both stripeAccount and stripeContext.");
        }
        opts.headers["Stripe-Context"] = params.stripeContext;
      }
      if (params.apiVersion) {
        opts.headers["Stripe-Version"] = params.apiVersion;
      }
      if (Number.isInteger(params.maxNetworkRetries)) {
        opts.settings.maxNetworkRetries = params.maxNetworkRetries;
      }
      if (Number.isInteger(params.timeout)) {
        opts.settings.timeout = params.timeout;
      }
      if (params.host) {
        opts.host = params.host;
      }
      if (params.authenticator) {
        if (params.apiKey) {
          throw new Error("Can't specify both apiKey and authenticator.");
        }
        if (typeof params.authenticator !== "function") {
          throw new Error("The authenticator must be a function receiving a request as the first parameter.");
        }
        opts.authenticator = params.authenticator;
      }
      if (params.headers) {
        Object.assign(opts.headers, params.headers);
      }
      if (params.additionalHeaders) {
        Object.assign(opts.headers, params.additionalHeaders);
      }
      if (params.streaming) {
        opts.streaming = true;
      }
    }
  }
  return opts;
}
function protoExtend(sub) {
  const Super = this;
  const Constructor = Object.prototype.hasOwnProperty.call(sub, "constructor") ? sub.constructor : function(...args) {
    Super.apply(this, args);
  };
  Object.assign(Constructor, Super);
  Constructor.prototype = Object.create(Super.prototype);
  Object.assign(Constructor.prototype, sub);
  return Constructor;
}
function removeNullish(obj) {
  if (typeof obj !== "object") {
    throw new Error("Argument must be an object");
  }
  return Object.keys(obj).reduce((result, key) => {
    if (obj[key] != null) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}
function normalizeHeaders(obj) {
  if (!(obj && typeof obj === "object")) {
    return obj;
  }
  return Object.keys(obj).reduce((result, header) => {
    result[normalizeHeader(header)] = obj[header];
    return result;
  }, {});
}
function normalizeHeader(header) {
  return header.split("-").map((text) => text.charAt(0).toUpperCase() + text.substr(1).toLowerCase()).join("-");
}
function callbackifyPromiseWithTimeout(promise, callback) {
  if (callback) {
    return promise.then((res) => {
      setTimeout(() => {
        callback(null, res);
      }, 0);
    }, (err) => {
      setTimeout(() => {
        callback(err, null);
      }, 0);
    });
  }
  return promise;
}
function pascalToCamelCase(name) {
  if (name === "OAuth") {
    return "oauth";
  } else {
    return name[0].toLowerCase() + name.substring(1);
  }
}
function emitWarning2(warning) {
  if (typeof process.emitWarning !== "function") {
    return console.warn(`Stripe: ${warning}`);
  }
  return process.emitWarning(warning, "Stripe");
}
function isObject(obj) {
  const type = typeof obj;
  return (type === "function" || type === "object") && !!obj;
}
function flattenAndStringify(data) {
  const result = {};
  const step = /* @__PURE__ */ __name((obj, prevKey) => {
    Object.entries(obj).forEach(([key, value]) => {
      const newKey = prevKey ? `${prevKey}[${key}]` : key;
      if (isObject(value)) {
        if (!(value instanceof Uint8Array) && !Object.prototype.hasOwnProperty.call(value, "data")) {
          return step(value, newKey);
        } else {
          result[newKey] = value;
        }
      } else {
        result[newKey] = String(value);
      }
    });
  }, "step");
  step(data, null);
  return result;
}
function validateInteger(name, n, defaultVal) {
  if (!Number.isInteger(n)) {
    if (defaultVal !== void 0) {
      return defaultVal;
    } else {
      throw new Error(`${name} must be an integer`);
    }
  }
  return n;
}
function determineProcessUserAgentProperties() {
  return typeof process === "undefined" ? {} : {
    lang_version: process.version,
    platform: process.platform
  };
}
function detectAIAgent(env2) {
  for (const [envVar, agentName] of AI_AGENTS) {
    if (env2[envVar]) {
      return agentName;
    }
  }
  return "";
}
function createApiKeyAuthenticator(apiKey) {
  const authenticator = /* @__PURE__ */ __name((request) => {
    request.headers.Authorization = "Bearer " + apiKey;
    return Promise.resolve();
  }, "authenticator");
  authenticator._apiKey = apiKey;
  return authenticator;
}
function dateTimeReplacer(key, value) {
  if (this[key] instanceof Date) {
    return Math.floor(this[key].getTime() / 1e3).toString();
  }
  return value;
}
function jsonStringifyRequestData(data) {
  return JSON.stringify(data, dateTimeReplacer);
}
function getAPIMode(path) {
  if (!path) {
    return "v1";
  }
  return path.startsWith("/v2") ? "v2" : "v1";
}
function parseHttpHeaderAsString(header) {
  if (Array.isArray(header)) {
    return header.join(", ");
  }
  return String(header);
}
function parseHttpHeaderAsNumber(header) {
  const number = Array.isArray(header) ? header[0] : header;
  return Number(number);
}
function parseHeadersForFetch(headers) {
  return Object.entries(headers).map(([key, value]) => {
    return [key, parseHttpHeaderAsString(value)];
  });
}
var OPTIONS_KEYS, makeURLInterpolator, AI_AGENTS;
var init_utils2 = __esm({
  "../node_modules/stripe/esm/utils.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    OPTIONS_KEYS = [
      "apiKey",
      "idempotencyKey",
      "stripeAccount",
      "apiVersion",
      "maxNetworkRetries",
      "timeout",
      "host",
      "authenticator",
      "stripeContext",
      "headers",
      "additionalHeaders",
      "streaming"
    ];
    __name(isOptionsHash, "isOptionsHash");
    __name(queryStringifyRequestData, "queryStringifyRequestData");
    __name(encodeQueryValue, "encodeQueryValue");
    __name(valueToString, "valueToString");
    __name(stringifyRequestData, "stringifyRequestData");
    makeURLInterpolator = (() => {
      const rc = {
        "\n": "\\n",
        '"': '\\"',
        "\u2028": "\\u2028",
        "\u2029": "\\u2029"
      };
      return (str) => {
        const cleanString = str.replace(/["\n\r\u2028\u2029]/g, ($0) => rc[$0]);
        return (outputs) => {
          return cleanString.replace(/\{([\s\S]+?)\}/g, ($0, $1) => {
            const output = outputs[$1];
            if (isValidEncodeUriComponentType(output))
              return encodeURIComponent(output);
            return "";
          });
        };
      };
    })();
    __name(isValidEncodeUriComponentType, "isValidEncodeUriComponentType");
    __name(extractUrlParams, "extractUrlParams");
    __name(getDataFromArgs, "getDataFromArgs");
    __name(getOptionsFromArgs, "getOptionsFromArgs");
    __name(protoExtend, "protoExtend");
    __name(removeNullish, "removeNullish");
    __name(normalizeHeaders, "normalizeHeaders");
    __name(normalizeHeader, "normalizeHeader");
    __name(callbackifyPromiseWithTimeout, "callbackifyPromiseWithTimeout");
    __name(pascalToCamelCase, "pascalToCamelCase");
    __name(emitWarning2, "emitWarning");
    __name(isObject, "isObject");
    __name(flattenAndStringify, "flattenAndStringify");
    __name(validateInteger, "validateInteger");
    __name(determineProcessUserAgentProperties, "determineProcessUserAgentProperties");
    AI_AGENTS = [
      // The beginning of the section generated from our OpenAPI spec
      ["ANTIGRAVITY_CLI_ALIAS", "antigravity"],
      ["CLAUDECODE", "claude_code"],
      ["CLINE_ACTIVE", "cline"],
      ["CODEX_SANDBOX", "codex_cli"],
      ["CODEX_THREAD_ID", "codex_cli"],
      ["CODEX_SANDBOX_NETWORK_DISABLED", "codex_cli"],
      ["CODEX_CI", "codex_cli"],
      ["CURSOR_AGENT", "cursor"],
      ["GEMINI_CLI", "gemini_cli"],
      ["OPENCODE", "open_code"]
      // The end of the section generated from our OpenAPI spec
    ];
    __name(detectAIAgent, "detectAIAgent");
    __name(createApiKeyAuthenticator, "createApiKeyAuthenticator");
    __name(dateTimeReplacer, "dateTimeReplacer");
    __name(jsonStringifyRequestData, "jsonStringifyRequestData");
    __name(getAPIMode, "getAPIMode");
    __name(parseHttpHeaderAsString, "parseHttpHeaderAsString");
    __name(parseHttpHeaderAsNumber, "parseHttpHeaderAsNumber");
    __name(parseHeadersForFetch, "parseHeadersForFetch");
  }
});

// ../node_modules/stripe/esm/net/HttpClient.js
var HttpClient, HttpClientResponse;
var init_HttpClient = __esm({
  "../node_modules/stripe/esm/net/HttpClient.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    HttpClient = class {
      /** The client name used for diagnostics. */
      getClientName() {
        throw new Error("getClientName not implemented.");
      }
      makeRequest(host, port, path, method, headers, requestData, protocol, timeout) {
        throw new Error("makeRequest not implemented.");
      }
      /** Helper to make a consistent timeout error across implementations. */
      static makeTimeoutError() {
        const timeoutErr = new TypeError(HttpClient.TIMEOUT_ERROR_CODE);
        timeoutErr.code = HttpClient.TIMEOUT_ERROR_CODE;
        return timeoutErr;
      }
    };
    __name(HttpClient, "HttpClient");
    HttpClient.CONNECTION_CLOSED_ERROR_CODES = ["ECONNRESET", "EPIPE"];
    HttpClient.TIMEOUT_ERROR_CODE = "ETIMEDOUT";
    HttpClientResponse = class {
      constructor(statusCode, headers) {
        this._statusCode = statusCode;
        this._headers = headers;
      }
      getStatusCode() {
        return this._statusCode;
      }
      getHeaders() {
        return this._headers;
      }
      getRawResponse() {
        throw new Error("getRawResponse not implemented.");
      }
      toStream(streamCompleteCallback) {
        throw new Error("toStream not implemented.");
      }
      toJSON() {
        throw new Error("toJSON not implemented.");
      }
    };
    __name(HttpClientResponse, "HttpClientResponse");
  }
});

// ../node_modules/stripe/esm/net/FetchHttpClient.js
var FetchHttpClient, FetchHttpClientResponse;
var init_FetchHttpClient = __esm({
  "../node_modules/stripe/esm/net/FetchHttpClient.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils2();
    init_HttpClient();
    FetchHttpClient = class extends HttpClient {
      constructor(fetchFn) {
        super();
        if (!fetchFn) {
          if (!globalThis.fetch) {
            throw new Error("fetch() function not provided and is not defined in the global scope. You must provide a fetch implementation.");
          }
          fetchFn = globalThis.fetch;
        }
        if (globalThis.AbortController) {
          this._fetchFn = FetchHttpClient.makeFetchWithAbortTimeout(fetchFn);
        } else {
          this._fetchFn = FetchHttpClient.makeFetchWithRaceTimeout(fetchFn);
        }
      }
      static makeFetchWithRaceTimeout(fetchFn) {
        return (url, init, timeout) => {
          let pendingTimeoutId;
          const timeoutPromise = new Promise((_, reject) => {
            pendingTimeoutId = setTimeout(() => {
              pendingTimeoutId = null;
              reject(HttpClient.makeTimeoutError());
            }, timeout);
          });
          const fetchPromise = fetchFn(url, init);
          return Promise.race([fetchPromise, timeoutPromise]).finally(() => {
            if (pendingTimeoutId) {
              clearTimeout(pendingTimeoutId);
            }
          });
        };
      }
      static makeFetchWithAbortTimeout(fetchFn) {
        return async (url, init, timeout) => {
          const abort2 = new AbortController();
          let timeoutId = setTimeout(() => {
            timeoutId = null;
            abort2.abort(HttpClient.makeTimeoutError());
          }, timeout);
          try {
            return await fetchFn(url, Object.assign(Object.assign({}, init), { signal: abort2.signal }));
          } catch (err) {
            if (err.name === "AbortError") {
              throw HttpClient.makeTimeoutError();
            } else {
              throw err;
            }
          } finally {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
          }
        };
      }
      /** @override. */
      getClientName() {
        return "fetch";
      }
      async makeRequest(host, port, path, method, headers, requestData, protocol, timeout) {
        const isInsecureConnection = protocol === "http";
        const url = new URL(path, `${isInsecureConnection ? "http" : "https"}://${host}`);
        url.port = port;
        const methodHasPayload = method == "POST" || method == "PUT" || method == "PATCH";
        const body = requestData || (methodHasPayload ? "" : void 0);
        const res = await this._fetchFn(url.toString(), {
          method,
          headers: parseHeadersForFetch(headers),
          body
        }, timeout);
        return new FetchHttpClientResponse(res);
      }
    };
    __name(FetchHttpClient, "FetchHttpClient");
    FetchHttpClientResponse = class extends HttpClientResponse {
      constructor(res) {
        super(res.status, FetchHttpClientResponse._transformHeadersToObject(res.headers));
        this._res = res;
      }
      getRawResponse() {
        return this._res;
      }
      toStream(streamCompleteCallback) {
        streamCompleteCallback();
        return this._res.body;
      }
      toJSON() {
        return this._res.json();
      }
      static _transformHeadersToObject(headers) {
        const headersObj = {};
        for (const entry of headers) {
          if (!Array.isArray(entry) || entry.length != 2) {
            throw new Error("Response objects produced by the fetch function given to FetchHttpClient do not have an iterable headers map. Response#headers should be an iterable object.");
          }
          headersObj[entry[0]] = entry[1];
        }
        return headersObj;
      }
    };
    __name(FetchHttpClientResponse, "FetchHttpClientResponse");
  }
});

// ../node_modules/stripe/esm/crypto/CryptoProvider.js
var CryptoProvider, CryptoProviderOnlySupportsAsyncError;
var init_CryptoProvider = __esm({
  "../node_modules/stripe/esm/crypto/CryptoProvider.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    CryptoProvider = class {
      /**
       * Computes a SHA-256 HMAC given a secret and a payload (encoded in UTF-8).
       * The output HMAC should be encoded in hexadecimal.
       *
       * Sample values for implementations:
       * - computeHMACSignature('', 'test_secret') => 'f7f9bd47fb987337b5796fdc1fdb9ba221d0d5396814bfcaf9521f43fd8927fd'
       * - computeHMACSignature('\ud83d\ude00', 'test_secret') => '837da296d05c4fe31f61d5d7ead035099d9585a5bcde87de952012a78f0b0c43
       */
      computeHMACSignature(payload, secret) {
        throw new Error("computeHMACSignature not implemented.");
      }
      /**
       * Asynchronous version of `computeHMACSignature`. Some implementations may
       * only allow support async signature computation.
       *
       * Computes a SHA-256 HMAC given a secret and a payload (encoded in UTF-8).
       * The output HMAC should be encoded in hexadecimal.
       *
       * Sample values for implementations:
       * - computeHMACSignature('', 'test_secret') => 'f7f9bd47fb987337b5796fdc1fdb9ba221d0d5396814bfcaf9521f43fd8927fd'
       * - computeHMACSignature('\ud83d\ude00', 'test_secret') => '837da296d05c4fe31f61d5d7ead035099d9585a5bcde87de952012a78f0b0c43
       */
      computeHMACSignatureAsync(payload, secret) {
        throw new Error("computeHMACSignatureAsync not implemented.");
      }
      /**
       * Computes a SHA-256 hash of the data.
       */
      computeSHA256Async(data) {
        throw new Error("computeSHA256 not implemented.");
      }
    };
    __name(CryptoProvider, "CryptoProvider");
    CryptoProviderOnlySupportsAsyncError = class extends Error {
    };
    __name(CryptoProviderOnlySupportsAsyncError, "CryptoProviderOnlySupportsAsyncError");
  }
});

// ../node_modules/stripe/esm/crypto/SubtleCryptoProvider.js
var SubtleCryptoProvider, byteHexMapping;
var init_SubtleCryptoProvider = __esm({
  "../node_modules/stripe/esm/crypto/SubtleCryptoProvider.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_CryptoProvider();
    SubtleCryptoProvider = class extends CryptoProvider {
      constructor(subtleCrypto) {
        super();
        this.subtleCrypto = subtleCrypto || crypto.subtle;
      }
      /** @override */
      computeHMACSignature(payload, secret) {
        throw new CryptoProviderOnlySupportsAsyncError("SubtleCryptoProvider cannot be used in a synchronous context.");
      }
      /** @override */
      async computeHMACSignatureAsync(payload, secret) {
        const encoder = new TextEncoder();
        const key = await this.subtleCrypto.importKey("raw", encoder.encode(secret), {
          name: "HMAC",
          hash: { name: "SHA-256" }
        }, false, ["sign"]);
        const signatureBuffer = await this.subtleCrypto.sign("hmac", key, encoder.encode(payload));
        const signatureBytes = new Uint8Array(signatureBuffer);
        const signatureHexCodes = new Array(signatureBytes.length);
        for (let i = 0; i < signatureBytes.length; i++) {
          signatureHexCodes[i] = byteHexMapping[signatureBytes[i]];
        }
        return signatureHexCodes.join("");
      }
      /** @override */
      async computeSHA256Async(data) {
        return new Uint8Array(await this.subtleCrypto.digest("SHA-256", data));
      }
    };
    __name(SubtleCryptoProvider, "SubtleCryptoProvider");
    byteHexMapping = new Array(256);
    for (let i = 0; i < byteHexMapping.length; i++) {
      byteHexMapping[i] = i.toString(16).padStart(2, "0");
    }
  }
});

// ../node_modules/stripe/esm/platform/PlatformFunctions.js
var PlatformFunctions;
var init_PlatformFunctions = __esm({
  "../node_modules/stripe/esm/platform/PlatformFunctions.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_FetchHttpClient();
    init_SubtleCryptoProvider();
    PlatformFunctions = class {
      constructor() {
        this._fetchFn = null;
        this._agent = null;
      }
      /**
       * Gets uname with Node's built-in `exec` function, if available.
       */
      getUname() {
        throw new Error("getUname not implemented.");
      }
      /**
       * Generates a v4 UUID. See https://stackoverflow.com/a/2117523
       */
      uuid4() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === "x" ? r : r & 3 | 8;
          return v.toString(16);
        });
      }
      /**
       * Compares strings in constant time.
       */
      secureCompare(a, b) {
        if (a.length !== b.length) {
          return false;
        }
        const len = a.length;
        let result = 0;
        for (let i = 0; i < len; ++i) {
          result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
      }
      /**
       * Creates an event emitter.
       */
      createEmitter() {
        throw new Error("createEmitter not implemented.");
      }
      /**
       * Checks if the request data is a stream. If so, read the entire stream
       * to a buffer and return the buffer.
       */
      tryBufferData(data) {
        throw new Error("tryBufferData not implemented.");
      }
      /**
       * Creates an HTTP client which uses the Node `http` and `https` packages
       * to issue requests.
       */
      createNodeHttpClient(agent) {
        throw new Error("createNodeHttpClient not implemented.");
      }
      /**
       * Creates an HTTP client for issuing Stripe API requests which uses the Web
       * Fetch API.
       *
       * A fetch function can optionally be passed in as a parameter. If none is
       * passed, will default to the default `fetch` function in the global scope.
       */
      createFetchHttpClient(fetchFn) {
        return new FetchHttpClient(fetchFn);
      }
      /**
       * Creates an HTTP client using runtime-specific APIs.
       */
      createDefaultHttpClient() {
        throw new Error("createDefaultHttpClient not implemented.");
      }
      /**
       * Creates a CryptoProvider which uses the Node `crypto` package for its computations.
       */
      createNodeCryptoProvider() {
        throw new Error("createNodeCryptoProvider not implemented.");
      }
      /**
       * Creates a CryptoProvider which uses the SubtleCrypto interface of the Web Crypto API.
       */
      createSubtleCryptoProvider(subtleCrypto) {
        return new SubtleCryptoProvider(subtleCrypto);
      }
      createDefaultCryptoProvider() {
        throw new Error("createDefaultCryptoProvider not implemented.");
      }
    };
    __name(PlatformFunctions, "PlatformFunctions");
  }
});

// ../node_modules/stripe/esm/StripeEmitter.js
var _StripeEvent, StripeEmitter;
var init_StripeEmitter = __esm({
  "../node_modules/stripe/esm/StripeEmitter.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    _StripeEvent = class extends Event {
      constructor(eventName, data) {
        super(eventName);
        this.data = data;
      }
    };
    __name(_StripeEvent, "_StripeEvent");
    StripeEmitter = class {
      constructor() {
        this.eventTarget = new EventTarget();
        this.listenerMapping = /* @__PURE__ */ new Map();
      }
      on(eventName, listener) {
        const listenerWrapper = /* @__PURE__ */ __name((event) => {
          listener(event.data);
        }, "listenerWrapper");
        this.listenerMapping.set(listener, listenerWrapper);
        return this.eventTarget.addEventListener(eventName, listenerWrapper);
      }
      removeListener(eventName, listener) {
        const listenerWrapper = this.listenerMapping.get(listener);
        this.listenerMapping.delete(listener);
        return this.eventTarget.removeEventListener(eventName, listenerWrapper);
      }
      once(eventName, listener) {
        const listenerWrapper = /* @__PURE__ */ __name((event) => {
          listener(event.data);
        }, "listenerWrapper");
        this.listenerMapping.set(listener, listenerWrapper);
        return this.eventTarget.addEventListener(eventName, listenerWrapper, {
          once: true
        });
      }
      emit(eventName, data) {
        return this.eventTarget.dispatchEvent(new _StripeEvent(eventName, data));
      }
    };
    __name(StripeEmitter, "StripeEmitter");
  }
});

// ../node_modules/stripe/esm/platform/WebPlatformFunctions.js
var WebPlatformFunctions;
var init_WebPlatformFunctions = __esm({
  "../node_modules/stripe/esm/platform/WebPlatformFunctions.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_PlatformFunctions();
    init_StripeEmitter();
    WebPlatformFunctions = class extends PlatformFunctions {
      /** @override */
      getUname() {
        return Promise.resolve(null);
      }
      /** @override */
      createEmitter() {
        return new StripeEmitter();
      }
      /** @override */
      tryBufferData(data) {
        if (data.file.data instanceof ReadableStream) {
          throw new Error("Uploading a file as a stream is not supported in non-Node environments. Please open or upvote an issue at github.com/stripe/stripe-node if you use this, detailing your use-case.");
        }
        return Promise.resolve(data);
      }
      /** @override */
      createNodeHttpClient() {
        throw new Error("Stripe: `createNodeHttpClient()` is not available in non-Node environments. Please use `createFetchHttpClient()` instead.");
      }
      /** @override */
      createDefaultHttpClient() {
        return super.createFetchHttpClient();
      }
      /** @override */
      createNodeCryptoProvider() {
        throw new Error("Stripe: `createNodeCryptoProvider()` is not available in non-Node environments. Please use `createSubtleCryptoProvider()` instead.");
      }
      /** @override */
      createDefaultCryptoProvider() {
        return this.createSubtleCryptoProvider();
      }
    };
    __name(WebPlatformFunctions, "WebPlatformFunctions");
  }
});

// ../node_modules/stripe/esm/Error.js
var Error_exports = {};
__export(Error_exports, {
  StripeAPIError: () => StripeAPIError,
  StripeAuthenticationError: () => StripeAuthenticationError,
  StripeCardError: () => StripeCardError,
  StripeConnectionError: () => StripeConnectionError,
  StripeError: () => StripeError,
  StripeIdempotencyError: () => StripeIdempotencyError,
  StripeInvalidGrantError: () => StripeInvalidGrantError,
  StripeInvalidRequestError: () => StripeInvalidRequestError,
  StripePermissionError: () => StripePermissionError,
  StripeRateLimitError: () => StripeRateLimitError,
  StripeSignatureVerificationError: () => StripeSignatureVerificationError,
  StripeUnknownError: () => StripeUnknownError,
  TemporarySessionExpiredError: () => TemporarySessionExpiredError,
  generateV1Error: () => generateV1Error,
  generateV2Error: () => generateV2Error
});
var generateV1Error, generateV2Error, StripeError, StripeCardError, StripeInvalidRequestError, StripeAPIError, StripeAuthenticationError, StripePermissionError, StripeRateLimitError, StripeConnectionError, StripeSignatureVerificationError, StripeIdempotencyError, StripeInvalidGrantError, StripeUnknownError, TemporarySessionExpiredError;
var init_Error = __esm({
  "../node_modules/stripe/esm/Error.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    generateV1Error = /* @__PURE__ */ __name((rawStripeError) => {
      switch (rawStripeError.type) {
        case "card_error":
          return new StripeCardError(rawStripeError);
        case "invalid_request_error":
          return new StripeInvalidRequestError(rawStripeError);
        case "api_error":
          return new StripeAPIError(rawStripeError);
        case "authentication_error":
          return new StripeAuthenticationError(rawStripeError);
        case "rate_limit_error":
          return new StripeRateLimitError(rawStripeError);
        case "idempotency_error":
          return new StripeIdempotencyError(rawStripeError);
        case "invalid_grant":
          return new StripeInvalidGrantError(rawStripeError);
        default:
          return new StripeUnknownError(rawStripeError);
      }
    }, "generateV1Error");
    generateV2Error = /* @__PURE__ */ __name((rawStripeError) => {
      switch (rawStripeError.type) {
        case "temporary_session_expired":
          return new TemporarySessionExpiredError(rawStripeError);
      }
      switch (rawStripeError.code) {
        case "invalid_fields":
          return new StripeInvalidRequestError(rawStripeError);
      }
      return generateV1Error(rawStripeError);
    }, "generateV2Error");
    StripeError = class extends Error {
      constructor(raw = {}, type = null) {
        var _a;
        super(raw.message);
        this.type = type || this.constructor.name;
        this.raw = raw;
        this.rawType = raw.type;
        this.code = raw.code;
        this.doc_url = raw.doc_url;
        this.param = raw.param;
        this.detail = raw.detail;
        this.headers = raw.headers;
        this.requestId = raw.requestId;
        this.statusCode = raw.statusCode;
        this.message = (_a = raw.message) !== null && _a !== void 0 ? _a : "";
        this.userMessage = raw.user_message;
        this.charge = raw.charge;
        this.decline_code = raw.decline_code;
        this.payment_intent = raw.payment_intent;
        this.payment_method = raw.payment_method;
        this.payment_method_type = raw.payment_method_type;
        this.setup_intent = raw.setup_intent;
        this.source = raw.source;
      }
    };
    __name(StripeError, "StripeError");
    StripeError.generate = generateV1Error;
    StripeCardError = class extends StripeError {
      constructor(raw = {}) {
        super(raw, "StripeCardError");
      }
    };
    __name(StripeCardError, "StripeCardError");
    StripeInvalidRequestError = class extends StripeError {
      constructor(raw = {}) {
        super(raw, "StripeInvalidRequestError");
      }
    };
    __name(StripeInvalidRequestError, "StripeInvalidRequestError");
    StripeAPIError = class extends StripeError {
      constructor(raw = {}) {
        super(raw, "StripeAPIError");
      }
    };
    __name(StripeAPIError, "StripeAPIError");
    StripeAuthenticationError = class extends StripeError {
      constructor(raw = {}) {
        super(raw, "StripeAuthenticationError");
      }
    };
    __name(StripeAuthenticationError, "StripeAuthenticationError");
    StripePermissionError = class extends StripeError {
      constructor(raw = {}) {
        super(raw, "StripePermissionError");
      }
    };
    __name(StripePermissionError, "StripePermissionError");
    StripeRateLimitError = class extends StripeError {
      constructor(raw = {}) {
        super(raw, "StripeRateLimitError");
      }
    };
    __name(StripeRateLimitError, "StripeRateLimitError");
    StripeConnectionError = class extends StripeError {
      constructor(raw = {}) {
        super(raw, "StripeConnectionError");
      }
    };
    __name(StripeConnectionError, "StripeConnectionError");
    StripeSignatureVerificationError = class extends StripeError {
      constructor(header, payload, raw = {}) {
        super(raw, "StripeSignatureVerificationError");
        this.header = header;
        this.payload = payload;
      }
    };
    __name(StripeSignatureVerificationError, "StripeSignatureVerificationError");
    StripeIdempotencyError = class extends StripeError {
      constructor(raw = {}) {
        super(raw, "StripeIdempotencyError");
      }
    };
    __name(StripeIdempotencyError, "StripeIdempotencyError");
    StripeInvalidGrantError = class extends StripeError {
      constructor(raw = {}) {
        super(raw, "StripeInvalidGrantError");
      }
    };
    __name(StripeInvalidGrantError, "StripeInvalidGrantError");
    StripeUnknownError = class extends StripeError {
      constructor(raw = {}) {
        super(raw, "StripeUnknownError");
      }
    };
    __name(StripeUnknownError, "StripeUnknownError");
    TemporarySessionExpiredError = class extends StripeError {
      constructor(rawStripeError = {}) {
        super(rawStripeError, "TemporarySessionExpiredError");
      }
    };
    __name(TemporarySessionExpiredError, "TemporarySessionExpiredError");
  }
});

// ../node_modules/stripe/esm/RequestSender.js
var MAX_RETRY_AFTER_WAIT, RequestSender;
var init_RequestSender = __esm({
  "../node_modules/stripe/esm/RequestSender.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_Error();
    init_HttpClient();
    init_utils2();
    MAX_RETRY_AFTER_WAIT = 60;
    RequestSender = class {
      constructor(stripe, maxBufferedRequestMetric) {
        this._stripe = stripe;
        this._maxBufferedRequestMetric = maxBufferedRequestMetric;
      }
      _normalizeStripeContext(optsContext, clientContext) {
        if (optsContext) {
          return optsContext.toString() || null;
        }
        return (clientContext === null || clientContext === void 0 ? void 0 : clientContext.toString()) || null;
      }
      _addHeadersDirectlyToObject(obj, headers) {
        obj.requestId = headers["request-id"];
        obj.stripeAccount = obj.stripeAccount || headers["stripe-account"];
        obj.apiVersion = obj.apiVersion || headers["stripe-version"];
        obj.idempotencyKey = obj.idempotencyKey || headers["idempotency-key"];
      }
      _makeResponseEvent(requestEvent, statusCode, headers) {
        const requestEndTime = Date.now();
        const requestDurationMs = requestEndTime - requestEvent.request_start_time;
        return removeNullish({
          api_version: headers["stripe-version"],
          account: headers["stripe-account"],
          idempotency_key: headers["idempotency-key"],
          method: requestEvent.method,
          path: requestEvent.path,
          status: statusCode,
          request_id: this._getRequestId(headers),
          elapsed: requestDurationMs,
          request_start_time: requestEvent.request_start_time,
          request_end_time: requestEndTime
        });
      }
      _getRequestId(headers) {
        return headers["request-id"];
      }
      /**
       * Used by methods with spec.streaming === true. For these methods, we do not
       * buffer successful responses into memory or do parse them into stripe
       * objects, we delegate that all of that to the user and pass back the raw
       * http.Response object to the callback.
       *
       * (Unsuccessful responses shouldn't make it here, they should
       * still be buffered/parsed and handled by _jsonResponseHandler -- see
       * makeRequest)
       */
      _streamingResponseHandler(requestEvent, usage, callback) {
        return (res) => {
          const headers = res.getHeaders();
          const streamCompleteCallback = /* @__PURE__ */ __name(() => {
            const responseEvent = this._makeResponseEvent(requestEvent, res.getStatusCode(), headers);
            this._stripe._emitter.emit("response", responseEvent);
            this._recordRequestMetrics(this._getRequestId(headers), responseEvent.elapsed, usage);
          }, "streamCompleteCallback");
          const stream = res.toStream(streamCompleteCallback);
          this._addHeadersDirectlyToObject(stream, headers);
          return callback(null, stream);
        };
      }
      /**
       * Default handler for Stripe responses. Buffers the response into memory,
       * parses the JSON and returns it (i.e. passes it to the callback) if there
       * is no "error" field. Otherwise constructs/passes an appropriate Error.
       */
      _jsonResponseHandler(requestEvent, apiMode, usage, callback) {
        return (res) => {
          const headers = res.getHeaders();
          const requestId = this._getRequestId(headers);
          const statusCode = res.getStatusCode();
          const responseEvent = this._makeResponseEvent(requestEvent, statusCode, headers);
          this._stripe._emitter.emit("response", responseEvent);
          res.toJSON().then((jsonResponse) => {
            if (jsonResponse.error) {
              let err;
              if (typeof jsonResponse.error === "string") {
                jsonResponse.error = {
                  type: jsonResponse.error,
                  message: jsonResponse.error_description
                };
              }
              jsonResponse.error.headers = headers;
              jsonResponse.error.statusCode = statusCode;
              jsonResponse.error.requestId = requestId;
              if (statusCode === 401) {
                err = new StripeAuthenticationError(jsonResponse.error);
              } else if (statusCode === 403) {
                err = new StripePermissionError(jsonResponse.error);
              } else if (statusCode === 429) {
                err = new StripeRateLimitError(jsonResponse.error);
              } else if (apiMode === "v2") {
                err = generateV2Error(jsonResponse.error);
              } else {
                err = generateV1Error(jsonResponse.error);
              }
              throw err;
            }
            return jsonResponse;
          }, (e) => {
            throw new StripeAPIError({
              message: "Invalid JSON received from the Stripe API",
              exception: e,
              requestId: headers["request-id"]
            });
          }).then((jsonResponse) => {
            this._recordRequestMetrics(requestId, responseEvent.elapsed, usage);
            const rawResponse = res.getRawResponse();
            this._addHeadersDirectlyToObject(rawResponse, headers);
            Object.defineProperty(jsonResponse, "lastResponse", {
              enumerable: false,
              writable: false,
              value: rawResponse
            });
            callback(null, jsonResponse);
          }, (e) => callback(e, null));
        };
      }
      static _generateConnectionErrorMessage(requestRetries) {
        return `An error occurred with our connection to Stripe.${requestRetries > 0 ? ` Request was retried ${requestRetries} times.` : ""}`;
      }
      // For more on when and how to retry API requests, see https://stripe.com/docs/error-handling#safely-retrying-requests-with-idempotency
      static _shouldRetry(res, numRetries, maxRetries, error3) {
        if (error3 && numRetries === 0 && HttpClient.CONNECTION_CLOSED_ERROR_CODES.includes(error3.code)) {
          return true;
        }
        if (numRetries >= maxRetries) {
          return false;
        }
        if (!res) {
          return true;
        }
        if (res.getHeaders()["stripe-should-retry"] === "false") {
          return false;
        }
        if (res.getHeaders()["stripe-should-retry"] === "true") {
          return true;
        }
        if (res.getStatusCode() === 409) {
          return true;
        }
        if (res.getStatusCode() >= 500) {
          return true;
        }
        return false;
      }
      _getSleepTimeInMS(numRetries, retryAfter = null) {
        const initialNetworkRetryDelay = this._stripe.getInitialNetworkRetryDelay();
        const maxNetworkRetryDelay = this._stripe.getMaxNetworkRetryDelay();
        let sleepSeconds = Math.min(initialNetworkRetryDelay * Math.pow(2, numRetries - 1), maxNetworkRetryDelay);
        sleepSeconds *= 0.5 * (1 + Math.random());
        sleepSeconds = Math.max(initialNetworkRetryDelay, sleepSeconds);
        if (Number.isInteger(retryAfter) && retryAfter <= MAX_RETRY_AFTER_WAIT) {
          sleepSeconds = Math.max(sleepSeconds, retryAfter);
        }
        return sleepSeconds * 1e3;
      }
      // Max retries can be set on a per request basis. Favor those over the global setting
      _getMaxNetworkRetries(settings = {}) {
        return settings.maxNetworkRetries !== void 0 && Number.isInteger(settings.maxNetworkRetries) ? settings.maxNetworkRetries : this._stripe.getMaxNetworkRetries();
      }
      _defaultIdempotencyKey(method, settings, apiMode) {
        const maxRetries = this._getMaxNetworkRetries(settings);
        const genKey = /* @__PURE__ */ __name(() => `stripe-node-retry-${this._stripe._platformFunctions.uuid4()}`, "genKey");
        if (apiMode === "v2") {
          if (method === "POST" || method === "DELETE") {
            return genKey();
          }
        } else if (apiMode === "v1") {
          if (method === "POST" && maxRetries > 0) {
            return genKey();
          }
        }
        return null;
      }
      _makeHeaders({ contentType, contentLength, apiVersion, clientUserAgent, method, userSuppliedHeaders, userSuppliedSettings, stripeAccount, stripeContext, apiMode }) {
        const defaultHeaders = {
          Accept: "application/json",
          "Content-Type": contentType,
          "User-Agent": this._getUserAgentString(apiMode),
          "X-Stripe-Client-User-Agent": clientUserAgent,
          "X-Stripe-Client-Telemetry": this._getTelemetryHeader(),
          "Stripe-Version": apiVersion,
          "Stripe-Account": stripeAccount,
          "Stripe-Context": stripeContext,
          "Idempotency-Key": this._defaultIdempotencyKey(method, userSuppliedSettings, apiMode)
        };
        const methodHasPayload = method == "POST" || method == "PUT" || method == "PATCH";
        if (methodHasPayload || contentLength) {
          if (!methodHasPayload) {
            emitWarning2(`${method} method had non-zero contentLength but no payload is expected for this verb`);
          }
          defaultHeaders["Content-Length"] = contentLength;
        }
        return Object.assign(
          removeNullish(defaultHeaders),
          // If the user supplied, say 'idempotency-key', override instead of appending by ensuring caps are the same.
          normalizeHeaders(userSuppliedHeaders)
        );
      }
      _getUserAgentString(apiMode) {
        const packageVersion = this._stripe.getConstant("PACKAGE_VERSION");
        const appInfo = this._stripe._appInfo ? this._stripe.getAppInfoAsString() : "";
        const aiAgent = this._stripe.getConstant("AI_AGENT");
        let uaString = `Stripe/${apiMode} NodeBindings/${packageVersion}`;
        if (appInfo) {
          uaString += ` ${appInfo}`;
        }
        if (aiAgent) {
          uaString += ` AIAgent/${aiAgent}`;
        }
        return uaString;
      }
      _getTelemetryHeader() {
        if (this._stripe.getTelemetryEnabled() && this._stripe._prevRequestMetrics.length > 0) {
          const metrics = this._stripe._prevRequestMetrics.shift();
          return JSON.stringify({
            last_request_metrics: metrics
          });
        }
      }
      _recordRequestMetrics(requestId, requestDurationMs, usage) {
        if (this._stripe.getTelemetryEnabled() && requestId) {
          if (this._stripe._prevRequestMetrics.length > this._maxBufferedRequestMetric) {
            emitWarning2("Request metrics buffer is full, dropping telemetry message.");
          } else {
            const m = {
              request_id: requestId,
              request_duration_ms: requestDurationMs
            };
            if (usage && usage.length > 0) {
              m.usage = usage;
            }
            this._stripe._prevRequestMetrics.push(m);
          }
        }
      }
      _rawRequest(method, path, params, options, usage) {
        const requestPromise = new Promise((resolve, reject) => {
          let opts;
          try {
            const requestMethod = method.toUpperCase();
            if (requestMethod !== "POST" && params && Object.keys(params).length !== 0) {
              throw new Error("rawRequest only supports params on POST requests. Please pass null and add your parameters to path.");
            }
            const args = [].slice.call([params, options]);
            const dataFromArgs = getDataFromArgs(args);
            const data = requestMethod === "POST" ? Object.assign({}, dataFromArgs) : null;
            const calculatedOptions = getOptionsFromArgs(args);
            const headers2 = calculatedOptions.headers;
            const authenticator2 = calculatedOptions.authenticator;
            opts = {
              requestMethod,
              requestPath: path,
              bodyData: data,
              queryData: {},
              authenticator: authenticator2,
              headers: headers2,
              host: calculatedOptions.host,
              streaming: !!calculatedOptions.streaming,
              settings: {},
              // We use this for thin event internals, so we should record the more specific `usage`, when available
              usage: usage || ["raw_request"]
            };
          } catch (err) {
            reject(err);
            return;
          }
          function requestCallback(err, response) {
            if (err) {
              reject(err);
            } else {
              resolve(response);
            }
          }
          __name(requestCallback, "requestCallback");
          const { headers, settings } = opts;
          const authenticator = opts.authenticator;
          this._request(opts.requestMethod, opts.host, path, opts.bodyData, authenticator, { headers, settings, streaming: opts.streaming }, opts.usage, requestCallback);
        });
        return requestPromise;
      }
      _getContentLength(data) {
        return typeof data === "string" ? new TextEncoder().encode(data).length : data.length;
      }
      _request(method, host, path, data, authenticator, options, usage = [], callback, requestDataProcessor = null) {
        var _a;
        let requestData;
        authenticator = (_a = authenticator !== null && authenticator !== void 0 ? authenticator : this._stripe._authenticator) !== null && _a !== void 0 ? _a : null;
        const apiMode = getAPIMode(path);
        const retryRequest = /* @__PURE__ */ __name((requestFn, apiVersion, headers, requestRetries, retryAfter) => {
          return setTimeout(requestFn, this._getSleepTimeInMS(requestRetries, retryAfter), apiVersion, headers, requestRetries + 1);
        }, "retryRequest");
        const makeRequest = /* @__PURE__ */ __name((apiVersion, headers, numRetries) => {
          const timeout = options.settings && options.settings.timeout && Number.isInteger(options.settings.timeout) && options.settings.timeout >= 0 ? options.settings.timeout : this._stripe.getApiField("timeout");
          const request = {
            host: host || this._stripe.getApiField("host"),
            port: this._stripe.getApiField("port"),
            path,
            method,
            headers: Object.assign({}, headers),
            body: requestData,
            protocol: this._stripe.getApiField("protocol")
          };
          authenticator(request).then(() => {
            const req = this._stripe.getApiField("httpClient").makeRequest(request.host, request.port, request.path, request.method, request.headers, request.body, request.protocol, timeout);
            const requestStartTime = Date.now();
            const requestEvent = removeNullish({
              api_version: apiVersion,
              account: parseHttpHeaderAsString(headers["Stripe-Account"]),
              idempotency_key: parseHttpHeaderAsString(headers["Idempotency-Key"]),
              method,
              path,
              request_start_time: requestStartTime
            });
            const requestRetries = numRetries || 0;
            const maxRetries = this._getMaxNetworkRetries(options.settings || {});
            this._stripe._emitter.emit("request", requestEvent);
            req.then((res) => {
              if (RequestSender._shouldRetry(res, requestRetries, maxRetries)) {
                return retryRequest(makeRequest, apiVersion, headers, requestRetries, parseHttpHeaderAsNumber(res.getHeaders()["retry-after"]));
              } else if (options.streaming && res.getStatusCode() < 400) {
                return this._streamingResponseHandler(requestEvent, usage, callback)(res);
              } else {
                return this._jsonResponseHandler(requestEvent, apiMode, usage, callback)(res);
              }
            }).catch((error3) => {
              if (RequestSender._shouldRetry(null, requestRetries, maxRetries, error3)) {
                return retryRequest(makeRequest, apiVersion, headers, requestRetries, null);
              } else {
                const isTimeoutError = error3.code && error3.code === HttpClient.TIMEOUT_ERROR_CODE;
                return callback(new StripeConnectionError({
                  message: isTimeoutError ? `Request aborted due to timeout being reached (${timeout}ms)` : RequestSender._generateConnectionErrorMessage(requestRetries),
                  detail: error3
                }));
              }
            });
          }).catch((e) => {
            throw new StripeError({
              message: "Unable to authenticate the request",
              exception: e
            });
          });
        }, "makeRequest");
        const prepareAndMakeRequest = /* @__PURE__ */ __name((error3, data2) => {
          if (error3) {
            return callback(error3);
          }
          requestData = data2;
          this._stripe.getClientUserAgent((clientUserAgent) => {
            var _a2, _b, _c;
            const apiVersion = this._stripe.getApiField("version");
            const headers = this._makeHeaders({
              contentType: apiMode == "v2" ? "application/json" : "application/x-www-form-urlencoded",
              contentLength: this._getContentLength(data2),
              apiVersion,
              clientUserAgent,
              method,
              // other callers expect null, but .headers being optional means it's undefined if not supplied. So we normalize to null.
              userSuppliedHeaders: (_a2 = options.headers) !== null && _a2 !== void 0 ? _a2 : null,
              userSuppliedSettings: (_b = options.settings) !== null && _b !== void 0 ? _b : {},
              stripeAccount: (_c = options.stripeAccount) !== null && _c !== void 0 ? _c : this._stripe.getApiField("stripeAccount"),
              stripeContext: this._normalizeStripeContext(options.stripeContext, this._stripe.getApiField("stripeContext")),
              apiMode
            });
            makeRequest(apiVersion, headers, 0);
          });
        }, "prepareAndMakeRequest");
        if (requestDataProcessor) {
          requestDataProcessor(method, data, options.headers, prepareAndMakeRequest);
        } else {
          let stringifiedData;
          if (apiMode == "v2") {
            stringifiedData = data ? jsonStringifyRequestData(data) : "";
          } else {
            stringifiedData = queryStringifyRequestData(data || {});
          }
          prepareAndMakeRequest(null, stringifiedData);
        }
      }
    };
    __name(RequestSender, "RequestSender");
  }
});

// ../node_modules/stripe/esm/autoPagination.js
function getAsyncIteratorSymbol() {
  if (typeof Symbol !== "undefined" && Symbol.asyncIterator) {
    return Symbol.asyncIterator;
  }
  return "@@asyncIterator";
}
function getDoneCallback(args) {
  if (args.length < 2) {
    return null;
  }
  const onDone = args[1];
  if (typeof onDone !== "function") {
    throw Error(`The second argument to autoPagingEach, if present, must be a callback function; received ${typeof onDone}`);
  }
  return onDone;
}
function getItemCallback(args) {
  if (args.length === 0) {
    return void 0;
  }
  const onItem = args[0];
  if (typeof onItem !== "function") {
    throw Error(`The first argument to autoPagingEach, if present, must be a callback function; received ${typeof onItem}`);
  }
  if (onItem.length === 2) {
    return onItem;
  }
  if (onItem.length > 2) {
    throw Error(`The \`onItem\` callback function passed to autoPagingEach must accept at most two arguments; got ${onItem}`);
  }
  return /* @__PURE__ */ __name(function _onItem(item, next) {
    const shouldContinue = onItem(item);
    next(shouldContinue);
  }, "_onItem");
}
function getLastId(listResult, reverseIteration) {
  const lastIdx = reverseIteration ? 0 : listResult.data.length - 1;
  const lastItem = listResult.data[lastIdx];
  const lastId = lastItem && lastItem.id;
  if (!lastId) {
    throw Error("Unexpected: No `id` found on the last item while auto-paging a list.");
  }
  return lastId;
}
function makeAutoPagingEach(asyncIteratorNext) {
  return /* @__PURE__ */ __name(function autoPagingEach() {
    const args = [].slice.call(arguments);
    const onItem = getItemCallback(args);
    const onDone = getDoneCallback(args);
    if (args.length > 2) {
      throw Error(`autoPagingEach takes up to two arguments; received ${args}`);
    }
    const autoPagePromise = wrapAsyncIteratorWithCallback(
      asyncIteratorNext,
      // @ts-ignore we might need a null check
      onItem
    );
    return callbackifyPromiseWithTimeout(autoPagePromise, onDone);
  }, "autoPagingEach");
}
function makeAutoPagingToArray(autoPagingEach) {
  return /* @__PURE__ */ __name(function autoPagingToArray(opts, onDone) {
    const limit = opts && opts.limit;
    if (!limit) {
      throw Error("You must pass a `limit` option to autoPagingToArray, e.g., `autoPagingToArray({limit: 1000});`.");
    }
    if (limit > 1e4) {
      throw Error("You cannot specify a limit of more than 10,000 items to fetch in `autoPagingToArray`; use `autoPagingEach` to iterate through longer lists.");
    }
    const promise = new Promise((resolve, reject) => {
      const items = [];
      autoPagingEach((item) => {
        items.push(item);
        if (items.length >= limit) {
          return false;
        }
      }).then(() => {
        resolve(items);
      }).catch(reject);
    });
    return callbackifyPromiseWithTimeout(promise, onDone);
  }, "autoPagingToArray");
}
function wrapAsyncIteratorWithCallback(asyncIteratorNext, onItem) {
  return new Promise((resolve, reject) => {
    function handleIteration(iterResult) {
      if (iterResult.done) {
        resolve();
        return;
      }
      const item = iterResult.value;
      return new Promise((next) => {
        onItem(item, next);
      }).then((shouldContinue) => {
        if (shouldContinue === false) {
          return handleIteration({ done: true, value: void 0 });
        } else {
          return asyncIteratorNext().then(handleIteration);
        }
      });
    }
    __name(handleIteration, "handleIteration");
    asyncIteratorNext().then(handleIteration).catch(reject);
  });
}
function isReverseIteration(requestArgs) {
  const args = [].slice.call(requestArgs);
  const dataFromArgs = getDataFromArgs(args);
  return !!dataFromArgs.ending_before;
}
var V1Iterator, V1ListIterator, V1SearchIterator, V2ListIterator, makeAutoPaginationMethods, makeAutoPaginationMethodsFromIterator;
var init_autoPagination = __esm({
  "../node_modules/stripe/esm/autoPagination.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils2();
    V1Iterator = class {
      constructor(firstPagePromise, requestArgs, spec, stripeResource) {
        this.index = 0;
        this.pagePromise = firstPagePromise;
        this.promiseCache = { currentPromise: null };
        this.requestArgs = requestArgs;
        this.spec = spec;
        this.stripeResource = stripeResource;
      }
      async iterate(pageResult) {
        if (!(pageResult && pageResult.data && typeof pageResult.data.length === "number")) {
          throw Error("Unexpected: Stripe API response does not have a well-formed `data` array.");
        }
        const reverseIteration = isReverseIteration(this.requestArgs);
        if (this.index < pageResult.data.length) {
          const idx = reverseIteration ? pageResult.data.length - 1 - this.index : this.index;
          const value = pageResult.data[idx];
          this.index += 1;
          return { value, done: false };
        } else if (pageResult.has_more) {
          this.index = 0;
          this.pagePromise = this.getNextPage(pageResult);
          const nextPageResult = await this.pagePromise;
          return this.iterate(nextPageResult);
        }
        return { done: true, value: void 0 };
      }
      /** @abstract */
      getNextPage(_pageResult) {
        throw new Error("Unimplemented");
      }
      async _next() {
        return this.iterate(await this.pagePromise);
      }
      next() {
        if (this.promiseCache.currentPromise) {
          return this.promiseCache.currentPromise;
        }
        const nextPromise = (async () => {
          const ret = await this._next();
          this.promiseCache.currentPromise = null;
          return ret;
        })();
        this.promiseCache.currentPromise = nextPromise;
        return nextPromise;
      }
    };
    __name(V1Iterator, "V1Iterator");
    V1ListIterator = class extends V1Iterator {
      getNextPage(pageResult) {
        const reverseIteration = isReverseIteration(this.requestArgs);
        const lastId = getLastId(pageResult, reverseIteration);
        return this.stripeResource._makeRequest(this.requestArgs, this.spec, {
          [reverseIteration ? "ending_before" : "starting_after"]: lastId
        });
      }
    };
    __name(V1ListIterator, "V1ListIterator");
    V1SearchIterator = class extends V1Iterator {
      getNextPage(pageResult) {
        if (!pageResult.next_page) {
          throw Error("Unexpected: Stripe API response does not have a well-formed `next_page` field, but `has_more` was true.");
        }
        return this.stripeResource._makeRequest(this.requestArgs, this.spec, {
          page: pageResult.next_page
        });
      }
    };
    __name(V1SearchIterator, "V1SearchIterator");
    V2ListIterator = class {
      constructor(firstPagePromise, requestArgs, spec, stripeResource) {
        this.firstPagePromise = firstPagePromise;
        this.currentPageIterator = null;
        this.nextPageUrl = null;
        this.requestArgs = requestArgs;
        this.spec = spec;
        this.stripeResource = stripeResource;
      }
      async initFirstPage() {
        if (this.firstPagePromise) {
          const page = await this.firstPagePromise;
          this.firstPagePromise = null;
          this.currentPageIterator = page.data[Symbol.iterator]();
          this.nextPageUrl = page.next_page_url || null;
        }
      }
      async turnPage() {
        if (!this.nextPageUrl)
          return null;
        this.spec.fullPath = this.nextPageUrl;
        const page = await this.stripeResource._makeRequest([], this.spec, {});
        this.nextPageUrl = page.next_page_url || null;
        this.currentPageIterator = page.data[Symbol.iterator]();
        return this.currentPageIterator;
      }
      async next() {
        await this.initFirstPage();
        if (this.currentPageIterator) {
          const result2 = this.currentPageIterator.next();
          if (!result2.done)
            return { done: false, value: result2.value };
        }
        const nextPageIterator = await this.turnPage();
        if (!nextPageIterator) {
          return { done: true, value: void 0 };
        }
        const result = nextPageIterator.next();
        if (!result.done)
          return { done: false, value: result.value };
        return { done: true, value: void 0 };
      }
    };
    __name(V2ListIterator, "V2ListIterator");
    makeAutoPaginationMethods = /* @__PURE__ */ __name((stripeResource, requestArgs, spec, firstPagePromise) => {
      const apiMode = getAPIMode(spec.fullPath || spec.path);
      if (apiMode !== "v2" && spec.methodType === "search") {
        return makeAutoPaginationMethodsFromIterator(new V1SearchIterator(firstPagePromise, requestArgs, spec, stripeResource));
      }
      if (apiMode !== "v2" && spec.methodType === "list") {
        return makeAutoPaginationMethodsFromIterator(new V1ListIterator(firstPagePromise, requestArgs, spec, stripeResource));
      }
      if (apiMode === "v2" && spec.methodType === "list") {
        return makeAutoPaginationMethodsFromIterator(new V2ListIterator(firstPagePromise, requestArgs, spec, stripeResource));
      }
      return null;
    }, "makeAutoPaginationMethods");
    makeAutoPaginationMethodsFromIterator = /* @__PURE__ */ __name((iterator) => {
      const autoPagingEach = makeAutoPagingEach((...args) => iterator.next(...args));
      const autoPagingToArray = makeAutoPagingToArray(autoPagingEach);
      const autoPaginationMethods = {
        autoPagingEach,
        autoPagingToArray,
        // Async iterator functions:
        next: () => iterator.next(),
        return: () => {
          return {};
        },
        [getAsyncIteratorSymbol()]: () => {
          return autoPaginationMethods;
        }
      };
      return autoPaginationMethods;
    }, "makeAutoPaginationMethodsFromIterator");
    __name(getAsyncIteratorSymbol, "getAsyncIteratorSymbol");
    __name(getDoneCallback, "getDoneCallback");
    __name(getItemCallback, "getItemCallback");
    __name(getLastId, "getLastId");
    __name(makeAutoPagingEach, "makeAutoPagingEach");
    __name(makeAutoPagingToArray, "makeAutoPagingToArray");
    __name(wrapAsyncIteratorWithCallback, "wrapAsyncIteratorWithCallback");
    __name(isReverseIteration, "isReverseIteration");
  }
});

// ../node_modules/stripe/esm/StripeMethod.js
function stripeMethod(spec) {
  if (spec.path !== void 0 && spec.fullPath !== void 0) {
    throw new Error(`Method spec specified both a 'path' (${spec.path}) and a 'fullPath' (${spec.fullPath}).`);
  }
  return function(...args) {
    const callback = typeof args[args.length - 1] == "function" && args.pop();
    spec.urlParams = extractUrlParams(spec.fullPath || this.createResourcePathWithSymbols(spec.path || ""));
    const requestPromise = callbackifyPromiseWithTimeout(this._makeRequest(args, spec, {}), callback);
    Object.assign(requestPromise, makeAutoPaginationMethods(this, args, spec, requestPromise));
    return requestPromise;
  };
}
var init_StripeMethod = __esm({
  "../node_modules/stripe/esm/StripeMethod.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils2();
    init_autoPagination();
    __name(stripeMethod, "stripeMethod");
  }
});

// ../node_modules/stripe/esm/StripeResource.js
function StripeResource(stripe, deprecatedUrlData) {
  this._stripe = stripe;
  if (deprecatedUrlData) {
    throw new Error("Support for curried url params was dropped in stripe-node v7.0.0. Instead, pass two ids.");
  }
  this.basePath = makeURLInterpolator(
    // @ts-ignore changing type of basePath
    this.basePath || stripe.getApiField("basePath")
  );
  this.resourcePath = this.path;
  this.path = makeURLInterpolator(this.path);
  this.initialize(...arguments);
}
var init_StripeResource = __esm({
  "../node_modules/stripe/esm/StripeResource.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils2();
    init_StripeMethod();
    StripeResource.extend = protoExtend;
    StripeResource.method = stripeMethod;
    StripeResource.MAX_BUFFERED_REQUEST_METRICS = 100;
    __name(StripeResource, "StripeResource");
    StripeResource.prototype = {
      _stripe: null,
      // @ts-ignore the type of path changes in ctor
      path: "",
      resourcePath: "",
      // Methods that don't use the API's default '/v1' path can override it with this setting.
      basePath: null,
      initialize() {
      },
      // Function to override the default data processor. This allows full control
      // over how a StripeResource's request data will get converted into an HTTP
      // body. This is useful for non-standard HTTP requests. The function should
      // take method name, data, and headers as arguments.
      requestDataProcessor: null,
      // Function to add a validation checks before sending the request, errors should
      // be thrown, and they will be passed to the callback/promise.
      validateRequest: null,
      createFullPath(commandPath, urlData) {
        const urlParts = [this.basePath(urlData), this.path(urlData)];
        if (typeof commandPath === "function") {
          const computedCommandPath = commandPath(urlData);
          if (computedCommandPath) {
            urlParts.push(computedCommandPath);
          }
        } else {
          urlParts.push(commandPath);
        }
        return this._joinUrlParts(urlParts);
      },
      // Creates a relative resource path with symbols left in (unlike
      // createFullPath which takes some data to replace them with). For example it
      // might produce: /invoices/{id}
      createResourcePathWithSymbols(pathWithSymbols) {
        if (pathWithSymbols) {
          return `/${this._joinUrlParts([this.resourcePath, pathWithSymbols])}`;
        } else {
          return `/${this.resourcePath}`;
        }
      },
      _joinUrlParts(parts) {
        return parts.join("/").replace(/\/{2,}/g, "/");
      },
      _getRequestOpts(requestArgs, spec, overrideData) {
        var _a;
        const requestMethod = (spec.method || "GET").toUpperCase();
        const usage = spec.usage || [];
        const urlParams = spec.urlParams || [];
        const encode = spec.encode || ((data2) => data2);
        const isUsingFullPath = !!spec.fullPath;
        const commandPath = makeURLInterpolator(isUsingFullPath ? spec.fullPath : spec.path || "");
        const path = isUsingFullPath ? spec.fullPath : this.createResourcePathWithSymbols(spec.path);
        const args = [].slice.call(requestArgs);
        const urlData = urlParams.reduce((urlData2, param) => {
          const arg = args.shift();
          if (typeof arg !== "string") {
            throw new Error(`Stripe: Argument "${param}" must be a string, but got: ${arg} (on API request to \`${requestMethod} ${path}\`)`);
          }
          urlData2[param] = arg;
          return urlData2;
        }, {});
        const dataFromArgs = getDataFromArgs(args);
        const data = encode(Object.assign({}, dataFromArgs, overrideData));
        const options = getOptionsFromArgs(args);
        const host = options.host || spec.host;
        const streaming = !!spec.streaming || !!options.streaming;
        if (args.filter((x) => x != null).length) {
          throw new Error(`Stripe: Unknown arguments (${args}). Did you mean to pass an options object? See https://github.com/stripe/stripe-node/wiki/Passing-Options. (on API request to ${requestMethod} \`${path}\`)`);
        }
        const requestPath = isUsingFullPath ? commandPath(urlData) : this.createFullPath(commandPath, urlData);
        const headers = Object.assign(options.headers, spec.headers);
        if (spec.validator) {
          spec.validator(data, { headers });
        }
        const dataInQuery = spec.method === "GET" || spec.method === "DELETE";
        const bodyData = dataInQuery ? null : data;
        const queryData = dataInQuery ? data : {};
        return {
          requestMethod,
          requestPath,
          bodyData,
          queryData,
          authenticator: (_a = options.authenticator) !== null && _a !== void 0 ? _a : null,
          headers,
          host: host !== null && host !== void 0 ? host : null,
          streaming,
          settings: options.settings,
          usage
        };
      },
      _makeRequest(requestArgs, spec, overrideData) {
        return new Promise((resolve, reject) => {
          var _a;
          let opts;
          try {
            opts = this._getRequestOpts(requestArgs, spec, overrideData);
          } catch (err) {
            reject(err);
            return;
          }
          function requestCallback(err, response) {
            if (err) {
              reject(err);
            } else {
              resolve(spec.transformResponseData ? spec.transformResponseData(response) : response);
            }
          }
          __name(requestCallback, "requestCallback");
          const emptyQuery = Object.keys(opts.queryData).length === 0;
          const path = [
            opts.requestPath,
            emptyQuery ? "" : "?",
            queryStringifyRequestData(opts.queryData)
          ].join("");
          const { headers, settings } = opts;
          this._stripe._requestSender._request(opts.requestMethod, opts.host, path, opts.bodyData, opts.authenticator, {
            headers,
            settings,
            streaming: opts.streaming
          }, opts.usage, requestCallback, (_a = this.requestDataProcessor) === null || _a === void 0 ? void 0 : _a.bind(this));
        });
      }
    };
  }
});

// ../node_modules/stripe/esm/StripeContext.js
var StripeContext;
var init_StripeContext = __esm({
  "../node_modules/stripe/esm/StripeContext.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    StripeContext = class {
      /**
       * Creates a new StripeContext with the given segments.
       */
      constructor(segments = []) {
        this._segments = [...segments];
      }
      /**
       * Gets a copy of the segments of this Context.
       */
      get segments() {
        return [...this._segments];
      }
      /**
       * Creates a new StripeContext with an additional segment appended.
       */
      push(segment) {
        if (!segment) {
          throw new Error("Segment cannot be null or undefined");
        }
        return new StripeContext([...this._segments, segment]);
      }
      /**
       * Creates a new StripeContext with the last segment removed.
       * If there are no segments, throws an error.
       */
      pop() {
        if (this._segments.length === 0) {
          throw new Error("Cannot pop from an empty context");
        }
        return new StripeContext(this._segments.slice(0, -1));
      }
      /**
       * Converts this context to its string representation.
       */
      toString() {
        return this._segments.join("/");
      }
      /**
       * Parses a context string into a StripeContext instance.
       */
      static parse(contextStr) {
        if (!contextStr) {
          return new StripeContext([]);
        }
        return new StripeContext(contextStr.split("/"));
      }
    };
    __name(StripeContext, "StripeContext");
  }
});

// ../node_modules/stripe/esm/Webhooks.js
function createWebhooks(platformFunctions) {
  const Webhook = {
    DEFAULT_TOLERANCE: 300,
    signature: null,
    constructEvent(payload, header, secret, tolerance, cryptoProvider, receivedAt) {
      try {
        if (!this.signature) {
          throw new Error("ERR: missing signature helper, unable to verify");
        }
        this.signature.verifyHeader(payload, header, secret, tolerance || Webhook.DEFAULT_TOLERANCE, cryptoProvider, receivedAt);
      } catch (e) {
        if (e instanceof CryptoProviderOnlySupportsAsyncError) {
          e.message += "\nUse `await constructEventAsync(...)` instead of `constructEvent(...)`";
        }
        throw e;
      }
      const jsonPayload = payload instanceof Uint8Array ? JSON.parse(new TextDecoder("utf8").decode(payload)) : JSON.parse(payload);
      return jsonPayload;
    },
    async constructEventAsync(payload, header, secret, tolerance, cryptoProvider, receivedAt) {
      if (!this.signature) {
        throw new Error("ERR: missing signature helper, unable to verify");
      }
      await this.signature.verifyHeaderAsync(payload, header, secret, tolerance || Webhook.DEFAULT_TOLERANCE, cryptoProvider, receivedAt);
      const jsonPayload = payload instanceof Uint8Array ? JSON.parse(new TextDecoder("utf8").decode(payload)) : JSON.parse(payload);
      return jsonPayload;
    },
    /**
     * Generates a header to be used for webhook mocking
     *
     * @typedef {object} opts
     * @property {number} timestamp - Timestamp of the header. Defaults to Date.now()
     * @property {string} payload - JSON stringified payload object, containing the 'id' and 'object' parameters
     * @property {string} secret - Stripe webhook secret 'whsec_...'
     * @property {string} scheme - Version of API to hit. Defaults to 'v1'.
     * @property {string} signature - Computed webhook signature
     * @property {CryptoProvider} cryptoProvider - Crypto provider to use for computing the signature if none was provided. Defaults to NodeCryptoProvider.
     */
    generateTestHeaderString: function(opts) {
      const preparedOpts = prepareOptions(opts);
      const signature2 = preparedOpts.signature || preparedOpts.cryptoProvider.computeHMACSignature(preparedOpts.payloadString, preparedOpts.secret);
      return preparedOpts.generateHeaderString(signature2);
    },
    generateTestHeaderStringAsync: async function(opts) {
      const preparedOpts = prepareOptions(opts);
      const signature2 = preparedOpts.signature || await preparedOpts.cryptoProvider.computeHMACSignatureAsync(preparedOpts.payloadString, preparedOpts.secret);
      return preparedOpts.generateHeaderString(signature2);
    }
  };
  const signature = {
    EXPECTED_SCHEME: "v1",
    verifyHeader(encodedPayload, encodedHeader, secret, tolerance, cryptoProvider, receivedAt) {
      const { decodedHeader: header, decodedPayload: payload, details, suspectPayloadType } = parseEventDetails(encodedPayload, encodedHeader, this.EXPECTED_SCHEME);
      const secretContainsWhitespace = /\s/.test(secret);
      cryptoProvider = cryptoProvider || getCryptoProvider();
      const expectedSignature = cryptoProvider.computeHMACSignature(makeHMACContent(payload, details), secret);
      validateComputedSignature(payload, header, details, expectedSignature, tolerance, suspectPayloadType, secretContainsWhitespace, receivedAt);
      return true;
    },
    async verifyHeaderAsync(encodedPayload, encodedHeader, secret, tolerance, cryptoProvider, receivedAt) {
      const { decodedHeader: header, decodedPayload: payload, details, suspectPayloadType } = parseEventDetails(encodedPayload, encodedHeader, this.EXPECTED_SCHEME);
      const secretContainsWhitespace = /\s/.test(secret);
      cryptoProvider = cryptoProvider || getCryptoProvider();
      const expectedSignature = await cryptoProvider.computeHMACSignatureAsync(makeHMACContent(payload, details), secret);
      return validateComputedSignature(payload, header, details, expectedSignature, tolerance, suspectPayloadType, secretContainsWhitespace, receivedAt);
    }
  };
  function makeHMACContent(payload, details) {
    return `${details.timestamp}.${payload}`;
  }
  __name(makeHMACContent, "makeHMACContent");
  function parseEventDetails(encodedPayload, encodedHeader, expectedScheme) {
    if (!encodedPayload) {
      throw new StripeSignatureVerificationError(encodedHeader, encodedPayload, {
        message: "No webhook payload was provided."
      });
    }
    const suspectPayloadType = typeof encodedPayload != "string" && !(encodedPayload instanceof Uint8Array);
    const textDecoder = new TextDecoder("utf8");
    const decodedPayload = encodedPayload instanceof Uint8Array ? textDecoder.decode(encodedPayload) : encodedPayload;
    if (Array.isArray(encodedHeader)) {
      throw new Error("Unexpected: An array was passed as a header, which should not be possible for the stripe-signature header.");
    }
    if (encodedHeader == null || encodedHeader == "") {
      throw new StripeSignatureVerificationError(encodedHeader, encodedPayload, {
        message: "No stripe-signature header value was provided."
      });
    }
    const decodedHeader = encodedHeader instanceof Uint8Array ? textDecoder.decode(encodedHeader) : encodedHeader;
    const details = parseHeader(decodedHeader, expectedScheme);
    if (!details || details.timestamp === -1) {
      throw new StripeSignatureVerificationError(decodedHeader, decodedPayload, {
        message: "Unable to extract timestamp and signatures from header"
      });
    }
    if (!details.signatures.length) {
      throw new StripeSignatureVerificationError(decodedHeader, decodedPayload, {
        message: "No signatures found with expected scheme"
      });
    }
    return {
      decodedPayload,
      decodedHeader,
      details,
      suspectPayloadType
    };
  }
  __name(parseEventDetails, "parseEventDetails");
  function validateComputedSignature(payload, header, details, expectedSignature, tolerance, suspectPayloadType, secretContainsWhitespace, receivedAt) {
    const signatureFound = !!details.signatures.filter(platformFunctions.secureCompare.bind(platformFunctions, expectedSignature)).length;
    const docsLocation = "\nLearn more about webhook signing and explore webhook integration examples for various frameworks at https://docs.stripe.com/webhooks/signature";
    const whitespaceMessage = secretContainsWhitespace ? "\n\nNote: The provided signing secret contains whitespace. This often indicates an extra newline or space is in the value" : "";
    if (!signatureFound) {
      if (suspectPayloadType) {
        throw new StripeSignatureVerificationError(header, payload, {
          message: "Webhook payload must be provided as a string or a Buffer (https://nodejs.org/api/buffer.html) instance representing the _raw_ request body.Payload was provided as a parsed JavaScript object instead. \nSignature verification is impossible without access to the original signed material. \n" + docsLocation + "\n" + whitespaceMessage
        });
      }
      throw new StripeSignatureVerificationError(header, payload, {
        message: "No signatures found matching the expected signature for payload. Are you passing the raw request body you received from Stripe? \n If a webhook request is being forwarded by a third-party tool, ensure that the exact request body, including JSON formatting and new line style, is preserved.\n" + docsLocation + "\n" + whitespaceMessage
      });
    }
    const timestampAge = Math.floor((typeof receivedAt === "number" ? receivedAt : Date.now()) / 1e3) - details.timestamp;
    if (tolerance > 0 && timestampAge > tolerance) {
      throw new StripeSignatureVerificationError(header, payload, {
        message: "Timestamp outside the tolerance zone"
      });
    }
    return true;
  }
  __name(validateComputedSignature, "validateComputedSignature");
  function parseHeader(header, scheme) {
    if (typeof header !== "string") {
      return null;
    }
    return header.split(",").reduce((accum, item) => {
      const kv = item.split("=");
      if (kv[0] === "t") {
        accum.timestamp = parseInt(kv[1], 10);
      }
      if (kv[0] === scheme) {
        accum.signatures.push(kv[1]);
      }
      return accum;
    }, {
      timestamp: -1,
      signatures: []
    });
  }
  __name(parseHeader, "parseHeader");
  let webhooksCryptoProviderInstance = null;
  function getCryptoProvider() {
    if (!webhooksCryptoProviderInstance) {
      webhooksCryptoProviderInstance = platformFunctions.createDefaultCryptoProvider();
    }
    return webhooksCryptoProviderInstance;
  }
  __name(getCryptoProvider, "getCryptoProvider");
  function prepareOptions(opts) {
    if (!opts) {
      throw new StripeError({
        message: "Options are required"
      });
    }
    const timestamp = Math.floor(opts.timestamp) || Math.floor(Date.now() / 1e3);
    const scheme = opts.scheme || signature.EXPECTED_SCHEME;
    const cryptoProvider = opts.cryptoProvider || getCryptoProvider();
    const payloadString = `${timestamp}.${opts.payload}`;
    const generateHeaderString = /* @__PURE__ */ __name((signature2) => {
      return `t=${timestamp},${scheme}=${signature2}`;
    }, "generateHeaderString");
    return Object.assign(Object.assign({}, opts), {
      timestamp,
      scheme,
      cryptoProvider,
      payloadString,
      generateHeaderString
    });
  }
  __name(prepareOptions, "prepareOptions");
  Webhook.signature = signature;
  return Webhook;
}
var init_Webhooks = __esm({
  "../node_modules/stripe/esm/Webhooks.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_Error();
    init_CryptoProvider();
    __name(createWebhooks, "createWebhooks");
  }
});

// ../node_modules/stripe/esm/apiVersion.js
var ApiVersion;
var init_apiVersion = __esm({
  "../node_modules/stripe/esm/apiVersion.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ApiVersion = "2026-02-25.clover";
  }
});

// ../node_modules/stripe/esm/ResourceNamespace.js
function ResourceNamespace(stripe, resources) {
  for (const name in resources) {
    if (!Object.prototype.hasOwnProperty.call(resources, name)) {
      continue;
    }
    const camelCaseName = name[0].toLowerCase() + name.substring(1);
    const resource = new resources[name](stripe);
    this[camelCaseName] = resource;
  }
}
function resourceNamespace(namespace, resources) {
  return function(stripe) {
    return new ResourceNamespace(stripe, resources);
  };
}
var init_ResourceNamespace = __esm({
  "../node_modules/stripe/esm/ResourceNamespace.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(ResourceNamespace, "ResourceNamespace");
    __name(resourceNamespace, "resourceNamespace");
  }
});

// ../node_modules/stripe/esm/resources/V2/Core/AccountLinks.js
var stripeMethod2, AccountLinks;
var init_AccountLinks = __esm({
  "../node_modules/stripe/esm/resources/V2/Core/AccountLinks.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod2 = StripeResource.method;
    AccountLinks = StripeResource.extend({
      create: stripeMethod2({ method: "POST", fullPath: "/v2/core/account_links" })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Core/AccountTokens.js
var stripeMethod3, AccountTokens;
var init_AccountTokens = __esm({
  "../node_modules/stripe/esm/resources/V2/Core/AccountTokens.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod3 = StripeResource.method;
    AccountTokens = StripeResource.extend({
      create: stripeMethod3({ method: "POST", fullPath: "/v2/core/account_tokens" }),
      retrieve: stripeMethod3({
        method: "GET",
        fullPath: "/v2/core/account_tokens/{id}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/FinancialConnections/Accounts.js
var stripeMethod4, Accounts;
var init_Accounts = __esm({
  "../node_modules/stripe/esm/resources/FinancialConnections/Accounts.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod4 = StripeResource.method;
    Accounts = StripeResource.extend({
      retrieve: stripeMethod4({
        method: "GET",
        fullPath: "/v1/financial_connections/accounts/{account}"
      }),
      list: stripeMethod4({
        method: "GET",
        fullPath: "/v1/financial_connections/accounts",
        methodType: "list"
      }),
      disconnect: stripeMethod4({
        method: "POST",
        fullPath: "/v1/financial_connections/accounts/{account}/disconnect"
      }),
      listOwners: stripeMethod4({
        method: "GET",
        fullPath: "/v1/financial_connections/accounts/{account}/owners",
        methodType: "list"
      }),
      refresh: stripeMethod4({
        method: "POST",
        fullPath: "/v1/financial_connections/accounts/{account}/refresh"
      }),
      subscribe: stripeMethod4({
        method: "POST",
        fullPath: "/v1/financial_connections/accounts/{account}/subscribe"
      }),
      unsubscribe: stripeMethod4({
        method: "POST",
        fullPath: "/v1/financial_connections/accounts/{account}/unsubscribe"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Core/Accounts/Persons.js
var stripeMethod5, Persons;
var init_Persons = __esm({
  "../node_modules/stripe/esm/resources/V2/Core/Accounts/Persons.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod5 = StripeResource.method;
    Persons = StripeResource.extend({
      create: stripeMethod5({
        method: "POST",
        fullPath: "/v2/core/accounts/{account_id}/persons"
      }),
      retrieve: stripeMethod5({
        method: "GET",
        fullPath: "/v2/core/accounts/{account_id}/persons/{id}"
      }),
      update: stripeMethod5({
        method: "POST",
        fullPath: "/v2/core/accounts/{account_id}/persons/{id}"
      }),
      list: stripeMethod5({
        method: "GET",
        fullPath: "/v2/core/accounts/{account_id}/persons",
        methodType: "list"
      }),
      del: stripeMethod5({
        method: "DELETE",
        fullPath: "/v2/core/accounts/{account_id}/persons/{id}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Core/Accounts/PersonTokens.js
var stripeMethod6, PersonTokens;
var init_PersonTokens = __esm({
  "../node_modules/stripe/esm/resources/V2/Core/Accounts/PersonTokens.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod6 = StripeResource.method;
    PersonTokens = StripeResource.extend({
      create: stripeMethod6({
        method: "POST",
        fullPath: "/v2/core/accounts/{account_id}/person_tokens"
      }),
      retrieve: stripeMethod6({
        method: "GET",
        fullPath: "/v2/core/accounts/{account_id}/person_tokens/{id}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Core/Accounts.js
var stripeMethod7, Accounts2;
var init_Accounts2 = __esm({
  "../node_modules/stripe/esm/resources/V2/Core/Accounts.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    init_Persons();
    init_PersonTokens();
    stripeMethod7 = StripeResource.method;
    Accounts2 = StripeResource.extend({
      constructor: function(...args) {
        StripeResource.apply(this, args);
        this.persons = new Persons(...args);
        this.personTokens = new PersonTokens(...args);
      },
      create: stripeMethod7({ method: "POST", fullPath: "/v2/core/accounts" }),
      retrieve: stripeMethod7({ method: "GET", fullPath: "/v2/core/accounts/{id}" }),
      update: stripeMethod7({ method: "POST", fullPath: "/v2/core/accounts/{id}" }),
      list: stripeMethod7({
        method: "GET",
        fullPath: "/v2/core/accounts",
        methodType: "list"
      }),
      close: stripeMethod7({
        method: "POST",
        fullPath: "/v2/core/accounts/{id}/close"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Entitlements/ActiveEntitlements.js
var stripeMethod8, ActiveEntitlements;
var init_ActiveEntitlements = __esm({
  "../node_modules/stripe/esm/resources/Entitlements/ActiveEntitlements.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod8 = StripeResource.method;
    ActiveEntitlements = StripeResource.extend({
      retrieve: stripeMethod8({
        method: "GET",
        fullPath: "/v1/entitlements/active_entitlements/{id}"
      }),
      list: stripeMethod8({
        method: "GET",
        fullPath: "/v1/entitlements/active_entitlements",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Billing/Alerts.js
var stripeMethod9, Alerts;
var init_Alerts = __esm({
  "../node_modules/stripe/esm/resources/Billing/Alerts.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod9 = StripeResource.method;
    Alerts = StripeResource.extend({
      create: stripeMethod9({ method: "POST", fullPath: "/v1/billing/alerts" }),
      retrieve: stripeMethod9({ method: "GET", fullPath: "/v1/billing/alerts/{id}" }),
      list: stripeMethod9({
        method: "GET",
        fullPath: "/v1/billing/alerts",
        methodType: "list"
      }),
      activate: stripeMethod9({
        method: "POST",
        fullPath: "/v1/billing/alerts/{id}/activate"
      }),
      archive: stripeMethod9({
        method: "POST",
        fullPath: "/v1/billing/alerts/{id}/archive"
      }),
      deactivate: stripeMethod9({
        method: "POST",
        fullPath: "/v1/billing/alerts/{id}/deactivate"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Tax/Associations.js
var stripeMethod10, Associations;
var init_Associations = __esm({
  "../node_modules/stripe/esm/resources/Tax/Associations.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod10 = StripeResource.method;
    Associations = StripeResource.extend({
      find: stripeMethod10({ method: "GET", fullPath: "/v1/tax/associations/find" })
    });
  }
});

// ../node_modules/stripe/esm/resources/Issuing/Authorizations.js
var stripeMethod11, Authorizations;
var init_Authorizations = __esm({
  "../node_modules/stripe/esm/resources/Issuing/Authorizations.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod11 = StripeResource.method;
    Authorizations = StripeResource.extend({
      retrieve: stripeMethod11({
        method: "GET",
        fullPath: "/v1/issuing/authorizations/{authorization}"
      }),
      update: stripeMethod11({
        method: "POST",
        fullPath: "/v1/issuing/authorizations/{authorization}"
      }),
      list: stripeMethod11({
        method: "GET",
        fullPath: "/v1/issuing/authorizations",
        methodType: "list"
      }),
      approve: stripeMethod11({
        method: "POST",
        fullPath: "/v1/issuing/authorizations/{authorization}/approve"
      }),
      decline: stripeMethod11({
        method: "POST",
        fullPath: "/v1/issuing/authorizations/{authorization}/decline"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Issuing/Authorizations.js
var stripeMethod12, Authorizations2;
var init_Authorizations2 = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Issuing/Authorizations.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod12 = StripeResource.method;
    Authorizations2 = StripeResource.extend({
      create: stripeMethod12({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/authorizations"
      }),
      capture: stripeMethod12({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/authorizations/{authorization}/capture"
      }),
      expire: stripeMethod12({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/authorizations/{authorization}/expire"
      }),
      finalizeAmount: stripeMethod12({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/authorizations/{authorization}/finalize_amount"
      }),
      increment: stripeMethod12({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/authorizations/{authorization}/increment"
      }),
      respond: stripeMethod12({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/authorizations/{authorization}/fraud_challenges/respond"
      }),
      reverse: stripeMethod12({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/authorizations/{authorization}/reverse"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Tax/Calculations.js
var stripeMethod13, Calculations;
var init_Calculations = __esm({
  "../node_modules/stripe/esm/resources/Tax/Calculations.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod13 = StripeResource.method;
    Calculations = StripeResource.extend({
      create: stripeMethod13({ method: "POST", fullPath: "/v1/tax/calculations" }),
      retrieve: stripeMethod13({
        method: "GET",
        fullPath: "/v1/tax/calculations/{calculation}"
      }),
      listLineItems: stripeMethod13({
        method: "GET",
        fullPath: "/v1/tax/calculations/{calculation}/line_items",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Issuing/Cardholders.js
var stripeMethod14, Cardholders;
var init_Cardholders = __esm({
  "../node_modules/stripe/esm/resources/Issuing/Cardholders.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod14 = StripeResource.method;
    Cardholders = StripeResource.extend({
      create: stripeMethod14({ method: "POST", fullPath: "/v1/issuing/cardholders" }),
      retrieve: stripeMethod14({
        method: "GET",
        fullPath: "/v1/issuing/cardholders/{cardholder}"
      }),
      update: stripeMethod14({
        method: "POST",
        fullPath: "/v1/issuing/cardholders/{cardholder}"
      }),
      list: stripeMethod14({
        method: "GET",
        fullPath: "/v1/issuing/cardholders",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Issuing/Cards.js
var stripeMethod15, Cards;
var init_Cards = __esm({
  "../node_modules/stripe/esm/resources/Issuing/Cards.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod15 = StripeResource.method;
    Cards = StripeResource.extend({
      create: stripeMethod15({ method: "POST", fullPath: "/v1/issuing/cards" }),
      retrieve: stripeMethod15({ method: "GET", fullPath: "/v1/issuing/cards/{card}" }),
      update: stripeMethod15({ method: "POST", fullPath: "/v1/issuing/cards/{card}" }),
      list: stripeMethod15({
        method: "GET",
        fullPath: "/v1/issuing/cards",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Issuing/Cards.js
var stripeMethod16, Cards2;
var init_Cards2 = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Issuing/Cards.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod16 = StripeResource.method;
    Cards2 = StripeResource.extend({
      deliverCard: stripeMethod16({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/cards/{card}/shipping/deliver"
      }),
      failCard: stripeMethod16({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/cards/{card}/shipping/fail"
      }),
      returnCard: stripeMethod16({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/cards/{card}/shipping/return"
      }),
      shipCard: stripeMethod16({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/cards/{card}/shipping/ship"
      }),
      submitCard: stripeMethod16({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/cards/{card}/shipping/submit"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/BillingPortal/Configurations.js
var stripeMethod17, Configurations;
var init_Configurations = __esm({
  "../node_modules/stripe/esm/resources/BillingPortal/Configurations.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod17 = StripeResource.method;
    Configurations = StripeResource.extend({
      create: stripeMethod17({
        method: "POST",
        fullPath: "/v1/billing_portal/configurations"
      }),
      retrieve: stripeMethod17({
        method: "GET",
        fullPath: "/v1/billing_portal/configurations/{configuration}"
      }),
      update: stripeMethod17({
        method: "POST",
        fullPath: "/v1/billing_portal/configurations/{configuration}"
      }),
      list: stripeMethod17({
        method: "GET",
        fullPath: "/v1/billing_portal/configurations",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Terminal/Configurations.js
var stripeMethod18, Configurations2;
var init_Configurations2 = __esm({
  "../node_modules/stripe/esm/resources/Terminal/Configurations.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod18 = StripeResource.method;
    Configurations2 = StripeResource.extend({
      create: stripeMethod18({
        method: "POST",
        fullPath: "/v1/terminal/configurations"
      }),
      retrieve: stripeMethod18({
        method: "GET",
        fullPath: "/v1/terminal/configurations/{configuration}"
      }),
      update: stripeMethod18({
        method: "POST",
        fullPath: "/v1/terminal/configurations/{configuration}"
      }),
      list: stripeMethod18({
        method: "GET",
        fullPath: "/v1/terminal/configurations",
        methodType: "list"
      }),
      del: stripeMethod18({
        method: "DELETE",
        fullPath: "/v1/terminal/configurations/{configuration}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/ConfirmationTokens.js
var stripeMethod19, ConfirmationTokens;
var init_ConfirmationTokens = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/ConfirmationTokens.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod19 = StripeResource.method;
    ConfirmationTokens = StripeResource.extend({
      create: stripeMethod19({
        method: "POST",
        fullPath: "/v1/test_helpers/confirmation_tokens"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Terminal/ConnectionTokens.js
var stripeMethod20, ConnectionTokens;
var init_ConnectionTokens = __esm({
  "../node_modules/stripe/esm/resources/Terminal/ConnectionTokens.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod20 = StripeResource.method;
    ConnectionTokens = StripeResource.extend({
      create: stripeMethod20({
        method: "POST",
        fullPath: "/v1/terminal/connection_tokens"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Billing/CreditBalanceSummary.js
var stripeMethod21, CreditBalanceSummary;
var init_CreditBalanceSummary = __esm({
  "../node_modules/stripe/esm/resources/Billing/CreditBalanceSummary.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod21 = StripeResource.method;
    CreditBalanceSummary = StripeResource.extend({
      retrieve: stripeMethod21({
        method: "GET",
        fullPath: "/v1/billing/credit_balance_summary"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Billing/CreditBalanceTransactions.js
var stripeMethod22, CreditBalanceTransactions;
var init_CreditBalanceTransactions = __esm({
  "../node_modules/stripe/esm/resources/Billing/CreditBalanceTransactions.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod22 = StripeResource.method;
    CreditBalanceTransactions = StripeResource.extend({
      retrieve: stripeMethod22({
        method: "GET",
        fullPath: "/v1/billing/credit_balance_transactions/{id}"
      }),
      list: stripeMethod22({
        method: "GET",
        fullPath: "/v1/billing/credit_balance_transactions",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Billing/CreditGrants.js
var stripeMethod23, CreditGrants;
var init_CreditGrants = __esm({
  "../node_modules/stripe/esm/resources/Billing/CreditGrants.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod23 = StripeResource.method;
    CreditGrants = StripeResource.extend({
      create: stripeMethod23({ method: "POST", fullPath: "/v1/billing/credit_grants" }),
      retrieve: stripeMethod23({
        method: "GET",
        fullPath: "/v1/billing/credit_grants/{id}"
      }),
      update: stripeMethod23({
        method: "POST",
        fullPath: "/v1/billing/credit_grants/{id}"
      }),
      list: stripeMethod23({
        method: "GET",
        fullPath: "/v1/billing/credit_grants",
        methodType: "list"
      }),
      expire: stripeMethod23({
        method: "POST",
        fullPath: "/v1/billing/credit_grants/{id}/expire"
      }),
      voidGrant: stripeMethod23({
        method: "POST",
        fullPath: "/v1/billing/credit_grants/{id}/void"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/CreditReversals.js
var stripeMethod24, CreditReversals;
var init_CreditReversals = __esm({
  "../node_modules/stripe/esm/resources/Treasury/CreditReversals.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod24 = StripeResource.method;
    CreditReversals = StripeResource.extend({
      create: stripeMethod24({
        method: "POST",
        fullPath: "/v1/treasury/credit_reversals"
      }),
      retrieve: stripeMethod24({
        method: "GET",
        fullPath: "/v1/treasury/credit_reversals/{credit_reversal}"
      }),
      list: stripeMethod24({
        method: "GET",
        fullPath: "/v1/treasury/credit_reversals",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Customers.js
var stripeMethod25, Customers;
var init_Customers = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Customers.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod25 = StripeResource.method;
    Customers = StripeResource.extend({
      fundCashBalance: stripeMethod25({
        method: "POST",
        fullPath: "/v1/test_helpers/customers/{customer}/fund_cash_balance"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/DebitReversals.js
var stripeMethod26, DebitReversals;
var init_DebitReversals = __esm({
  "../node_modules/stripe/esm/resources/Treasury/DebitReversals.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod26 = StripeResource.method;
    DebitReversals = StripeResource.extend({
      create: stripeMethod26({
        method: "POST",
        fullPath: "/v1/treasury/debit_reversals"
      }),
      retrieve: stripeMethod26({
        method: "GET",
        fullPath: "/v1/treasury/debit_reversals/{debit_reversal}"
      }),
      list: stripeMethod26({
        method: "GET",
        fullPath: "/v1/treasury/debit_reversals",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Issuing/Disputes.js
var stripeMethod27, Disputes;
var init_Disputes = __esm({
  "../node_modules/stripe/esm/resources/Issuing/Disputes.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod27 = StripeResource.method;
    Disputes = StripeResource.extend({
      create: stripeMethod27({ method: "POST", fullPath: "/v1/issuing/disputes" }),
      retrieve: stripeMethod27({
        method: "GET",
        fullPath: "/v1/issuing/disputes/{dispute}"
      }),
      update: stripeMethod27({
        method: "POST",
        fullPath: "/v1/issuing/disputes/{dispute}"
      }),
      list: stripeMethod27({
        method: "GET",
        fullPath: "/v1/issuing/disputes",
        methodType: "list"
      }),
      submit: stripeMethod27({
        method: "POST",
        fullPath: "/v1/issuing/disputes/{dispute}/submit"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Radar/EarlyFraudWarnings.js
var stripeMethod28, EarlyFraudWarnings;
var init_EarlyFraudWarnings = __esm({
  "../node_modules/stripe/esm/resources/Radar/EarlyFraudWarnings.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod28 = StripeResource.method;
    EarlyFraudWarnings = StripeResource.extend({
      retrieve: stripeMethod28({
        method: "GET",
        fullPath: "/v1/radar/early_fraud_warnings/{early_fraud_warning}"
      }),
      list: stripeMethod28({
        method: "GET",
        fullPath: "/v1/radar/early_fraud_warnings",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Core/EventDestinations.js
var stripeMethod29, EventDestinations;
var init_EventDestinations = __esm({
  "../node_modules/stripe/esm/resources/V2/Core/EventDestinations.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod29 = StripeResource.method;
    EventDestinations = StripeResource.extend({
      create: stripeMethod29({
        method: "POST",
        fullPath: "/v2/core/event_destinations"
      }),
      retrieve: stripeMethod29({
        method: "GET",
        fullPath: "/v2/core/event_destinations/{id}"
      }),
      update: stripeMethod29({
        method: "POST",
        fullPath: "/v2/core/event_destinations/{id}"
      }),
      list: stripeMethod29({
        method: "GET",
        fullPath: "/v2/core/event_destinations",
        methodType: "list"
      }),
      del: stripeMethod29({
        method: "DELETE",
        fullPath: "/v2/core/event_destinations/{id}"
      }),
      disable: stripeMethod29({
        method: "POST",
        fullPath: "/v2/core/event_destinations/{id}/disable"
      }),
      enable: stripeMethod29({
        method: "POST",
        fullPath: "/v2/core/event_destinations/{id}/enable"
      }),
      ping: stripeMethod29({
        method: "POST",
        fullPath: "/v2/core/event_destinations/{id}/ping"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Core/Events.js
var stripeMethod30, Events;
var init_Events = __esm({
  "../node_modules/stripe/esm/resources/V2/Core/Events.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod30 = StripeResource.method;
    Events = StripeResource.extend({
      retrieve(...args) {
        const transformResponseData = /* @__PURE__ */ __name((response) => {
          return this.addFetchRelatedObjectIfNeeded(response);
        }, "transformResponseData");
        return stripeMethod30({
          method: "GET",
          fullPath: "/v2/core/events/{id}",
          transformResponseData
        }).apply(this, args);
      },
      list(...args) {
        const transformResponseData = /* @__PURE__ */ __name((response) => {
          return Object.assign(Object.assign({}, response), { data: response.data.map(this.addFetchRelatedObjectIfNeeded.bind(this)) });
        }, "transformResponseData");
        return stripeMethod30({
          method: "GET",
          fullPath: "/v2/core/events",
          methodType: "list",
          transformResponseData
        }).apply(this, args);
      },
      /**
       * @private
       *
       * For internal use in stripe-node.
       *
       * @param pulledEvent The retrieved event object
       * @returns The retrieved event object with a fetchRelatedObject method,
       * if pulledEvent.related_object is valid (non-null and has a url)
       */
      addFetchRelatedObjectIfNeeded(pulledEvent) {
        if (!pulledEvent.related_object || !pulledEvent.related_object.url) {
          return pulledEvent;
        }
        return Object.assign(Object.assign({}, pulledEvent), { fetchRelatedObject: () => (
          // call stripeMethod with 'this' resource to fetch
          // the related object. 'this' is needed to construct
          // and send the request, but the method spec controls
          // the url endpoint and method, so it doesn't matter
          // that 'this' is an Events resource object here
          stripeMethod30({
            method: "GET",
            fullPath: pulledEvent.related_object.url
          }).apply(this, [
            {
              stripeContext: pulledEvent.context,
              headers: {
                "Stripe-Request-Trigger": `event=${pulledEvent.id}`
              }
            }
          ])
        ) });
      }
    });
  }
});

// ../node_modules/stripe/esm/resources/Entitlements/Features.js
var stripeMethod31, Features;
var init_Features = __esm({
  "../node_modules/stripe/esm/resources/Entitlements/Features.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod31 = StripeResource.method;
    Features = StripeResource.extend({
      create: stripeMethod31({ method: "POST", fullPath: "/v1/entitlements/features" }),
      retrieve: stripeMethod31({
        method: "GET",
        fullPath: "/v1/entitlements/features/{id}"
      }),
      update: stripeMethod31({
        method: "POST",
        fullPath: "/v1/entitlements/features/{id}"
      }),
      list: stripeMethod31({
        method: "GET",
        fullPath: "/v1/entitlements/features",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/FinancialAccounts.js
var stripeMethod32, FinancialAccounts;
var init_FinancialAccounts = __esm({
  "../node_modules/stripe/esm/resources/Treasury/FinancialAccounts.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod32 = StripeResource.method;
    FinancialAccounts = StripeResource.extend({
      create: stripeMethod32({
        method: "POST",
        fullPath: "/v1/treasury/financial_accounts"
      }),
      retrieve: stripeMethod32({
        method: "GET",
        fullPath: "/v1/treasury/financial_accounts/{financial_account}"
      }),
      update: stripeMethod32({
        method: "POST",
        fullPath: "/v1/treasury/financial_accounts/{financial_account}"
      }),
      list: stripeMethod32({
        method: "GET",
        fullPath: "/v1/treasury/financial_accounts",
        methodType: "list"
      }),
      close: stripeMethod32({
        method: "POST",
        fullPath: "/v1/treasury/financial_accounts/{financial_account}/close"
      }),
      retrieveFeatures: stripeMethod32({
        method: "GET",
        fullPath: "/v1/treasury/financial_accounts/{financial_account}/features"
      }),
      updateFeatures: stripeMethod32({
        method: "POST",
        fullPath: "/v1/treasury/financial_accounts/{financial_account}/features"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Treasury/InboundTransfers.js
var stripeMethod33, InboundTransfers;
var init_InboundTransfers = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Treasury/InboundTransfers.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod33 = StripeResource.method;
    InboundTransfers = StripeResource.extend({
      fail: stripeMethod33({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/inbound_transfers/{id}/fail"
      }),
      returnInboundTransfer: stripeMethod33({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/inbound_transfers/{id}/return"
      }),
      succeed: stripeMethod33({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/inbound_transfers/{id}/succeed"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/InboundTransfers.js
var stripeMethod34, InboundTransfers2;
var init_InboundTransfers2 = __esm({
  "../node_modules/stripe/esm/resources/Treasury/InboundTransfers.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod34 = StripeResource.method;
    InboundTransfers2 = StripeResource.extend({
      create: stripeMethod34({
        method: "POST",
        fullPath: "/v1/treasury/inbound_transfers"
      }),
      retrieve: stripeMethod34({
        method: "GET",
        fullPath: "/v1/treasury/inbound_transfers/{id}"
      }),
      list: stripeMethod34({
        method: "GET",
        fullPath: "/v1/treasury/inbound_transfers",
        methodType: "list"
      }),
      cancel: stripeMethod34({
        method: "POST",
        fullPath: "/v1/treasury/inbound_transfers/{inbound_transfer}/cancel"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Terminal/Locations.js
var stripeMethod35, Locations;
var init_Locations = __esm({
  "../node_modules/stripe/esm/resources/Terminal/Locations.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod35 = StripeResource.method;
    Locations = StripeResource.extend({
      create: stripeMethod35({ method: "POST", fullPath: "/v1/terminal/locations" }),
      retrieve: stripeMethod35({
        method: "GET",
        fullPath: "/v1/terminal/locations/{location}"
      }),
      update: stripeMethod35({
        method: "POST",
        fullPath: "/v1/terminal/locations/{location}"
      }),
      list: stripeMethod35({
        method: "GET",
        fullPath: "/v1/terminal/locations",
        methodType: "list"
      }),
      del: stripeMethod35({
        method: "DELETE",
        fullPath: "/v1/terminal/locations/{location}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Billing/MeterEventAdjustments.js
var stripeMethod36, MeterEventAdjustments;
var init_MeterEventAdjustments = __esm({
  "../node_modules/stripe/esm/resources/Billing/MeterEventAdjustments.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod36 = StripeResource.method;
    MeterEventAdjustments = StripeResource.extend({
      create: stripeMethod36({
        method: "POST",
        fullPath: "/v1/billing/meter_event_adjustments"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Billing/MeterEventAdjustments.js
var stripeMethod37, MeterEventAdjustments2;
var init_MeterEventAdjustments2 = __esm({
  "../node_modules/stripe/esm/resources/V2/Billing/MeterEventAdjustments.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod37 = StripeResource.method;
    MeterEventAdjustments2 = StripeResource.extend({
      create: stripeMethod37({
        method: "POST",
        fullPath: "/v2/billing/meter_event_adjustments"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Billing/MeterEventSession.js
var stripeMethod38, MeterEventSession;
var init_MeterEventSession = __esm({
  "../node_modules/stripe/esm/resources/V2/Billing/MeterEventSession.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod38 = StripeResource.method;
    MeterEventSession = StripeResource.extend({
      create: stripeMethod38({
        method: "POST",
        fullPath: "/v2/billing/meter_event_session"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Billing/MeterEventStream.js
var stripeMethod39, MeterEventStream;
var init_MeterEventStream = __esm({
  "../node_modules/stripe/esm/resources/V2/Billing/MeterEventStream.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod39 = StripeResource.method;
    MeterEventStream = StripeResource.extend({
      create: stripeMethod39({
        method: "POST",
        fullPath: "/v2/billing/meter_event_stream",
        host: "meter-events.stripe.com"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Billing/MeterEvents.js
var stripeMethod40, MeterEvents;
var init_MeterEvents = __esm({
  "../node_modules/stripe/esm/resources/Billing/MeterEvents.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod40 = StripeResource.method;
    MeterEvents = StripeResource.extend({
      create: stripeMethod40({ method: "POST", fullPath: "/v1/billing/meter_events" })
    });
  }
});

// ../node_modules/stripe/esm/resources/V2/Billing/MeterEvents.js
var stripeMethod41, MeterEvents2;
var init_MeterEvents2 = __esm({
  "../node_modules/stripe/esm/resources/V2/Billing/MeterEvents.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod41 = StripeResource.method;
    MeterEvents2 = StripeResource.extend({
      create: stripeMethod41({ method: "POST", fullPath: "/v2/billing/meter_events" })
    });
  }
});

// ../node_modules/stripe/esm/resources/Billing/Meters.js
var stripeMethod42, Meters;
var init_Meters = __esm({
  "../node_modules/stripe/esm/resources/Billing/Meters.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod42 = StripeResource.method;
    Meters = StripeResource.extend({
      create: stripeMethod42({ method: "POST", fullPath: "/v1/billing/meters" }),
      retrieve: stripeMethod42({ method: "GET", fullPath: "/v1/billing/meters/{id}" }),
      update: stripeMethod42({ method: "POST", fullPath: "/v1/billing/meters/{id}" }),
      list: stripeMethod42({
        method: "GET",
        fullPath: "/v1/billing/meters",
        methodType: "list"
      }),
      deactivate: stripeMethod42({
        method: "POST",
        fullPath: "/v1/billing/meters/{id}/deactivate"
      }),
      listEventSummaries: stripeMethod42({
        method: "GET",
        fullPath: "/v1/billing/meters/{id}/event_summaries",
        methodType: "list"
      }),
      reactivate: stripeMethod42({
        method: "POST",
        fullPath: "/v1/billing/meters/{id}/reactivate"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Terminal/OnboardingLinks.js
var stripeMethod43, OnboardingLinks;
var init_OnboardingLinks = __esm({
  "../node_modules/stripe/esm/resources/Terminal/OnboardingLinks.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod43 = StripeResource.method;
    OnboardingLinks = StripeResource.extend({
      create: stripeMethod43({
        method: "POST",
        fullPath: "/v1/terminal/onboarding_links"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Climate/Orders.js
var stripeMethod44, Orders;
var init_Orders = __esm({
  "../node_modules/stripe/esm/resources/Climate/Orders.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod44 = StripeResource.method;
    Orders = StripeResource.extend({
      create: stripeMethod44({ method: "POST", fullPath: "/v1/climate/orders" }),
      retrieve: stripeMethod44({
        method: "GET",
        fullPath: "/v1/climate/orders/{order}"
      }),
      update: stripeMethod44({
        method: "POST",
        fullPath: "/v1/climate/orders/{order}"
      }),
      list: stripeMethod44({
        method: "GET",
        fullPath: "/v1/climate/orders",
        methodType: "list"
      }),
      cancel: stripeMethod44({
        method: "POST",
        fullPath: "/v1/climate/orders/{order}/cancel"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Treasury/OutboundPayments.js
var stripeMethod45, OutboundPayments;
var init_OutboundPayments = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Treasury/OutboundPayments.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod45 = StripeResource.method;
    OutboundPayments = StripeResource.extend({
      update: stripeMethod45({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/outbound_payments/{id}"
      }),
      fail: stripeMethod45({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/outbound_payments/{id}/fail"
      }),
      post: stripeMethod45({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/outbound_payments/{id}/post"
      }),
      returnOutboundPayment: stripeMethod45({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/outbound_payments/{id}/return"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/OutboundPayments.js
var stripeMethod46, OutboundPayments2;
var init_OutboundPayments2 = __esm({
  "../node_modules/stripe/esm/resources/Treasury/OutboundPayments.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod46 = StripeResource.method;
    OutboundPayments2 = StripeResource.extend({
      create: stripeMethod46({
        method: "POST",
        fullPath: "/v1/treasury/outbound_payments"
      }),
      retrieve: stripeMethod46({
        method: "GET",
        fullPath: "/v1/treasury/outbound_payments/{id}"
      }),
      list: stripeMethod46({
        method: "GET",
        fullPath: "/v1/treasury/outbound_payments",
        methodType: "list"
      }),
      cancel: stripeMethod46({
        method: "POST",
        fullPath: "/v1/treasury/outbound_payments/{id}/cancel"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Treasury/OutboundTransfers.js
var stripeMethod47, OutboundTransfers;
var init_OutboundTransfers = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Treasury/OutboundTransfers.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod47 = StripeResource.method;
    OutboundTransfers = StripeResource.extend({
      update: stripeMethod47({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/outbound_transfers/{outbound_transfer}"
      }),
      fail: stripeMethod47({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/outbound_transfers/{outbound_transfer}/fail"
      }),
      post: stripeMethod47({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/outbound_transfers/{outbound_transfer}/post"
      }),
      returnOutboundTransfer: stripeMethod47({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/outbound_transfers/{outbound_transfer}/return"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/OutboundTransfers.js
var stripeMethod48, OutboundTransfers2;
var init_OutboundTransfers2 = __esm({
  "../node_modules/stripe/esm/resources/Treasury/OutboundTransfers.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod48 = StripeResource.method;
    OutboundTransfers2 = StripeResource.extend({
      create: stripeMethod48({
        method: "POST",
        fullPath: "/v1/treasury/outbound_transfers"
      }),
      retrieve: stripeMethod48({
        method: "GET",
        fullPath: "/v1/treasury/outbound_transfers/{outbound_transfer}"
      }),
      list: stripeMethod48({
        method: "GET",
        fullPath: "/v1/treasury/outbound_transfers",
        methodType: "list"
      }),
      cancel: stripeMethod48({
        method: "POST",
        fullPath: "/v1/treasury/outbound_transfers/{outbound_transfer}/cancel"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Radar/PaymentEvaluations.js
var stripeMethod49, PaymentEvaluations;
var init_PaymentEvaluations = __esm({
  "../node_modules/stripe/esm/resources/Radar/PaymentEvaluations.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod49 = StripeResource.method;
    PaymentEvaluations = StripeResource.extend({
      create: stripeMethod49({
        method: "POST",
        fullPath: "/v1/radar/payment_evaluations"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Issuing/PersonalizationDesigns.js
var stripeMethod50, PersonalizationDesigns;
var init_PersonalizationDesigns = __esm({
  "../node_modules/stripe/esm/resources/Issuing/PersonalizationDesigns.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod50 = StripeResource.method;
    PersonalizationDesigns = StripeResource.extend({
      create: stripeMethod50({
        method: "POST",
        fullPath: "/v1/issuing/personalization_designs"
      }),
      retrieve: stripeMethod50({
        method: "GET",
        fullPath: "/v1/issuing/personalization_designs/{personalization_design}"
      }),
      update: stripeMethod50({
        method: "POST",
        fullPath: "/v1/issuing/personalization_designs/{personalization_design}"
      }),
      list: stripeMethod50({
        method: "GET",
        fullPath: "/v1/issuing/personalization_designs",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Issuing/PersonalizationDesigns.js
var stripeMethod51, PersonalizationDesigns2;
var init_PersonalizationDesigns2 = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Issuing/PersonalizationDesigns.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod51 = StripeResource.method;
    PersonalizationDesigns2 = StripeResource.extend({
      activate: stripeMethod51({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/personalization_designs/{personalization_design}/activate"
      }),
      deactivate: stripeMethod51({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/personalization_designs/{personalization_design}/deactivate"
      }),
      reject: stripeMethod51({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/personalization_designs/{personalization_design}/reject"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Issuing/PhysicalBundles.js
var stripeMethod52, PhysicalBundles;
var init_PhysicalBundles = __esm({
  "../node_modules/stripe/esm/resources/Issuing/PhysicalBundles.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod52 = StripeResource.method;
    PhysicalBundles = StripeResource.extend({
      retrieve: stripeMethod52({
        method: "GET",
        fullPath: "/v1/issuing/physical_bundles/{physical_bundle}"
      }),
      list: stripeMethod52({
        method: "GET",
        fullPath: "/v1/issuing/physical_bundles",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Climate/Products.js
var stripeMethod53, Products;
var init_Products = __esm({
  "../node_modules/stripe/esm/resources/Climate/Products.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod53 = StripeResource.method;
    Products = StripeResource.extend({
      retrieve: stripeMethod53({
        method: "GET",
        fullPath: "/v1/climate/products/{product}"
      }),
      list: stripeMethod53({
        method: "GET",
        fullPath: "/v1/climate/products",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Terminal/Readers.js
var stripeMethod54, Readers;
var init_Readers = __esm({
  "../node_modules/stripe/esm/resources/Terminal/Readers.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod54 = StripeResource.method;
    Readers = StripeResource.extend({
      create: stripeMethod54({ method: "POST", fullPath: "/v1/terminal/readers" }),
      retrieve: stripeMethod54({
        method: "GET",
        fullPath: "/v1/terminal/readers/{reader}"
      }),
      update: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}"
      }),
      list: stripeMethod54({
        method: "GET",
        fullPath: "/v1/terminal/readers",
        methodType: "list"
      }),
      del: stripeMethod54({
        method: "DELETE",
        fullPath: "/v1/terminal/readers/{reader}"
      }),
      cancelAction: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}/cancel_action"
      }),
      collectInputs: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}/collect_inputs"
      }),
      collectPaymentMethod: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}/collect_payment_method"
      }),
      confirmPaymentIntent: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}/confirm_payment_intent"
      }),
      processPaymentIntent: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}/process_payment_intent"
      }),
      processSetupIntent: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}/process_setup_intent"
      }),
      refundPayment: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}/refund_payment"
      }),
      setReaderDisplay: stripeMethod54({
        method: "POST",
        fullPath: "/v1/terminal/readers/{reader}/set_reader_display"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Terminal/Readers.js
var stripeMethod55, Readers2;
var init_Readers2 = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Terminal/Readers.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod55 = StripeResource.method;
    Readers2 = StripeResource.extend({
      presentPaymentMethod: stripeMethod55({
        method: "POST",
        fullPath: "/v1/test_helpers/terminal/readers/{reader}/present_payment_method"
      }),
      succeedInputCollection: stripeMethod55({
        method: "POST",
        fullPath: "/v1/test_helpers/terminal/readers/{reader}/succeed_input_collection"
      }),
      timeoutInputCollection: stripeMethod55({
        method: "POST",
        fullPath: "/v1/test_helpers/terminal/readers/{reader}/timeout_input_collection"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Treasury/ReceivedCredits.js
var stripeMethod56, ReceivedCredits;
var init_ReceivedCredits = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Treasury/ReceivedCredits.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod56 = StripeResource.method;
    ReceivedCredits = StripeResource.extend({
      create: stripeMethod56({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/received_credits"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/ReceivedCredits.js
var stripeMethod57, ReceivedCredits2;
var init_ReceivedCredits2 = __esm({
  "../node_modules/stripe/esm/resources/Treasury/ReceivedCredits.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod57 = StripeResource.method;
    ReceivedCredits2 = StripeResource.extend({
      retrieve: stripeMethod57({
        method: "GET",
        fullPath: "/v1/treasury/received_credits/{id}"
      }),
      list: stripeMethod57({
        method: "GET",
        fullPath: "/v1/treasury/received_credits",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Treasury/ReceivedDebits.js
var stripeMethod58, ReceivedDebits;
var init_ReceivedDebits = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Treasury/ReceivedDebits.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod58 = StripeResource.method;
    ReceivedDebits = StripeResource.extend({
      create: stripeMethod58({
        method: "POST",
        fullPath: "/v1/test_helpers/treasury/received_debits"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/ReceivedDebits.js
var stripeMethod59, ReceivedDebits2;
var init_ReceivedDebits2 = __esm({
  "../node_modules/stripe/esm/resources/Treasury/ReceivedDebits.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod59 = StripeResource.method;
    ReceivedDebits2 = StripeResource.extend({
      retrieve: stripeMethod59({
        method: "GET",
        fullPath: "/v1/treasury/received_debits/{id}"
      }),
      list: stripeMethod59({
        method: "GET",
        fullPath: "/v1/treasury/received_debits",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Refunds.js
var stripeMethod60, Refunds;
var init_Refunds = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Refunds.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod60 = StripeResource.method;
    Refunds = StripeResource.extend({
      expire: stripeMethod60({
        method: "POST",
        fullPath: "/v1/test_helpers/refunds/{refund}/expire"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Tax/Registrations.js
var stripeMethod61, Registrations;
var init_Registrations = __esm({
  "../node_modules/stripe/esm/resources/Tax/Registrations.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod61 = StripeResource.method;
    Registrations = StripeResource.extend({
      create: stripeMethod61({ method: "POST", fullPath: "/v1/tax/registrations" }),
      retrieve: stripeMethod61({
        method: "GET",
        fullPath: "/v1/tax/registrations/{id}"
      }),
      update: stripeMethod61({
        method: "POST",
        fullPath: "/v1/tax/registrations/{id}"
      }),
      list: stripeMethod61({
        method: "GET",
        fullPath: "/v1/tax/registrations",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Reporting/ReportRuns.js
var stripeMethod62, ReportRuns;
var init_ReportRuns = __esm({
  "../node_modules/stripe/esm/resources/Reporting/ReportRuns.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod62 = StripeResource.method;
    ReportRuns = StripeResource.extend({
      create: stripeMethod62({ method: "POST", fullPath: "/v1/reporting/report_runs" }),
      retrieve: stripeMethod62({
        method: "GET",
        fullPath: "/v1/reporting/report_runs/{report_run}"
      }),
      list: stripeMethod62({
        method: "GET",
        fullPath: "/v1/reporting/report_runs",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Reporting/ReportTypes.js
var stripeMethod63, ReportTypes;
var init_ReportTypes = __esm({
  "../node_modules/stripe/esm/resources/Reporting/ReportTypes.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod63 = StripeResource.method;
    ReportTypes = StripeResource.extend({
      retrieve: stripeMethod63({
        method: "GET",
        fullPath: "/v1/reporting/report_types/{report_type}"
      }),
      list: stripeMethod63({
        method: "GET",
        fullPath: "/v1/reporting/report_types",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Forwarding/Requests.js
var stripeMethod64, Requests;
var init_Requests = __esm({
  "../node_modules/stripe/esm/resources/Forwarding/Requests.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod64 = StripeResource.method;
    Requests = StripeResource.extend({
      create: stripeMethod64({ method: "POST", fullPath: "/v1/forwarding/requests" }),
      retrieve: stripeMethod64({
        method: "GET",
        fullPath: "/v1/forwarding/requests/{id}"
      }),
      list: stripeMethod64({
        method: "GET",
        fullPath: "/v1/forwarding/requests",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Sigma/ScheduledQueryRuns.js
var stripeMethod65, ScheduledQueryRuns;
var init_ScheduledQueryRuns = __esm({
  "../node_modules/stripe/esm/resources/Sigma/ScheduledQueryRuns.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod65 = StripeResource.method;
    ScheduledQueryRuns = StripeResource.extend({
      retrieve: stripeMethod65({
        method: "GET",
        fullPath: "/v1/sigma/scheduled_query_runs/{scheduled_query_run}"
      }),
      list: stripeMethod65({
        method: "GET",
        fullPath: "/v1/sigma/scheduled_query_runs",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Apps/Secrets.js
var stripeMethod66, Secrets;
var init_Secrets = __esm({
  "../node_modules/stripe/esm/resources/Apps/Secrets.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod66 = StripeResource.method;
    Secrets = StripeResource.extend({
      create: stripeMethod66({ method: "POST", fullPath: "/v1/apps/secrets" }),
      list: stripeMethod66({
        method: "GET",
        fullPath: "/v1/apps/secrets",
        methodType: "list"
      }),
      deleteWhere: stripeMethod66({
        method: "POST",
        fullPath: "/v1/apps/secrets/delete"
      }),
      find: stripeMethod66({ method: "GET", fullPath: "/v1/apps/secrets/find" })
    });
  }
});

// ../node_modules/stripe/esm/resources/BillingPortal/Sessions.js
var stripeMethod67, Sessions;
var init_Sessions = __esm({
  "../node_modules/stripe/esm/resources/BillingPortal/Sessions.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod67 = StripeResource.method;
    Sessions = StripeResource.extend({
      create: stripeMethod67({
        method: "POST",
        fullPath: "/v1/billing_portal/sessions"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Checkout/Sessions.js
var stripeMethod68, Sessions2;
var init_Sessions2 = __esm({
  "../node_modules/stripe/esm/resources/Checkout/Sessions.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod68 = StripeResource.method;
    Sessions2 = StripeResource.extend({
      create: stripeMethod68({ method: "POST", fullPath: "/v1/checkout/sessions" }),
      retrieve: stripeMethod68({
        method: "GET",
        fullPath: "/v1/checkout/sessions/{session}"
      }),
      update: stripeMethod68({
        method: "POST",
        fullPath: "/v1/checkout/sessions/{session}"
      }),
      list: stripeMethod68({
        method: "GET",
        fullPath: "/v1/checkout/sessions",
        methodType: "list"
      }),
      expire: stripeMethod68({
        method: "POST",
        fullPath: "/v1/checkout/sessions/{session}/expire"
      }),
      listLineItems: stripeMethod68({
        method: "GET",
        fullPath: "/v1/checkout/sessions/{session}/line_items",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/FinancialConnections/Sessions.js
var stripeMethod69, Sessions3;
var init_Sessions3 = __esm({
  "../node_modules/stripe/esm/resources/FinancialConnections/Sessions.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod69 = StripeResource.method;
    Sessions3 = StripeResource.extend({
      create: stripeMethod69({
        method: "POST",
        fullPath: "/v1/financial_connections/sessions"
      }),
      retrieve: stripeMethod69({
        method: "GET",
        fullPath: "/v1/financial_connections/sessions/{session}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Tax/Settings.js
var stripeMethod70, Settings;
var init_Settings = __esm({
  "../node_modules/stripe/esm/resources/Tax/Settings.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod70 = StripeResource.method;
    Settings = StripeResource.extend({
      retrieve: stripeMethod70({ method: "GET", fullPath: "/v1/tax/settings" }),
      update: stripeMethod70({ method: "POST", fullPath: "/v1/tax/settings" })
    });
  }
});

// ../node_modules/stripe/esm/resources/Climate/Suppliers.js
var stripeMethod71, Suppliers;
var init_Suppliers = __esm({
  "../node_modules/stripe/esm/resources/Climate/Suppliers.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod71 = StripeResource.method;
    Suppliers = StripeResource.extend({
      retrieve: stripeMethod71({
        method: "GET",
        fullPath: "/v1/climate/suppliers/{supplier}"
      }),
      list: stripeMethod71({
        method: "GET",
        fullPath: "/v1/climate/suppliers",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/TestClocks.js
var stripeMethod72, TestClocks;
var init_TestClocks = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/TestClocks.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod72 = StripeResource.method;
    TestClocks = StripeResource.extend({
      create: stripeMethod72({
        method: "POST",
        fullPath: "/v1/test_helpers/test_clocks"
      }),
      retrieve: stripeMethod72({
        method: "GET",
        fullPath: "/v1/test_helpers/test_clocks/{test_clock}"
      }),
      list: stripeMethod72({
        method: "GET",
        fullPath: "/v1/test_helpers/test_clocks",
        methodType: "list"
      }),
      del: stripeMethod72({
        method: "DELETE",
        fullPath: "/v1/test_helpers/test_clocks/{test_clock}"
      }),
      advance: stripeMethod72({
        method: "POST",
        fullPath: "/v1/test_helpers/test_clocks/{test_clock}/advance"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Issuing/Tokens.js
var stripeMethod73, Tokens;
var init_Tokens = __esm({
  "../node_modules/stripe/esm/resources/Issuing/Tokens.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod73 = StripeResource.method;
    Tokens = StripeResource.extend({
      retrieve: stripeMethod73({
        method: "GET",
        fullPath: "/v1/issuing/tokens/{token}"
      }),
      update: stripeMethod73({
        method: "POST",
        fullPath: "/v1/issuing/tokens/{token}"
      }),
      list: stripeMethod73({
        method: "GET",
        fullPath: "/v1/issuing/tokens",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/TransactionEntries.js
var stripeMethod74, TransactionEntries;
var init_TransactionEntries = __esm({
  "../node_modules/stripe/esm/resources/Treasury/TransactionEntries.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod74 = StripeResource.method;
    TransactionEntries = StripeResource.extend({
      retrieve: stripeMethod74({
        method: "GET",
        fullPath: "/v1/treasury/transaction_entries/{id}"
      }),
      list: stripeMethod74({
        method: "GET",
        fullPath: "/v1/treasury/transaction_entries",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/FinancialConnections/Transactions.js
var stripeMethod75, Transactions;
var init_Transactions = __esm({
  "../node_modules/stripe/esm/resources/FinancialConnections/Transactions.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod75 = StripeResource.method;
    Transactions = StripeResource.extend({
      retrieve: stripeMethod75({
        method: "GET",
        fullPath: "/v1/financial_connections/transactions/{transaction}"
      }),
      list: stripeMethod75({
        method: "GET",
        fullPath: "/v1/financial_connections/transactions",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Issuing/Transactions.js
var stripeMethod76, Transactions2;
var init_Transactions2 = __esm({
  "../node_modules/stripe/esm/resources/Issuing/Transactions.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod76 = StripeResource.method;
    Transactions2 = StripeResource.extend({
      retrieve: stripeMethod76({
        method: "GET",
        fullPath: "/v1/issuing/transactions/{transaction}"
      }),
      update: stripeMethod76({
        method: "POST",
        fullPath: "/v1/issuing/transactions/{transaction}"
      }),
      list: stripeMethod76({
        method: "GET",
        fullPath: "/v1/issuing/transactions",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Tax/Transactions.js
var stripeMethod77, Transactions3;
var init_Transactions3 = __esm({
  "../node_modules/stripe/esm/resources/Tax/Transactions.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod77 = StripeResource.method;
    Transactions3 = StripeResource.extend({
      retrieve: stripeMethod77({
        method: "GET",
        fullPath: "/v1/tax/transactions/{transaction}"
      }),
      createFromCalculation: stripeMethod77({
        method: "POST",
        fullPath: "/v1/tax/transactions/create_from_calculation"
      }),
      createReversal: stripeMethod77({
        method: "POST",
        fullPath: "/v1/tax/transactions/create_reversal"
      }),
      listLineItems: stripeMethod77({
        method: "GET",
        fullPath: "/v1/tax/transactions/{transaction}/line_items",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TestHelpers/Issuing/Transactions.js
var stripeMethod78, Transactions4;
var init_Transactions4 = __esm({
  "../node_modules/stripe/esm/resources/TestHelpers/Issuing/Transactions.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod78 = StripeResource.method;
    Transactions4 = StripeResource.extend({
      createForceCapture: stripeMethod78({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/transactions/create_force_capture"
      }),
      createUnlinkedRefund: stripeMethod78({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/transactions/create_unlinked_refund"
      }),
      refund: stripeMethod78({
        method: "POST",
        fullPath: "/v1/test_helpers/issuing/transactions/{transaction}/refund"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Treasury/Transactions.js
var stripeMethod79, Transactions5;
var init_Transactions5 = __esm({
  "../node_modules/stripe/esm/resources/Treasury/Transactions.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod79 = StripeResource.method;
    Transactions5 = StripeResource.extend({
      retrieve: stripeMethod79({
        method: "GET",
        fullPath: "/v1/treasury/transactions/{id}"
      }),
      list: stripeMethod79({
        method: "GET",
        fullPath: "/v1/treasury/transactions",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Radar/ValueListItems.js
var stripeMethod80, ValueListItems;
var init_ValueListItems = __esm({
  "../node_modules/stripe/esm/resources/Radar/ValueListItems.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod80 = StripeResource.method;
    ValueListItems = StripeResource.extend({
      create: stripeMethod80({
        method: "POST",
        fullPath: "/v1/radar/value_list_items"
      }),
      retrieve: stripeMethod80({
        method: "GET",
        fullPath: "/v1/radar/value_list_items/{item}"
      }),
      list: stripeMethod80({
        method: "GET",
        fullPath: "/v1/radar/value_list_items",
        methodType: "list"
      }),
      del: stripeMethod80({
        method: "DELETE",
        fullPath: "/v1/radar/value_list_items/{item}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Radar/ValueLists.js
var stripeMethod81, ValueLists;
var init_ValueLists = __esm({
  "../node_modules/stripe/esm/resources/Radar/ValueLists.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod81 = StripeResource.method;
    ValueLists = StripeResource.extend({
      create: stripeMethod81({ method: "POST", fullPath: "/v1/radar/value_lists" }),
      retrieve: stripeMethod81({
        method: "GET",
        fullPath: "/v1/radar/value_lists/{value_list}"
      }),
      update: stripeMethod81({
        method: "POST",
        fullPath: "/v1/radar/value_lists/{value_list}"
      }),
      list: stripeMethod81({
        method: "GET",
        fullPath: "/v1/radar/value_lists",
        methodType: "list"
      }),
      del: stripeMethod81({
        method: "DELETE",
        fullPath: "/v1/radar/value_lists/{value_list}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Identity/VerificationReports.js
var stripeMethod82, VerificationReports;
var init_VerificationReports = __esm({
  "../node_modules/stripe/esm/resources/Identity/VerificationReports.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod82 = StripeResource.method;
    VerificationReports = StripeResource.extend({
      retrieve: stripeMethod82({
        method: "GET",
        fullPath: "/v1/identity/verification_reports/{report}"
      }),
      list: stripeMethod82({
        method: "GET",
        fullPath: "/v1/identity/verification_reports",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Identity/VerificationSessions.js
var stripeMethod83, VerificationSessions;
var init_VerificationSessions = __esm({
  "../node_modules/stripe/esm/resources/Identity/VerificationSessions.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod83 = StripeResource.method;
    VerificationSessions = StripeResource.extend({
      create: stripeMethod83({
        method: "POST",
        fullPath: "/v1/identity/verification_sessions"
      }),
      retrieve: stripeMethod83({
        method: "GET",
        fullPath: "/v1/identity/verification_sessions/{session}"
      }),
      update: stripeMethod83({
        method: "POST",
        fullPath: "/v1/identity/verification_sessions/{session}"
      }),
      list: stripeMethod83({
        method: "GET",
        fullPath: "/v1/identity/verification_sessions",
        methodType: "list"
      }),
      cancel: stripeMethod83({
        method: "POST",
        fullPath: "/v1/identity/verification_sessions/{session}/cancel"
      }),
      redact: stripeMethod83({
        method: "POST",
        fullPath: "/v1/identity/verification_sessions/{session}/redact"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Accounts.js
var stripeMethod84, Accounts3;
var init_Accounts3 = __esm({
  "../node_modules/stripe/esm/resources/Accounts.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod84 = StripeResource.method;
    Accounts3 = StripeResource.extend({
      create: stripeMethod84({ method: "POST", fullPath: "/v1/accounts" }),
      retrieve(id, ...args) {
        if (typeof id === "string") {
          return stripeMethod84({
            method: "GET",
            fullPath: "/v1/accounts/{id}"
          }).apply(this, [id, ...args]);
        } else {
          if (id === null || id === void 0) {
            [].shift.apply([id, ...args]);
          }
          return stripeMethod84({
            method: "GET",
            fullPath: "/v1/account"
          }).apply(this, [id, ...args]);
        }
      },
      update: stripeMethod84({ method: "POST", fullPath: "/v1/accounts/{account}" }),
      list: stripeMethod84({
        method: "GET",
        fullPath: "/v1/accounts",
        methodType: "list"
      }),
      del: stripeMethod84({ method: "DELETE", fullPath: "/v1/accounts/{account}" }),
      createExternalAccount: stripeMethod84({
        method: "POST",
        fullPath: "/v1/accounts/{account}/external_accounts"
      }),
      createLoginLink: stripeMethod84({
        method: "POST",
        fullPath: "/v1/accounts/{account}/login_links"
      }),
      createPerson: stripeMethod84({
        method: "POST",
        fullPath: "/v1/accounts/{account}/persons"
      }),
      deleteExternalAccount: stripeMethod84({
        method: "DELETE",
        fullPath: "/v1/accounts/{account}/external_accounts/{id}"
      }),
      deletePerson: stripeMethod84({
        method: "DELETE",
        fullPath: "/v1/accounts/{account}/persons/{person}"
      }),
      listCapabilities: stripeMethod84({
        method: "GET",
        fullPath: "/v1/accounts/{account}/capabilities",
        methodType: "list"
      }),
      listExternalAccounts: stripeMethod84({
        method: "GET",
        fullPath: "/v1/accounts/{account}/external_accounts",
        methodType: "list"
      }),
      listPersons: stripeMethod84({
        method: "GET",
        fullPath: "/v1/accounts/{account}/persons",
        methodType: "list"
      }),
      reject: stripeMethod84({
        method: "POST",
        fullPath: "/v1/accounts/{account}/reject"
      }),
      retrieveCurrent: stripeMethod84({ method: "GET", fullPath: "/v1/account" }),
      retrieveCapability: stripeMethod84({
        method: "GET",
        fullPath: "/v1/accounts/{account}/capabilities/{capability}"
      }),
      retrieveExternalAccount: stripeMethod84({
        method: "GET",
        fullPath: "/v1/accounts/{account}/external_accounts/{id}"
      }),
      retrievePerson: stripeMethod84({
        method: "GET",
        fullPath: "/v1/accounts/{account}/persons/{person}"
      }),
      updateCapability: stripeMethod84({
        method: "POST",
        fullPath: "/v1/accounts/{account}/capabilities/{capability}"
      }),
      updateExternalAccount: stripeMethod84({
        method: "POST",
        fullPath: "/v1/accounts/{account}/external_accounts/{id}"
      }),
      updatePerson: stripeMethod84({
        method: "POST",
        fullPath: "/v1/accounts/{account}/persons/{person}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/AccountLinks.js
var stripeMethod85, AccountLinks2;
var init_AccountLinks2 = __esm({
  "../node_modules/stripe/esm/resources/AccountLinks.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod85 = StripeResource.method;
    AccountLinks2 = StripeResource.extend({
      create: stripeMethod85({ method: "POST", fullPath: "/v1/account_links" })
    });
  }
});

// ../node_modules/stripe/esm/resources/AccountSessions.js
var stripeMethod86, AccountSessions;
var init_AccountSessions = __esm({
  "../node_modules/stripe/esm/resources/AccountSessions.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod86 = StripeResource.method;
    AccountSessions = StripeResource.extend({
      create: stripeMethod86({ method: "POST", fullPath: "/v1/account_sessions" })
    });
  }
});

// ../node_modules/stripe/esm/resources/ApplePayDomains.js
var stripeMethod87, ApplePayDomains;
var init_ApplePayDomains = __esm({
  "../node_modules/stripe/esm/resources/ApplePayDomains.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod87 = StripeResource.method;
    ApplePayDomains = StripeResource.extend({
      create: stripeMethod87({ method: "POST", fullPath: "/v1/apple_pay/domains" }),
      retrieve: stripeMethod87({
        method: "GET",
        fullPath: "/v1/apple_pay/domains/{domain}"
      }),
      list: stripeMethod87({
        method: "GET",
        fullPath: "/v1/apple_pay/domains",
        methodType: "list"
      }),
      del: stripeMethod87({
        method: "DELETE",
        fullPath: "/v1/apple_pay/domains/{domain}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/ApplicationFees.js
var stripeMethod88, ApplicationFees;
var init_ApplicationFees = __esm({
  "../node_modules/stripe/esm/resources/ApplicationFees.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod88 = StripeResource.method;
    ApplicationFees = StripeResource.extend({
      retrieve: stripeMethod88({
        method: "GET",
        fullPath: "/v1/application_fees/{id}"
      }),
      list: stripeMethod88({
        method: "GET",
        fullPath: "/v1/application_fees",
        methodType: "list"
      }),
      createRefund: stripeMethod88({
        method: "POST",
        fullPath: "/v1/application_fees/{id}/refunds"
      }),
      listRefunds: stripeMethod88({
        method: "GET",
        fullPath: "/v1/application_fees/{id}/refunds",
        methodType: "list"
      }),
      retrieveRefund: stripeMethod88({
        method: "GET",
        fullPath: "/v1/application_fees/{fee}/refunds/{id}"
      }),
      updateRefund: stripeMethod88({
        method: "POST",
        fullPath: "/v1/application_fees/{fee}/refunds/{id}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Balance.js
var stripeMethod89, Balance;
var init_Balance = __esm({
  "../node_modules/stripe/esm/resources/Balance.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod89 = StripeResource.method;
    Balance = StripeResource.extend({
      retrieve: stripeMethod89({ method: "GET", fullPath: "/v1/balance" })
    });
  }
});

// ../node_modules/stripe/esm/resources/BalanceSettings.js
var stripeMethod90, BalanceSettings;
var init_BalanceSettings = __esm({
  "../node_modules/stripe/esm/resources/BalanceSettings.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod90 = StripeResource.method;
    BalanceSettings = StripeResource.extend({
      retrieve: stripeMethod90({ method: "GET", fullPath: "/v1/balance_settings" }),
      update: stripeMethod90({ method: "POST", fullPath: "/v1/balance_settings" })
    });
  }
});

// ../node_modules/stripe/esm/resources/BalanceTransactions.js
var stripeMethod91, BalanceTransactions;
var init_BalanceTransactions = __esm({
  "../node_modules/stripe/esm/resources/BalanceTransactions.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod91 = StripeResource.method;
    BalanceTransactions = StripeResource.extend({
      retrieve: stripeMethod91({
        method: "GET",
        fullPath: "/v1/balance_transactions/{id}"
      }),
      list: stripeMethod91({
        method: "GET",
        fullPath: "/v1/balance_transactions",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Charges.js
var stripeMethod92, Charges;
var init_Charges = __esm({
  "../node_modules/stripe/esm/resources/Charges.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod92 = StripeResource.method;
    Charges = StripeResource.extend({
      create: stripeMethod92({ method: "POST", fullPath: "/v1/charges" }),
      retrieve: stripeMethod92({ method: "GET", fullPath: "/v1/charges/{charge}" }),
      update: stripeMethod92({ method: "POST", fullPath: "/v1/charges/{charge}" }),
      list: stripeMethod92({
        method: "GET",
        fullPath: "/v1/charges",
        methodType: "list"
      }),
      capture: stripeMethod92({
        method: "POST",
        fullPath: "/v1/charges/{charge}/capture"
      }),
      search: stripeMethod92({
        method: "GET",
        fullPath: "/v1/charges/search",
        methodType: "search"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/ConfirmationTokens.js
var stripeMethod93, ConfirmationTokens2;
var init_ConfirmationTokens2 = __esm({
  "../node_modules/stripe/esm/resources/ConfirmationTokens.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod93 = StripeResource.method;
    ConfirmationTokens2 = StripeResource.extend({
      retrieve: stripeMethod93({
        method: "GET",
        fullPath: "/v1/confirmation_tokens/{confirmation_token}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/CountrySpecs.js
var stripeMethod94, CountrySpecs;
var init_CountrySpecs = __esm({
  "../node_modules/stripe/esm/resources/CountrySpecs.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod94 = StripeResource.method;
    CountrySpecs = StripeResource.extend({
      retrieve: stripeMethod94({
        method: "GET",
        fullPath: "/v1/country_specs/{country}"
      }),
      list: stripeMethod94({
        method: "GET",
        fullPath: "/v1/country_specs",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Coupons.js
var stripeMethod95, Coupons;
var init_Coupons = __esm({
  "../node_modules/stripe/esm/resources/Coupons.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod95 = StripeResource.method;
    Coupons = StripeResource.extend({
      create: stripeMethod95({ method: "POST", fullPath: "/v1/coupons" }),
      retrieve: stripeMethod95({ method: "GET", fullPath: "/v1/coupons/{coupon}" }),
      update: stripeMethod95({ method: "POST", fullPath: "/v1/coupons/{coupon}" }),
      list: stripeMethod95({
        method: "GET",
        fullPath: "/v1/coupons",
        methodType: "list"
      }),
      del: stripeMethod95({ method: "DELETE", fullPath: "/v1/coupons/{coupon}" })
    });
  }
});

// ../node_modules/stripe/esm/resources/CreditNotes.js
var stripeMethod96, CreditNotes;
var init_CreditNotes = __esm({
  "../node_modules/stripe/esm/resources/CreditNotes.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod96 = StripeResource.method;
    CreditNotes = StripeResource.extend({
      create: stripeMethod96({ method: "POST", fullPath: "/v1/credit_notes" }),
      retrieve: stripeMethod96({ method: "GET", fullPath: "/v1/credit_notes/{id}" }),
      update: stripeMethod96({ method: "POST", fullPath: "/v1/credit_notes/{id}" }),
      list: stripeMethod96({
        method: "GET",
        fullPath: "/v1/credit_notes",
        methodType: "list"
      }),
      listLineItems: stripeMethod96({
        method: "GET",
        fullPath: "/v1/credit_notes/{credit_note}/lines",
        methodType: "list"
      }),
      listPreviewLineItems: stripeMethod96({
        method: "GET",
        fullPath: "/v1/credit_notes/preview/lines",
        methodType: "list"
      }),
      preview: stripeMethod96({ method: "GET", fullPath: "/v1/credit_notes/preview" }),
      voidCreditNote: stripeMethod96({
        method: "POST",
        fullPath: "/v1/credit_notes/{id}/void"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/CustomerSessions.js
var stripeMethod97, CustomerSessions;
var init_CustomerSessions = __esm({
  "../node_modules/stripe/esm/resources/CustomerSessions.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod97 = StripeResource.method;
    CustomerSessions = StripeResource.extend({
      create: stripeMethod97({ method: "POST", fullPath: "/v1/customer_sessions" })
    });
  }
});

// ../node_modules/stripe/esm/resources/Customers.js
var stripeMethod98, Customers2;
var init_Customers2 = __esm({
  "../node_modules/stripe/esm/resources/Customers.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod98 = StripeResource.method;
    Customers2 = StripeResource.extend({
      create: stripeMethod98({ method: "POST", fullPath: "/v1/customers" }),
      retrieve: stripeMethod98({ method: "GET", fullPath: "/v1/customers/{customer}" }),
      update: stripeMethod98({ method: "POST", fullPath: "/v1/customers/{customer}" }),
      list: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers",
        methodType: "list"
      }),
      del: stripeMethod98({ method: "DELETE", fullPath: "/v1/customers/{customer}" }),
      createBalanceTransaction: stripeMethod98({
        method: "POST",
        fullPath: "/v1/customers/{customer}/balance_transactions"
      }),
      createFundingInstructions: stripeMethod98({
        method: "POST",
        fullPath: "/v1/customers/{customer}/funding_instructions"
      }),
      createSource: stripeMethod98({
        method: "POST",
        fullPath: "/v1/customers/{customer}/sources"
      }),
      createTaxId: stripeMethod98({
        method: "POST",
        fullPath: "/v1/customers/{customer}/tax_ids"
      }),
      deleteDiscount: stripeMethod98({
        method: "DELETE",
        fullPath: "/v1/customers/{customer}/discount"
      }),
      deleteSource: stripeMethod98({
        method: "DELETE",
        fullPath: "/v1/customers/{customer}/sources/{id}"
      }),
      deleteTaxId: stripeMethod98({
        method: "DELETE",
        fullPath: "/v1/customers/{customer}/tax_ids/{id}"
      }),
      listBalanceTransactions: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/balance_transactions",
        methodType: "list"
      }),
      listCashBalanceTransactions: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/cash_balance_transactions",
        methodType: "list"
      }),
      listPaymentMethods: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/payment_methods",
        methodType: "list"
      }),
      listSources: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/sources",
        methodType: "list"
      }),
      listTaxIds: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/tax_ids",
        methodType: "list"
      }),
      retrieveBalanceTransaction: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/balance_transactions/{transaction}"
      }),
      retrieveCashBalance: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/cash_balance"
      }),
      retrieveCashBalanceTransaction: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/cash_balance_transactions/{transaction}"
      }),
      retrievePaymentMethod: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/payment_methods/{payment_method}"
      }),
      retrieveSource: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/sources/{id}"
      }),
      retrieveTaxId: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/{customer}/tax_ids/{id}"
      }),
      search: stripeMethod98({
        method: "GET",
        fullPath: "/v1/customers/search",
        methodType: "search"
      }),
      updateBalanceTransaction: stripeMethod98({
        method: "POST",
        fullPath: "/v1/customers/{customer}/balance_transactions/{transaction}"
      }),
      updateCashBalance: stripeMethod98({
        method: "POST",
        fullPath: "/v1/customers/{customer}/cash_balance"
      }),
      updateSource: stripeMethod98({
        method: "POST",
        fullPath: "/v1/customers/{customer}/sources/{id}"
      }),
      verifySource: stripeMethod98({
        method: "POST",
        fullPath: "/v1/customers/{customer}/sources/{id}/verify"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Disputes.js
var stripeMethod99, Disputes2;
var init_Disputes2 = __esm({
  "../node_modules/stripe/esm/resources/Disputes.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod99 = StripeResource.method;
    Disputes2 = StripeResource.extend({
      retrieve: stripeMethod99({ method: "GET", fullPath: "/v1/disputes/{dispute}" }),
      update: stripeMethod99({ method: "POST", fullPath: "/v1/disputes/{dispute}" }),
      list: stripeMethod99({
        method: "GET",
        fullPath: "/v1/disputes",
        methodType: "list"
      }),
      close: stripeMethod99({
        method: "POST",
        fullPath: "/v1/disputes/{dispute}/close"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/EphemeralKeys.js
var stripeMethod100, EphemeralKeys;
var init_EphemeralKeys = __esm({
  "../node_modules/stripe/esm/resources/EphemeralKeys.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod100 = StripeResource.method;
    EphemeralKeys = StripeResource.extend({
      create: stripeMethod100({
        method: "POST",
        fullPath: "/v1/ephemeral_keys",
        validator: (data, options) => {
          if (!options.headers || !options.headers["Stripe-Version"]) {
            throw new Error("Passing apiVersion in a separate options hash is required to create an ephemeral key. See https://stripe.com/docs/api/versioning?lang=node");
          }
        }
      }),
      del: stripeMethod100({ method: "DELETE", fullPath: "/v1/ephemeral_keys/{key}" })
    });
  }
});

// ../node_modules/stripe/esm/resources/Events.js
var stripeMethod101, Events2;
var init_Events2 = __esm({
  "../node_modules/stripe/esm/resources/Events.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod101 = StripeResource.method;
    Events2 = StripeResource.extend({
      retrieve: stripeMethod101({ method: "GET", fullPath: "/v1/events/{id}" }),
      list: stripeMethod101({
        method: "GET",
        fullPath: "/v1/events",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/ExchangeRates.js
var stripeMethod102, ExchangeRates;
var init_ExchangeRates = __esm({
  "../node_modules/stripe/esm/resources/ExchangeRates.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod102 = StripeResource.method;
    ExchangeRates = StripeResource.extend({
      retrieve: stripeMethod102({
        method: "GET",
        fullPath: "/v1/exchange_rates/{rate_id}"
      }),
      list: stripeMethod102({
        method: "GET",
        fullPath: "/v1/exchange_rates",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/FileLinks.js
var stripeMethod103, FileLinks;
var init_FileLinks = __esm({
  "../node_modules/stripe/esm/resources/FileLinks.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod103 = StripeResource.method;
    FileLinks = StripeResource.extend({
      create: stripeMethod103({ method: "POST", fullPath: "/v1/file_links" }),
      retrieve: stripeMethod103({ method: "GET", fullPath: "/v1/file_links/{link}" }),
      update: stripeMethod103({ method: "POST", fullPath: "/v1/file_links/{link}" }),
      list: stripeMethod103({
        method: "GET",
        fullPath: "/v1/file_links",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/multipart.js
function multipartRequestDataProcessor(method, data, headers, callback) {
  data = data || {};
  if (method !== "POST") {
    return callback(null, queryStringifyRequestData(data));
  }
  this._stripe._platformFunctions.tryBufferData(data).then((bufferedData) => {
    const buffer = multipartDataGenerator(method, bufferedData, headers);
    return callback(null, buffer);
  }).catch((err) => callback(err, null));
}
var multipartDataGenerator;
var init_multipart = __esm({
  "../node_modules/stripe/esm/multipart.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils2();
    multipartDataGenerator = /* @__PURE__ */ __name((method, data, headers) => {
      const segno = (Math.round(Math.random() * 1e16) + Math.round(Math.random() * 1e16)).toString();
      headers["Content-Type"] = `multipart/form-data; boundary=${segno}`;
      const textEncoder = new TextEncoder();
      let buffer = new Uint8Array(0);
      const endBuffer = textEncoder.encode("\r\n");
      function push(l) {
        const prevBuffer = buffer;
        const newBuffer = l instanceof Uint8Array ? l : new Uint8Array(textEncoder.encode(l));
        buffer = new Uint8Array(prevBuffer.length + newBuffer.length + 2);
        buffer.set(prevBuffer);
        buffer.set(newBuffer, prevBuffer.length);
        buffer.set(endBuffer, buffer.length - 2);
      }
      __name(push, "push");
      function q(s) {
        return `"${s.replace(/"|"/g, "%22").replace(/\r\n|\r|\n/g, " ")}"`;
      }
      __name(q, "q");
      const flattenedData = flattenAndStringify(data);
      for (const k in flattenedData) {
        if (!Object.prototype.hasOwnProperty.call(flattenedData, k)) {
          continue;
        }
        const v = flattenedData[k];
        push(`--${segno}`);
        if (Object.prototype.hasOwnProperty.call(v, "data")) {
          const typedEntry = v;
          push(`Content-Disposition: form-data; name=${q(k)}; filename=${q(typedEntry.name || "blob")}`);
          push(`Content-Type: ${typedEntry.type || "application/octet-stream"}`);
          push("");
          push(typedEntry.data);
        } else {
          push(`Content-Disposition: form-data; name=${q(k)}`);
          push("");
          push(v);
        }
      }
      push(`--${segno}--`);
      return buffer;
    }, "multipartDataGenerator");
    __name(multipartRequestDataProcessor, "multipartRequestDataProcessor");
  }
});

// ../node_modules/stripe/esm/resources/Files.js
var stripeMethod104, Files;
var init_Files = __esm({
  "../node_modules/stripe/esm/resources/Files.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_multipart();
    init_StripeResource();
    stripeMethod104 = StripeResource.method;
    Files = StripeResource.extend({
      create: stripeMethod104({
        method: "POST",
        fullPath: "/v1/files",
        headers: {
          "Content-Type": "multipart/form-data"
        },
        host: "files.stripe.com"
      }),
      retrieve: stripeMethod104({ method: "GET", fullPath: "/v1/files/{file}" }),
      list: stripeMethod104({
        method: "GET",
        fullPath: "/v1/files",
        methodType: "list"
      }),
      requestDataProcessor: multipartRequestDataProcessor
    });
  }
});

// ../node_modules/stripe/esm/resources/InvoiceItems.js
var stripeMethod105, InvoiceItems;
var init_InvoiceItems = __esm({
  "../node_modules/stripe/esm/resources/InvoiceItems.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod105 = StripeResource.method;
    InvoiceItems = StripeResource.extend({
      create: stripeMethod105({ method: "POST", fullPath: "/v1/invoiceitems" }),
      retrieve: stripeMethod105({
        method: "GET",
        fullPath: "/v1/invoiceitems/{invoiceitem}"
      }),
      update: stripeMethod105({
        method: "POST",
        fullPath: "/v1/invoiceitems/{invoiceitem}"
      }),
      list: stripeMethod105({
        method: "GET",
        fullPath: "/v1/invoiceitems",
        methodType: "list"
      }),
      del: stripeMethod105({
        method: "DELETE",
        fullPath: "/v1/invoiceitems/{invoiceitem}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/InvoicePayments.js
var stripeMethod106, InvoicePayments;
var init_InvoicePayments = __esm({
  "../node_modules/stripe/esm/resources/InvoicePayments.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod106 = StripeResource.method;
    InvoicePayments = StripeResource.extend({
      retrieve: stripeMethod106({
        method: "GET",
        fullPath: "/v1/invoice_payments/{invoice_payment}"
      }),
      list: stripeMethod106({
        method: "GET",
        fullPath: "/v1/invoice_payments",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/InvoiceRenderingTemplates.js
var stripeMethod107, InvoiceRenderingTemplates;
var init_InvoiceRenderingTemplates = __esm({
  "../node_modules/stripe/esm/resources/InvoiceRenderingTemplates.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod107 = StripeResource.method;
    InvoiceRenderingTemplates = StripeResource.extend({
      retrieve: stripeMethod107({
        method: "GET",
        fullPath: "/v1/invoice_rendering_templates/{template}"
      }),
      list: stripeMethod107({
        method: "GET",
        fullPath: "/v1/invoice_rendering_templates",
        methodType: "list"
      }),
      archive: stripeMethod107({
        method: "POST",
        fullPath: "/v1/invoice_rendering_templates/{template}/archive"
      }),
      unarchive: stripeMethod107({
        method: "POST",
        fullPath: "/v1/invoice_rendering_templates/{template}/unarchive"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Invoices.js
var stripeMethod108, Invoices;
var init_Invoices = __esm({
  "../node_modules/stripe/esm/resources/Invoices.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod108 = StripeResource.method;
    Invoices = StripeResource.extend({
      create: stripeMethod108({ method: "POST", fullPath: "/v1/invoices" }),
      retrieve: stripeMethod108({ method: "GET", fullPath: "/v1/invoices/{invoice}" }),
      update: stripeMethod108({ method: "POST", fullPath: "/v1/invoices/{invoice}" }),
      list: stripeMethod108({
        method: "GET",
        fullPath: "/v1/invoices",
        methodType: "list"
      }),
      del: stripeMethod108({ method: "DELETE", fullPath: "/v1/invoices/{invoice}" }),
      addLines: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/add_lines"
      }),
      attachPayment: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/attach_payment"
      }),
      createPreview: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/create_preview"
      }),
      finalizeInvoice: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/finalize"
      }),
      listLineItems: stripeMethod108({
        method: "GET",
        fullPath: "/v1/invoices/{invoice}/lines",
        methodType: "list"
      }),
      markUncollectible: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/mark_uncollectible"
      }),
      pay: stripeMethod108({ method: "POST", fullPath: "/v1/invoices/{invoice}/pay" }),
      removeLines: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/remove_lines"
      }),
      search: stripeMethod108({
        method: "GET",
        fullPath: "/v1/invoices/search",
        methodType: "search"
      }),
      sendInvoice: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/send"
      }),
      updateLines: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/update_lines"
      }),
      updateLineItem: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/lines/{line_item_id}"
      }),
      voidInvoice: stripeMethod108({
        method: "POST",
        fullPath: "/v1/invoices/{invoice}/void"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Mandates.js
var stripeMethod109, Mandates;
var init_Mandates = __esm({
  "../node_modules/stripe/esm/resources/Mandates.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod109 = StripeResource.method;
    Mandates = StripeResource.extend({
      retrieve: stripeMethod109({ method: "GET", fullPath: "/v1/mandates/{mandate}" })
    });
  }
});

// ../node_modules/stripe/esm/resources/OAuth.js
var stripeMethod110, oAuthHost, OAuth;
var init_OAuth = __esm({
  "../node_modules/stripe/esm/resources/OAuth.js"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    init_utils2();
    stripeMethod110 = StripeResource.method;
    oAuthHost = "connect.stripe.com";
    OAuth = StripeResource.extend({
      basePath: "/",
      authorizeUrl(params, options) {
        params = params || {};
        options = options || {};
        let path = "oauth/authorize";
        if (options.express) {
          path = `express/${path}`;
        }
        if (!params.response_type) {
          params.response_type = "code";
        }
        if (!params.client_id) {
          params.client_id = this._stripe.getClientId();
        }
        if (!params.scope) {
          params.scope = "read_write";
        }
        return `https://${oAuthHost}/${path}?${queryStringifyRequestData(params)}`;
      },
      token: stripeMethod110({
        method: "POST",
        path: "oauth/token",
        host: oAuthHost
      }),
      deauthorize(spec, ...args) {
        if (!spec.client_id) {
          spec.client_id = this._stripe.getClientId();
        }
        return stripeMethod110({
          method: "POST",
          path: "oauth/deauthorize",
          host: oAuthHost
        }).apply(this, [spec, ...args]);
      }
    });
  }
});

// ../node_modules/stripe/esm/resources/PaymentAttemptRecords.js
var stripeMethod111, PaymentAttemptRecords;
var init_PaymentAttemptRecords = __esm({
  "../node_modules/stripe/esm/resources/PaymentAttemptRecords.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod111 = StripeResource.method;
    PaymentAttemptRecords = StripeResource.extend({
      retrieve: stripeMethod111({
        method: "GET",
        fullPath: "/v1/payment_attempt_records/{id}"
      }),
      list: stripeMethod111({
        method: "GET",
        fullPath: "/v1/payment_attempt_records",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/PaymentIntents.js
var stripeMethod112, PaymentIntents;
var init_PaymentIntents = __esm({
  "../node_modules/stripe/esm/resources/PaymentIntents.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod112 = StripeResource.method;
    PaymentIntents = StripeResource.extend({
      create: stripeMethod112({ method: "POST", fullPath: "/v1/payment_intents" }),
      retrieve: stripeMethod112({
        method: "GET",
        fullPath: "/v1/payment_intents/{intent}"
      }),
      update: stripeMethod112({
        method: "POST",
        fullPath: "/v1/payment_intents/{intent}"
      }),
      list: stripeMethod112({
        method: "GET",
        fullPath: "/v1/payment_intents",
        methodType: "list"
      }),
      applyCustomerBalance: stripeMethod112({
        method: "POST",
        fullPath: "/v1/payment_intents/{intent}/apply_customer_balance"
      }),
      cancel: stripeMethod112({
        method: "POST",
        fullPath: "/v1/payment_intents/{intent}/cancel"
      }),
      capture: stripeMethod112({
        method: "POST",
        fullPath: "/v1/payment_intents/{intent}/capture"
      }),
      confirm: stripeMethod112({
        method: "POST",
        fullPath: "/v1/payment_intents/{intent}/confirm"
      }),
      incrementAuthorization: stripeMethod112({
        method: "POST",
        fullPath: "/v1/payment_intents/{intent}/increment_authorization"
      }),
      listAmountDetailsLineItems: stripeMethod112({
        method: "GET",
        fullPath: "/v1/payment_intents/{intent}/amount_details_line_items",
        methodType: "list"
      }),
      search: stripeMethod112({
        method: "GET",
        fullPath: "/v1/payment_intents/search",
        methodType: "search"
      }),
      verifyMicrodeposits: stripeMethod112({
        method: "POST",
        fullPath: "/v1/payment_intents/{intent}/verify_microdeposits"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/PaymentLinks.js
var stripeMethod113, PaymentLinks;
var init_PaymentLinks = __esm({
  "../node_modules/stripe/esm/resources/PaymentLinks.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod113 = StripeResource.method;
    PaymentLinks = StripeResource.extend({
      create: stripeMethod113({ method: "POST", fullPath: "/v1/payment_links" }),
      retrieve: stripeMethod113({
        method: "GET",
        fullPath: "/v1/payment_links/{payment_link}"
      }),
      update: stripeMethod113({
        method: "POST",
        fullPath: "/v1/payment_links/{payment_link}"
      }),
      list: stripeMethod113({
        method: "GET",
        fullPath: "/v1/payment_links",
        methodType: "list"
      }),
      listLineItems: stripeMethod113({
        method: "GET",
        fullPath: "/v1/payment_links/{payment_link}/line_items",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/PaymentMethodConfigurations.js
var stripeMethod114, PaymentMethodConfigurations;
var init_PaymentMethodConfigurations = __esm({
  "../node_modules/stripe/esm/resources/PaymentMethodConfigurations.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod114 = StripeResource.method;
    PaymentMethodConfigurations = StripeResource.extend({
      create: stripeMethod114({
        method: "POST",
        fullPath: "/v1/payment_method_configurations"
      }),
      retrieve: stripeMethod114({
        method: "GET",
        fullPath: "/v1/payment_method_configurations/{configuration}"
      }),
      update: stripeMethod114({
        method: "POST",
        fullPath: "/v1/payment_method_configurations/{configuration}"
      }),
      list: stripeMethod114({
        method: "GET",
        fullPath: "/v1/payment_method_configurations",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/PaymentMethodDomains.js
var stripeMethod115, PaymentMethodDomains;
var init_PaymentMethodDomains = __esm({
  "../node_modules/stripe/esm/resources/PaymentMethodDomains.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod115 = StripeResource.method;
    PaymentMethodDomains = StripeResource.extend({
      create: stripeMethod115({
        method: "POST",
        fullPath: "/v1/payment_method_domains"
      }),
      retrieve: stripeMethod115({
        method: "GET",
        fullPath: "/v1/payment_method_domains/{payment_method_domain}"
      }),
      update: stripeMethod115({
        method: "POST",
        fullPath: "/v1/payment_method_domains/{payment_method_domain}"
      }),
      list: stripeMethod115({
        method: "GET",
        fullPath: "/v1/payment_method_domains",
        methodType: "list"
      }),
      validate: stripeMethod115({
        method: "POST",
        fullPath: "/v1/payment_method_domains/{payment_method_domain}/validate"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/PaymentMethods.js
var stripeMethod116, PaymentMethods;
var init_PaymentMethods = __esm({
  "../node_modules/stripe/esm/resources/PaymentMethods.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod116 = StripeResource.method;
    PaymentMethods = StripeResource.extend({
      create: stripeMethod116({ method: "POST", fullPath: "/v1/payment_methods" }),
      retrieve: stripeMethod116({
        method: "GET",
        fullPath: "/v1/payment_methods/{payment_method}"
      }),
      update: stripeMethod116({
        method: "POST",
        fullPath: "/v1/payment_methods/{payment_method}"
      }),
      list: stripeMethod116({
        method: "GET",
        fullPath: "/v1/payment_methods",
        methodType: "list"
      }),
      attach: stripeMethod116({
        method: "POST",
        fullPath: "/v1/payment_methods/{payment_method}/attach"
      }),
      detach: stripeMethod116({
        method: "POST",
        fullPath: "/v1/payment_methods/{payment_method}/detach"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/PaymentRecords.js
var stripeMethod117, PaymentRecords;
var init_PaymentRecords = __esm({
  "../node_modules/stripe/esm/resources/PaymentRecords.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod117 = StripeResource.method;
    PaymentRecords = StripeResource.extend({
      retrieve: stripeMethod117({ method: "GET", fullPath: "/v1/payment_records/{id}" }),
      reportPayment: stripeMethod117({
        method: "POST",
        fullPath: "/v1/payment_records/report_payment"
      }),
      reportPaymentAttempt: stripeMethod117({
        method: "POST",
        fullPath: "/v1/payment_records/{id}/report_payment_attempt"
      }),
      reportPaymentAttemptCanceled: stripeMethod117({
        method: "POST",
        fullPath: "/v1/payment_records/{id}/report_payment_attempt_canceled"
      }),
      reportPaymentAttemptFailed: stripeMethod117({
        method: "POST",
        fullPath: "/v1/payment_records/{id}/report_payment_attempt_failed"
      }),
      reportPaymentAttemptGuaranteed: stripeMethod117({
        method: "POST",
        fullPath: "/v1/payment_records/{id}/report_payment_attempt_guaranteed"
      }),
      reportPaymentAttemptInformational: stripeMethod117({
        method: "POST",
        fullPath: "/v1/payment_records/{id}/report_payment_attempt_informational"
      }),
      reportRefund: stripeMethod117({
        method: "POST",
        fullPath: "/v1/payment_records/{id}/report_refund"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Payouts.js
var stripeMethod118, Payouts;
var init_Payouts = __esm({
  "../node_modules/stripe/esm/resources/Payouts.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod118 = StripeResource.method;
    Payouts = StripeResource.extend({
      create: stripeMethod118({ method: "POST", fullPath: "/v1/payouts" }),
      retrieve: stripeMethod118({ method: "GET", fullPath: "/v1/payouts/{payout}" }),
      update: stripeMethod118({ method: "POST", fullPath: "/v1/payouts/{payout}" }),
      list: stripeMethod118({
        method: "GET",
        fullPath: "/v1/payouts",
        methodType: "list"
      }),
      cancel: stripeMethod118({
        method: "POST",
        fullPath: "/v1/payouts/{payout}/cancel"
      }),
      reverse: stripeMethod118({
        method: "POST",
        fullPath: "/v1/payouts/{payout}/reverse"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Plans.js
var stripeMethod119, Plans;
var init_Plans = __esm({
  "../node_modules/stripe/esm/resources/Plans.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod119 = StripeResource.method;
    Plans = StripeResource.extend({
      create: stripeMethod119({ method: "POST", fullPath: "/v1/plans" }),
      retrieve: stripeMethod119({ method: "GET", fullPath: "/v1/plans/{plan}" }),
      update: stripeMethod119({ method: "POST", fullPath: "/v1/plans/{plan}" }),
      list: stripeMethod119({
        method: "GET",
        fullPath: "/v1/plans",
        methodType: "list"
      }),
      del: stripeMethod119({ method: "DELETE", fullPath: "/v1/plans/{plan}" })
    });
  }
});

// ../node_modules/stripe/esm/resources/Prices.js
var stripeMethod120, Prices;
var init_Prices = __esm({
  "../node_modules/stripe/esm/resources/Prices.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod120 = StripeResource.method;
    Prices = StripeResource.extend({
      create: stripeMethod120({ method: "POST", fullPath: "/v1/prices" }),
      retrieve: stripeMethod120({ method: "GET", fullPath: "/v1/prices/{price}" }),
      update: stripeMethod120({ method: "POST", fullPath: "/v1/prices/{price}" }),
      list: stripeMethod120({
        method: "GET",
        fullPath: "/v1/prices",
        methodType: "list"
      }),
      search: stripeMethod120({
        method: "GET",
        fullPath: "/v1/prices/search",
        methodType: "search"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Products.js
var stripeMethod121, Products2;
var init_Products2 = __esm({
  "../node_modules/stripe/esm/resources/Products.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod121 = StripeResource.method;
    Products2 = StripeResource.extend({
      create: stripeMethod121({ method: "POST", fullPath: "/v1/products" }),
      retrieve: stripeMethod121({ method: "GET", fullPath: "/v1/products/{id}" }),
      update: stripeMethod121({ method: "POST", fullPath: "/v1/products/{id}" }),
      list: stripeMethod121({
        method: "GET",
        fullPath: "/v1/products",
        methodType: "list"
      }),
      del: stripeMethod121({ method: "DELETE", fullPath: "/v1/products/{id}" }),
      createFeature: stripeMethod121({
        method: "POST",
        fullPath: "/v1/products/{product}/features"
      }),
      deleteFeature: stripeMethod121({
        method: "DELETE",
        fullPath: "/v1/products/{product}/features/{id}"
      }),
      listFeatures: stripeMethod121({
        method: "GET",
        fullPath: "/v1/products/{product}/features",
        methodType: "list"
      }),
      retrieveFeature: stripeMethod121({
        method: "GET",
        fullPath: "/v1/products/{product}/features/{id}"
      }),
      search: stripeMethod121({
        method: "GET",
        fullPath: "/v1/products/search",
        methodType: "search"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/PromotionCodes.js
var stripeMethod122, PromotionCodes;
var init_PromotionCodes = __esm({
  "../node_modules/stripe/esm/resources/PromotionCodes.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod122 = StripeResource.method;
    PromotionCodes = StripeResource.extend({
      create: stripeMethod122({ method: "POST", fullPath: "/v1/promotion_codes" }),
      retrieve: stripeMethod122({
        method: "GET",
        fullPath: "/v1/promotion_codes/{promotion_code}"
      }),
      update: stripeMethod122({
        method: "POST",
        fullPath: "/v1/promotion_codes/{promotion_code}"
      }),
      list: stripeMethod122({
        method: "GET",
        fullPath: "/v1/promotion_codes",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Quotes.js
var stripeMethod123, Quotes;
var init_Quotes = __esm({
  "../node_modules/stripe/esm/resources/Quotes.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod123 = StripeResource.method;
    Quotes = StripeResource.extend({
      create: stripeMethod123({ method: "POST", fullPath: "/v1/quotes" }),
      retrieve: stripeMethod123({ method: "GET", fullPath: "/v1/quotes/{quote}" }),
      update: stripeMethod123({ method: "POST", fullPath: "/v1/quotes/{quote}" }),
      list: stripeMethod123({
        method: "GET",
        fullPath: "/v1/quotes",
        methodType: "list"
      }),
      accept: stripeMethod123({ method: "POST", fullPath: "/v1/quotes/{quote}/accept" }),
      cancel: stripeMethod123({ method: "POST", fullPath: "/v1/quotes/{quote}/cancel" }),
      finalizeQuote: stripeMethod123({
        method: "POST",
        fullPath: "/v1/quotes/{quote}/finalize"
      }),
      listComputedUpfrontLineItems: stripeMethod123({
        method: "GET",
        fullPath: "/v1/quotes/{quote}/computed_upfront_line_items",
        methodType: "list"
      }),
      listLineItems: stripeMethod123({
        method: "GET",
        fullPath: "/v1/quotes/{quote}/line_items",
        methodType: "list"
      }),
      pdf: stripeMethod123({
        method: "GET",
        fullPath: "/v1/quotes/{quote}/pdf",
        host: "files.stripe.com",
        streaming: true
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Refunds.js
var stripeMethod124, Refunds2;
var init_Refunds2 = __esm({
  "../node_modules/stripe/esm/resources/Refunds.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod124 = StripeResource.method;
    Refunds2 = StripeResource.extend({
      create: stripeMethod124({ method: "POST", fullPath: "/v1/refunds" }),
      retrieve: stripeMethod124({ method: "GET", fullPath: "/v1/refunds/{refund}" }),
      update: stripeMethod124({ method: "POST", fullPath: "/v1/refunds/{refund}" }),
      list: stripeMethod124({
        method: "GET",
        fullPath: "/v1/refunds",
        methodType: "list"
      }),
      cancel: stripeMethod124({
        method: "POST",
        fullPath: "/v1/refunds/{refund}/cancel"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Reviews.js
var stripeMethod125, Reviews;
var init_Reviews = __esm({
  "../node_modules/stripe/esm/resources/Reviews.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod125 = StripeResource.method;
    Reviews = StripeResource.extend({
      retrieve: stripeMethod125({ method: "GET", fullPath: "/v1/reviews/{review}" }),
      list: stripeMethod125({
        method: "GET",
        fullPath: "/v1/reviews",
        methodType: "list"
      }),
      approve: stripeMethod125({
        method: "POST",
        fullPath: "/v1/reviews/{review}/approve"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/SetupAttempts.js
var stripeMethod126, SetupAttempts;
var init_SetupAttempts = __esm({
  "../node_modules/stripe/esm/resources/SetupAttempts.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod126 = StripeResource.method;
    SetupAttempts = StripeResource.extend({
      list: stripeMethod126({
        method: "GET",
        fullPath: "/v1/setup_attempts",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/SetupIntents.js
var stripeMethod127, SetupIntents;
var init_SetupIntents = __esm({
  "../node_modules/stripe/esm/resources/SetupIntents.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod127 = StripeResource.method;
    SetupIntents = StripeResource.extend({
      create: stripeMethod127({ method: "POST", fullPath: "/v1/setup_intents" }),
      retrieve: stripeMethod127({
        method: "GET",
        fullPath: "/v1/setup_intents/{intent}"
      }),
      update: stripeMethod127({
        method: "POST",
        fullPath: "/v1/setup_intents/{intent}"
      }),
      list: stripeMethod127({
        method: "GET",
        fullPath: "/v1/setup_intents",
        methodType: "list"
      }),
      cancel: stripeMethod127({
        method: "POST",
        fullPath: "/v1/setup_intents/{intent}/cancel"
      }),
      confirm: stripeMethod127({
        method: "POST",
        fullPath: "/v1/setup_intents/{intent}/confirm"
      }),
      verifyMicrodeposits: stripeMethod127({
        method: "POST",
        fullPath: "/v1/setup_intents/{intent}/verify_microdeposits"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/ShippingRates.js
var stripeMethod128, ShippingRates;
var init_ShippingRates = __esm({
  "../node_modules/stripe/esm/resources/ShippingRates.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod128 = StripeResource.method;
    ShippingRates = StripeResource.extend({
      create: stripeMethod128({ method: "POST", fullPath: "/v1/shipping_rates" }),
      retrieve: stripeMethod128({
        method: "GET",
        fullPath: "/v1/shipping_rates/{shipping_rate_token}"
      }),
      update: stripeMethod128({
        method: "POST",
        fullPath: "/v1/shipping_rates/{shipping_rate_token}"
      }),
      list: stripeMethod128({
        method: "GET",
        fullPath: "/v1/shipping_rates",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Sources.js
var stripeMethod129, Sources;
var init_Sources = __esm({
  "../node_modules/stripe/esm/resources/Sources.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod129 = StripeResource.method;
    Sources = StripeResource.extend({
      create: stripeMethod129({ method: "POST", fullPath: "/v1/sources" }),
      retrieve: stripeMethod129({ method: "GET", fullPath: "/v1/sources/{source}" }),
      update: stripeMethod129({ method: "POST", fullPath: "/v1/sources/{source}" }),
      listSourceTransactions: stripeMethod129({
        method: "GET",
        fullPath: "/v1/sources/{source}/source_transactions",
        methodType: "list"
      }),
      verify: stripeMethod129({
        method: "POST",
        fullPath: "/v1/sources/{source}/verify"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/SubscriptionItems.js
var stripeMethod130, SubscriptionItems;
var init_SubscriptionItems = __esm({
  "../node_modules/stripe/esm/resources/SubscriptionItems.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod130 = StripeResource.method;
    SubscriptionItems = StripeResource.extend({
      create: stripeMethod130({ method: "POST", fullPath: "/v1/subscription_items" }),
      retrieve: stripeMethod130({
        method: "GET",
        fullPath: "/v1/subscription_items/{item}"
      }),
      update: stripeMethod130({
        method: "POST",
        fullPath: "/v1/subscription_items/{item}"
      }),
      list: stripeMethod130({
        method: "GET",
        fullPath: "/v1/subscription_items",
        methodType: "list"
      }),
      del: stripeMethod130({
        method: "DELETE",
        fullPath: "/v1/subscription_items/{item}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/SubscriptionSchedules.js
var stripeMethod131, SubscriptionSchedules;
var init_SubscriptionSchedules = __esm({
  "../node_modules/stripe/esm/resources/SubscriptionSchedules.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod131 = StripeResource.method;
    SubscriptionSchedules = StripeResource.extend({
      create: stripeMethod131({
        method: "POST",
        fullPath: "/v1/subscription_schedules"
      }),
      retrieve: stripeMethod131({
        method: "GET",
        fullPath: "/v1/subscription_schedules/{schedule}"
      }),
      update: stripeMethod131({
        method: "POST",
        fullPath: "/v1/subscription_schedules/{schedule}"
      }),
      list: stripeMethod131({
        method: "GET",
        fullPath: "/v1/subscription_schedules",
        methodType: "list"
      }),
      cancel: stripeMethod131({
        method: "POST",
        fullPath: "/v1/subscription_schedules/{schedule}/cancel"
      }),
      release: stripeMethod131({
        method: "POST",
        fullPath: "/v1/subscription_schedules/{schedule}/release"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Subscriptions.js
var stripeMethod132, Subscriptions;
var init_Subscriptions = __esm({
  "../node_modules/stripe/esm/resources/Subscriptions.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod132 = StripeResource.method;
    Subscriptions = StripeResource.extend({
      create: stripeMethod132({ method: "POST", fullPath: "/v1/subscriptions" }),
      retrieve: stripeMethod132({
        method: "GET",
        fullPath: "/v1/subscriptions/{subscription_exposed_id}"
      }),
      update: stripeMethod132({
        method: "POST",
        fullPath: "/v1/subscriptions/{subscription_exposed_id}"
      }),
      list: stripeMethod132({
        method: "GET",
        fullPath: "/v1/subscriptions",
        methodType: "list"
      }),
      cancel: stripeMethod132({
        method: "DELETE",
        fullPath: "/v1/subscriptions/{subscription_exposed_id}"
      }),
      deleteDiscount: stripeMethod132({
        method: "DELETE",
        fullPath: "/v1/subscriptions/{subscription_exposed_id}/discount"
      }),
      migrate: stripeMethod132({
        method: "POST",
        fullPath: "/v1/subscriptions/{subscription}/migrate"
      }),
      resume: stripeMethod132({
        method: "POST",
        fullPath: "/v1/subscriptions/{subscription}/resume"
      }),
      search: stripeMethod132({
        method: "GET",
        fullPath: "/v1/subscriptions/search",
        methodType: "search"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TaxCodes.js
var stripeMethod133, TaxCodes;
var init_TaxCodes = __esm({
  "../node_modules/stripe/esm/resources/TaxCodes.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod133 = StripeResource.method;
    TaxCodes = StripeResource.extend({
      retrieve: stripeMethod133({ method: "GET", fullPath: "/v1/tax_codes/{id}" }),
      list: stripeMethod133({
        method: "GET",
        fullPath: "/v1/tax_codes",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/TaxIds.js
var stripeMethod134, TaxIds;
var init_TaxIds = __esm({
  "../node_modules/stripe/esm/resources/TaxIds.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod134 = StripeResource.method;
    TaxIds = StripeResource.extend({
      create: stripeMethod134({ method: "POST", fullPath: "/v1/tax_ids" }),
      retrieve: stripeMethod134({ method: "GET", fullPath: "/v1/tax_ids/{id}" }),
      list: stripeMethod134({
        method: "GET",
        fullPath: "/v1/tax_ids",
        methodType: "list"
      }),
      del: stripeMethod134({ method: "DELETE", fullPath: "/v1/tax_ids/{id}" })
    });
  }
});

// ../node_modules/stripe/esm/resources/TaxRates.js
var stripeMethod135, TaxRates;
var init_TaxRates = __esm({
  "../node_modules/stripe/esm/resources/TaxRates.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod135 = StripeResource.method;
    TaxRates = StripeResource.extend({
      create: stripeMethod135({ method: "POST", fullPath: "/v1/tax_rates" }),
      retrieve: stripeMethod135({ method: "GET", fullPath: "/v1/tax_rates/{tax_rate}" }),
      update: stripeMethod135({ method: "POST", fullPath: "/v1/tax_rates/{tax_rate}" }),
      list: stripeMethod135({
        method: "GET",
        fullPath: "/v1/tax_rates",
        methodType: "list"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/Tokens.js
var stripeMethod136, Tokens2;
var init_Tokens2 = __esm({
  "../node_modules/stripe/esm/resources/Tokens.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod136 = StripeResource.method;
    Tokens2 = StripeResource.extend({
      create: stripeMethod136({ method: "POST", fullPath: "/v1/tokens" }),
      retrieve: stripeMethod136({ method: "GET", fullPath: "/v1/tokens/{token}" })
    });
  }
});

// ../node_modules/stripe/esm/resources/Topups.js
var stripeMethod137, Topups;
var init_Topups = __esm({
  "../node_modules/stripe/esm/resources/Topups.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod137 = StripeResource.method;
    Topups = StripeResource.extend({
      create: stripeMethod137({ method: "POST", fullPath: "/v1/topups" }),
      retrieve: stripeMethod137({ method: "GET", fullPath: "/v1/topups/{topup}" }),
      update: stripeMethod137({ method: "POST", fullPath: "/v1/topups/{topup}" }),
      list: stripeMethod137({
        method: "GET",
        fullPath: "/v1/topups",
        methodType: "list"
      }),
      cancel: stripeMethod137({ method: "POST", fullPath: "/v1/topups/{topup}/cancel" })
    });
  }
});

// ../node_modules/stripe/esm/resources/Transfers.js
var stripeMethod138, Transfers;
var init_Transfers = __esm({
  "../node_modules/stripe/esm/resources/Transfers.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod138 = StripeResource.method;
    Transfers = StripeResource.extend({
      create: stripeMethod138({ method: "POST", fullPath: "/v1/transfers" }),
      retrieve: stripeMethod138({ method: "GET", fullPath: "/v1/transfers/{transfer}" }),
      update: stripeMethod138({ method: "POST", fullPath: "/v1/transfers/{transfer}" }),
      list: stripeMethod138({
        method: "GET",
        fullPath: "/v1/transfers",
        methodType: "list"
      }),
      createReversal: stripeMethod138({
        method: "POST",
        fullPath: "/v1/transfers/{id}/reversals"
      }),
      listReversals: stripeMethod138({
        method: "GET",
        fullPath: "/v1/transfers/{id}/reversals",
        methodType: "list"
      }),
      retrieveReversal: stripeMethod138({
        method: "GET",
        fullPath: "/v1/transfers/{transfer}/reversals/{id}"
      }),
      updateReversal: stripeMethod138({
        method: "POST",
        fullPath: "/v1/transfers/{transfer}/reversals/{id}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources/WebhookEndpoints.js
var stripeMethod139, WebhookEndpoints;
var init_WebhookEndpoints = __esm({
  "../node_modules/stripe/esm/resources/WebhookEndpoints.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_StripeResource();
    stripeMethod139 = StripeResource.method;
    WebhookEndpoints = StripeResource.extend({
      create: stripeMethod139({ method: "POST", fullPath: "/v1/webhook_endpoints" }),
      retrieve: stripeMethod139({
        method: "GET",
        fullPath: "/v1/webhook_endpoints/{webhook_endpoint}"
      }),
      update: stripeMethod139({
        method: "POST",
        fullPath: "/v1/webhook_endpoints/{webhook_endpoint}"
      }),
      list: stripeMethod139({
        method: "GET",
        fullPath: "/v1/webhook_endpoints",
        methodType: "list"
      }),
      del: stripeMethod139({
        method: "DELETE",
        fullPath: "/v1/webhook_endpoints/{webhook_endpoint}"
      })
    });
  }
});

// ../node_modules/stripe/esm/resources.js
var resources_exports = {};
__export(resources_exports, {
  Account: () => Accounts3,
  AccountLinks: () => AccountLinks2,
  AccountSessions: () => AccountSessions,
  Accounts: () => Accounts3,
  ApplePayDomains: () => ApplePayDomains,
  ApplicationFees: () => ApplicationFees,
  Apps: () => Apps,
  Balance: () => Balance,
  BalanceSettings: () => BalanceSettings,
  BalanceTransactions: () => BalanceTransactions,
  Billing: () => Billing,
  BillingPortal: () => BillingPortal,
  Charges: () => Charges,
  Checkout: () => Checkout,
  Climate: () => Climate,
  ConfirmationTokens: () => ConfirmationTokens2,
  CountrySpecs: () => CountrySpecs,
  Coupons: () => Coupons,
  CreditNotes: () => CreditNotes,
  CustomerSessions: () => CustomerSessions,
  Customers: () => Customers2,
  Disputes: () => Disputes2,
  Entitlements: () => Entitlements,
  EphemeralKeys: () => EphemeralKeys,
  Events: () => Events2,
  ExchangeRates: () => ExchangeRates,
  FileLinks: () => FileLinks,
  Files: () => Files,
  FinancialConnections: () => FinancialConnections,
  Forwarding: () => Forwarding,
  Identity: () => Identity,
  InvoiceItems: () => InvoiceItems,
  InvoicePayments: () => InvoicePayments,
  InvoiceRenderingTemplates: () => InvoiceRenderingTemplates,
  Invoices: () => Invoices,
  Issuing: () => Issuing,
  Mandates: () => Mandates,
  OAuth: () => OAuth,
  PaymentAttemptRecords: () => PaymentAttemptRecords,
  PaymentIntents: () => PaymentIntents,
  PaymentLinks: () => PaymentLinks,
  PaymentMethodConfigurations: () => PaymentMethodConfigurations,
  PaymentMethodDomains: () => PaymentMethodDomains,
  PaymentMethods: () => PaymentMethods,
  PaymentRecords: () => PaymentRecords,
  Payouts: () => Payouts,
  Plans: () => Plans,
  Prices: () => Prices,
  Products: () => Products2,
  PromotionCodes: () => PromotionCodes,
  Quotes: () => Quotes,
  Radar: () => Radar,
  Refunds: () => Refunds2,
  Reporting: () => Reporting,
  Reviews: () => Reviews,
  SetupAttempts: () => SetupAttempts,
  SetupIntents: () => SetupIntents,
  ShippingRates: () => ShippingRates,
  Sigma: () => Sigma,
  Sources: () => Sources,
  SubscriptionItems: () => SubscriptionItems,
  SubscriptionSchedules: () => SubscriptionSchedules,
  Subscriptions: () => Subscriptions,
  Tax: () => Tax,
  TaxCodes: () => TaxCodes,
  TaxIds: () => TaxIds,
  TaxRates: () => TaxRates,
  Terminal: () => Terminal,
  TestHelpers: () => TestHelpers,
  Tokens: () => Tokens2,
  Topups: () => Topups,
  Transfers: () => Transfers,
  Treasury: () => Treasury,
  V2: () => V2,
  WebhookEndpoints: () => WebhookEndpoints
});
var Apps, Billing, BillingPortal, Checkout, Climate, Entitlements, FinancialConnections, Forwarding, Identity, Issuing, Radar, Reporting, Sigma, Tax, Terminal, TestHelpers, Treasury, V2;
var init_resources = __esm({
  "../node_modules/stripe/esm/resources.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_ResourceNamespace();
    init_AccountLinks();
    init_AccountTokens();
    init_Accounts();
    init_Accounts2();
    init_ActiveEntitlements();
    init_Alerts();
    init_Associations();
    init_Authorizations();
    init_Authorizations2();
    init_Calculations();
    init_Cardholders();
    init_Cards();
    init_Cards2();
    init_Configurations();
    init_Configurations2();
    init_ConfirmationTokens();
    init_ConnectionTokens();
    init_CreditBalanceSummary();
    init_CreditBalanceTransactions();
    init_CreditGrants();
    init_CreditReversals();
    init_Customers();
    init_DebitReversals();
    init_Disputes();
    init_EarlyFraudWarnings();
    init_EventDestinations();
    init_Events();
    init_Features();
    init_FinancialAccounts();
    init_InboundTransfers();
    init_InboundTransfers2();
    init_Locations();
    init_MeterEventAdjustments();
    init_MeterEventAdjustments2();
    init_MeterEventSession();
    init_MeterEventStream();
    init_MeterEvents();
    init_MeterEvents2();
    init_Meters();
    init_OnboardingLinks();
    init_Orders();
    init_OutboundPayments();
    init_OutboundPayments2();
    init_OutboundTransfers();
    init_OutboundTransfers2();
    init_PaymentEvaluations();
    init_PersonalizationDesigns();
    init_PersonalizationDesigns2();
    init_PhysicalBundles();
    init_Products();
    init_Readers();
    init_Readers2();
    init_ReceivedCredits();
    init_ReceivedCredits2();
    init_ReceivedDebits();
    init_ReceivedDebits2();
    init_Refunds();
    init_Registrations();
    init_ReportRuns();
    init_ReportTypes();
    init_Requests();
    init_ScheduledQueryRuns();
    init_Secrets();
    init_Sessions();
    init_Sessions2();
    init_Sessions3();
    init_Settings();
    init_Suppliers();
    init_TestClocks();
    init_Tokens();
    init_TransactionEntries();
    init_Transactions();
    init_Transactions2();
    init_Transactions3();
    init_Transactions4();
    init_Transactions5();
    init_ValueListItems();
    init_ValueLists();
    init_VerificationReports();
    init_VerificationSessions();
    init_Accounts3();
    init_AccountLinks2();
    init_AccountSessions();
    init_Accounts3();
    init_ApplePayDomains();
    init_ApplicationFees();
    init_Balance();
    init_BalanceSettings();
    init_BalanceTransactions();
    init_Charges();
    init_ConfirmationTokens2();
    init_CountrySpecs();
    init_Coupons();
    init_CreditNotes();
    init_CustomerSessions();
    init_Customers2();
    init_Disputes2();
    init_EphemeralKeys();
    init_Events2();
    init_ExchangeRates();
    init_FileLinks();
    init_Files();
    init_InvoiceItems();
    init_InvoicePayments();
    init_InvoiceRenderingTemplates();
    init_Invoices();
    init_Mandates();
    init_OAuth();
    init_PaymentAttemptRecords();
    init_PaymentIntents();
    init_PaymentLinks();
    init_PaymentMethodConfigurations();
    init_PaymentMethodDomains();
    init_PaymentMethods();
    init_PaymentRecords();
    init_Payouts();
    init_Plans();
    init_Prices();
    init_Products2();
    init_PromotionCodes();
    init_Quotes();
    init_Refunds2();
    init_Reviews();
    init_SetupAttempts();
    init_SetupIntents();
    init_ShippingRates();
    init_Sources();
    init_SubscriptionItems();
    init_SubscriptionSchedules();
    init_Subscriptions();
    init_TaxCodes();
    init_TaxIds();
    init_TaxRates();
    init_Tokens2();
    init_Topups();
    init_Transfers();
    init_WebhookEndpoints();
    Apps = resourceNamespace("apps", { Secrets });
    Billing = resourceNamespace("billing", {
      Alerts,
      CreditBalanceSummary,
      CreditBalanceTransactions,
      CreditGrants,
      MeterEventAdjustments,
      MeterEvents,
      Meters
    });
    BillingPortal = resourceNamespace("billingPortal", {
      Configurations,
      Sessions
    });
    Checkout = resourceNamespace("checkout", {
      Sessions: Sessions2
    });
    Climate = resourceNamespace("climate", {
      Orders,
      Products,
      Suppliers
    });
    Entitlements = resourceNamespace("entitlements", {
      ActiveEntitlements,
      Features
    });
    FinancialConnections = resourceNamespace("financialConnections", {
      Accounts,
      Sessions: Sessions3,
      Transactions
    });
    Forwarding = resourceNamespace("forwarding", {
      Requests
    });
    Identity = resourceNamespace("identity", {
      VerificationReports,
      VerificationSessions
    });
    Issuing = resourceNamespace("issuing", {
      Authorizations,
      Cardholders,
      Cards,
      Disputes,
      PersonalizationDesigns,
      PhysicalBundles,
      Tokens,
      Transactions: Transactions2
    });
    Radar = resourceNamespace("radar", {
      EarlyFraudWarnings,
      PaymentEvaluations,
      ValueListItems,
      ValueLists
    });
    Reporting = resourceNamespace("reporting", {
      ReportRuns,
      ReportTypes
    });
    Sigma = resourceNamespace("sigma", {
      ScheduledQueryRuns
    });
    Tax = resourceNamespace("tax", {
      Associations,
      Calculations,
      Registrations,
      Settings,
      Transactions: Transactions3
    });
    Terminal = resourceNamespace("terminal", {
      Configurations: Configurations2,
      ConnectionTokens,
      Locations,
      OnboardingLinks,
      Readers
    });
    TestHelpers = resourceNamespace("testHelpers", {
      ConfirmationTokens,
      Customers,
      Refunds,
      TestClocks,
      Issuing: resourceNamespace("issuing", {
        Authorizations: Authorizations2,
        Cards: Cards2,
        PersonalizationDesigns: PersonalizationDesigns2,
        Transactions: Transactions4
      }),
      Terminal: resourceNamespace("terminal", {
        Readers: Readers2
      }),
      Treasury: resourceNamespace("treasury", {
        InboundTransfers,
        OutboundPayments,
        OutboundTransfers,
        ReceivedCredits,
        ReceivedDebits
      })
    });
    Treasury = resourceNamespace("treasury", {
      CreditReversals,
      DebitReversals,
      FinancialAccounts,
      InboundTransfers: InboundTransfers2,
      OutboundPayments: OutboundPayments2,
      OutboundTransfers: OutboundTransfers2,
      ReceivedCredits: ReceivedCredits2,
      ReceivedDebits: ReceivedDebits2,
      TransactionEntries,
      Transactions: Transactions5
    });
    V2 = resourceNamespace("v2", {
      Billing: resourceNamespace("billing", {
        MeterEventAdjustments: MeterEventAdjustments2,
        MeterEventSession,
        MeterEventStream,
        MeterEvents: MeterEvents2
      }),
      Core: resourceNamespace("core", {
        AccountLinks,
        AccountTokens,
        Accounts: Accounts2,
        EventDestinations,
        Events
      })
    });
  }
});

// ../node_modules/stripe/esm/stripe.core.js
function createStripe(platformFunctions, requestSender = defaultRequestSenderFactory) {
  Stripe2.PACKAGE_VERSION = "20.4.1";
  Stripe2.API_VERSION = ApiVersion;
  const aiAgent = typeof process !== "undefined" && process.env ? detectAIAgent(process.env) : "";
  Stripe2.AI_AGENT = aiAgent;
  Stripe2.USER_AGENT = Object.assign(Object.assign({ bindings_version: Stripe2.PACKAGE_VERSION, lang: "node", publisher: "stripe", uname: null, typescript: false }, determineProcessUserAgentProperties()), aiAgent ? { ai_agent: aiAgent } : {});
  Stripe2.StripeResource = StripeResource;
  Stripe2.StripeContext = StripeContext;
  Stripe2.resources = resources_exports;
  Stripe2.HttpClient = HttpClient;
  Stripe2.HttpClientResponse = HttpClientResponse;
  Stripe2.CryptoProvider = CryptoProvider;
  Stripe2.webhooks = createWebhooks(platformFunctions);
  function Stripe2(key, config2 = {}) {
    if (!(this instanceof Stripe2)) {
      return new Stripe2(key, config2);
    }
    const props = this._getPropsFromConfig(config2);
    this._platformFunctions = platformFunctions;
    Object.defineProperty(this, "_emitter", {
      value: this._platformFunctions.createEmitter(),
      enumerable: false,
      configurable: false,
      writable: false
    });
    this.VERSION = Stripe2.PACKAGE_VERSION;
    this.on = this._emitter.on.bind(this._emitter);
    this.once = this._emitter.once.bind(this._emitter);
    this.off = this._emitter.removeListener.bind(this._emitter);
    const agent = props.httpAgent || null;
    this._api = {
      host: props.host || DEFAULT_HOST,
      port: props.port || DEFAULT_PORT,
      protocol: props.protocol || "https",
      basePath: DEFAULT_BASE_PATH,
      version: props.apiVersion || DEFAULT_API_VERSION,
      timeout: validateInteger("timeout", props.timeout, DEFAULT_TIMEOUT),
      maxNetworkRetries: validateInteger("maxNetworkRetries", props.maxNetworkRetries, 2),
      agent,
      httpClient: props.httpClient || (agent ? this._platformFunctions.createNodeHttpClient(agent) : this._platformFunctions.createDefaultHttpClient()),
      dev: false,
      stripeAccount: props.stripeAccount || null,
      stripeContext: props.stripeContext || null
    };
    const typescript = props.typescript || false;
    if (typescript !== Stripe2.USER_AGENT.typescript) {
      Stripe2.USER_AGENT.typescript = typescript;
    }
    if (props.appInfo) {
      this._setAppInfo(props.appInfo);
    }
    this._prepResources();
    this._setAuthenticator(key, props.authenticator);
    this.errors = Error_exports;
    this.webhooks = Stripe2.webhooks;
    this._prevRequestMetrics = [];
    this._enableTelemetry = props.telemetry !== false;
    this._requestSender = requestSender(this);
    this.StripeResource = Stripe2.StripeResource;
  }
  __name(Stripe2, "Stripe");
  Stripe2.errors = Error_exports;
  Stripe2.createNodeHttpClient = platformFunctions.createNodeHttpClient;
  Stripe2.createFetchHttpClient = platformFunctions.createFetchHttpClient;
  Stripe2.createNodeCryptoProvider = platformFunctions.createNodeCryptoProvider;
  Stripe2.createSubtleCryptoProvider = platformFunctions.createSubtleCryptoProvider;
  Stripe2.prototype = {
    // Properties are set in the constructor above
    _appInfo: void 0,
    on: null,
    off: null,
    once: null,
    VERSION: null,
    StripeResource: null,
    webhooks: null,
    errors: null,
    _api: null,
    _prevRequestMetrics: null,
    _emitter: null,
    _enableTelemetry: null,
    _requestSender: null,
    _platformFunctions: null,
    rawRequest(method, path, params, options) {
      return this._requestSender._rawRequest(method, path, params, options);
    },
    /**
     * @private
     */
    _setAuthenticator(key, authenticator) {
      if (key && authenticator) {
        throw new Error("Can't specify both apiKey and authenticator");
      }
      if (!key && !authenticator) {
        throw new Error("Neither apiKey nor config.authenticator provided");
      }
      this._authenticator = key ? createApiKeyAuthenticator(key) : authenticator;
    },
    /**
     * @private
     * This may be removed in the future.
     */
    _setAppInfo(info3) {
      if (info3 && typeof info3 !== "object") {
        throw new Error("AppInfo must be an object.");
      }
      if (info3 && !info3.name) {
        throw new Error("AppInfo.name is required");
      }
      info3 = info3 || {};
      this._appInfo = APP_INFO_PROPERTIES.reduce((accum, prop) => {
        if (typeof info3[prop] == "string") {
          accum = accum || {};
          accum[prop] = info3[prop];
        }
        return accum;
      }, {});
    },
    /**
     * @private
     * This may be removed in the future.
     */
    _setApiField(key, value) {
      this._api[key] = value;
    },
    /**
     * @private
     * Please open or upvote an issue at github.com/stripe/stripe-node
     * if you use this, detailing your use-case.
     *
     * It may be deprecated and removed in the future.
     */
    getApiField(key) {
      return this._api[key];
    },
    setClientId(clientId) {
      this._clientId = clientId;
    },
    getClientId() {
      return this._clientId;
    },
    /**
     * @private
     * Please open or upvote an issue at github.com/stripe/stripe-node
     * if you use this, detailing your use-case.
     *
     * It may be deprecated and removed in the future.
     */
    getConstant: (c) => {
      switch (c) {
        case "DEFAULT_HOST":
          return DEFAULT_HOST;
        case "DEFAULT_PORT":
          return DEFAULT_PORT;
        case "DEFAULT_BASE_PATH":
          return DEFAULT_BASE_PATH;
        case "DEFAULT_API_VERSION":
          return DEFAULT_API_VERSION;
        case "DEFAULT_TIMEOUT":
          return DEFAULT_TIMEOUT;
        case "MAX_NETWORK_RETRY_DELAY_SEC":
          return MAX_NETWORK_RETRY_DELAY_SEC;
        case "INITIAL_NETWORK_RETRY_DELAY_SEC":
          return INITIAL_NETWORK_RETRY_DELAY_SEC;
      }
      return Stripe2[c];
    },
    getMaxNetworkRetries() {
      return this.getApiField("maxNetworkRetries");
    },
    /**
     * @private
     * This may be removed in the future.
     */
    _setApiNumberField(prop, n, defaultVal) {
      const val = validateInteger(prop, n, defaultVal);
      this._setApiField(prop, val);
    },
    getMaxNetworkRetryDelay() {
      return MAX_NETWORK_RETRY_DELAY_SEC;
    },
    getInitialNetworkRetryDelay() {
      return INITIAL_NETWORK_RETRY_DELAY_SEC;
    },
    /**
     * @private
     * Please open or upvote an issue at github.com/stripe/stripe-node
     * if you use this, detailing your use-case.
     *
     * It may be deprecated and removed in the future.
     *
     * Gets a JSON version of a User-Agent and uses a cached version for a slight
     * speed advantage.
     */
    getClientUserAgent(cb) {
      return this.getClientUserAgentSeeded(Stripe2.USER_AGENT, cb);
    },
    /**
     * @private
     * Please open or upvote an issue at github.com/stripe/stripe-node
     * if you use this, detailing your use-case.
     *
     * It may be deprecated and removed in the future.
     *
     * Gets a JSON version of a User-Agent by encoding a seeded object and
     * fetching a uname from the system.
     */
    getClientUserAgentSeeded(seed, cb) {
      this._platformFunctions.getUname().then((uname) => {
        var _a;
        const userAgent = {};
        for (const field in seed) {
          if (!Object.prototype.hasOwnProperty.call(seed, field)) {
            continue;
          }
          userAgent[field] = encodeURIComponent((_a = seed[field]) !== null && _a !== void 0 ? _a : "null");
        }
        userAgent.uname = encodeURIComponent(uname || "UNKNOWN");
        const client = this.getApiField("httpClient");
        if (client) {
          userAgent.httplib = encodeURIComponent(client.getClientName());
        }
        if (this._appInfo) {
          userAgent.application = this._appInfo;
        }
        cb(JSON.stringify(userAgent));
      });
    },
    /**
     * @private
     * Please open or upvote an issue at github.com/stripe/stripe-node
     * if you use this, detailing your use-case.
     *
     * It may be deprecated and removed in the future.
     */
    getAppInfoAsString() {
      if (!this._appInfo) {
        return "";
      }
      let formatted = this._appInfo.name;
      if (this._appInfo.version) {
        formatted += `/${this._appInfo.version}`;
      }
      if (this._appInfo.url) {
        formatted += ` (${this._appInfo.url})`;
      }
      return formatted;
    },
    getTelemetryEnabled() {
      return this._enableTelemetry;
    },
    /**
     * @private
     * This may be removed in the future.
     */
    _prepResources() {
      for (const name in resources_exports) {
        if (!Object.prototype.hasOwnProperty.call(resources_exports, name)) {
          continue;
        }
        this[pascalToCamelCase(name)] = new resources_exports[name](this);
      }
    },
    /**
     * @private
     * This may be removed in the future.
     */
    _getPropsFromConfig(config2) {
      if (!config2) {
        return {};
      }
      const isString = typeof config2 === "string";
      const isObject2 = config2 === Object(config2) && !Array.isArray(config2);
      if (!isObject2 && !isString) {
        throw new Error("Config must either be an object or a string");
      }
      if (isString) {
        return {
          apiVersion: config2
        };
      }
      const values = Object.keys(config2).filter((value) => !ALLOWED_CONFIG_PROPERTIES.includes(value));
      if (values.length > 0) {
        throw new Error(`Config object may only contain the following: ${ALLOWED_CONFIG_PROPERTIES.join(", ")}`);
      }
      return config2;
    },
    parseEventNotification(payload, header, secret, tolerance, cryptoProvider, receivedAt) {
      const eventNotification = this.webhooks.constructEvent(payload, header, secret, tolerance, cryptoProvider, receivedAt);
      if (eventNotification.context) {
        eventNotification.context = StripeContext.parse(eventNotification.context);
      }
      eventNotification.fetchEvent = () => {
        return this._requestSender._rawRequest("GET", `/v2/core/events/${eventNotification.id}`, void 0, {
          stripeContext: eventNotification.context,
          headers: {
            "Stripe-Request-Trigger": `event=${eventNotification.id}`
          }
        }, ["fetch_event"]);
      };
      eventNotification.fetchRelatedObject = () => {
        if (!eventNotification.related_object) {
          return Promise.resolve(null);
        }
        return this._requestSender._rawRequest("GET", eventNotification.related_object.url, void 0, {
          stripeContext: eventNotification.context,
          headers: {
            "Stripe-Request-Trigger": `event=${eventNotification.id}`
          }
        }, ["fetch_related_object"]);
      };
      return eventNotification;
    }
  };
  return Stripe2;
}
var DEFAULT_HOST, DEFAULT_PORT, DEFAULT_BASE_PATH, DEFAULT_API_VERSION, DEFAULT_TIMEOUT, MAX_NETWORK_RETRY_DELAY_SEC, INITIAL_NETWORK_RETRY_DELAY_SEC, APP_INFO_PROPERTIES, ALLOWED_CONFIG_PROPERTIES, defaultRequestSenderFactory;
var init_stripe_core = __esm({
  "../node_modules/stripe/esm/stripe.core.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_Error();
    init_RequestSender();
    init_StripeResource();
    init_StripeContext();
    init_Webhooks();
    init_apiVersion();
    init_CryptoProvider();
    init_HttpClient();
    init_resources();
    init_utils2();
    DEFAULT_HOST = "api.stripe.com";
    DEFAULT_PORT = "443";
    DEFAULT_BASE_PATH = "/v1/";
    DEFAULT_API_VERSION = ApiVersion;
    DEFAULT_TIMEOUT = 8e4;
    MAX_NETWORK_RETRY_DELAY_SEC = 5;
    INITIAL_NETWORK_RETRY_DELAY_SEC = 0.5;
    APP_INFO_PROPERTIES = ["name", "version", "url", "partner_id"];
    ALLOWED_CONFIG_PROPERTIES = [
      "authenticator",
      "apiVersion",
      "typescript",
      "maxNetworkRetries",
      "httpAgent",
      "httpClient",
      "timeout",
      "host",
      "port",
      "protocol",
      "telemetry",
      "appInfo",
      "stripeAccount",
      "stripeContext"
    ];
    defaultRequestSenderFactory = /* @__PURE__ */ __name((stripe) => new RequestSender(stripe, StripeResource.MAX_BUFFERED_REQUEST_METRICS), "defaultRequestSenderFactory");
    __name(createStripe, "createStripe");
  }
});

// ../node_modules/stripe/esm/stripe.esm.worker.js
var Stripe, stripe_esm_worker_default;
var init_stripe_esm_worker = __esm({
  "../node_modules/stripe/esm/stripe.esm.worker.js"() {
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_WebPlatformFunctions();
    init_stripe_core();
    Stripe = createStripe(new WebPlatformFunctions());
    stripe_esm_worker_default = Stripe;
  }
});

// _shared/stripe.ts
function getStripe(env2) {
  if (!env2.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripeInstance) {
    stripeInstance = new stripe_esm_worker_default(env2.STRIPE_SECRET_KEY, {
      apiVersion: "2025-04-30.basil",
      httpClient: stripe_esm_worker_default.createFetchHttpClient()
    });
  }
  return stripeInstance;
}
function poundsToPence(pounds) {
  return Math.round(pounds * 100);
}
function penceToPounds(pence) {
  return pence / 100;
}
async function createStripeCustomer(stripe, name, email) {
  return stripe.customers.create({ name, email });
}
async function createCheckoutSession(stripe, params) {
  return stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: "payment",
    currency: "gbp",
    line_items: [{
      price_data: {
        currency: "gbp",
        unit_amount: params.amount,
        product_data: {
          name: params.description
        }
      },
      quantity: 1
    }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
    payment_intent_data: {
      metadata: params.metadata
    }
  });
}
async function verifyWebhookEvent(stripe, rawBody, signature, webhookSecret) {
  return stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
}
var stripeInstance;
var init_stripe = __esm({
  "_shared/stripe.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_stripe_esm_worker();
    stripeInstance = null;
    __name(getStripe, "getStripe");
    __name(poundsToPence, "poundsToPence");
    __name(penceToPounds, "penceToPounds");
    __name(createStripeCustomer, "createStripeCustomer");
    __name(createCheckoutSession, "createCheckoutSession");
    __name(verifyWebhookEvent, "verifyWebhookEvent");
  }
});

// api/admin/payments/send-installment-reminders.ts
async function onRequestOptions6() {
  return handleCORS();
}
async function onRequestPost6(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const portalUrl = context2.env.PORTAL_URL || "https://retreat.cloverleafchristiancentre.org";
    const retreatName = context2.env.RETREAT_NAME || "Growth and Wisdom Retreat";
    const { results: schedules } = await context2.env.DB.prepare(`
      SELECT s.*, a.name, a.email, a.ref_number, a.stripe_customer_id as attendee_stripe_id
      FROM installment_schedules s
      JOIN attendees a ON s.attendee_id = a.id
      WHERE s.status = 'active'
        AND s.installments_paid < s.installment_count
        AND s.next_due_date <= ?
    `).bind(today).all();
    if (schedules.length === 0) {
      return createResponse({ message: "No installment reminders due", sent: 0 });
    }
    const stripe = getStripe(context2.env);
    let sent = 0;
    const results = [];
    for (const row of schedules) {
      const schedule = row;
      try {
        if (!schedule.email) {
          results.push({ attendee: schedule.name, status: "skipped", error: "No email" });
          continue;
        }
        const customerId = schedule.stripe_customer_id || schedule.attendee_stripe_id;
        if (!customerId) {
          results.push({ attendee: schedule.name, status: "skipped", error: "No Stripe customer" });
          continue;
        }
        const nextInstallment = schedule.installments_paid + 1;
        const session = await createCheckoutSession(stripe, {
          customerId,
          amount: schedule.installment_amount,
          description: `${retreatName} - Installment ${nextInstallment} of ${schedule.installment_count}`,
          successUrl: `${portalUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${portalUrl}?payment=cancelled`,
          metadata: {
            attendee_id: String(schedule.attendee_id),
            attendee_ref: schedule.ref_number,
            payment_type: "installment",
            installment_number: String(nextInstallment),
            installment_total: String(schedule.installment_count)
          }
        });
        await context2.env.DB.prepare(`
          INSERT INTO payments (attendee_id, stripe_checkout_session_id, stripe_customer_id, amount, currency, status, payment_type, installment_number, installment_total, description)
          VALUES (?, ?, ?, ?, 'gbp', 'pending', 'installment', ?, ?, ?)
        `).bind(
          schedule.attendee_id,
          session.id,
          customerId,
          schedule.installment_amount,
          nextInstallment,
          schedule.installment_count,
          `${retreatName} - Installment ${nextInstallment} of ${schedule.installment_count}`
        ).run();
        if (context2.env.RESEND_API_KEY && context2.env.FROM_EMAIL) {
          const amount = (schedule.installment_amount / 100).toFixed(2);
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${context2.env.RESEND_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: context2.env.FROM_EMAIL,
              to: [schedule.email],
              subject: `Installment Payment Due - \xA3${amount} - ${retreatName}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0;">Installment Payment Due</h1>
                  </div>
                  <div style="padding: 30px; background: #f8fafc; border-radius: 0 0 12px 12px;">
                    <p>Dear ${schedule.name},</p>
                    <p>Your installment payment for the ${retreatName} is now due.</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                      <p style="margin: 0;"><strong>Amount Due:</strong> \xA3${amount}</p>
                      <p style="margin: 5px 0 0;"><strong>Installment:</strong> ${nextInstallment} of ${schedule.installment_count}</p>
                    </div>
                    <div style="text-align: center; margin: 25px 0;">
                      <a href="${session.url}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Pay Now - \xA3${amount}</a>
                    </div>
                    <p style="color: #6b7280; font-size: 0.85rem;">This link will expire in 24 hours. If you have any questions, please contact the retreat organizers.</p>
                  </div>
                </div>
              `
            })
          });
        }
        sent++;
        results.push({ attendee: schedule.name, status: "sent" });
      } catch (error3) {
        console.error(`[${requestId}] Failed to process installment for ${schedule.name}:`, error3);
        results.push({ attendee: schedule.name, status: "error", error: String(error3) });
      }
    }
    return createResponse({
      message: `Sent ${sent} installment reminders`,
      sent,
      total: schedules.length,
      results
    });
  } catch (error3) {
    console.error(`[${requestId}] Installment reminder error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_send_installment_reminders = __esm({
  "api/admin/payments/send-installment-reminders.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    init_stripe();
    __name(onRequestOptions6, "onRequestOptions");
    __name(onRequestPost6, "onRequestPost");
  }
});

// api/admin/payments/send-payment-reminders.ts
async function onRequestOptions7() {
  return handleCORS();
}
async function onRequestPost7(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin)
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    if (!context2.env.RESEND_API_KEY || !context2.env.FROM_EMAIL) {
      return createErrorResponse(errors.badRequest("Email service not configured", requestId));
    }
    const retreatName = context2.env.RETREAT_NAME || "Growth and Wisdom Retreat";
    const portalUrl = context2.env.PORTAL_URL || "https://retreat.cloverleafchristiancentre.org";
    const { results } = await context2.env.DB.prepare(`
      SELECT id, name, email, ref_number, payment_due, payment_option
      FROM attendees
      WHERE payment_due > 0 AND email IS NOT NULL AND email != '' AND (is_archived = 0 OR is_archived IS NULL)
    `).all();
    let sent = 0;
    for (const row of results) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${context2.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: context2.env.FROM_EMAIL,
            to: [row.email],
            subject: `Payment Reminder - \xA3${row.payment_due.toFixed(2)} Outstanding - ${retreatName}`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px;text-align:center;border-radius:12px 12px 0 0;">
                <h1 style="color:white;margin:0;">Payment Reminder</h1></div>
              <div style="padding:30px;background:#f8fafc;border-radius:0 0 12px 12px;">
                <p>Dear ${row.name},</p>
                <p>This is a friendly reminder that you have an outstanding balance for the <strong>${retreatName}</strong>.</p>
                <div style="background:white;padding:20px;border-radius:8px;border-left:4px solid #f59e0b;margin:20px 0;">
                  <p style="margin:0 0 8px;"><strong>Amount Due:</strong> \xA3${row.payment_due.toFixed(2)}</p>
                  <p style="margin:0;"><strong>Reference:</strong> ${row.ref_number}</p>
                </div>
                <div style="text-align:center;margin:25px 0;">
                  <a href="${portalUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;text-decoration:none;border-radius:8px;font-weight:600;">Pay Now</a>
                </div>
                <p style="color:#6b7280;font-size:0.85rem;">If you have already made payment, please disregard this reminder.</p>
                <p style="color:#6b7280;font-size:0.85rem;">\u2014 The ${retreatName} Team</p>
              </div></div>`
          })
        });
        sent++;
      } catch (err) {
        console.error(`[${requestId}] Failed to send reminder to ${row.email}:`, err);
      }
    }
    await context2.env.DB.prepare(
      "INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)"
    ).bind(admin.user, "send_payment_reminders", "system", 0, `Sent ${sent} payment reminders`).run();
    return createResponse({ message: `Sent ${sent} payment reminders`, sent, total: results.length });
  } catch (error3) {
    console.error(`[${requestId}] Payment reminder error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_send_payment_reminders = __esm({
  "api/admin/payments/send-payment-reminders.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    __name(onRequestOptions7, "onRequestOptions");
    __name(onRequestPost7, "onRequestPost");
  }
});

// api/admin/payments/summary.ts
async function onRequestOptions8() {
  return handleCORS();
}
async function onRequestGet(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const { results: collectedRows } = await context2.env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM payments WHERE status = 'succeeded'
    `).all();
    const { results: outstandingRows } = await context2.env.DB.prepare(`
      SELECT COALESCE(SUM(payment_due), 0) as total, COUNT(*) as count
      FROM attendees WHERE payment_due > 0
    `).all();
    const { results: byStatusRows } = await context2.env.DB.prepare(`
      SELECT status, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
      FROM payments GROUP BY status
    `).all();
    const { results: byTypeRows } = await context2.env.DB.prepare(`
      SELECT payment_type, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
      FROM payments WHERE status = 'succeeded' GROUP BY payment_type
    `).all();
    const { results: installmentRows } = await context2.env.DB.prepare(`
      SELECT COUNT(*) as active_count
      FROM installment_schedules WHERE status = 'active'
    `).all();
    const collected = collectedRows[0];
    const outstanding = outstandingRows[0];
    const activeInstallments = installmentRows[0].active_count;
    const byStatus = {};
    for (const row of byStatusRows) {
      byStatus[row.status] = { count: row.count, total: row.total };
    }
    const byType = {};
    for (const row of byTypeRows) {
      byType[row.payment_type] = { count: row.count, total: row.total };
    }
    return createResponse({
      total_collected_pence: collected.total,
      total_collected_count: collected.count,
      total_outstanding_pounds: outstanding.total,
      outstanding_attendees: outstanding.count,
      active_installment_plans: activeInstallments,
      by_status: byStatus,
      by_type: byType
    });
  } catch (error3) {
    console.error(`[${requestId}] Payment summary error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_summary = __esm({
  "api/admin/payments/summary.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    __name(onRequestOptions8, "onRequestOptions");
    __name(onRequestGet, "onRequestGet");
  }
});

// api/admin/reports/analytics.ts
async function onRequestOptions9() {
  return handleCORS();
}
async function onRequestGet2(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const db = context2.env.DB;
    const [
      totalAttendeesRes,
      paymentPlanRes,
      paymentStatusRes,
      roomTypeRes,
      groupRes,
      dietaryRes,
      registrationsRes,
      revenueRes,
      checkedInRes,
      registrationsByMonthRes
    ] = await Promise.all([
      // Total attendees (non-archived)
      db.prepare("SELECT COUNT(*) as count FROM attendees WHERE is_archived = 0 OR is_archived IS NULL").all(),
      // By payment plan
      db.prepare(`
        SELECT COALESCE(payment_option, 'unknown') as label, COUNT(*) as count
        FROM attendees WHERE is_archived = 0 OR is_archived IS NULL
        GROUP BY payment_option ORDER BY count DESC
      `).all(),
      // By payment status
      db.prepare(`
        SELECT CASE WHEN payment_due = 0 THEN 'paid' ELSE 'outstanding' END as label, COUNT(*) as count
        FROM attendees WHERE is_archived = 0 OR is_archived IS NULL
        GROUP BY label ORDER BY count DESC
      `).all(),
      // By room type (attendees assigned to rooms)
      db.prepare(`
        SELECT COALESCE(r.room_type, 'unassigned') as label, COUNT(*) as count
        FROM attendees a LEFT JOIN rooms r ON a.room_id = r.id
        WHERE a.is_archived = 0 OR a.is_archived IS NULL
        GROUP BY label ORDER BY count DESC
      `).all(),
      // By group
      db.prepare(`
        SELECT COALESCE(g.name, 'Unassigned') as label, COUNT(*) as count
        FROM attendees a LEFT JOIN groups g ON a.group_id = g.id
        WHERE a.is_archived = 0 OR a.is_archived IS NULL
        GROUP BY label ORDER BY count DESC
      `).all(),
      // Dietary requirements (non-null, non-empty)
      db.prepare(`
        SELECT dietary_requirements as label, COUNT(*) as count
        FROM attendees
        WHERE (is_archived = 0 OR is_archived IS NULL)
          AND dietary_requirements IS NOT NULL AND dietary_requirements != ''
        GROUP BY dietary_requirements ORDER BY count DESC
      `).all(),
      // All registrations with family_members JSON
      db.prepare(`
        SELECT family_members, total_amount, member_count, status, payment_option
        FROM registrations
      `).all(),
      // Revenue: total expected vs collected
      db.prepare(`
        SELECT
          COALESCE(SUM(payment_due), 0) as outstanding,
          COUNT(*) as attendee_count
        FROM attendees WHERE is_archived = 0 OR is_archived IS NULL
      `).all(),
      // Checked-in count
      db.prepare(`
        SELECT COUNT(*) as count FROM attendees
        WHERE (is_archived = 0 OR is_archived IS NULL) AND checked_in = 1
      `).all(),
      // Registrations by month
      db.prepare(`
        SELECT strftime('%Y-%m', submitted_at) as label, COUNT(*) as count
        FROM registrations
        GROUP BY label ORDER BY label
      `).all()
    ]);
    const totalAttendees = totalAttendeesRes.results[0].count;
    const checkedIn = checkedInRes.results[0].count;
    const registrations = registrationsRes.results;
    let totalAdults = 0;
    let totalChildren = 0;
    let totalInfants = 0;
    let totalPeople = 0;
    const approvedRegistrations = registrations.filter((r) => r.status === "approved");
    for (const reg of approvedRegistrations) {
      if (reg.family_members) {
        try {
          const members = JSON.parse(reg.family_members);
          for (const m of members) {
            if (m.member_type === "adult")
              totalAdults++;
            else if (m.member_type === "child")
              totalChildren++;
            else if (m.member_type === "infant")
              totalInfants++;
          }
          totalPeople += members.length;
        } catch {
        }
      }
    }
    const regStatusMap = {};
    for (const reg of registrations) {
      regStatusMap[reg.status] = (regStatusMap[reg.status] || 0) + 1;
    }
    const revenueData = revenueRes.results[0];
    const collectedRes = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'succeeded'
    `).all();
    const totalCollectedPence = collectedRes.results[0].total;
    return createResponse({
      summary: {
        total_attendees: totalAttendees,
        checked_in: checkedIn,
        total_people: totalPeople,
        adults: totalAdults,
        children: totalChildren,
        infants: totalInfants
      },
      financial: {
        total_collected_pence: totalCollectedPence,
        total_outstanding_pounds: revenueData.outstanding,
        attendees_with_balance: revenueData.attendee_count
      },
      registrations: {
        by_status: regStatusMap,
        by_month: registrationsByMonthRes.results.map((r) => ({
          month: r.label,
          count: r.count
        })),
        total: registrations.length
      },
      breakdowns: {
        by_payment_plan: paymentPlanRes.results.map((r) => ({
          label: r.label,
          count: r.count
        })),
        by_payment_status: paymentStatusRes.results.map((r) => ({
          label: r.label,
          count: r.count
        })),
        by_room_type: roomTypeRes.results.map((r) => ({
          label: r.label,
          count: r.count
        })),
        by_group: groupRes.results.map((r) => ({
          label: r.label,
          count: r.count
        })),
        dietary_requirements: dietaryRes.results.map((r) => ({
          label: r.label,
          count: r.count
        }))
      }
    });
  } catch (error3) {
    console.error(`[${requestId}] Analytics error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_analytics = __esm({
  "api/admin/reports/analytics.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    __name(onRequestOptions9, "onRequestOptions");
    __name(onRequestGet2, "onRequestGet");
  }
});

// _shared/pagination.ts
function parsePaginationParams(url) {
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");
  let limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT;
  let offset = offsetParam ? parseInt(offsetParam, 10) : 0;
  if (isNaN(limit) || limit < MIN_LIMIT) {
    limit = DEFAULT_LIMIT;
  }
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }
  if (isNaN(offset) || offset < 0) {
    offset = 0;
  }
  return { limit, offset };
}
function createPaginationMeta(total, limit, offset) {
  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total
  };
}
function createPaginatedResponse(data, total, limit, offset) {
  return {
    data,
    pagination: createPaginationMeta(total, limit, offset)
  };
}
var DEFAULT_LIMIT, MAX_LIMIT, MIN_LIMIT;
var init_pagination = __esm({
  "_shared/pagination.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    DEFAULT_LIMIT = 50;
    MAX_LIMIT = 500;
    MIN_LIMIT = 1;
    __name(parsePaginationParams, "parsePaginationParams");
    __name(createPaginationMeta, "createPaginationMeta");
    __name(createPaginatedResponse, "createPaginatedResponse");
  }
});

// api/admin/reports/login-history.ts
async function onRequestOptions10() {
  return handleCORS();
}
async function onRequestGet3(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const url = new URL(context2.request.url);
    const { limit, offset } = parsePaginationParams(url);
    const { results: countResult } = await context2.env.DB.prepare(
      "SELECT COUNT(*) as total FROM login_history"
    ).all();
    const total = countResult[0].total;
    const { results } = await context2.env.DB.prepare(`
      SELECT id, user_type, user_id, login_time
      FROM login_history
      ORDER BY datetime(login_time) DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    return createResponse(createPaginatedResponse(results, total, limit, offset));
  } catch (error3) {
    console.error(`[${requestId}] Error fetching login history:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_login_history = __esm({
  "api/admin/reports/login-history.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_pagination();
    init_errors();
    __name(onRequestOptions10, "onRequestOptions");
    __name(onRequestGet3, "onRequestGet");
  }
});

// api/admin/activity-teams/index.ts
var activity_teams_exports = {};
__export(activity_teams_exports, {
  onRequestGet: () => onRequestGet4,
  onRequestOptions: () => onRequestOptions11,
  onRequestPost: () => onRequestPost8,
  sendTeamNotificationEmails: () => sendTeamNotificationEmails
});
async function onRequestOptions11() {
  return handleCORS();
}
async function onRequestGet4(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const { results } = await context2.env.DB.prepare(`
      SELECT
        t.id, t.name, t.description, t.leader_id, t.created_at,
        leader.name AS leader_name,
        COUNT(m.id) AS member_count,
        GROUP_CONCAT(a.name, ', ') AS member_names,
        GROUP_CONCAT(a.id) AS member_ids
      FROM activity_teams t
      LEFT JOIN attendees leader ON t.leader_id = leader.id
      LEFT JOIN activity_team_members m ON t.id = m.team_id
      LEFT JOIN attendees a ON m.attendee_id = a.id
      GROUP BY t.id
      ORDER BY t.name
    `).all();
    const teams = results.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      leader_id: t.leader_id,
      leader_name: t.leader_name,
      member_count: t.member_count,
      members: t.member_names ? t.member_names.split(", ") : [],
      member_ids: t.member_ids ? t.member_ids.split(",").map(Number) : [],
      created_at: t.created_at
    }));
    return createResponse({ data: teams });
  } catch (error3) {
    console.error(`[${requestId}] Error fetching activity teams:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestPost8(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const body = await context2.request.json();
    if (!body.name || body.name.trim() === "") {
      return createErrorResponse(errors.badRequest("Team name is required", requestId));
    }
    const { results: existing } = await context2.env.DB.prepare(
      "SELECT id FROM activity_teams WHERE name = ?"
    ).bind(body.name.trim()).all();
    if (existing.length > 0) {
      return createErrorResponse(errors.conflict("A team with this name already exists", requestId));
    }
    const result = await context2.env.DB.prepare(`
      INSERT INTO activity_teams (name, description, leader_id)
      VALUES (?, ?, ?)
    `).bind(
      body.name.trim(),
      body.description?.trim() || null,
      body.leader_id || null
    ).run();
    const teamId = result.meta.last_row_id;
    const memberIds = body.member_ids || [];
    if (body.leader_id && !memberIds.includes(body.leader_id)) {
      memberIds.push(body.leader_id);
    }
    for (const attendeeId of memberIds) {
      await context2.env.DB.prepare(
        "INSERT OR IGNORE INTO activity_team_members (team_id, attendee_id) VALUES (?, ?)"
      ).bind(teamId, attendeeId).run();
    }
    const emailPromise = sendTeamNotificationEmails(
      context2.env,
      teamId,
      body.name.trim(),
      body.description?.trim() || "",
      memberIds,
      body.leader_id || null,
      requestId
    ).catch((err) => console.error(`[${requestId}] Email notification error:`, err));
    context2.waitUntil(emailPromise);
    return createResponse({ id: teamId, message: "Activity team created successfully" }, 201);
  } catch (error3) {
    console.error(`[${requestId}] Error creating activity team:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function sendTeamNotificationEmails(env2, teamId, teamName, description, memberIds, leaderId, requestId) {
  if (!env2.RESEND_API_KEY || !env2.FROM_EMAIL || memberIds.length === 0)
    return;
  const retreatName = env2.RETREAT_NAME || "Growth and Wisdom Retreat";
  const placeholders = memberIds.map(() => "?").join(",");
  const { results } = await env2.DB.prepare(
    `SELECT id, name, email FROM attendees WHERE id IN (${placeholders})`
  ).bind(...memberIds).all();
  let leaderName = "Not assigned";
  if (leaderId) {
    const { results: leaderRows } = await env2.DB.prepare(
      "SELECT name FROM attendees WHERE id = ?"
    ).bind(leaderId).all();
    if (leaderRows.length > 0)
      leaderName = leaderRows[0].name;
  }
  const memberNames = results.map((r) => r.name);
  for (const member of results) {
    if (!member.email)
      continue;
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env2.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: env2.FROM_EMAIL,
          to: [member.email],
          subject: `You've been added to ${teamName} - ${retreatName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0;">Activity Team Assignment</h1>
              </div>
              <div style="padding: 30px; background: #f8fafc; border-radius: 0 0 12px 12px;">
                <p>Dear ${member.name},</p>
                <p>You have been added to an activity team for the <strong>${retreatName}</strong>!</p>
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                  <p style="margin: 0 0 8px;"><strong>Team:</strong> ${teamName}</p>
                  ${description ? `<p style="margin: 0 0 8px;"><strong>Description:</strong> ${description}</p>` : ""}
                  <p style="margin: 0 0 8px;"><strong>Team Leader:</strong> ${leaderName}</p>
                  <p style="margin: 0;"><strong>Team Members:</strong> ${memberNames.join(", ")}</p>
                </div>
                ${member.id === leaderId ? '<p style="color: #667eea; font-weight: 600;">You have been designated as the Team Leader!</p>' : ""}
                <p>We look forward to a wonderful retreat experience together!</p>
                <p style="color: #6b7280; font-size: 0.85rem;">\u2014 The ${retreatName} Team</p>
              </div>
            </div>
          `
        })
      });
      console.log(`[${requestId}] Team notification sent to ${member.email}`);
    } catch (err) {
      console.error(`[${requestId}] Failed to send team notification to ${member.email}:`, err);
    }
  }
}
var init_activity_teams = __esm({
  "api/admin/activity-teams/index.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    __name(onRequestOptions11, "onRequestOptions");
    __name(onRequestGet4, "onRequestGet");
    __name(onRequestPost8, "onRequestPost");
    __name(sendTeamNotificationEmails, "sendTeamNotificationEmails");
  }
});

// api/admin/activity-teams/[id].ts
async function onRequestOptions12() {
  return handleCORS();
}
async function onRequestGet5(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const id = context2.params.id;
    const { results: teamRows } = await context2.env.DB.prepare(`
      SELECT t.*, leader.name AS leader_name
      FROM activity_teams t
      LEFT JOIN attendees leader ON t.leader_id = leader.id
      WHERE t.id = ?
    `).bind(id).all();
    if (teamRows.length === 0) {
      return createErrorResponse(errors.notFound("Activity team", requestId));
    }
    const team = teamRows[0];
    const { results: members } = await context2.env.DB.prepare(`
      SELECT a.id, a.name, a.email, a.ref_number
      FROM activity_team_members m
      JOIN attendees a ON m.attendee_id = a.id
      WHERE m.team_id = ?
      ORDER BY a.name
    `).bind(id).all();
    return createResponse({
      ...team,
      members,
      member_ids: members.map((m) => m.id)
    });
  } catch (error3) {
    console.error(`[${requestId}] Error fetching activity team:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestPut(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const id = context2.params.id;
    const { results: existing } = await context2.env.DB.prepare(
      "SELECT id FROM activity_teams WHERE id = ?"
    ).bind(id).all();
    if (existing.length === 0) {
      return createErrorResponse(errors.notFound("Activity team", requestId));
    }
    const body = await context2.request.json();
    if (body.name) {
      const { results: nameCheck } = await context2.env.DB.prepare(
        "SELECT id FROM activity_teams WHERE name = ? AND id != ?"
      ).bind(body.name.trim(), id).all();
      if (nameCheck.length > 0) {
        return createErrorResponse(errors.conflict("A team with this name already exists", requestId));
      }
    }
    const updates = [];
    const values = [];
    if (body.name !== void 0) {
      updates.push("name = ?");
      values.push(body.name.trim());
    }
    if (body.description !== void 0) {
      updates.push("description = ?");
      values.push(body.description?.trim() || null);
    }
    if (body.leader_id !== void 0) {
      updates.push("leader_id = ?");
      values.push(body.leader_id);
    }
    if (updates.length > 0) {
      values.push(id);
      await context2.env.DB.prepare(
        `UPDATE activity_teams SET ${updates.join(", ")} WHERE id = ?`
      ).bind(...values).run();
    }
    if (body.member_ids !== void 0) {
      const { results: currentMembers } = await context2.env.DB.prepare(
        "SELECT attendee_id FROM activity_team_members WHERE team_id = ?"
      ).bind(id).all();
      const currentIds = new Set(currentMembers.map((m) => m.attendee_id));
      const newMemberIds = body.member_ids;
      if (body.leader_id && !newMemberIds.includes(body.leader_id)) {
        newMemberIds.push(body.leader_id);
      }
      await context2.env.DB.prepare(
        "DELETE FROM activity_team_members WHERE team_id = ?"
      ).bind(id).run();
      for (const attendeeId of newMemberIds) {
        await context2.env.DB.prepare(
          "INSERT OR IGNORE INTO activity_team_members (team_id, attendee_id) VALUES (?, ?)"
        ).bind(id, attendeeId).run();
      }
      const addedIds = newMemberIds.filter((mid) => !currentIds.has(mid));
      if (addedIds.length > 0) {
        const teamName = body.name?.trim() || (await context2.env.DB.prepare("SELECT name FROM activity_teams WHERE id = ?").bind(id).all()).results[0];
        const name = typeof teamName === "string" ? teamName : teamName.name;
        const { sendTeamNotificationEmails: sendTeamNotificationEmails2 } = await Promise.resolve().then(() => (init_activity_teams(), activity_teams_exports));
        const emailPromise = sendTeamNotificationEmails2(
          context2.env,
          parseInt(id),
          name,
          body.description?.trim() || "",
          addedIds,
          body.leader_id || null,
          requestId
        ).catch((err) => console.error(`[${requestId}] Email error:`, err));
        context2.waitUntil(emailPromise);
      }
    }
    return createResponse({ message: "Activity team updated successfully" });
  } catch (error3) {
    console.error(`[${requestId}] Error updating activity team:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestDelete(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const id = context2.params.id;
    const { results } = await context2.env.DB.prepare(
      "SELECT name FROM activity_teams WHERE id = ?"
    ).bind(id).all();
    if (results.length === 0) {
      return createErrorResponse(errors.notFound("Activity team", requestId));
    }
    await context2.env.DB.prepare("DELETE FROM activity_teams WHERE id = ?").bind(id).run();
    return createResponse({ message: `Team "${results[0].name}" deleted successfully` });
  } catch (error3) {
    console.error(`[${requestId}] Error deleting activity team:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_id = __esm({
  "api/admin/activity-teams/[id].ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    __name(onRequestOptions12, "onRequestOptions");
    __name(onRequestGet5, "onRequestGet");
    __name(onRequestPut, "onRequestPut");
    __name(onRequestDelete, "onRequestDelete");
  }
});

// api/admin/announcements/[id].ts
async function onRequestOptions13() {
  return handleCORS();
}
async function onRequestGet6(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const id = context2.params.id;
    const { results } = await context2.env.DB.prepare(
      "SELECT * FROM announcements WHERE id = ?"
    ).bind(id).all();
    if (!results.length) {
      return createErrorResponse(errors.notFound("Announcement", requestId));
    }
    const announcement = results[0];
    return createResponse({
      ...announcement,
      is_active: Boolean(announcement.is_active),
      target_groups: announcement.target_groups ? JSON.parse(announcement.target_groups) : null
    });
  } catch (error3) {
    console.error(`[${requestId}] Error fetching announcement:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestPut2(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const id = context2.params.id;
    const updateData = await context2.request.json();
    const validation = validate(updateData, announcementUpdateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }
    const { results: existing } = await context2.env.DB.prepare(
      "SELECT id FROM announcements WHERE id = ?"
    ).bind(id).all();
    if (!existing.length) {
      return createErrorResponse(errors.notFound("Announcement", requestId));
    }
    const allowedFields = [
      "title",
      "content",
      "type",
      "priority",
      "is_active",
      "target_audience",
      "target_groups",
      "starts_at",
      "expires_at"
    ];
    const updateFields = [];
    const updateValues = [];
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== void 0) {
        if (key === "target_groups" && Array.isArray(value)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(JSON.stringify(value));
        } else if (key === "is_active") {
          updateFields.push(`${key} = ?`);
          updateValues.push(value ? 1 : 0);
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(value === "" ? null : value);
        }
      }
    }
    if (updateFields.length === 0) {
      return createErrorResponse(errors.badRequest("No valid fields to update", requestId));
    }
    updateValues.push(id);
    const updateQuery = `UPDATE announcements SET ${updateFields.join(", ")} WHERE id = ?`;
    const result = await context2.env.DB.prepare(updateQuery).bind(...updateValues).run();
    if (!result.success) {
      throw new Error("Failed to update announcement");
    }
    return createResponse({
      success: true,
      message: "Announcement updated successfully"
    });
  } catch (error3) {
    console.error(`[${requestId}] Error updating announcement:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestDelete2(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const id = context2.params.id;
    const { results: existing } = await context2.env.DB.prepare(
      "SELECT id, title FROM announcements WHERE id = ?"
    ).bind(id).all();
    if (!existing.length) {
      return createErrorResponse(errors.notFound("Announcement", requestId));
    }
    const announcement = existing[0];
    const result = await context2.env.DB.prepare(
      "DELETE FROM announcements WHERE id = ?"
    ).bind(id).run();
    if (!result.success) {
      throw new Error("Failed to delete announcement");
    }
    return createResponse({
      success: true,
      message: `Announcement "${announcement.title}" deleted successfully`
    });
  } catch (error3) {
    console.error(`[${requestId}] Error deleting announcement:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_id2 = __esm({
  "api/admin/announcements/[id].ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_validation();
    init_errors();
    __name(onRequestOptions13, "onRequestOptions");
    __name(onRequestGet6, "onRequestGet");
    __name(onRequestPut2, "onRequestPut");
    __name(onRequestDelete2, "onRequestDelete");
  }
});

// api/admin/attendees/[id].ts
async function onRequestOptions14() {
  return handleCORS();
}
async function onRequestGet7(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const id = context2.params.id;
    if (!id) {
      return createErrorResponse(errors.badRequest("Attendee ID is required", requestId));
    }
    const { results } = await context2.env.DB.prepare(`
      SELECT
        a.id,
        a.ref_number,
        a.name,
        a.email,
        a.payment_due,
        a.payment_option,
        a.room_id,
        a.group_id,
        r.number AS room_number,
        r.description AS room_description,
        g.name AS group_name
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.id = ?
    `).bind(id).all();
    if (!results.length) {
      return createErrorResponse(errors.notFound("Attendee", requestId));
    }
    const attendee = results[0];
    const formattedResult = {
      id: attendee.id,
      ref_number: attendee.ref_number,
      name: attendee.name,
      email: attendee.email,
      payment_due: attendee.payment_due || 0,
      payment_option: attendee.payment_option || "full",
      room_id: attendee.room_id,
      group_id: attendee.group_id,
      room: attendee.room_number ? {
        number: attendee.room_number,
        description: attendee.room_description
      } : null,
      group: attendee.group_name ? { name: attendee.group_name } : null
    };
    return createResponse(formattedResult);
  } catch (error3) {
    console.error(`[${requestId}] Error fetching attendee:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestPut3(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const id = context2.params.id;
    if (!id) {
      return createErrorResponse(errors.badRequest("Attendee ID is required", requestId));
    }
    const updateData = await context2.request.json();
    const validation = validate(updateData, attendeeUpdateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }
    const { results: existingResults } = await context2.env.DB.prepare(
      "SELECT id FROM attendees WHERE id = ?"
    ).bind(id).all();
    if (!existingResults.length) {
      return createErrorResponse(errors.notFound("Attendee", requestId));
    }
    const allowedFields = ["name", "first_name", "last_name", "date_of_birth", "email", "ref_number", "room_id", "group_id", "payment_due", "payment_option", "password"];
    const updateFields = [];
    const updateValues = [];
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== void 0) {
        if (key === "password") {
          if (value && typeof value === "string" && value.trim() !== "") {
            const hashedPassword = await hashPassword(value);
            updateFields.push("password_hash = ?");
            updateValues.push(hashedPassword);
          }
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(value === "" ? null : value);
        }
      }
    }
    if (updateFields.length === 0) {
      return createErrorResponse(errors.badRequest("No valid fields to update", requestId));
    }
    updateValues.push(id);
    const updateQuery = `UPDATE attendees SET ${updateFields.join(", ")} WHERE id = ?`;
    const result = await context2.env.DB.prepare(updateQuery).bind(...updateValues).run();
    if (!result.success) {
      throw new Error("Failed to update attendee");
    }
    return createResponse({
      success: true,
      message: "Attendee updated successfully",
      id: parseInt(id)
    });
  } catch (error3) {
    console.error(`[${requestId}] Error updating attendee:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestDelete3(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const id = context2.params.id;
    if (!id) {
      return createErrorResponse(errors.badRequest("Attendee ID is required", requestId));
    }
    const { results: existingResults } = await context2.env.DB.prepare(
      "SELECT id, name, ref_number FROM attendees WHERE id = ?"
    ).bind(id).all();
    if (!existingResults.length) {
      return createErrorResponse(errors.notFound("Attendee", requestId));
    }
    const attendee = existingResults[0];
    const result = await context2.env.DB.prepare(
      "UPDATE attendees SET is_archived = 1 WHERE id = ?"
    ).bind(id).run();
    if (!result.success) {
      throw new Error("Failed to archive attendee");
    }
    return createResponse({
      success: true,
      message: `Attendee ${attendee.name} deleted successfully`,
      deleted_attendee: {
        id: attendee.id,
        name: attendee.name,
        ref_number: attendee.ref_number
      }
    });
  } catch (error3) {
    console.error(`[${requestId}] Error deleting attendee:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_id3 = __esm({
  "api/admin/attendees/[id].ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_validation();
    init_errors();
    __name(onRequestOptions14, "onRequestOptions");
    __name(onRequestGet7, "onRequestGet");
    __name(onRequestPut3, "onRequestPut");
    __name(onRequestDelete3, "onRequestDelete");
  }
});

// api/admin/groups/[id].ts
async function onRequestOptions15() {
  return handleCORS();
}
async function onRequestGet8(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const id = context2.params.id;
    const { results } = await context2.env.DB.prepare(`
      SELECT
        g.id,
        g.name,
        COUNT(a.id) as member_count,
        GROUP_CONCAT(a.name, ', ') as members,
        GROUP_CONCAT(a.ref_number, ', ') as member_refs
      FROM groups g
      LEFT JOIN attendees a ON g.id = a.group_id
      WHERE g.id = ?
      GROUP BY g.id, g.name
    `).bind(id).all();
    if (!results.length) {
      return createErrorResponse(errors.notFound("Group", requestId));
    }
    const group3 = results[0];
    const memberNames = group3.members ? group3.members.split(", ").filter(Boolean) : [];
    const memberRefs = group3.member_refs ? group3.member_refs.split(", ").filter(Boolean) : [];
    const members = memberNames.map((name, index) => ({
      name,
      ref_number: memberRefs[index] || ""
    }));
    const formattedGroup = {
      id: group3.id,
      name: group3.name,
      member_count: group3.member_count || 0,
      members
    };
    return createResponse(formattedGroup);
  } catch (error3) {
    console.error(`[${requestId}] Error fetching group:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestPut4(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const id = context2.params.id;
    const body = await context2.request.json();
    const validation = validate(body, groupUpdateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }
    const { name } = body;
    if (!name || !name.trim()) {
      return createErrorResponse(errors.badRequest("Group name is required", requestId));
    }
    const { results: existing } = await context2.env.DB.prepare(
      "SELECT id FROM groups WHERE id = ?"
    ).bind(id).all();
    if (!existing.length) {
      return createErrorResponse(errors.notFound("Group", requestId));
    }
    const { results: conflict } = await context2.env.DB.prepare(
      "SELECT id FROM groups WHERE name = ? AND id != ?"
    ).bind(name.trim(), id).all();
    if (conflict.length > 0) {
      return createErrorResponse(errors.conflict("Group name already exists", requestId));
    }
    const result = await context2.env.DB.prepare(
      "UPDATE groups SET name = ? WHERE id = ?"
    ).bind(name.trim(), id).run();
    if (!result.success) {
      throw new Error("Failed to update group");
    }
    return createResponse({
      success: true,
      message: "Group updated successfully"
    });
  } catch (error3) {
    console.error(`[${requestId}] Error updating group:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestDelete4(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const id = context2.params.id;
    const { results: existing } = await context2.env.DB.prepare(
      "SELECT id, name FROM groups WHERE id = ?"
    ).bind(id).all();
    if (!existing.length) {
      return createErrorResponse(errors.notFound("Group", requestId));
    }
    const group3 = existing[0];
    const { results: members } = await context2.env.DB.prepare(
      "SELECT COUNT(*) as count FROM attendees WHERE group_id = ?"
    ).bind(id).all();
    if (members[0].count > 0) {
      return createErrorResponse(
        errors.conflict("Cannot delete group with members. Please reassign attendees first.", requestId)
      );
    }
    const result = await context2.env.DB.prepare(
      "DELETE FROM groups WHERE id = ?"
    ).bind(id).run();
    if (!result.success) {
      throw new Error("Failed to delete group");
    }
    return createResponse({
      success: true,
      message: `Group ${group3.name} deleted successfully`
    });
  } catch (error3) {
    console.error(`[${requestId}] Error deleting group:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_id4 = __esm({
  "api/admin/groups/[id].ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_validation();
    init_errors();
    __name(onRequestOptions15, "onRequestOptions");
    __name(onRequestGet8, "onRequestGet");
    __name(onRequestPut4, "onRequestPut");
    __name(onRequestDelete4, "onRequestDelete");
  }
});

// api/admin/payments/[id].ts
async function onRequestOptions16() {
  return handleCORS();
}
async function onRequestGet9(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin)
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    const { results } = await context2.env.DB.prepare(`
      SELECT p.*, a.name as attendee_name, a.ref_number as attendee_ref
      FROM payments p LEFT JOIN attendees a ON p.attendee_id = a.id
      WHERE p.id = ?
    `).bind(context2.params.id).all();
    if (results.length === 0)
      return createErrorResponse(errors.notFound("Payment", requestId));
    return createResponse(results[0]);
  } catch (error3) {
    console.error(`[${requestId}] Error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestPut5(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin)
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    const id = context2.params.id;
    const body = await context2.request.json();
    if (!body.action || !["confirm", "reject"].includes(body.action)) {
      return createErrorResponse(errors.badRequest('Action must be "confirm" or "reject"', requestId));
    }
    const { results } = await context2.env.DB.prepare(
      "SELECT * FROM payments WHERE id = ?"
    ).bind(id).all();
    if (results.length === 0)
      return createErrorResponse(errors.notFound("Payment", requestId));
    const payment = results[0];
    if (payment.status !== "pending") {
      return createErrorResponse(errors.badRequest(`Payment is already ${payment.status}`, requestId));
    }
    if (body.action === "confirm") {
      await context2.env.DB.prepare(
        "UPDATE payments SET status = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind("succeeded", id).run();
      const paidPounds = penceToPounds(payment.amount);
      const { results: attendeeRows } = await context2.env.DB.prepare(
        "SELECT payment_due FROM attendees WHERE id = ?"
      ).bind(payment.attendee_id).all();
      if (attendeeRows.length > 0) {
        const currentDue = attendeeRows[0].payment_due || 0;
        const newDue = Math.max(0, currentDue - paidPounds);
        const newStatus = newDue <= 0 ? "paid" : "partial";
        await context2.env.DB.prepare(
          "UPDATE attendees SET payment_due = ?, payment_status = ? WHERE id = ?"
        ).bind(newDue, newStatus, payment.attendee_id).run();
      }
      if (payment.payment_type === "installment" && payment.installment_number) {
        await context2.env.DB.prepare(`
          UPDATE installment_schedules
          SET installments_paid = ?,
              status = CASE WHEN ? >= installment_count THEN 'completed' ELSE 'active' END,
              next_due_date = CASE WHEN ? >= installment_count THEN NULL ELSE date(next_due_date, '+1 month') END
          WHERE attendee_id = ?
        `).bind(
          payment.installment_number,
          payment.installment_number,
          payment.installment_number,
          payment.attendee_id
        ).run();
      }
      context2.waitUntil(sendConfirmation(context2.env, payment.attendee_id, payment.amount, requestId));
      return createResponse({ message: "Payment confirmed successfully" });
    } else {
      await context2.env.DB.prepare(
        "UPDATE payments SET status = ? WHERE id = ?"
      ).bind("failed", id).run();
      return createResponse({ message: "Payment rejected" });
    }
  } catch (error3) {
    console.error(`[${requestId}] Payment action error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function sendConfirmation(env2, attendeeId, amountPence, requestId) {
  try {
    if (!env2.RESEND_API_KEY || !env2.FROM_EMAIL)
      return;
    const { results } = await env2.DB.prepare("SELECT name, email FROM attendees WHERE id = ?").bind(attendeeId).all();
    if (results.length === 0)
      return;
    const attendee = results[0];
    if (!attendee.email)
      return;
    const amount = (amountPence / 100).toFixed(2);
    const retreatName = env2.RETREAT_NAME || "Growth and Wisdom Retreat";
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env2.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env2.FROM_EMAIL,
        to: [attendee.email],
        subject: `Payment Confirmed - \xA3${amount} - ${retreatName}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px;text-align:center;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;">Payment Confirmed</h1></div>
          <div style="padding:30px;background:#f8fafc;border-radius:0 0 12px 12px;">
            <p>Dear ${attendee.name},</p>
            <p>Your bank transfer payment of <strong>\xA3${amount}</strong> has been confirmed.</p>
            <p>Thank you!</p>
            <p style="color:#6b7280;font-size:0.85rem;">\u2014 The ${retreatName} Team</p>
          </div></div>`
      })
    });
  } catch (err) {
    console.error(`[${requestId}] Confirmation email failed:`, err);
  }
}
var init_id5 = __esm({
  "api/admin/payments/[id].ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    init_stripe();
    __name(onRequestOptions16, "onRequestOptions");
    __name(onRequestGet9, "onRequestGet");
    __name(onRequestPut5, "onRequestPut");
    __name(sendConfirmation, "sendConfirmation");
  }
});

// _shared/names.ts
function splitFullName(full) {
  if (!full)
    return { first: null, last: null };
  const trimmed = full.trim();
  if (!trimmed)
    return { first: null, last: null };
  const idx = trimmed.search(/\s/);
  if (idx === -1)
    return { first: trimmed, last: null };
  return {
    first: trimmed.slice(0, idx),
    last: trimmed.slice(idx + 1).trim() || null
  };
}
function ageFromDateOfBirth(dob, asOf = /* @__PURE__ */ new Date()) {
  if (!dob)
    return null;
  const d = new Date(dob);
  if (isNaN(d.getTime()))
    return null;
  let age = asOf.getFullYear() - d.getFullYear();
  const m = asOf.getMonth() - d.getMonth();
  if (m < 0 || m === 0 && asOf.getDate() < d.getDate())
    age--;
  return age >= 0 ? age : null;
}
var init_names = __esm({
  "_shared/names.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(splitFullName, "splitFullName");
    __name(ageFromDateOfBirth, "ageFromDateOfBirth");
  }
});

// api/admin/registrations/[id].ts
async function onRequestOptions17() {
  return handleCORS();
}
async function onRequestGet10(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const registrationId = context2.params.id;
    if (!registrationId) {
      return createErrorResponse(errors.badRequest("Registration ID is required", requestId));
    }
    const { results } = await context2.env.DB.prepare(`
      SELECT * FROM registrations WHERE id = ?
    `).bind(registrationId).all();
    if (results.length === 0) {
      return createErrorResponse(errors.notFound("Registration", requestId));
    }
    return createResponse(results[0]);
  } catch (error3) {
    console.error(`[${requestId}] Error fetching registration:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestPut6(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const registrationId = context2.params.id;
    if (!registrationId) {
      return createErrorResponse(errors.badRequest("Registration ID is required", requestId));
    }
    const { results } = await context2.env.DB.prepare(`
      SELECT * FROM registrations WHERE id = ?
    `).bind(registrationId).all();
    if (results.length === 0) {
      return createErrorResponse(errors.notFound("Registration", requestId));
    }
    const registration = results[0];
    const body = await context2.request.json();
    if (!body.action || !["approve", "reject", "waitlist"].includes(body.action)) {
      return createErrorResponse(errors.badRequest("Valid action is required (approve, reject, waitlist)", requestId));
    }
    if (body.action === "approve") {
      let familyMembers = [];
      try {
        if (registration.family_members) {
          familyMembers = JSON.parse(registration.family_members);
        }
      } catch (e) {
        console.warn(`[${requestId}] Failed to parse family members, using primary contact only`);
      }
      if (familyMembers.length === 0) {
        familyMembers = [{
          name: registration.name,
          date_of_birth: "",
          member_type: "adult",
          price: registration.total_amount || 200
        }];
      }
      const groupId = body.group_id || null;
      const createdAttendees = [];
      let primaryRefNumber = "";
      for (let i = 0; i < familyMembers.length; i++) {
        const member = familyMembers[i];
        const refNumber = await generateRefNumber(context2.env.DB);
        const tempPassword = generateTempPassword();
        const passwordHash = await hashPassword(tempPassword);
        const isPrimary = i === 0;
        const memberName = member.name.trim();
        const { first: firstName, last: lastName } = splitFullName(memberName);
        const attendeeResult = await context2.env.DB.prepare(`
          INSERT INTO attendees (
            ref_number, name, first_name, last_name, date_of_birth,
            email, password_hash, phone,
            emergency_contact, dietary_requirements, special_requests,
            room_id, group_id, payment_due, payment_status, payment_option
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        `).bind(
          refNumber,
          memberName,
          firstName,
          lastName,
          member.date_of_birth?.trim() || null,
          isPrimary ? registration.email : null,
          // Only primary gets email
          passwordHash,
          isPrimary ? registration.phone : null,
          // Only primary gets phone
          isPrimary ? registration.emergency_contact : null,
          member.dietary_requirements || member.special_needs || null,
          isPrimary ? registration.special_requests : null,
          body.room_id || null,
          groupId,
          member.price || 0,
          registration.payment_option || "full"
        ).run();
        if (!attendeeResult.success) {
          throw new Error(`Failed to create attendee for ${member.name}`);
        }
        if (isPrimary) {
          primaryRefNumber = refNumber;
        }
        createdAttendees.push({
          name: member.name,
          ref_number: refNumber,
          temp_password: tempPassword,
          member_type: member.member_type,
          payment_due: member.price || 0
        });
      }
      await context2.env.DB.prepare(`
        UPDATE registrations
        SET status = 'approved', notes = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
        WHERE id = ?
      `).bind(body.notes || null, admin.user || "Admin", registrationId).run();
      const emailPromise = sendApprovalEmail(
        context2.env,
        registration.email,
        registration.name,
        createdAttendees,
        registration.total_amount || 0,
        registration.payment_option
      ).catch((err) => console.error(`[${requestId}] Failed to send approval email:`, err));
      context2.waitUntil(emailPromise);
      return createResponse({
        success: true,
        message: `Registration approved! Created ${createdAttendees.length} attendee account(s). Credentials sent to ${registration.email}`,
        attendees: createdAttendees
      });
    } else {
      const newStatus = body.action === "reject" ? "rejected" : "waitlist";
      await context2.env.DB.prepare(`
        UPDATE registrations
        SET status = ?, notes = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
        WHERE id = ?
      `).bind(newStatus, body.notes || null, admin.user || "Admin", registrationId).run();
      return createResponse({
        success: true,
        message: `Registration ${newStatus === "rejected" ? "rejected" : "added to waitlist"}`
      });
    }
  } catch (error3) {
    console.error(`[${requestId}] Error updating registration:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestDelete5(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const registrationId = context2.params.id;
    if (!registrationId) {
      return createErrorResponse(errors.badRequest("Registration ID is required", requestId));
    }
    const result = await context2.env.DB.prepare(`
      DELETE FROM registrations WHERE id = ?
    `).bind(registrationId).run();
    if (!result.success || result.meta.changes === 0) {
      return createErrorResponse(errors.notFound("Registration", requestId));
    }
    return createResponse({
      success: true,
      message: "Registration deleted successfully"
    });
  } catch (error3) {
    console.error(`[${requestId}] Error deleting registration:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function generateRefNumber(db) {
  const prefix = "REF";
  const year = (/* @__PURE__ */ new Date()).getFullYear().toString().slice(-2);
  const { results } = await db.prepare(`
    SELECT ref_number FROM attendees
    WHERE ref_number LIKE ?
    ORDER BY ref_number DESC
    LIMIT 1
  `).bind(`${prefix}${year}%`).all();
  let nextNumber = 1;
  if (results.length > 0) {
    const lastRef = results[0].ref_number;
    const numPart = parseInt(lastRef.slice(5), 10);
    if (!isNaN(numPart)) {
      nextNumber = numPart + 1;
    }
  }
  return `${prefix}${year}${nextNumber.toString().padStart(4, "0")}`;
}
function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
async function sendApprovalEmail(env2, email, primaryName, attendees, totalAmount, paymentOption) {
  if (!env2.RESEND_API_KEY || !env2.FROM_EMAIL) {
    console.warn("Email service not configured - skipping approval email");
    return;
  }
  const portalUrl = env2.PORTAL_URL || "https://retreat-manager.pages.dev";
  const retreatName = env2.RETREAT_NAME || "Growth and Wisdom Retreat";
  const paymentLabels = {
    full: "Pay in Full",
    installments: "Pay in Installments",
    sponsorship: "Sponsorship Requested"
  };
  const credentialsRows = attendees.map((attendee, index) => `
    <tr style="${index === 0 ? "background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);" : ""}">
      <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb;">
        <strong style="color: #1f2937;">${attendee.name}</strong>
        ${index === 0 ? '<br><span style="font-size: 0.8rem; color: #667eea;">(Primary Contact)</span>' : ""}
        <br><span style="font-size: 0.8rem; color: #6b7280; text-transform: capitalize;">${attendee.member_type}</span>
      </td>
      <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; font-family: monospace; background: #f9fafb;">
        <strong style="color: #1f2937; font-size: 1.1rem;">${attendee.ref_number}</strong>
      </td>
      <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; font-family: monospace; background: #fef3c7;">
        <strong style="color: #92400e;">${attendee.temp_password}</strong>
      </td>
      <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; text-align: right;">
        ${attendee.payment_due === 0 ? '<span style="color: #10b981; font-weight: bold;">FREE</span>' : `<strong style="color: #1f2937;">\xA3${attendee.payment_due}</strong>`}
      </td>
    </tr>
  `).join("");
  const emailHtml = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 700px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">\u{1F389}</div>
        <h1 style="margin: 0; font-size: 1.5rem;">Registration Approved!</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">${retreatName}</p>
      </div>

      <!-- Content -->
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

        <p style="font-size: 1.1rem; color: #1f2937; margin: 0 0 1.5rem 0;">
          Dear <strong>${primaryName}</strong>,
        </p>

        <p style="color: #4b5563; margin: 0 0 1.5rem 0;">
          Great news! Your family registration has been approved. Below are the login credentials for each family member to access the retreat portal.
        </p>

        <!-- Important Notice -->
        <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <strong style="color: #92400e;">\u26A0\uFE0F Important: Save These Credentials</strong>
          <p style="color: #b45309; margin: 0.5rem 0 0 0; font-size: 0.9rem;">
            Please save these login details securely. Each family member will need their own Reference Number and Password to log in.
          </p>
        </div>

        <!-- Credentials Table -->
        <h2 style="color: #1f2937; margin: 0 0 1rem 0; font-size: 1.1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
          \u{1F510} Login Credentials (${attendees.length} Member${attendees.length > 1 ? "s" : ""})
        </h2>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; min-width: 500px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 0.75rem; text-align: left; color: #6b7280; font-size: 0.85rem;">Name</th>
                <th style="padding: 0.75rem; text-align: left; color: #6b7280; font-size: 0.85rem;">Reference #</th>
                <th style="padding: 0.75rem; text-align: left; color: #6b7280; font-size: 0.85rem;">Password</th>
                <th style="padding: 0.75rem; text-align: right; color: #6b7280; font-size: 0.85rem;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${credentialsRows}
            </tbody>
            <tfoot>
              <tr style="background: #f3f4f6;">
                <td colspan="3" style="padding: 0.75rem; font-weight: bold; color: #1f2937;">Total Amount Due</td>
                <td style="padding: 0.75rem; font-weight: bold; color: #667eea; text-align: right; font-size: 1.2rem;">\xA3${totalAmount}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Payment Info -->
        <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <strong style="color: #0369a1;">\u{1F4B3} Payment Option: ${paymentLabels[paymentOption] || paymentOption}</strong>
          ${paymentOption === "sponsorship" ? `
            <p style="color: #0284c7; margin: 0.5rem 0 0 0; font-size: 0.9rem;">
              Your sponsorship request has been noted. We will contact you with further details.
            </p>
          ` : paymentOption === "installments" ? `
            <p style="color: #0284c7; margin: 0.5rem 0 0 0; font-size: 0.9rem;">
              You've chosen to pay in installments. Payment details will be provided separately.
            </p>
          ` : `
            <p style="color: #0284c7; margin: 0.5rem 0 0 0; font-size: 0.9rem;">
              Please arrange payment at your earliest convenience.
            </p>
          `}
        </div>

        <!-- How to Login -->
        <h2 style="color: #1f2937; margin: 0 0 1rem 0; font-size: 1.1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
          \u{1F4F1} How to Log In
        </h2>

        <ol style="color: #4b5563; padding-left: 1.5rem; margin: 0 0 1.5rem 0;">
          <li style="margin-bottom: 0.5rem;">Go to <a href="${portalUrl}" style="color: #667eea;">${portalUrl}</a></li>
          <li style="margin-bottom: 0.5rem;">Enter the Reference Number (e.g., ${attendees[0]?.ref_number})</li>
          <li style="margin-bottom: 0.5rem;">Enter the Password for that family member</li>
          <li style="margin-bottom: 0.5rem;">Click "Login" to access the portal</li>
        </ol>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 2rem 0;">
          <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 1.1rem;">
            Login to Portal \u2192
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 1rem; text-align: center;">
          <p style="color: #9ca3af; font-size: 0.85rem; margin: 0;">
            If you have any questions, please contact us at this email address.
          </p>
          <p style="color: #6b7280; font-size: 0.9rem; margin: 1rem 0 0 0;">
            We look forward to seeing your family at the retreat!
          </p>
          <p style="color: #667eea; font-weight: bold; margin: 0.5rem 0 0 0;">
            ${retreatName} Team
          </p>
        </div>
      </div>
    </div>
  `;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env2.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env2.FROM_EMAIL,
      to: [email],
      subject: `\u2705 Registration Approved - ${retreatName} (${attendees.length} Member${attendees.length > 1 ? "s" : ""})`,
      html: emailHtml
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send approval email: ${errorText}`);
  }
  console.log(`Approval email sent to ${email} for ${attendees.length} family members`);
}
var init_id6 = __esm({
  "api/admin/registrations/[id].ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    init_names();
    __name(onRequestOptions17, "onRequestOptions");
    __name(onRequestGet10, "onRequestGet");
    __name(onRequestPut6, "onRequestPut");
    __name(onRequestDelete5, "onRequestDelete");
    __name(generateRefNumber, "generateRefNumber");
    __name(generateTempPassword, "generateTempPassword");
    __name(sendApprovalEmail, "sendApprovalEmail");
  }
});

// api/admin/rooms/[id].ts
async function onRequestOptions18() {
  return handleCORS();
}
async function onRequestGet11(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const id = context2.params.id;
    const { results } = await context2.env.DB.prepare(`
      SELECT
        r.id,
        r.number,
        r.description,
        COUNT(a.id) as occupant_count,
        GROUP_CONCAT(a.name, ', ') as occupants
      FROM rooms r
      LEFT JOIN attendees a ON r.id = a.room_id
      WHERE r.id = ?
      GROUP BY r.id, r.number, r.description
    `).bind(id).all();
    if (!results.length) {
      return createErrorResponse(errors.notFound("Room", requestId));
    }
    const room = results[0];
    const formattedRoom = {
      id: room.id,
      number: room.number,
      description: room.description || "",
      occupant_count: room.occupant_count || 0,
      occupants: room.occupants ? room.occupants.split(", ").filter(Boolean) : []
    };
    return createResponse(formattedRoom);
  } catch (error3) {
    console.error(`[${requestId}] Error fetching room:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestPut7(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const id = context2.params.id;
    const body = await context2.request.json();
    const validation = validate(body, roomUpdateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }
    const { number, description } = body;
    if (!number || !number.trim()) {
      return createErrorResponse(errors.badRequest("Room number is required", requestId));
    }
    const { results: existing } = await context2.env.DB.prepare(
      "SELECT id FROM rooms WHERE id = ?"
    ).bind(id).all();
    if (!existing.length) {
      return createErrorResponse(errors.notFound("Room", requestId));
    }
    const { results: conflict } = await context2.env.DB.prepare(
      "SELECT id FROM rooms WHERE number = ? AND id != ?"
    ).bind(number.trim(), id).all();
    if (conflict.length > 0) {
      return createErrorResponse(errors.conflict("Room number already exists", requestId));
    }
    const result = await context2.env.DB.prepare(
      "UPDATE rooms SET number = ?, description = ? WHERE id = ?"
    ).bind(number.trim(), description?.trim() || null, id).run();
    if (!result.success) {
      throw new Error("Failed to update room");
    }
    return createResponse({
      success: true,
      message: "Room updated successfully"
    });
  } catch (error3) {
    console.error(`[${requestId}] Error updating room:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestDelete6(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const id = context2.params.id;
    const { results: existing } = await context2.env.DB.prepare(
      "SELECT id, number FROM rooms WHERE id = ?"
    ).bind(id).all();
    if (!existing.length) {
      return createErrorResponse(errors.notFound("Room", requestId));
    }
    const room = existing[0];
    const { results: occupants } = await context2.env.DB.prepare(
      "SELECT COUNT(*) as count FROM attendees WHERE room_id = ?"
    ).bind(id).all();
    if (occupants[0].count > 0) {
      return createErrorResponse(
        errors.conflict("Cannot delete room with occupants. Please reassign attendees first.", requestId)
      );
    }
    const result = await context2.env.DB.prepare(
      "DELETE FROM rooms WHERE id = ?"
    ).bind(id).run();
    if (!result.success) {
      throw new Error("Failed to delete room");
    }
    return createResponse({
      success: true,
      message: `Room ${room.number} deleted successfully`
    });
  } catch (error3) {
    console.error(`[${requestId}] Error deleting room:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_id7 = __esm({
  "api/admin/rooms/[id].ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_validation();
    init_errors();
    __name(onRequestOptions18, "onRequestOptions");
    __name(onRequestGet11, "onRequestGet");
    __name(onRequestPut7, "onRequestPut");
    __name(onRequestDelete6, "onRequestDelete");
  }
});

// api/admin/announcements/index.ts
async function onRequestOptions19() {
  return handleCORS();
}
async function onRequestGet12(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const url = new URL(context2.request.url);
    const { limit, offset } = parsePaginationParams(url);
    const { results: countResult } = await context2.env.DB.prepare(
      "SELECT COUNT(*) as total FROM announcements"
    ).all();
    const total = countResult[0].total;
    const { results } = await context2.env.DB.prepare(`
      SELECT
        id,
        title,
        content,
        type,
        priority,
        is_active,
        target_audience,
        target_groups,
        author_name,
        starts_at,
        expires_at,
        created_at,
        updated_at
      FROM announcements
      ORDER BY priority DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    const formattedAnnouncements = results.map((announcement) => ({
      ...announcement,
      is_active: Boolean(announcement.is_active),
      target_groups: announcement.target_groups ? JSON.parse(announcement.target_groups) : null
    }));
    return createResponse(createPaginatedResponse(formattedAnnouncements, total, limit, offset));
  } catch (error3) {
    console.error(`[${requestId}] Error fetching announcements:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestPost9(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const body = await context2.request.json();
    const validation = validate(body, announcementCreateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }
    const {
      title: title2,
      content,
      type = "general",
      priority = 1,
      target_audience = "all",
      target_groups,
      starts_at,
      expires_at
    } = body;
    let targetGroupsJson = null;
    if (target_audience === "groups" && target_groups && Array.isArray(target_groups)) {
      targetGroupsJson = JSON.stringify(target_groups);
    }
    const result = await context2.env.DB.prepare(`
      INSERT INTO announcements (
        title, content, type, priority, target_audience, target_groups,
        author_name, starts_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title2.trim(),
      content.trim(),
      type,
      priority,
      target_audience,
      targetGroupsJson,
      admin.user || "Admin",
      starts_at || null,
      expires_at || null
    ).run();
    if (!result.success) {
      throw new Error("Failed to create announcement");
    }
    return createResponse({
      id: result.meta.last_row_id,
      message: "Announcement created successfully"
    }, 201);
  } catch (error3) {
    console.error(`[${requestId}] Error creating announcement:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_announcements = __esm({
  "api/admin/announcements/index.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_validation();
    init_pagination();
    init_errors();
    __name(onRequestOptions19, "onRequestOptions");
    __name(onRequestGet12, "onRequestGet");
    __name(onRequestPost9, "onRequestPost");
  }
});

// api/admin/attendees/index.ts
async function onRequestOptions20() {
  return handleCORS();
}
async function onRequestGet13(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const url = new URL(context2.request.url);
    const { limit, offset } = parsePaginationParams(url);
    const { results: countResult } = await context2.env.DB.prepare(
      "SELECT COUNT(*) as total FROM attendees WHERE is_archived = 0 OR is_archived IS NULL"
    ).all();
    const total = countResult[0].total;
    const { results } = await context2.env.DB.prepare(`
      SELECT
        a.id,
        a.ref_number,
        a.name,
        a.email,
        a.payment_due,
        a.payment_option,
        a.payment_status,
        a.room_id,
        a.group_id,
        a.created_at,
        r.number AS room_number,
        g.name AS group_name
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.is_archived = 0 OR a.is_archived IS NULL
      ORDER BY a.name
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    const formattedResults = results.map((attendee) => ({
      id: attendee.id,
      ref_number: attendee.ref_number,
      name: attendee.name,
      email: attendee.email,
      payment_due: attendee.payment_due || 0,
      payment_option: attendee.payment_option || "full",
      payment_status: attendee.payment_status || "pending",
      room_id: attendee.room_id,
      group_id: attendee.group_id,
      created_at: attendee.created_at,
      room: attendee.room_number ? { number: attendee.room_number } : null,
      group: attendee.group_name ? { name: attendee.group_name } : null
    }));
    return createResponse(createPaginatedResponse(formattedResults, total, limit, offset));
  } catch (error3) {
    console.error(`[${requestId}] Error fetching attendees:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestPost10(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const body = await context2.request.json();
    const validation = validate(body, attendeeCreateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }
    const {
      name,
      email,
      ref_number,
      password,
      room_id,
      group_id,
      payment_due,
      first_name,
      last_name,
      date_of_birth
    } = body;
    const { results: existing } = await context2.env.DB.prepare(
      "SELECT id FROM attendees WHERE ref_number = ?"
    ).bind(ref_number.trim()).all();
    if (existing.length > 0) {
      return createErrorResponse(errors.conflict("Reference number already exists", requestId));
    }
    const password_hash = await hashPassword(password);
    const trimmedName = name.trim();
    const split = splitFullName(trimmedName);
    const firstName = first_name?.trim() || split.first || null;
    const lastName = last_name?.trim() || split.last || null;
    const result = await context2.env.DB.prepare(`
      INSERT INTO attendees (name, first_name, last_name, date_of_birth, email, ref_number, password_hash, room_id, group_id, payment_due)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      trimmedName,
      firstName,
      lastName,
      date_of_birth?.trim() || null,
      email ? email.trim() : null,
      ref_number.trim(),
      password_hash,
      room_id ?? null,
      group_id ?? null,
      payment_due ?? 0
    ).run();
    if (!result.success) {
      throw new Error("Failed to create attendee");
    }
    return createResponse({
      id: result.meta.last_row_id,
      message: "Attendee created successfully"
    }, 201);
  } catch (error3) {
    console.error(`[${requestId}] Error creating attendee:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_attendees = __esm({
  "api/admin/attendees/index.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_validation();
    init_pagination();
    init_errors();
    init_names();
    __name(onRequestOptions20, "onRequestOptions");
    __name(onRequestGet13, "onRequestGet");
    __name(onRequestPost10, "onRequestPost");
  }
});

// api/admin/audit-log.ts
async function onRequestOptions21() {
  return handleCORS();
}
async function onRequestGet14(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin)
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    const url = new URL(context2.request.url);
    const { limit, offset } = parsePaginationParams(url);
    const { results: countResult } = await context2.env.DB.prepare(
      "SELECT COUNT(*) as total FROM audit_log"
    ).all();
    const total = countResult[0].total;
    const { results } = await context2.env.DB.prepare(`
      SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    return createResponse(createPaginatedResponse(results, total, limit, offset));
  } catch (error3) {
    console.error(`[${requestId}] Audit log error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_audit_log = __esm({
  "api/admin/audit-log.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_pagination();
    init_errors();
    __name(onRequestOptions21, "onRequestOptions");
    __name(onRequestGet14, "onRequestGet");
  }
});

// api/admin/bulk-actions.ts
async function onRequestOptions22() {
  return handleCORS();
}
async function onRequestPost11(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin)
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    const body = await context2.request.json();
    if (!body.action || !body.attendee_ids || body.attendee_ids.length === 0) {
      return createErrorResponse(errors.badRequest("Action and attendee_ids are required", requestId));
    }
    const ids = body.attendee_ids;
    const placeholders = ids.map(() => "?").join(",");
    let updated = 0;
    switch (body.action) {
      case "assign_group":
        if (body.group_id === void 0)
          return createErrorResponse(errors.badRequest("group_id required", requestId));
        await context2.env.DB.prepare(
          `UPDATE attendees SET group_id = ? WHERE id IN (${placeholders})`
        ).bind(body.group_id, ...ids).run();
        updated = ids.length;
        break;
      case "assign_room":
        if (body.room_id === void 0)
          return createErrorResponse(errors.badRequest("room_id required", requestId));
        await context2.env.DB.prepare(
          `UPDATE attendees SET room_id = ? WHERE id IN (${placeholders})`
        ).bind(body.room_id, ...ids).run();
        updated = ids.length;
        break;
      case "archive":
        await context2.env.DB.prepare(
          `UPDATE attendees SET is_archived = 1 WHERE id IN (${placeholders})`
        ).bind(...ids).run();
        updated = ids.length;
        break;
      case "unarchive":
        await context2.env.DB.prepare(
          `UPDATE attendees SET is_archived = 0 WHERE id IN (${placeholders})`
        ).bind(...ids).run();
        updated = ids.length;
        break;
      default:
        return createErrorResponse(errors.badRequest("Invalid action", requestId));
    }
    await context2.env.DB.prepare(
      "INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)"
    ).bind(admin.user, `bulk_${body.action}`, "attendee", 0, `Bulk ${body.action} on ${ids.length} attendees`).run();
    return createResponse({ message: `${updated} attendees updated`, updated });
  } catch (error3) {
    console.error(`[${requestId}] Bulk action error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_bulk_actions = __esm({
  "api/admin/bulk-actions.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    __name(onRequestOptions22, "onRequestOptions");
    __name(onRequestPost11, "onRequestPost");
  }
});

// api/admin/check-in.ts
async function onRequestOptions23() {
  return handleCORS();
}
async function onRequestPost12(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin)
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    const body = await context2.request.json();
    const ref = body.ref_number;
    const id = body.attendee_id;
    if (!ref && !id) {
      return createErrorResponse(errors.badRequest("ref_number or attendee_id required", requestId));
    }
    const query = ref ? "SELECT id, name, ref_number, checked_in FROM attendees WHERE ref_number = ? AND is_archived = 0" : "SELECT id, name, ref_number, checked_in FROM attendees WHERE id = ? AND is_archived = 0";
    const bind = ref || id;
    const { results } = await context2.env.DB.prepare(query).bind(bind).all();
    if (results.length === 0) {
      return createErrorResponse(errors.notFound("Attendee", requestId));
    }
    const attendee = results[0];
    if (attendee.checked_in) {
      return createResponse({
        message: `${attendee.name} is already checked in`,
        already_checked_in: true,
        attendee: { id: attendee.id, name: attendee.name, ref_number: attendee.ref_number }
      });
    }
    await context2.env.DB.prepare(
      "UPDATE attendees SET checked_in = 1, checked_in_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(attendee.id).run();
    await context2.env.DB.prepare(
      "INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)"
    ).bind(admin.user, "check_in", "attendee", attendee.id, `Checked in ${attendee.name} (${attendee.ref_number})`).run();
    return createResponse({
      message: `${attendee.name} checked in successfully!`,
      already_checked_in: false,
      attendee: { id: attendee.id, name: attendee.name, ref_number: attendee.ref_number }
    });
  } catch (error3) {
    console.error(`[${requestId}] Check-in error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestGet15(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin)
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    const { results: stats } = await context2.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN checked_in = 1 THEN 1 ELSE 0 END) as checked_in,
        SUM(CASE WHEN checked_in = 0 OR checked_in IS NULL THEN 1 ELSE 0 END) as not_checked_in
      FROM attendees WHERE is_archived = 0
    `).all();
    const { results: recent } = await context2.env.DB.prepare(`
      SELECT name, ref_number, checked_in_at
      FROM attendees
      WHERE checked_in = 1 AND is_archived = 0
      ORDER BY checked_in_at DESC
      LIMIT 20
    `).all();
    return createResponse({
      stats: stats[0],
      recent_checkins: recent
    });
  } catch (error3) {
    console.error(`[${requestId}] Check-in stats error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_check_in = __esm({
  "api/admin/check-in.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    __name(onRequestOptions23, "onRequestOptions");
    __name(onRequestPost12, "onRequestPost");
    __name(onRequestGet15, "onRequestGet");
  }
});

// api/admin/export.ts
async function onRequestOptions24() {
  return handleCORS();
}
async function onRequestGet16(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin)
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    const url = new URL(context2.request.url);
    const type = url.searchParams.get("type") || "attendees";
    let csv = "";
    let filename = "";
    if (type === "attendees") {
      const { results } = await context2.env.DB.prepare(`
        SELECT a.ref_number, a.name, a.email, a.phone, a.payment_due, a.payment_status,
               a.payment_option, a.dietary_requirements, a.special_requests, a.checked_in,
               r.number AS room, g.name AS group_name, a.created_at
        FROM attendees a
        LEFT JOIN rooms r ON a.room_id = r.id
        LEFT JOIN groups g ON a.group_id = g.id
        WHERE a.is_archived = 0
        ORDER BY a.name
      `).all();
      csv = "Reference,Name,Email,Phone,Payment Due,Payment Status,Payment Plan,Dietary,Special Requests,Checked In,Room,Group,Registered\n";
      for (const r of results) {
        csv += [
          r.ref_number,
          r.name,
          r.email || "",
          r.phone || "",
          r.payment_due,
          r.payment_status,
          r.payment_option,
          r.dietary_requirements || "",
          r.special_requests || "",
          r.checked_in ? "Yes" : "No",
          r.room || "",
          r.group_name || "",
          r.created_at
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n";
      }
      filename = `attendees-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
    } else if (type === "attendees-basic") {
      const { results } = await context2.env.DB.prepare(`
        SELECT first_name, last_name, name, date_of_birth
        FROM attendees
        WHERE is_archived = 0 OR is_archived IS NULL
        ORDER BY last_name, first_name, name
      `).all();
      csv = "First Name,Last Name,Age\n";
      for (const r of results) {
        let first = r.first_name ?? null;
        let last = r.last_name ?? null;
        if (!first && !last) {
          const split = splitFullName(r.name);
          first = split.first;
          last = split.last;
        }
        const age = ageFromDateOfBirth(r.date_of_birth);
        csv += [first || "", last || "", age ?? ""].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n";
      }
      filename = `attendees-basic-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
    } else if (type === "payments") {
      const { results } = await context2.env.DB.prepare(`
        SELECT p.id, a.ref_number, a.name, p.amount, p.currency, p.status, p.payment_type,
               p.installment_number, p.installment_total, p.description, p.paid_at, p.created_at,
               CASE WHEN p.stripe_checkout_session_id IS NOT NULL THEN 'Card' ELSE 'Bank Transfer' END as method
        FROM payments p LEFT JOIN attendees a ON p.attendee_id = a.id
        ORDER BY p.created_at DESC
      `).all();
      csv = "ID,Reference,Name,Amount (\xA3),Status,Type,Installment,Method,Paid At,Created\n";
      for (const r of results) {
        const amount = (r.amount / 100).toFixed(2);
        const inst = r.installment_number ? `${r.installment_number}/${r.installment_total}` : "";
        csv += [r.id, r.ref_number, r.name, amount, r.status, r.payment_type, inst, r.method, r.paid_at || "", r.created_at].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n";
      }
      filename = `payments-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
    } else if (type === "registrations") {
      const { results } = await context2.env.DB.prepare(`
        SELECT id, name, email, phone, status, payment_option, total_amount, member_count, submitted_at, reviewed_at
        FROM registrations ORDER BY submitted_at DESC
      `).all();
      csv = "ID,Name,Email,Phone,Status,Payment Option,Total,Members,Submitted,Reviewed\n";
      for (const r of results) {
        csv += [r.id, r.name, r.email, r.phone || "", r.status, r.payment_option, r.total_amount, r.member_count, r.submitted_at, r.reviewed_at || ""].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n";
      }
      filename = `registrations-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
    } else {
      return createErrorResponse(errors.badRequest("Invalid export type", requestId));
    }
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error3) {
    console.error(`[${requestId}] Export error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_export = __esm({
  "api/admin/export.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    init_names();
    __name(onRequestOptions24, "onRequestOptions");
    __name(onRequestGet16, "onRequestGet");
  }
});

// api/admin/groups/index.ts
async function onRequestOptions25() {
  return handleCORS();
}
async function onRequestGet17(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const url = new URL(context2.request.url);
    const { limit, offset } = parsePaginationParams(url);
    const { results: countResult } = await context2.env.DB.prepare(
      "SELECT COUNT(*) as total FROM groups"
    ).all();
    const total = countResult[0].total;
    const { results } = await context2.env.DB.prepare(`
      SELECT
        g.id,
        g.name,
        COUNT(a.id) as member_count,
        GROUP_CONCAT(a.name, ', ') as members,
        GROUP_CONCAT(a.ref_number, ', ') as member_refs,
        COALESCE(SUM(a.payment_due), 0) as total_outstanding,
        SUM(CASE WHEN a.payment_due > 0 THEN 1 ELSE 0 END) as members_with_payments
      FROM groups g
      LEFT JOIN attendees a ON g.id = a.group_id AND (a.is_archived = 0 OR a.is_archived IS NULL)
      GROUP BY g.id, g.name
      ORDER BY g.name
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    const formattedGroups = results.map((group3) => {
      const memberNames = group3.members ? group3.members.split(", ").filter(Boolean) : [];
      const memberRefs = group3.member_refs ? group3.member_refs.split(", ").filter(Boolean) : [];
      const members = memberNames.map((name, index) => ({
        name,
        ref_number: memberRefs[index] || ""
      }));
      return {
        id: group3.id,
        name: group3.name,
        member_count: group3.member_count || 0,
        members,
        financial: {
          totalOutstanding: group3.total_outstanding || 0,
          membersWithPayments: group3.members_with_payments || 0
        }
      };
    });
    return createResponse(createPaginatedResponse(formattedGroups, total, limit, offset));
  } catch (error3) {
    console.error(`[${requestId}] Error fetching groups:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestPost13(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const body = await context2.request.json();
    const validation = validate(body, groupCreateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }
    const { name } = body;
    const { results: existing } = await context2.env.DB.prepare(
      "SELECT id FROM groups WHERE name = ?"
    ).bind(name.trim()).all();
    if (existing.length > 0) {
      return createErrorResponse(errors.conflict("Group name already exists", requestId));
    }
    const result = await context2.env.DB.prepare(
      "INSERT INTO groups (name) VALUES (?)"
    ).bind(name.trim()).run();
    if (!result.success) {
      throw new Error("Failed to create group");
    }
    return createResponse({
      id: result.meta.last_row_id,
      message: "Group created successfully"
    }, 201);
  } catch (error3) {
    console.error(`[${requestId}] Error creating group:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_groups = __esm({
  "api/admin/groups/index.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_validation();
    init_pagination();
    init_errors();
    __name(onRequestOptions25, "onRequestOptions");
    __name(onRequestGet17, "onRequestGet");
    __name(onRequestPost13, "onRequestPost");
  }
});

// api/admin/login.ts
async function onRequestOptions26() {
  return handleCORS();
}
async function onRequestPost14(context2) {
  const requestId = generateRequestId();
  try {
    const body = await context2.request.json();
    const validation = validate(body, adminLoginSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }
    const { user, pass } = body;
    const trimmedUser = user.trim();
    const clientIP = context2.request.headers.get("CF-Connecting-IP") || context2.request.headers.get("X-Forwarded-For") || "unknown";
    const rateLimit = await checkRateLimit(context2.env.DB, trimmedUser, "admin");
    if (!rateLimit.allowed) {
      return createErrorResponse(errors.rateLimited(Math.ceil((rateLimit.resetTime - Date.now()) / 1e3), requestId));
    }
    const adminUser = context2.env.ADMIN_USER || "admin";
    const adminPass = context2.env.ADMIN_PASS || "admin123";
    const userMatch = timingSafeEqual2(trimmedUser, adminUser);
    const passMatch = timingSafeEqual2(pass, adminPass);
    if (!userMatch || !passMatch) {
      await recordLoginAttempt(context2.env.DB, trimmedUser, "admin", false, clientIP);
      return createErrorResponse(errors.unauthorized("Invalid credentials", requestId));
    }
    await recordLoginAttempt(context2.env.DB, trimmedUser, "admin", true, clientIP);
    await clearRateLimit(context2.env.DB, trimmedUser, "admin");
    await context2.env.DB.prepare(`
      INSERT INTO login_history (user_type, user_id, login_time)
      VALUES ('admin', ?, CURRENT_TIMESTAMP)
    `).bind(trimmedUser).run();
    const token = await generateAdminToken(trimmedUser, "admin", context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    return createResponse({ token });
  } catch (error3) {
    console.error(`[${requestId}] Error in admin login:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
function timingSafeEqual2(a, b) {
  if (a.length !== b.length) {
    let result2 = 0;
    for (let i = 0; i < a.length; i++) {
      result2 |= a.charCodeAt(i) ^ a.charCodeAt(i);
    }
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
var init_login = __esm({
  "api/admin/login.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_validation();
    init_errors();
    __name(onRequestOptions26, "onRequestOptions");
    __name(onRequestPost14, "onRequestPost");
    __name(timingSafeEqual2, "timingSafeEqual");
  }
});

// api/admin/payments/index.ts
async function onRequestOptions27() {
  return handleCORS();
}
async function onRequestGet18(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const url = new URL(context2.request.url);
    const { limit, offset } = parsePaginationParams(url);
    const statusFilter = url.searchParams.get("status");
    const attendeeIdFilter = url.searchParams.get("attendee_id");
    let countQuery = "SELECT COUNT(*) as total FROM payments";
    let dataQuery = `
      SELECT p.*, a.name as attendee_name, a.ref_number as attendee_ref
      FROM payments p
      LEFT JOIN attendees a ON p.attendee_id = a.id
    `;
    const conditions = [];
    const bindings = [];
    if (statusFilter) {
      conditions.push("p.status = ?");
      bindings.push(statusFilter);
    }
    if (attendeeIdFilter) {
      conditions.push("p.attendee_id = ?");
      bindings.push(parseInt(attendeeIdFilter));
    }
    if (conditions.length > 0) {
      const where = " WHERE " + conditions.join(" AND ");
      countQuery += where.replace(/p\./g, "");
      dataQuery += where;
    }
    dataQuery += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
    const countStmt = context2.env.DB.prepare(countQuery);
    const { results: countResult } = bindings.length > 0 ? await countStmt.bind(...bindings).all() : await countStmt.all();
    const total = countResult[0].total;
    const dataStmt = context2.env.DB.prepare(dataQuery);
    const allBindings = [...bindings, limit, offset];
    const { results } = await dataStmt.bind(...allBindings).all();
    return createResponse(createPaginatedResponse(results, total, limit, offset));
  } catch (error3) {
    console.error(`[${requestId}] Error fetching payments:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_payments = __esm({
  "api/admin/payments/index.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_pagination();
    init_errors();
    __name(onRequestOptions27, "onRequestOptions");
    __name(onRequestGet18, "onRequestGet");
  }
});

// api/admin/registrations/index.ts
async function onRequestOptions28() {
  return handleCORS();
}
async function onRequestGet19(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const url = new URL(context2.request.url);
    const { limit, offset } = parsePaginationParams(url);
    const statusFilter = url.searchParams.get("status");
    let countQuery = "SELECT COUNT(*) as total FROM registrations";
    let dataQuery = `
      SELECT id, name, email, phone, emergency_contact,
             dietary_requirements, special_requests,
             preferred_room_type, group_preference, status,
             notes, submitted_at, reviewed_at, reviewed_by,
             family_members, total_amount, member_count, payment_option
      FROM registrations
    `;
    const bindings = [];
    if (statusFilter && ["pending", "approved", "rejected", "waitlist"].includes(statusFilter)) {
      countQuery += " WHERE status = ?";
      dataQuery += " WHERE status = ?";
      bindings.push(statusFilter);
    }
    dataQuery += " ORDER BY submitted_at DESC LIMIT ? OFFSET ?";
    const countStmt = statusFilter ? context2.env.DB.prepare(countQuery).bind(statusFilter) : context2.env.DB.prepare(countQuery);
    const { results: countResult } = await countStmt.all();
    const total = countResult[0].total;
    const stmt = statusFilter ? context2.env.DB.prepare(dataQuery).bind(statusFilter, limit, offset) : context2.env.DB.prepare(dataQuery).bind(limit, offset);
    const { results } = await stmt.all();
    return createResponse(createPaginatedResponse(results, total, limit, offset));
  } catch (error3) {
    console.error(`[${requestId}] Error fetching registrations:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_registrations = __esm({
  "api/admin/registrations/index.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_pagination();
    init_errors();
    __name(onRequestOptions28, "onRequestOptions");
    __name(onRequestGet19, "onRequestGet");
  }
});

// api/admin/rooms/index.ts
async function onRequestOptions29() {
  return handleCORS();
}
async function onRequestGet20(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const url = new URL(context2.request.url);
    const { limit, offset } = parsePaginationParams(url);
    const { results: countResult } = await context2.env.DB.prepare(
      "SELECT COUNT(*) as total FROM rooms"
    ).all();
    const total = countResult[0].total;
    const { results } = await context2.env.DB.prepare(`
      SELECT
        r.id,
        r.number,
        r.description,
        COUNT(a.id) as occupant_count,
        GROUP_CONCAT(a.name, ', ') as occupants
      FROM rooms r
      LEFT JOIN attendees a ON r.id = a.room_id
      GROUP BY r.id, r.number, r.description
      ORDER BY r.number
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();
    const formattedRooms = results.map((room) => ({
      id: room.id,
      number: room.number,
      description: room.description || "",
      occupant_count: room.occupant_count || 0,
      occupants: room.occupants ? room.occupants.split(", ").filter(Boolean) : []
    }));
    return createResponse(createPaginatedResponse(formattedRooms, total, limit, offset));
  } catch (error3) {
    console.error(`[${requestId}] Error fetching rooms:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestPost15(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const body = await context2.request.json();
    const validation = validate(body, roomCreateSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }
    const { number, description } = body;
    const { results: existing } = await context2.env.DB.prepare(
      "SELECT id FROM rooms WHERE number = ?"
    ).bind(number.trim()).all();
    if (existing.length > 0) {
      return createErrorResponse(errors.conflict("Room number already exists", requestId));
    }
    const result = await context2.env.DB.prepare(
      "INSERT INTO rooms (number, description) VALUES (?, ?)"
    ).bind(number.trim(), description?.trim() || null).run();
    if (!result.success) {
      throw new Error("Failed to create room");
    }
    return createResponse({
      id: result.meta.last_row_id,
      message: "Room created successfully"
    }, 201);
  } catch (error3) {
    console.error(`[${requestId}] Error creating room:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_rooms = __esm({
  "api/admin/rooms/index.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_validation();
    init_pagination();
    init_errors();
    __name(onRequestOptions29, "onRequestOptions");
    __name(onRequestGet20, "onRequestGet");
    __name(onRequestPost15, "onRequestPost");
  }
});

// api/email/test.ts
async function onRequestOptions30() {
  return handleCORS();
}
async function onRequestPost16(context2) {
  const requestId = generateRequestId();
  try {
    const admin = await checkAdminAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!admin) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const body = await context2.request.json();
    const validation = validate(body, testEmailSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }
    const { testEmail } = body;
    console.log(`[${requestId}] Testing email to:`, testEmail);
    console.log(`[${requestId}] API key available:`, !!context2.env.RESEND_API_KEY);
    console.log(`[${requestId}] From email:`, context2.env.FROM_EMAIL || "Not set");
    if (!context2.env.RESEND_API_KEY || !context2.env.FROM_EMAIL) {
      console.error(`[${requestId}] Email configuration missing`);
      return createErrorResponse(errors.internal("Email system not configured", requestId));
    }
    const emailResult = await sendTestEmail(context2.env, testEmail);
    if (emailResult.success) {
      return createResponse({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        service: "Resend API",
        fromEmail: context2.env.FROM_EMAIL
      });
    } else {
      return createErrorResponse(errors.externalService("Email service", requestId, emailResult.error));
    }
  } catch (error3) {
    console.error(`[${requestId}] Error sending test email:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function sendTestEmail(env2, toEmail) {
  if (!env2.RESEND_API_KEY) {
    return {
      success: false,
      error: "RESEND_API_KEY not configured. Please add it in Cloudflare Pages settings."
    };
  }
  if (!env2.FROM_EMAIL) {
    return {
      success: false,
      error: "FROM_EMAIL not configured. Please add it in Cloudflare Pages settings."
    };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env2.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env2.FROM_EMAIL,
        to: [toEmail],
        subject: "Retreat Portal - Email Test Successful!",
        html: generateTestEmailTemplate(env2.FROM_EMAIL)
      })
    });
    if (response.ok) {
      const result = await response.json();
      console.log("Email sent successfully:", result);
      return { success: true, data: result };
    } else {
      const errorText = await response.text();
      console.error("Resend API error:", errorText);
      return { success: false, error: `Resend API error: ${errorText}` };
    }
  } catch (error3) {
    console.error("Email sending error:", error3);
    return { success: false, error: `Connection error: ${error3 instanceof Error ? error3.message : "Unknown error"}` };
  }
}
function generateTestEmailTemplate(fromEmail) {
  const timestamp = (/* @__PURE__ */ new Date()).toLocaleString();
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.8rem;">Email Test Successful!</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Your retreat portal email system is working perfectly</p>
      </div>

      <!-- Content -->
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #10b981; margin: 1rem 0;">
          <h3 style="margin: 0 0 1rem 0; color: #065f46;">System Status: All Good!</h3>
          <ul style="margin: 0; padding-left: 1.2rem; color: #374151;">
            <li>Email service connected successfully</li>
            <li>Authentication working properly</li>
            <li>Templates rendering correctly</li>
            <li>Ready for production use</li>
          </ul>
        </div>

        <h3 style="color: #1f2937; margin: 1.5rem 0 1rem 0;">What's Next?</h3>
        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 1rem 0;">
          Your retreat portal can now automatically send:
        </p>
        <ul style="color: #4b5563; line-height: 1.6; margin: 0 0 1.5rem 1.2rem;">
          <li><strong>Welcome emails</strong> with login details for new attendees</li>
          <li><strong>Urgent announcements</strong> directly to attendees' inboxes</li>
          <li><strong>Payment reminders</strong> for outstanding balances</li>
          <li><strong>Custom bulk emails</strong> to specific groups</li>
        </ul>

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem;">
          <div style="color: #6b7280; font-size: 0.875rem; text-align: center;">
            <p><strong>Sent:</strong> ${timestamp}</p>
            <p><strong>Service:</strong> Resend API</p>
            <p><strong>From:</strong> ${fromEmail}</p>
            <div style="margin-top: 1rem; padding: 0.5rem; background: #f3f4f6; border-radius: 6px;">
              <strong style="color: #374141;">Retreat Portal Email System</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
var testEmailSchema;
var init_test = __esm({
  "api/email/test.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_validation();
    init_errors();
    testEmailSchema = {
      testEmail: { validators: [validators.required, validators.email] }
    };
    __name(onRequestOptions30, "onRequestOptions");
    __name(onRequestPost16, "onRequestPost");
    __name(sendTestEmail, "sendTestEmail");
    __name(generateTestEmailTemplate, "generateTestEmailTemplate");
  }
});

// api/payments/bank-transfer.ts
async function onRequestOptions31() {
  return handleCORS();
}
async function onRequestPost17(context2) {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!auth) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const body = await context2.request.json();
    if (!body.payment_type || !["full", "installment"].includes(body.payment_type)) {
      return createErrorResponse(errors.badRequest("Invalid payment_type", requestId));
    }
    const { results } = await context2.env.DB.prepare(
      "SELECT id, name, payment_due, payment_option FROM attendees WHERE ref_number = ?"
    ).bind(auth.ref).all();
    if (results.length === 0) {
      return createErrorResponse(errors.notFound("Attendee", requestId));
    }
    const attendee = results[0];
    if (attendee.payment_due <= 0) {
      return createErrorResponse(errors.badRequest("No payment due", requestId));
    }
    const retreatName = context2.env.RETREAT_NAME || "Growth and Wisdom Retreat";
    let amount;
    let installmentNumber = null;
    let installmentTotal = null;
    let description;
    if (body.payment_type === "full") {
      amount = poundsToPence(attendee.payment_due);
      description = `${retreatName} - Bank Transfer (Full)`;
    } else {
      const count3 = body.installment_count || 3;
      installmentTotal = count3;
      const { results: scheduleRows } = await context2.env.DB.prepare(
        "SELECT * FROM installment_schedules WHERE attendee_id = ? AND status = ?"
      ).bind(attendee.id, "active").all();
      if (scheduleRows.length > 0) {
        const schedule = scheduleRows[0];
        installmentNumber = schedule.installments_paid + 1;
        installmentTotal = schedule.installment_count;
        amount = schedule.installment_amount;
      } else {
        const totalPence = poundsToPence(attendee.payment_due);
        const perInstallment = Math.ceil(totalPence / count3);
        installmentNumber = 1;
        const nextDue = /* @__PURE__ */ new Date();
        nextDue.setMonth(nextDue.getMonth() + 1);
        await context2.env.DB.prepare(`
          INSERT INTO installment_schedules (attendee_id, total_amount, installment_count, installment_amount, installments_paid, status, next_due_date)
          VALUES (?, ?, ?, ?, 0, 'active', ?)
        `).bind(attendee.id, totalPence, count3, perInstallment, nextDue.toISOString().split("T")[0]).run();
        amount = perInstallment;
      }
      description = `${retreatName} - Bank Transfer (Installment ${installmentNumber}/${installmentTotal})`;
    }
    await context2.env.DB.prepare(`
      INSERT INTO payments (attendee_id, amount, currency, status, payment_type, installment_number, installment_total, description)
      VALUES (?, ?, 'gbp', 'pending', ?, ?, ?, ?)
    `).bind(
      attendee.id,
      amount,
      body.payment_type,
      installmentNumber,
      installmentTotal,
      description
    ).run();
    return createResponse({
      message: "Bank transfer recorded. Your payment will be confirmed once we receive the funds.",
      amount,
      reference: `${auth.ref}-${Date.now()}`
    }, 201);
  } catch (error3) {
    console.error(`[${requestId}] Bank transfer error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_bank_transfer = __esm({
  "api/payments/bank-transfer.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    init_stripe();
    __name(onRequestOptions31, "onRequestOptions");
    __name(onRequestPost17, "onRequestPost");
  }
});

// api/payments/checkout.ts
async function onRequestOptions32() {
  return handleCORS();
}
async function onRequestPost18(context2) {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!auth) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const body = await context2.request.json();
    if (!body.payment_type || !["full", "installment"].includes(body.payment_type)) {
      return createErrorResponse(errors.badRequest('Invalid payment_type. Must be "full" or "installment"', requestId));
    }
    if (body.payment_type === "installment") {
      if (!body.installment_count || ![3, 4].includes(body.installment_count)) {
        return createErrorResponse(errors.badRequest("installment_count must be 3 or 4", requestId));
      }
    }
    const { results } = await context2.env.DB.prepare(`
      SELECT id, ref_number, name, email, payment_due, payment_option, stripe_customer_id
      FROM attendees WHERE ref_number = ?
    `).bind(auth.ref).all();
    if (results.length === 0) {
      return createErrorResponse(errors.notFound("Attendee", requestId));
    }
    const attendee = results[0];
    if (attendee.payment_due <= 0) {
      return createErrorResponse(errors.badRequest("No payment due", requestId));
    }
    const stripe = getStripe(context2.env);
    const portalUrl = context2.env.PORTAL_URL || "https://retreat.cloverleafchristiancentre.org";
    const retreatName = context2.env.RETREAT_NAME || "Growth and Wisdom Retreat";
    let customerId = attendee.stripe_customer_id;
    if (!customerId) {
      const customer = await createStripeCustomer(
        stripe,
        attendee.name,
        attendee.email || `${attendee.ref_number}@noemail.retreat`
      );
      customerId = customer.id;
      await context2.env.DB.prepare(
        "UPDATE attendees SET stripe_customer_id = ? WHERE id = ?"
      ).bind(customerId, attendee.id).run();
    }
    let amount;
    let description;
    let installmentNumber = null;
    let installmentTotal = null;
    if (body.payment_type === "full") {
      amount = poundsToPence(attendee.payment_due);
      description = `${retreatName} - Full Payment`;
    } else {
      const count3 = body.installment_count;
      installmentTotal = count3;
      const { results: scheduleRows } = await context2.env.DB.prepare(
        "SELECT * FROM installment_schedules WHERE attendee_id = ? AND status = ?"
      ).bind(attendee.id, "active").all();
      if (scheduleRows.length > 0) {
        const schedule = scheduleRows[0];
        installmentNumber = schedule.installments_paid + 1;
        installmentTotal = schedule.installment_count;
        amount = schedule.installment_amount;
      } else {
        const totalPence = poundsToPence(attendee.payment_due);
        const perInstallment = Math.ceil(totalPence / count3);
        installmentNumber = 1;
        const nextDue = /* @__PURE__ */ new Date();
        nextDue.setMonth(nextDue.getMonth() + 1);
        const nextDueStr = nextDue.toISOString().split("T")[0];
        await context2.env.DB.prepare(`
          INSERT INTO installment_schedules (attendee_id, total_amount, installment_count, installment_amount, installments_paid, status, next_due_date, stripe_customer_id)
          VALUES (?, ?, ?, ?, 0, 'active', ?, ?)
        `).bind(attendee.id, totalPence, count3, perInstallment, nextDueStr, customerId).run();
        amount = perInstallment;
      }
      description = `${retreatName} - Installment ${installmentNumber} of ${installmentTotal}`;
    }
    const session = await createCheckoutSession(stripe, {
      customerId,
      amount,
      description,
      successUrl: `${portalUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${portalUrl}?payment=cancelled`,
      metadata: {
        attendee_id: String(attendee.id),
        attendee_ref: attendee.ref_number,
        payment_type: body.payment_type,
        installment_number: String(installmentNumber || ""),
        installment_total: String(installmentTotal || "")
      }
    });
    await context2.env.DB.prepare(`
      INSERT INTO payments (attendee_id, stripe_checkout_session_id, stripe_customer_id, amount, currency, status, payment_type, installment_number, installment_total, description)
      VALUES (?, ?, ?, ?, 'gbp', 'pending', ?, ?, ?, ?)
    `).bind(
      attendee.id,
      session.id,
      customerId,
      amount,
      body.payment_type,
      installmentNumber,
      installmentTotal,
      description
    ).run();
    return createResponse({
      checkout_url: session.url,
      session_id: session.id,
      amount,
      description
    });
  } catch (error3) {
    console.error(`[${requestId}] Checkout error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_checkout = __esm({
  "api/payments/checkout.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    init_stripe();
    __name(onRequestOptions32, "onRequestOptions");
    __name(onRequestPost18, "onRequestPost");
  }
});

// api/payments/history.ts
async function onRequestOptions33() {
  return handleCORS();
}
async function onRequestGet21(context2) {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!auth) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const { results: attendeeRows } = await context2.env.DB.prepare(
      "SELECT id FROM attendees WHERE ref_number = ?"
    ).bind(auth.ref).all();
    if (attendeeRows.length === 0) {
      return createErrorResponse(errors.notFound("Attendee", requestId));
    }
    const attendeeId = attendeeRows[0].id;
    const { results: payments } = await context2.env.DB.prepare(`
      SELECT id, amount, currency, status, payment_type, installment_number, installment_total, description, paid_at, created_at
      FROM payments
      WHERE attendee_id = ?
      ORDER BY created_at DESC
    `).bind(attendeeId).all();
    const { results: schedules } = await context2.env.DB.prepare(`
      SELECT total_amount, installment_count, installment_amount, installments_paid, status, next_due_date
      FROM installment_schedules
      WHERE attendee_id = ?
    `).bind(attendeeId).all();
    return createResponse({
      payments,
      installment_schedule: schedules.length > 0 ? schedules[0] : null
    });
  } catch (error3) {
    console.error(`[${requestId}] Payment history error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_history = __esm({
  "api/payments/history.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    __name(onRequestOptions33, "onRequestOptions");
    __name(onRequestGet21, "onRequestGet");
  }
});

// api/payments/status.ts
async function onRequestOptions34() {
  return handleCORS();
}
async function onRequestGet22(context2) {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!auth) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const { results } = await context2.env.DB.prepare(`
      SELECT id, payment_due, payment_status, payment_option, stripe_customer_id
      FROM attendees WHERE ref_number = ?
    `).bind(auth.ref).all();
    if (results.length === 0) {
      return createErrorResponse(errors.notFound("Attendee", requestId));
    }
    const attendee = results[0];
    const { results: paidRows } = await context2.env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_paid
      FROM payments
      WHERE attendee_id = ? AND status = 'succeeded'
    `).bind(attendee.id).all();
    const totalPaid = paidRows[0].total_paid || 0;
    let installmentSchedule = null;
    if (attendee.payment_option === "installments") {
      const { results: schedules } = await context2.env.DB.prepare(`
        SELECT total_amount, installment_count, installment_amount, installments_paid, status, next_due_date
        FROM installment_schedules
        WHERE attendee_id = ?
      `).bind(attendee.id).all();
      if (schedules.length > 0) {
        installmentSchedule = schedules[0];
      }
    }
    return createResponse({
      payment_due: attendee.payment_due,
      payment_status: attendee.payment_status,
      payment_option: attendee.payment_option,
      total_paid_pence: totalPaid,
      has_stripe_customer: !!attendee.stripe_customer_id,
      installment_schedule: installmentSchedule
    });
  } catch (error3) {
    console.error(`[${requestId}] Payment status error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_status = __esm({
  "api/payments/status.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    __name(onRequestOptions34, "onRequestOptions");
    __name(onRequestGet22, "onRequestGet");
  }
});

// api/webhooks/stripe.ts
async function onRequestOptions35() {
  return new Response(null, { status: 204 });
}
async function onRequestPost19(context2) {
  const requestId = generateRequestId();
  try {
    const stripe = getStripe(context2.env);
    const webhookSecret = context2.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error(`[${requestId}] STRIPE_WEBHOOK_SECRET not configured`);
      return new Response("Webhook secret not configured", { status: 500 });
    }
    const signature = context2.request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }
    const rawBody = await context2.request.text();
    let event;
    try {
      event = await verifyWebhookEvent(stripe, rawBody, signature, webhookSecret);
    } catch (err) {
      console.error(`[${requestId}] Webhook signature verification failed:`, err);
      return new Response("Invalid signature", { status: 400 });
    }
    console.log(`[${requestId}] Stripe event: ${event.type} (${event.id})`);
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(context2, event.data.object, requestId);
        break;
      case "checkout.session.expired":
        await handleCheckoutExpired(context2, event.data.object, requestId);
        break;
      default:
        console.log(`[${requestId}] Unhandled event type: ${event.type}`);
    }
    return createResponse({ received: true });
  } catch (error3) {
    console.error(`[${requestId}] Webhook error:`, error3);
    return new Response("Webhook handler failed", { status: 500 });
  }
}
async function handleCheckoutCompleted(context2, session, requestId) {
  const metadata = session.metadata || {};
  const attendeeId = parseInt(metadata.attendee_id || "0");
  const paymentType = metadata.payment_type || "full";
  const installmentNumber = parseInt(metadata.installment_number || "0") || null;
  const installmentTotal = parseInt(metadata.installment_total || "0") || null;
  if (!attendeeId) {
    console.error(`[${requestId}] No attendee_id in session metadata`);
    return;
  }
  const amountTotal = session.amount_total || 0;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null;
  if (paymentIntentId) {
    const { results: existing } = await context2.env.DB.prepare(
      "SELECT id FROM payments WHERE stripe_payment_intent_id = ? AND status = ?"
    ).bind(paymentIntentId, "succeeded").all();
    if (existing.length > 0) {
      console.log(`[${requestId}] Payment already recorded for PI ${paymentIntentId}, skipping`);
      return;
    }
  }
  await context2.env.DB.prepare(`
    UPDATE payments
    SET status = 'succeeded',
        stripe_payment_intent_id = ?,
        paid_at = CURRENT_TIMESTAMP
    WHERE stripe_checkout_session_id = ? AND attendee_id = ?
  `).bind(paymentIntentId, session.id, attendeeId).run();
  const paidPounds = penceToPounds(amountTotal);
  const { results: attendeeRows } = await context2.env.DB.prepare(
    "SELECT payment_due FROM attendees WHERE id = ?"
  ).bind(attendeeId).all();
  if (attendeeRows.length > 0) {
    const currentDue = attendeeRows[0].payment_due || 0;
    const newDue = Math.max(0, currentDue - paidPounds);
    const newStatus = newDue <= 0 ? "paid" : "partial";
    await context2.env.DB.prepare(`
      UPDATE attendees SET payment_due = ?, payment_status = ? WHERE id = ?
    `).bind(newDue, newStatus, attendeeId).run();
    console.log(`[${requestId}] Attendee ${attendeeId}: payment_due ${currentDue} -> ${newDue}, status -> ${newStatus}`);
  }
  if (paymentType === "installment" && installmentNumber) {
    await context2.env.DB.prepare(`
      UPDATE installment_schedules
      SET installments_paid = ?,
          status = CASE WHEN ? >= installment_count THEN 'completed' ELSE 'active' END,
          next_due_date = CASE
            WHEN ? >= installment_count THEN NULL
            ELSE date(next_due_date, '+1 month')
          END
      WHERE attendee_id = ?
    `).bind(installmentNumber, installmentNumber, installmentNumber, attendeeId).run();
    console.log(`[${requestId}] Installment ${installmentNumber}/${installmentTotal} recorded for attendee ${attendeeId}`);
  }
  context2.waitUntil(sendPaymentConfirmationEmail(context2.env, attendeeId, amountTotal, paymentType, requestId));
}
async function handleCheckoutExpired(context2, session, requestId) {
  await context2.env.DB.prepare(`
    UPDATE payments SET status = 'cancelled' WHERE stripe_checkout_session_id = ? AND status = 'pending'
  `).bind(session.id).run();
  console.log(`[${requestId}] Checkout session ${session.id} expired, payment cancelled`);
}
async function sendPaymentConfirmationEmail(env2, attendeeId, amountPence, paymentType, requestId) {
  try {
    if (!env2.RESEND_API_KEY || !env2.FROM_EMAIL)
      return;
    const { results } = await env2.DB.prepare(
      "SELECT name, email FROM attendees WHERE id = ?"
    ).bind(attendeeId).all();
    if (results.length === 0 || !results[0].email)
      return;
    const attendee = results[0];
    const amount = (amountPence / 100).toFixed(2);
    const retreatName = env2.RETREAT_NAME || "Growth and Wisdom Retreat";
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env2.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env2.FROM_EMAIL,
        to: [attendee.email],
        subject: `Payment Confirmation - \xA3${amount} - ${retreatName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">Payment Confirmed</h1>
            </div>
            <div style="padding: 30px; background: #f8fafc; border-radius: 0 0 12px 12px;">
              <p>Dear ${attendee.name},</p>
              <p>We have received your payment of <strong>\xA3${amount}</strong> for the ${retreatName}.</p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                <p style="margin: 0;"><strong>Amount Paid:</strong> \xA3${amount}</p>
                <p style="margin: 5px 0 0;"><strong>Payment Type:</strong> ${paymentType === "installment" ? "Installment Payment" : "Full Payment"}</p>
              </div>
              ${paymentType === "installment" ? "<p>Your remaining installments will be due according to your payment schedule. You will receive a reminder before each payment is due.</p>" : ""}
              <p>Thank you for your payment!</p>
              <p style="color: #6b7280; font-size: 0.85rem;">\u2014 The ${retreatName} Team</p>
            </div>
          </div>
        `
      })
    });
    console.log(`[${requestId}] Payment confirmation email sent to ${attendee.email}`);
  } catch (error3) {
    console.error(`[${requestId}] Failed to send payment confirmation email:`, error3);
  }
}
var init_stripe2 = __esm({
  "api/webhooks/stripe.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    init_stripe();
    __name(onRequestOptions35, "onRequestOptions");
    __name(onRequestPost19, "onRequestPost");
    __name(handleCheckoutCompleted, "handleCheckoutCompleted");
    __name(handleCheckoutExpired, "handleCheckoutExpired");
    __name(sendPaymentConfirmationEmail, "sendPaymentConfirmationEmail");
  }
});

// api/announcements.ts
async function onRequestOptions36() {
  return handleCORS();
}
async function onRequestGet23(context2) {
  const requestId = generateRequestId();
  try {
    const attendee = await checkAttendeeAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!attendee) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const ref = attendee.ref;
    const { results: attendeeInfo } = await context2.env.DB.prepare(`
      SELECT
        a.group_id,
        g.name as group_name
      FROM attendees a
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.ref_number = ?
    `).bind(ref).all();
    const userGroupId = attendeeInfo[0]?.group_id;
    const userGroupName = attendeeInfo[0]?.group_name;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const { results } = await context2.env.DB.prepare(`
      SELECT
        id,
        title,
        content,
        type,
        priority,
        target_audience,
        target_groups,
        author_name,
        starts_at,
        expires_at,
        created_at
      FROM announcements
      WHERE
        is_active = 1
        AND (starts_at IS NULL OR starts_at <= ?)
        AND (expires_at IS NULL OR expires_at > ?)
        AND (
          target_audience = 'all'
          OR (target_audience = 'vip' AND ? IN (
            SELECT ref_number FROM attendees a
            JOIN groups g ON a.group_id = g.id
            WHERE g.name = 'VIP Group'
          ))
          OR (target_audience = 'groups' AND target_groups IS NOT NULL)
        )
      ORDER BY priority DESC, created_at DESC
    `).bind(now, now, ref).all();
    const relevantAnnouncements = results.filter((announcement) => {
      if (announcement.target_audience === "groups" && announcement.target_groups) {
        try {
          const targetGroups = JSON.parse(announcement.target_groups);
          return userGroupId && targetGroups.includes(userGroupId);
        } catch {
          return false;
        }
      }
      return true;
    });
    const nowTs = Date.now();
    const formattedAnnouncements = relevantAnnouncements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      author_name: announcement.author_name,
      created_at: announcement.created_at,
      starts_at: announcement.starts_at,
      expires_at: announcement.expires_at,
      is_new: isNewAnnouncement(announcement.created_at, nowTs)
    }));
    return createResponse({
      announcements: formattedAnnouncements,
      user_group: userGroupName || null,
      total_count: formattedAnnouncements.length
    });
  } catch (error3) {
    console.error(`[${requestId}] Error fetching announcements for attendee:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
function isNewAnnouncement(createdAt, nowTs) {
  const created = new Date(createdAt).getTime();
  const hoursDiff = (nowTs - created) / (1e3 * 60 * 60);
  return hoursDiff <= 24;
}
var init_announcements2 = __esm({
  "api/announcements.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    __name(onRequestOptions36, "onRequestOptions");
    __name(onRequestGet23, "onRequestGet");
    __name(isNewAnnouncement, "isNewAnnouncement");
  }
});

// api/login.ts
async function onRequestOptions37() {
  return handleCORS();
}
async function onRequestPost20(context2) {
  const requestId = generateRequestId();
  try {
    const body = await context2.request.json();
    const validation = validate(body, loginSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }
    const { ref, password } = body;
    const trimmedRef = ref.trim();
    const clientIP = context2.request.headers.get("CF-Connecting-IP") || context2.request.headers.get("X-Forwarded-For") || "unknown";
    const rateLimit = await checkRateLimit(context2.env.DB, trimmedRef, "attendee");
    if (!rateLimit.allowed) {
      return createErrorResponse(errors.rateLimited(Math.ceil((rateLimit.resetTime - Date.now()) / 1e3), requestId));
    }
    const { results } = await context2.env.DB.prepare(`
      SELECT id, ref_number, password_hash, name
      FROM attendees
      WHERE ref_number = ?
    `).bind(trimmedRef).all();
    if (!results.length) {
      await recordLoginAttempt(context2.env.DB, trimmedRef, "attendee", false, clientIP);
      return createErrorResponse(errors.unauthorized("Invalid credentials", requestId));
    }
    const attendee = results[0];
    const isValid = await verifyPassword(password, attendee.password_hash);
    if (!isValid) {
      await recordLoginAttempt(context2.env.DB, trimmedRef, "attendee", false, clientIP);
      return createErrorResponse(errors.unauthorized("Invalid credentials", requestId));
    }
    await recordLoginAttempt(context2.env.DB, trimmedRef, "attendee", true, clientIP);
    await clearRateLimit(context2.env.DB, trimmedRef, "attendee");
    if (needsPasswordUpgrade(attendee.password_hash)) {
      const newHash = await hashPassword(password);
      await context2.env.DB.prepare(`
        UPDATE attendees SET password_hash = ? WHERE id = ?
      `).bind(newHash, attendee.id).run();
    }
    await context2.env.DB.prepare(`
      INSERT INTO login_history (user_type, user_id, login_time)
      VALUES ('attendee', ?, CURRENT_TIMESTAMP)
    `).bind(trimmedRef).run();
    await context2.env.DB.prepare(`
      UPDATE attendees SET last_login = CURRENT_TIMESTAMP
      WHERE ref_number = ?
    `).bind(trimmedRef).run();
    const token = await generateAttendeeToken(trimmedRef, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    return createResponse({ token });
  } catch (error3) {
    console.error(`[${requestId}] Error in attendee login:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_login2 = __esm({
  "api/login.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_validation();
    init_errors();
    __name(onRequestOptions37, "onRequestOptions");
    __name(onRequestPost20, "onRequestPost");
  }
});

// api/me.ts
async function onRequestOptions38() {
  return handleCORS();
}
async function onRequestGet24(context2) {
  const requestId = generateRequestId();
  try {
    const attendee = await checkAttendeeAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!attendee) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const ref = attendee.ref;
    const { results } = await context2.env.DB.prepare(`
      SELECT
        a.id,
        a.ref_number,
        a.name,
        a.email,
        a.phone,
        a.emergency_contact,
        a.dietary_requirements,
        a.special_requests,
        a.payment_due,
        a.payment_option,
        a.payment_status,
        r.number AS room_number,
        r.description AS room_description,
        g.name AS group_name,
        a.group_id
      FROM attendees a
      LEFT JOIN rooms r ON a.room_id = r.id
      LEFT JOIN groups g ON a.group_id = g.id
      WHERE a.ref_number = ?
    `).bind(ref).all();
    if (!results.length) {
      return createErrorResponse(errors.notFound("Attendee", requestId));
    }
    const attendeeData = results[0];
    let members = [];
    let groupFinancial = null;
    if (attendeeData.group_id) {
      const { results: memberResults } = await context2.env.DB.prepare(`
        SELECT name, ref_number, payment_due, email
        FROM attendees
        WHERE group_id = ? AND ref_number != ?
        ORDER BY name
      `).bind(attendeeData.group_id, ref).all();
      members = memberResults.map((member) => ({
        name: member.name,
        ref_number: member.ref_number,
        payment_due: member.payment_due || 0,
        email: member.email
      }));
      const allMembers = [
        ...members,
        { name: attendeeData.name, payment_due: attendeeData.payment_due || 0 }
      ];
      const totalOutstanding = allMembers.reduce((sum, member) => sum + (member.payment_due || 0), 0);
      const membersWithPayments = allMembers.filter((m) => (m.payment_due || 0) > 0).length;
      groupFinancial = {
        totalOutstanding,
        membersWithPayments,
        totalMembers: allMembers.length
      };
    }
    const announcements = await getAttendeeAnnouncements(context2.env.DB, ref, attendeeData.group_id, attendeeData.group_name);
    let familyRegistration = null;
    if (attendeeData.email) {
      const { results: regRows } = await context2.env.DB.prepare(`
        SELECT family_members, total_amount, member_count, payment_option, submitted_at
        FROM registrations
        WHERE email = ? AND status = 'approved'
        ORDER BY submitted_at DESC
        LIMIT 1
      `).bind(attendeeData.email).all();
      if (regRows.length > 0) {
        const reg = regRows[0];
        let parsedMembers = [];
        try {
          if (reg.family_members) {
            parsedMembers = JSON.parse(reg.family_members);
          }
        } catch {
        }
        familyRegistration = {
          total_amount: reg.total_amount || 0,
          member_count: reg.member_count || 1,
          payment_option: reg.payment_option || "full",
          family_members: parsedMembers,
          submitted_at: reg.submitted_at
        };
      }
    }
    const { results: teamRows } = await context2.env.DB.prepare(`
      SELECT t.id, t.name, t.description, t.leader_id, leader.name AS leader_name
      FROM activity_team_members m
      JOIN activity_teams t ON m.team_id = t.id
      LEFT JOIN attendees leader ON t.leader_id = leader.id
      WHERE m.attendee_id = ?
    `).bind(attendeeData.id).all();
    let activityTeams = [];
    for (const row of teamRows) {
      const { results: teamMembers } = await context2.env.DB.prepare(`
        SELECT a.name FROM activity_team_members m JOIN attendees a ON m.attendee_id = a.id WHERE m.team_id = ? ORDER BY a.name
      `).bind(row.id).all();
      activityTeams.push({
        name: row.name,
        description: row.description,
        leader_name: row.leader_name,
        is_leader: row.leader_id === attendeeData.id,
        members: teamMembers.map((m) => m.name)
      });
    }
    const response = {
      ref_number: ref,
      name: attendeeData.name,
      email: attendeeData.email,
      phone: attendeeData.phone,
      emergency_contact: attendeeData.emergency_contact,
      dietary_requirements: attendeeData.dietary_requirements,
      special_requests: attendeeData.special_requests,
      payment_due: attendeeData.payment_due || 0,
      payment_option: attendeeData.payment_option || "full",
      payment_status: attendeeData.payment_status || "pending",
      room: attendeeData.room_number ? {
        number: attendeeData.room_number,
        description: attendeeData.room_description || ""
      } : null,
      group: attendeeData.group_name ? {
        name: attendeeData.group_name,
        members,
        financial: groupFinancial
      } : null,
      activity_teams: activityTeams,
      family_registration: familyRegistration,
      announcements
    };
    return createResponse(response);
  } catch (error3) {
    console.error(`[${requestId}] Error in /api/me:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function getAttendeeAnnouncements(db, _ref, groupId, groupName) {
  try {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const { results } = await db.prepare(`
      SELECT
        id,
        title,
        content,
        type,
        priority,
        target_audience,
        target_groups,
        author_name,
        starts_at,
        expires_at,
        created_at
      FROM announcements
      WHERE
        is_active = 1
        AND (starts_at IS NULL OR starts_at <= ?)
        AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY priority DESC, created_at DESC
      LIMIT 10
    `).bind(now, now).all();
    const relevantAnnouncements = results.filter((announcement) => {
      if (announcement.target_audience === "all") {
        return true;
      }
      if (announcement.target_audience === "vip") {
        return groupName === "VIP Group";
      }
      if (announcement.target_audience === "groups" && announcement.target_groups && groupId) {
        try {
          const targetGroups = JSON.parse(announcement.target_groups);
          return targetGroups.includes(groupId);
        } catch {
          return false;
        }
      }
      return false;
    });
    const nowTs = Date.now();
    return relevantAnnouncements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      author_name: announcement.author_name,
      created_at: announcement.created_at,
      starts_at: announcement.starts_at,
      expires_at: announcement.expires_at,
      is_new: isNewAnnouncement2(announcement.created_at, nowTs),
      type_badge: getTypeBadge(announcement.type),
      priority_badge: getPriorityBadge(announcement.priority)
    }));
  } catch (error3) {
    console.error("Error fetching attendee announcements:", error3);
    return [];
  }
}
function isNewAnnouncement2(createdAt, nowTs) {
  const created = new Date(createdAt).getTime();
  const hoursDiff = (nowTs - created) / (1e3 * 60 * 60);
  return hoursDiff <= 24;
}
function getTypeBadge(type) {
  const badges = {
    "general": { text: "General", class: "badge-secondary", icon: "fas fa-info-circle" },
    "urgent": { text: "Urgent", class: "badge-warning", icon: "fas fa-exclamation-triangle" },
    "event": { text: "Event", class: "badge-primary", icon: "fas fa-calendar" },
    "reminder": { text: "Reminder", class: "badge-success", icon: "fas fa-clock" }
  };
  return badges[type] || badges["general"];
}
function getPriorityBadge(priority) {
  if (priority >= 4) {
    return { text: "High Priority", class: "badge-warning", icon: "fas fa-exclamation" };
  } else if (priority >= 3) {
    return { text: "Normal", class: "badge-secondary", icon: "fas fa-info" };
  } else {
    return { text: "Low Priority", class: "badge-secondary", icon: "fas fa-info" };
  }
}
var init_me = __esm({
  "api/me.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    __name(onRequestOptions38, "onRequestOptions");
    __name(onRequestGet24, "onRequestGet");
    __name(getAttendeeAnnouncements, "getAttendeeAnnouncements");
    __name(isNewAnnouncement2, "isNewAnnouncement");
    __name(getTypeBadge, "getTypeBadge");
    __name(getPriorityBadge, "getPriorityBadge");
  }
});

// api/profile.ts
async function onRequestOptions39() {
  return handleCORS();
}
async function onRequestPut8(context2) {
  const requestId = generateRequestId();
  try {
    const auth = await checkAttendeeAuth(context2.request, context2.env.JWT_SECRET || context2.env.ADMIN_JWT_SECRET);
    if (!auth) {
      return createErrorResponse(errors.unauthorized("Invalid or expired token", requestId));
    }
    const body = await context2.request.json();
    const allowedFields = ["phone", "emergency_contact", "dietary_requirements", "special_requests"];
    const updates = [];
    const values = [];
    for (const field of allowedFields) {
      if (body[field] !== void 0) {
        updates.push(`${field} = ?`);
        values.push(typeof body[field] === "string" ? body[field].trim() || null : null);
      }
    }
    if (updates.length === 0) {
      return createErrorResponse(errors.badRequest("No valid fields to update", requestId));
    }
    values.push(auth.ref);
    await context2.env.DB.prepare(
      `UPDATE attendees SET ${updates.join(", ")} WHERE ref_number = ?`
    ).bind(...values).run();
    return createResponse({ message: "Profile updated successfully" });
  } catch (error3) {
    console.error(`[${requestId}] Profile update error:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
var init_profile = __esm({
  "api/profile.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    __name(onRequestOptions39, "onRequestOptions");
    __name(onRequestPut8, "onRequestPut");
  }
});

// api/register.ts
async function onRequestOptions40() {
  return handleCORS();
}
async function onRequestGet25(context2) {
  const requestId = generateRequestId();
  try {
    const roomTypes = ["family", "single", "double", "suite", "standard"];
    return createResponse({
      roomTypes,
      pricing: {
        adult: { price: PRICING.adult, description: "Adults (17+ years)" },
        child: { price: PRICING.child, description: "Children (6-16 years)" },
        infant: { price: PRICING.infant, description: "Under 6 years (FREE)" }
      },
      message: "Registration is open. Please fill out the form to register your family."
    });
  } catch (error3) {
    console.error(`[${requestId}] Error fetching registration info:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
async function onRequestPost21(context2) {
  const requestId = generateRequestId();
  try {
    const body = await context2.request.json();
    const validationErrors = validateRegistration(body);
    if (validationErrors.length > 0) {
      return createErrorResponse(errors.validation(
        validationErrors.reduce((acc, err) => ({ ...acc, [err.field]: err.message }), {}),
        requestId
      ));
    }
    const data = body;
    const { results: existing } = await context2.env.DB.prepare(`
      SELECT id, status FROM registrations
      WHERE email = ? AND status IN ('pending', 'approved')
    `).bind(data.email.trim().toLowerCase()).all();
    if (existing.length > 0) {
      const reg = existing[0];
      if (reg.status === "approved") {
        return createErrorResponse(errors.conflict(
          "This email has already been registered and approved.",
          requestId
        ));
      }
      return createErrorResponse(errors.conflict(
        "A registration with this email is already pending review.",
        requestId
      ));
    }
    const { results: existingAttendee } = await context2.env.DB.prepare(`
      SELECT id FROM attendees WHERE email = ?
    `).bind(data.email.trim().toLowerCase()).all();
    if (existingAttendee.length > 0) {
      return createErrorResponse(errors.conflict(
        "This email is already registered as an attendee. Please login instead.",
        requestId
      ));
    }
    const calculatedTotal = calculateTotal(data.members);
    const primaryMember = data.members[0];
    const result = await context2.env.DB.prepare(`
      INSERT INTO registrations (
        name, email, phone, emergency_contact,
        dietary_requirements, special_requests,
        preferred_room_type, payment_option, status,
        family_members, total_amount, member_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).bind(
      primaryMember.name.trim(),
      data.email.trim().toLowerCase(),
      data.phone.trim(),
      data.emergency_contact?.trim() || null,
      data.members.map((m) => m.dietary_requirements).filter(Boolean).join("; ") || null,
      data.special_requests?.trim() || null,
      data.preferred_room_type || "family",
      data.payment_option,
      JSON.stringify(data.members),
      calculatedTotal,
      data.members.length
    ).run();
    if (!result.success) {
      throw new Error("Failed to submit registration");
    }
    const emailPromise = sendRegistrationNotification(context2.env, data, result.meta.last_row_id).catch((err) => console.error(`[${requestId}] Failed to send notification email:`, err));
    context2.waitUntil(emailPromise);
    return createResponse({
      success: true,
      registrationId: result.meta.last_row_id,
      totalAmount: calculatedTotal,
      memberCount: data.members.length,
      message: "Registration submitted successfully! You will receive an email once your registration is reviewed."
    }, 201);
  } catch (error3) {
    console.error(`[${requestId}] Error submitting registration:`, error3);
    return createErrorResponse(handleError(error3, requestId));
  }
}
function validateRegistration(body) {
  const validationErrors = [];
  if (!Array.isArray(body.members) || body.members.length === 0) {
    validationErrors.push({ field: "members", message: "At least one family member is required" });
  } else {
    body.members.forEach((member, index) => {
      if (!member.name || typeof member.name !== "string" || !member.name.trim()) {
        validationErrors.push({ field: `members[${index}].name`, message: `Member ${index + 1}: Name is required` });
      }
      if (!member.date_of_birth || typeof member.date_of_birth !== "string") {
        validationErrors.push({ field: `members[${index}].date_of_birth`, message: `Member ${index + 1}: Date of birth is required` });
      }
    });
  }
  if (!body.email || typeof body.email !== "string" || !body.email.trim()) {
    validationErrors.push({ field: "email", message: "Email is required" });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    validationErrors.push({ field: "email", message: "Invalid email format" });
  }
  if (!body.phone || typeof body.phone !== "string" || !body.phone.trim()) {
    validationErrors.push({ field: "phone", message: "Phone number is required" });
  }
  const validPaymentOptions = ["full", "installments", "sponsorship"];
  if (!body.payment_option || !validPaymentOptions.includes(body.payment_option)) {
    validationErrors.push({ field: "payment_option", message: "Please select a valid payment option" });
  }
  return validationErrors;
}
function calculateTotal(members) {
  return members.reduce((total, member) => {
    if (member.member_type === "adult")
      return total + PRICING.adult;
    if (member.member_type === "child")
      return total + PRICING.child;
    return total;
  }, 0);
}
function calculateAge(dob) {
  const today = /* @__PURE__ */ new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || monthDiff === 0 && today.getDate() < birthDate.getDate()) {
    age--;
  }
  return age;
}
function getMemberTypeLabel(type, dob) {
  const age = calculateAge(dob);
  if (type === "adult")
    return "Adult";
  if (type === "child")
    return `Child (${age} yrs)`;
  return `Under 6 (${age} yrs)`;
}
async function sendRegistrationNotification(env2, data, registrationId) {
  if (!env2.RESEND_API_KEY || !env2.FROM_EMAIL) {
    console.warn("Email service not configured - skipping notification");
    return;
  }
  const paymentOptionLabels = {
    full: "Pay in Full",
    installments: "Pay in Installments",
    sponsorship: "Requires Sponsorship"
  };
  const roomTypeLabels = {
    family: "Family Room",
    standard: "Standard Room",
    single: "Single Room",
    double: "Double Room",
    suite: "Suite"
  };
  const currentDate = (/* @__PURE__ */ new Date()).toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short"
  });
  const paymentLabel = paymentOptionLabels[data.payment_option] || data.payment_option;
  const roomLabel = roomTypeLabels[data.preferred_room_type || "family"] || data.preferred_room_type;
  const totalAmount = calculateTotal(data.members);
  const primaryMember = data.members[0];
  const adultCount = data.members.filter((m) => m.member_type === "adult").length;
  const childCount = data.members.filter((m) => m.member_type === "child").length;
  const infantCount = data.members.filter((m) => m.member_type === "infant").length;
  const isSponsorshipRequest = data.payment_option === "sponsorship";
  const headerColor = isSponsorshipRequest ? "background: linear-gradient(135deg, #d97706 0%, #b45309 100%);" : "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);";
  const subjectPrefix = isSponsorshipRequest ? "\u{1F514} [SPONSORSHIP] " : "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466} ";
  const membersTableRows = data.members.map((member, index) => `
    <tr>
      <td style="padding: 0.75rem; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-weight: ${index === 0 ? "bold" : "normal"};">
        ${member.name}${index === 0 ? ' <span style="color: #f59e0b; font-size: 0.8rem;">(Primary)</span>' : ""}
      </td>
      <td style="padding: 0.75rem; border-bottom: 1px solid #f3f4f6; color: #6b7280;">${getMemberTypeLabel(member.member_type, member.date_of_birth)}</td>
      <td style="padding: 0.75rem; border-bottom: 1px solid #f3f4f6; color: #1f2937; text-align: right;">
        ${member.price === 0 ? '<span style="color: #10b981;">FREE</span>' : `\xA3${member.price}`}
      </td>
    </tr>
    ${member.dietary_requirements || member.special_needs ? `
    <tr>
      <td colspan="3" style="padding: 0.5rem 0.75rem 0.75rem; border-bottom: 1px solid #f3f4f6; background: #f9fafb;">
        ${member.dietary_requirements ? `<span style="font-size: 0.85rem; color: #6b7280;"><strong>Diet:</strong> ${member.dietary_requirements}</span>` : ""}
        ${member.dietary_requirements && member.special_needs ? " | " : ""}
        ${member.special_needs ? `<span style="font-size: 0.85rem; color: #6b7280;"><strong>Special:</strong> ${member.special_needs}</span>` : ""}
      </td>
    </tr>
    ` : ""}
  `).join("");
  const emailHtml = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 650px; margin: 0 auto; background: #f8fafc; padding: 2rem;">
      <!-- Header -->
      <div style="${headerColor} color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.5rem;">New Family Registration</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Growth and Wisdom Retreat</p>
      </div>

      <!-- Content -->
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

        ${isSponsorshipRequest ? `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <strong style="color: #92400e;">\u26A0\uFE0F Sponsorship Request</strong>
          <p style="color: #b45309; margin: 0.5rem 0 0 0; font-size: 0.9rem;">This family has requested sponsorship assistance for ${data.members.length} member${data.members.length > 1 ? "s" : ""}.</p>
        </div>
        ` : ""}

        <!-- Summary Box -->
        <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%); border: 1px solid rgba(102, 126, 234, 0.2); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <table style="width: 100%;">
            <tr>
              <td style="text-align: center; padding: 0.5rem;">
                <div style="font-size: 0.8rem; color: #6b7280;">Registration ID</div>
                <div style="font-weight: bold; color: #1f2937;">#${registrationId}</div>
              </td>
              <td style="text-align: center; padding: 0.5rem;">
                <div style="font-size: 0.8rem; color: #6b7280;">Family Members</div>
                <div style="font-weight: bold; color: #1f2937;">${data.members.length}</div>
              </td>
              <td style="text-align: center; padding: 0.5rem;">
                <div style="font-size: 0.8rem; color: #6b7280;">Total Amount</div>
                <div style="font-weight: bold; color: ${isSponsorshipRequest ? "#d97706" : "#667eea"}; font-size: 1.2rem;">\xA3${totalAmount}</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Family Members -->
        <h2 style="color: #1f2937; margin: 0 0 1rem 0; font-size: 1.1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
          \u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466} Family Members
        </h2>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 0.75rem; text-align: left; color: #6b7280; font-size: 0.85rem;">Name</th>
              <th style="padding: 0.75rem; text-align: left; color: #6b7280; font-size: 0.85rem;">Type</th>
              <th style="padding: 0.75rem; text-align: right; color: #6b7280; font-size: 0.85rem;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${membersTableRows}
          </tbody>
          <tfoot>
            <tr style="background: #f3f4f6;">
              <td colspan="2" style="padding: 0.75rem; font-weight: bold; color: #1f2937;">Total</td>
              <td style="padding: 0.75rem; font-weight: bold; color: #667eea; text-align: right; font-size: 1.1rem;">\xA3${totalAmount}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Breakdown -->
        <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem;">
          <div style="color: #6b7280;">
            ${adultCount > 0 ? `<span style="margin-right: 1rem;"><strong>${adultCount}</strong> Adult${adultCount > 1 ? "s" : ""} \xD7 \xA3200 = \xA3${adultCount * 200}</span>` : ""}
            ${childCount > 0 ? `<span style="margin-right: 1rem;"><strong>${childCount}</strong> Child${childCount > 1 ? "ren" : ""} \xD7 \xA360 = \xA3${childCount * 60}</span>` : ""}
            ${infantCount > 0 ? `<span><strong>${infantCount}</strong> Under 6 = FREE</span>` : ""}
          </div>
        </div>

        <!-- Contact Details -->
        <h2 style="color: #1f2937; margin: 0 0 1rem 0; font-size: 1.1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">
          \u{1F4E7} Contact Details
        </h2>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
          <tr>
            <td style="padding: 0.5rem 0; color: #6b7280; width: 35%;">Email</td>
            <td style="padding: 0.5rem 0; color: #1f2937;">${data.email}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #6b7280;">Phone</td>
            <td style="padding: 0.5rem 0; color: #1f2937;">${data.phone}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #6b7280;">Emergency Contact</td>
            <td style="padding: 0.5rem 0; color: #1f2937;">${data.emergency_contact || "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #6b7280;">Room Preference</td>
            <td style="padding: 0.5rem 0; color: #1f2937;">${roomLabel}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #6b7280;">Payment Option</td>
            <td style="padding: 0.5rem 0; color: ${isSponsorshipRequest ? "#d97706" : "#1f2937"}; font-weight: ${isSponsorshipRequest ? "bold" : "normal"};">${paymentLabel}</td>
          </tr>
          ${data.special_requests ? `
          <tr>
            <td style="padding: 0.5rem 0; color: #6b7280; vertical-align: top;">Special Requests</td>
            <td style="padding: 0.5rem 0; color: #1f2937;">${data.special_requests}</td>
          </tr>
          ` : ""}
        </table>

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 1rem; text-align: center;">
          <p style="color: #6b7280; font-size: 0.9rem; margin: 0;">Submitted on ${currentDate}</p>
          <p style="color: #9ca3af; font-size: 0.8rem; margin: 0.5rem 0 0 0;">
            Please review this registration in the admin portal.
          </p>
        </div>
      </div>
    </div>
  `;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env2.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env2.FROM_EMAIL,
      to: [ADMIN_NOTIFICATION_EMAIL],
      subject: `${subjectPrefix}Family Registration: ${primaryMember.name} (${data.members.length} members, \xA3${totalAmount})`,
      html: emailHtml
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send notification email: ${errorText}`);
  }
}
var ADMIN_NOTIFICATION_EMAIL, PRICING;
var init_register = __esm({
  "api/register.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_auth();
    init_errors();
    ADMIN_NOTIFICATION_EMAIL = "samuel.odekunle@cloverleafworld.org";
    PRICING = {
      adult: 200,
      // 17+ years
      child: 60,
      // 6-16 years
      infant: 0
      // Under 6
    };
    __name(onRequestOptions40, "onRequestOptions");
    __name(onRequestGet25, "onRequestGet");
    __name(onRequestPost21, "onRequestPost");
    __name(validateRegistration, "validateRegistration");
    __name(calculateTotal, "calculateTotal");
    __name(calculateAge, "calculateAge");
    __name(getMemberTypeLabel, "getMemberTypeLabel");
    __name(sendRegistrationNotification, "sendRegistrationNotification");
  }
});

// _middleware.ts
async function onRequest(context2) {
  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  context2.data = context2.data || {};
  context2.data.requestId = requestId;
  try {
    const response = await context2.next();
    const newHeaders = new Headers(response.headers);
    newHeaders.set("X-Request-ID", requestId);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  } catch (error3) {
    console.error(`[${requestId}] Unhandled error in middleware:`, error3);
    return new Response(JSON.stringify({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      details: {
        requestId
      }
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
}
var init_middleware = __esm({
  "_middleware.ts"() {
    "use strict";
    init_functionsRoutes_0_7445773257736559();
    init_strip_cf_connecting_ip_header();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(onRequest, "onRequest");
  }
});

// ../.wrangler/tmp/pages-B79zuF/functionsRoutes-0.7445773257736559.mjs
var routes;
var init_functionsRoutes_0_7445773257736559 = __esm({
  "../.wrangler/tmp/pages-B79zuF/functionsRoutes-0.7445773257736559.mjs"() {
    "use strict";
    init_email();
    init_email();
    init_individual();
    init_individual();
    init_notifications();
    init_notifications();
    init_send();
    init_send();
    init_auto_create();
    init_auto_create();
    init_send_installment_reminders();
    init_send_installment_reminders();
    init_send_payment_reminders();
    init_send_payment_reminders();
    init_summary();
    init_summary();
    init_analytics();
    init_analytics();
    init_login_history();
    init_login_history();
    init_id();
    init_id();
    init_id();
    init_id();
    init_id2();
    init_id2();
    init_id2();
    init_id2();
    init_id3();
    init_id3();
    init_id3();
    init_id3();
    init_id4();
    init_id4();
    init_id4();
    init_id4();
    init_id5();
    init_id5();
    init_id5();
    init_id6();
    init_id6();
    init_id6();
    init_id6();
    init_id7();
    init_id7();
    init_id7();
    init_id7();
    init_activity_teams();
    init_activity_teams();
    init_activity_teams();
    init_announcements();
    init_announcements();
    init_announcements();
    init_attendees();
    init_attendees();
    init_attendees();
    init_audit_log();
    init_audit_log();
    init_bulk_actions();
    init_bulk_actions();
    init_check_in();
    init_check_in();
    init_check_in();
    init_export();
    init_export();
    init_groups();
    init_groups();
    init_groups();
    init_login();
    init_login();
    init_payments();
    init_payments();
    init_registrations();
    init_registrations();
    init_rooms();
    init_rooms();
    init_rooms();
    init_test();
    init_test();
    init_bank_transfer();
    init_bank_transfer();
    init_checkout();
    init_checkout();
    init_history();
    init_history();
    init_status();
    init_status();
    init_stripe2();
    init_stripe2();
    init_announcements2();
    init_announcements2();
    init_login2();
    init_login2();
    init_me();
    init_me();
    init_profile();
    init_profile();
    init_register();
    init_register();
    init_register();
    init_middleware();
    routes = [
      {
        routePath: "/api/admin/announcements/:id/email",
        mountPath: "/api/admin/announcements/:id",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions]
      },
      {
        routePath: "/api/admin/announcements/:id/email",
        mountPath: "/api/admin/announcements/:id",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost]
      },
      {
        routePath: "/api/admin/email/individual",
        mountPath: "/api/admin/email",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions2]
      },
      {
        routePath: "/api/admin/email/individual",
        mountPath: "/api/admin/email",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost2]
      },
      {
        routePath: "/api/admin/email/notifications",
        mountPath: "/api/admin/email",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions3]
      },
      {
        routePath: "/api/admin/email/notifications",
        mountPath: "/api/admin/email",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost3]
      },
      {
        routePath: "/api/admin/email/send",
        mountPath: "/api/admin/email",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions4]
      },
      {
        routePath: "/api/admin/email/send",
        mountPath: "/api/admin/email",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost4]
      },
      {
        routePath: "/api/admin/groups/auto-create",
        mountPath: "/api/admin/groups",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions5]
      },
      {
        routePath: "/api/admin/groups/auto-create",
        mountPath: "/api/admin/groups",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost5]
      },
      {
        routePath: "/api/admin/payments/send-installment-reminders",
        mountPath: "/api/admin/payments",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions6]
      },
      {
        routePath: "/api/admin/payments/send-installment-reminders",
        mountPath: "/api/admin/payments",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost6]
      },
      {
        routePath: "/api/admin/payments/send-payment-reminders",
        mountPath: "/api/admin/payments",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions7]
      },
      {
        routePath: "/api/admin/payments/send-payment-reminders",
        mountPath: "/api/admin/payments",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost7]
      },
      {
        routePath: "/api/admin/payments/summary",
        mountPath: "/api/admin/payments",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet]
      },
      {
        routePath: "/api/admin/payments/summary",
        mountPath: "/api/admin/payments",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions8]
      },
      {
        routePath: "/api/admin/reports/analytics",
        mountPath: "/api/admin/reports",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet2]
      },
      {
        routePath: "/api/admin/reports/analytics",
        mountPath: "/api/admin/reports",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions9]
      },
      {
        routePath: "/api/admin/reports/login-history",
        mountPath: "/api/admin/reports",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet3]
      },
      {
        routePath: "/api/admin/reports/login-history",
        mountPath: "/api/admin/reports",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions10]
      },
      {
        routePath: "/api/admin/activity-teams/:id",
        mountPath: "/api/admin/activity-teams",
        method: "DELETE",
        middlewares: [],
        modules: [onRequestDelete]
      },
      {
        routePath: "/api/admin/activity-teams/:id",
        mountPath: "/api/admin/activity-teams",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet5]
      },
      {
        routePath: "/api/admin/activity-teams/:id",
        mountPath: "/api/admin/activity-teams",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions12]
      },
      {
        routePath: "/api/admin/activity-teams/:id",
        mountPath: "/api/admin/activity-teams",
        method: "PUT",
        middlewares: [],
        modules: [onRequestPut]
      },
      {
        routePath: "/api/admin/announcements/:id",
        mountPath: "/api/admin/announcements",
        method: "DELETE",
        middlewares: [],
        modules: [onRequestDelete2]
      },
      {
        routePath: "/api/admin/announcements/:id",
        mountPath: "/api/admin/announcements",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet6]
      },
      {
        routePath: "/api/admin/announcements/:id",
        mountPath: "/api/admin/announcements",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions13]
      },
      {
        routePath: "/api/admin/announcements/:id",
        mountPath: "/api/admin/announcements",
        method: "PUT",
        middlewares: [],
        modules: [onRequestPut2]
      },
      {
        routePath: "/api/admin/attendees/:id",
        mountPath: "/api/admin/attendees",
        method: "DELETE",
        middlewares: [],
        modules: [onRequestDelete3]
      },
      {
        routePath: "/api/admin/attendees/:id",
        mountPath: "/api/admin/attendees",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet7]
      },
      {
        routePath: "/api/admin/attendees/:id",
        mountPath: "/api/admin/attendees",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions14]
      },
      {
        routePath: "/api/admin/attendees/:id",
        mountPath: "/api/admin/attendees",
        method: "PUT",
        middlewares: [],
        modules: [onRequestPut3]
      },
      {
        routePath: "/api/admin/groups/:id",
        mountPath: "/api/admin/groups",
        method: "DELETE",
        middlewares: [],
        modules: [onRequestDelete4]
      },
      {
        routePath: "/api/admin/groups/:id",
        mountPath: "/api/admin/groups",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet8]
      },
      {
        routePath: "/api/admin/groups/:id",
        mountPath: "/api/admin/groups",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions15]
      },
      {
        routePath: "/api/admin/groups/:id",
        mountPath: "/api/admin/groups",
        method: "PUT",
        middlewares: [],
        modules: [onRequestPut4]
      },
      {
        routePath: "/api/admin/payments/:id",
        mountPath: "/api/admin/payments",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet9]
      },
      {
        routePath: "/api/admin/payments/:id",
        mountPath: "/api/admin/payments",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions16]
      },
      {
        routePath: "/api/admin/payments/:id",
        mountPath: "/api/admin/payments",
        method: "PUT",
        middlewares: [],
        modules: [onRequestPut5]
      },
      {
        routePath: "/api/admin/registrations/:id",
        mountPath: "/api/admin/registrations",
        method: "DELETE",
        middlewares: [],
        modules: [onRequestDelete5]
      },
      {
        routePath: "/api/admin/registrations/:id",
        mountPath: "/api/admin/registrations",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet10]
      },
      {
        routePath: "/api/admin/registrations/:id",
        mountPath: "/api/admin/registrations",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions17]
      },
      {
        routePath: "/api/admin/registrations/:id",
        mountPath: "/api/admin/registrations",
        method: "PUT",
        middlewares: [],
        modules: [onRequestPut6]
      },
      {
        routePath: "/api/admin/rooms/:id",
        mountPath: "/api/admin/rooms",
        method: "DELETE",
        middlewares: [],
        modules: [onRequestDelete6]
      },
      {
        routePath: "/api/admin/rooms/:id",
        mountPath: "/api/admin/rooms",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet11]
      },
      {
        routePath: "/api/admin/rooms/:id",
        mountPath: "/api/admin/rooms",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions18]
      },
      {
        routePath: "/api/admin/rooms/:id",
        mountPath: "/api/admin/rooms",
        method: "PUT",
        middlewares: [],
        modules: [onRequestPut7]
      },
      {
        routePath: "/api/admin/activity-teams",
        mountPath: "/api/admin/activity-teams",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet4]
      },
      {
        routePath: "/api/admin/activity-teams",
        mountPath: "/api/admin/activity-teams",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions11]
      },
      {
        routePath: "/api/admin/activity-teams",
        mountPath: "/api/admin/activity-teams",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost8]
      },
      {
        routePath: "/api/admin/announcements",
        mountPath: "/api/admin/announcements",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet12]
      },
      {
        routePath: "/api/admin/announcements",
        mountPath: "/api/admin/announcements",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions19]
      },
      {
        routePath: "/api/admin/announcements",
        mountPath: "/api/admin/announcements",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost9]
      },
      {
        routePath: "/api/admin/attendees",
        mountPath: "/api/admin/attendees",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet13]
      },
      {
        routePath: "/api/admin/attendees",
        mountPath: "/api/admin/attendees",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions20]
      },
      {
        routePath: "/api/admin/attendees",
        mountPath: "/api/admin/attendees",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost10]
      },
      {
        routePath: "/api/admin/audit-log",
        mountPath: "/api/admin",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet14]
      },
      {
        routePath: "/api/admin/audit-log",
        mountPath: "/api/admin",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions21]
      },
      {
        routePath: "/api/admin/bulk-actions",
        mountPath: "/api/admin",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions22]
      },
      {
        routePath: "/api/admin/bulk-actions",
        mountPath: "/api/admin",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost11]
      },
      {
        routePath: "/api/admin/check-in",
        mountPath: "/api/admin",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet15]
      },
      {
        routePath: "/api/admin/check-in",
        mountPath: "/api/admin",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions23]
      },
      {
        routePath: "/api/admin/check-in",
        mountPath: "/api/admin",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost12]
      },
      {
        routePath: "/api/admin/export",
        mountPath: "/api/admin",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet16]
      },
      {
        routePath: "/api/admin/export",
        mountPath: "/api/admin",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions24]
      },
      {
        routePath: "/api/admin/groups",
        mountPath: "/api/admin/groups",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet17]
      },
      {
        routePath: "/api/admin/groups",
        mountPath: "/api/admin/groups",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions25]
      },
      {
        routePath: "/api/admin/groups",
        mountPath: "/api/admin/groups",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost13]
      },
      {
        routePath: "/api/admin/login",
        mountPath: "/api/admin",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions26]
      },
      {
        routePath: "/api/admin/login",
        mountPath: "/api/admin",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost14]
      },
      {
        routePath: "/api/admin/payments",
        mountPath: "/api/admin/payments",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet18]
      },
      {
        routePath: "/api/admin/payments",
        mountPath: "/api/admin/payments",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions27]
      },
      {
        routePath: "/api/admin/registrations",
        mountPath: "/api/admin/registrations",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet19]
      },
      {
        routePath: "/api/admin/registrations",
        mountPath: "/api/admin/registrations",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions28]
      },
      {
        routePath: "/api/admin/rooms",
        mountPath: "/api/admin/rooms",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet20]
      },
      {
        routePath: "/api/admin/rooms",
        mountPath: "/api/admin/rooms",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions29]
      },
      {
        routePath: "/api/admin/rooms",
        mountPath: "/api/admin/rooms",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost15]
      },
      {
        routePath: "/api/email/test",
        mountPath: "/api/email",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions30]
      },
      {
        routePath: "/api/email/test",
        mountPath: "/api/email",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost16]
      },
      {
        routePath: "/api/payments/bank-transfer",
        mountPath: "/api/payments",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions31]
      },
      {
        routePath: "/api/payments/bank-transfer",
        mountPath: "/api/payments",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost17]
      },
      {
        routePath: "/api/payments/checkout",
        mountPath: "/api/payments",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions32]
      },
      {
        routePath: "/api/payments/checkout",
        mountPath: "/api/payments",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost18]
      },
      {
        routePath: "/api/payments/history",
        mountPath: "/api/payments",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet21]
      },
      {
        routePath: "/api/payments/history",
        mountPath: "/api/payments",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions33]
      },
      {
        routePath: "/api/payments/status",
        mountPath: "/api/payments",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet22]
      },
      {
        routePath: "/api/payments/status",
        mountPath: "/api/payments",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions34]
      },
      {
        routePath: "/api/webhooks/stripe",
        mountPath: "/api/webhooks",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions35]
      },
      {
        routePath: "/api/webhooks/stripe",
        mountPath: "/api/webhooks",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost19]
      },
      {
        routePath: "/api/announcements",
        mountPath: "/api",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet23]
      },
      {
        routePath: "/api/announcements",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions36]
      },
      {
        routePath: "/api/login",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions37]
      },
      {
        routePath: "/api/login",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost20]
      },
      {
        routePath: "/api/me",
        mountPath: "/api",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet24]
      },
      {
        routePath: "/api/me",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions38]
      },
      {
        routePath: "/api/profile",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions39]
      },
      {
        routePath: "/api/profile",
        mountPath: "/api",
        method: "PUT",
        middlewares: [],
        modules: [onRequestPut8]
      },
      {
        routePath: "/api/register",
        mountPath: "/api",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet25]
      },
      {
        routePath: "/api/register",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions40]
      },
      {
        routePath: "/api/register",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost21]
      },
      {
        routePath: "/",
        mountPath: "/",
        method: "",
        middlewares: [onRequest],
        modules: []
      }
    ];
  }
});

// ../.wrangler/tmp/bundle-kiG2rO/middleware-loader.entry.ts
init_functionsRoutes_0_7445773257736559();
init_strip_cf_connecting_ip_header();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../.wrangler/tmp/bundle-kiG2rO/middleware-insertion-facade.js
init_functionsRoutes_0_7445773257736559();
init_strip_cf_connecting_ip_header();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../node_modules/wrangler/templates/pages-template-worker.ts
init_functionsRoutes_0_7445773257736559();
init_strip_cf_connecting_ip_header();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../node_modules/path-to-regexp/dist.es2015/index.js
init_functionsRoutes_0_7445773257736559();
init_strip_cf_connecting_ip_header();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count3 = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count3--;
          if (count3 === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count3++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count3)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env2, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context2 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env2,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: () => {
            isFailOpen = true;
          }
        };
        const response = await handler(context2);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error3) {
      if (isFailOpen) {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error3;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_functionsRoutes_0_7445773257736559();
init_strip_cf_connecting_ip_header();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_functionsRoutes_0_7445773257736559();
init_strip_cf_connecting_ip_header();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-kiG2rO/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
init_functionsRoutes_0_7445773257736559();
init_strip_cf_connecting_ip_header();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-kiG2rO/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.4514949215307493.mjs.map
