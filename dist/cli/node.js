#!/usr/bin/env node
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// app.ts
import { Hono } from "hono";
import { cors } from "hono/cors";

// middleware/config.ts
import { createMiddleware } from "hono/factory";
function createConfigMiddleware(options) {
  return createMiddleware(async (c, next) => {
    c.set("config", options);
    await next();
  });
}

// utils/fs.ts
import { promises as fs } from "node:fs";
import { constants as fsConstants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
async function readTextFile(path) {
  return await fs.readFile(path, "utf8");
}
async function readBinaryFile(path) {
  const buffer = await fs.readFile(path);
  return new Uint8Array(buffer);
}
async function writeTextFile(path, content, options) {
  await fs.writeFile(path, content, "utf8");
  if (options?.mode !== void 0) {
    await fs.chmod(path, options.mode);
  }
}
async function exists(path) {
  try {
    await fs.access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}
async function stat(path) {
  const stats = await fs.stat(path);
  return {
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
    isSymlink: stats.isSymbolicLink(),
    size: stats.size,
    mtime: stats.mtime
  };
}
async function* readDir(path) {
  const entries = await fs.readdir(path, { withFileTypes: true });
  for (const entry of entries) {
    yield {
      name: entry.name,
      isFile: entry.isFile(),
      isDirectory: entry.isDirectory(),
      isSymlink: entry.isSymbolicLink()
    };
  }
}
async function withTempDir(callback) {
  const tempDir = await fs.mkdtemp(join(tmpdir(), "claude-code-webui-temp-"));
  try {
    return await callback(tempDir);
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
    }
  }
}

// utils/os.ts
import { homedir } from "node:os";
import process2 from "node:process";
function getEnv(key) {
  return process2.env[key];
}
function getArgs() {
  return process2.argv.slice(2);
}
function getPlatform() {
  switch (process2.platform) {
    case "win32":
      return "windows";
    case "darwin":
      return "darwin";
    case "linux":
      return "linux";
    default:
      return "linux";
  }
}
function getHomeDir() {
  try {
    return homedir();
  } catch {
    return void 0;
  }
}
function exit(code) {
  process2.exit(code);
}

// history/pathUtils.ts
async function getEncodedProjectName(projectPath) {
  const homeDir = getHomeDir();
  if (!homeDir) {
    return null;
  }
  const projectsDir = `${homeDir}/.claude/projects`;
  try {
    const entries = [];
    for await (const entry of readDir(projectsDir)) {
      if (entry.isDirectory) {
        entries.push(entry.name);
      }
    }
    const normalizedPath = projectPath.replace(/\/$/, "");
    const expectedEncoded = normalizedPath.replace(/[/\\:._]/g, "-");
    if (entries.includes(expectedEncoded)) {
      return expectedEncoded;
    }
    return null;
  } catch {
    return null;
  }
}
function validateEncodedProjectName(encodedName) {
  if (!encodedName) {
    return false;
  }
  const dangerousChars = /[<>:"|?*\x00-\x1f\/\\]/;
  if (dangerousChars.test(encodedName)) {
    return false;
  }
  return true;
}

// node_modules/@logtape/logtape/dist/filter.js
function toFilter(filter) {
  if (typeof filter === "function") return filter;
  return getLevelFilter(filter);
}
function getLevelFilter(level) {
  if (level == null) return () => false;
  if (level === "fatal") return (record) => record.level === "fatal";
  else if (level === "error") return (record) => record.level === "fatal" || record.level === "error";
  else if (level === "warning") return (record) => record.level === "fatal" || record.level === "error" || record.level === "warning";
  else if (level === "info") return (record) => record.level === "fatal" || record.level === "error" || record.level === "warning" || record.level === "info";
  else if (level === "debug") return (record) => record.level === "fatal" || record.level === "error" || record.level === "warning" || record.level === "info" || record.level === "debug";
  else if (level === "trace") return () => true;
  throw new TypeError(`Invalid log level: ${level}.`);
}

// node_modules/@logtape/logtape/dist/level.js
var logLevels = [
  "trace",
  "debug",
  "info",
  "warning",
  "error",
  "fatal"
];
function compareLogLevel(a, b) {
  const aIndex = logLevels.indexOf(a);
  if (aIndex < 0) throw new TypeError(`Invalid log level: ${JSON.stringify(a)}.`);
  const bIndex = logLevels.indexOf(b);
  if (bIndex < 0) throw new TypeError(`Invalid log level: ${JSON.stringify(b)}.`);
  return aIndex - bIndex;
}

// node_modules/@logtape/logtape/dist/logger.js
function getLogger(category = []) {
  return LoggerImpl.getLogger(category);
}
var globalRootLoggerSymbol = Symbol.for("logtape.rootLogger");
var LoggerImpl = class LoggerImpl2 {
  parent;
  children;
  category;
  sinks;
  parentSinks = "inherit";
  filters;
  lowestLevel = "trace";
  contextLocalStorage;
  static getLogger(category = []) {
    let rootLogger = globalRootLoggerSymbol in globalThis ? globalThis[globalRootLoggerSymbol] ?? null : null;
    if (rootLogger == null) {
      rootLogger = new LoggerImpl2(null, []);
      globalThis[globalRootLoggerSymbol] = rootLogger;
    }
    if (typeof category === "string") return rootLogger.getChild(category);
    if (category.length === 0) return rootLogger;
    return rootLogger.getChild(category);
  }
  constructor(parent, category) {
    this.parent = parent;
    this.children = {};
    this.category = category;
    this.sinks = [];
    this.filters = [];
  }
  getChild(subcategory) {
    const name = typeof subcategory === "string" ? subcategory : subcategory[0];
    const childRef = this.children[name];
    let child = childRef instanceof LoggerImpl2 ? childRef : childRef?.deref();
    if (child == null) {
      child = new LoggerImpl2(this, [...this.category, name]);
      this.children[name] = "WeakRef" in globalThis ? new WeakRef(child) : child;
    }
    if (typeof subcategory === "string" || subcategory.length === 1) return child;
    return child.getChild(subcategory.slice(1));
  }
  /**
  * Reset the logger.  This removes all sinks and filters from the logger.
  */
  reset() {
    while (this.sinks.length > 0) this.sinks.shift();
    this.parentSinks = "inherit";
    while (this.filters.length > 0) this.filters.shift();
    this.lowestLevel = "trace";
  }
  /**
  * Reset the logger and all its descendants.  This removes all sinks and
  * filters from the logger and all its descendants.
  */
  resetDescendants() {
    for (const child of Object.values(this.children)) {
      const logger2 = child instanceof LoggerImpl2 ? child : child.deref();
      if (logger2 != null) logger2.resetDescendants();
    }
    this.reset();
  }
  with(properties) {
    return new LoggerCtx(this, { ...properties });
  }
  filter(record) {
    for (const filter of this.filters) if (!filter(record)) return false;
    if (this.filters.length < 1) return this.parent?.filter(record) ?? true;
    return true;
  }
  *getSinks(level) {
    if (this.lowestLevel === null || compareLogLevel(level, this.lowestLevel) < 0) return;
    if (this.parent != null && this.parentSinks === "inherit") for (const sink of this.parent.getSinks(level)) yield sink;
    for (const sink of this.sinks) yield sink;
  }
  emit(record, bypassSinks) {
    const fullRecord = "category" in record ? record : {
      ...record,
      category: this.category
    };
    if (this.lowestLevel === null || compareLogLevel(fullRecord.level, this.lowestLevel) < 0 || !this.filter(fullRecord)) return;
    for (const sink of this.getSinks(fullRecord.level)) {
      if (bypassSinks?.has(sink)) continue;
      try {
        sink(fullRecord);
      } catch (error) {
        const bypassSinks2 = new Set(bypassSinks);
        bypassSinks2.add(sink);
        metaLogger.log("fatal", "Failed to emit a log record to sink {sink}: {error}", {
          sink,
          error,
          record: fullRecord
        }, bypassSinks2);
      }
    }
  }
  log(level, rawMessage, properties, bypassSinks) {
    const implicitContext = LoggerImpl2.getLogger().contextLocalStorage?.getStore() ?? {};
    let cachedProps = void 0;
    const record = typeof properties === "function" ? {
      category: this.category,
      level,
      timestamp: Date.now(),
      get message() {
        return parseMessageTemplate(rawMessage, this.properties);
      },
      rawMessage,
      get properties() {
        if (cachedProps == null) cachedProps = {
          ...implicitContext,
          ...properties()
        };
        return cachedProps;
      }
    } : {
      category: this.category,
      level,
      timestamp: Date.now(),
      message: parseMessageTemplate(rawMessage, {
        ...implicitContext,
        ...properties
      }),
      rawMessage,
      properties: {
        ...implicitContext,
        ...properties
      }
    };
    this.emit(record, bypassSinks);
  }
  logLazily(level, callback, properties = {}) {
    const implicitContext = LoggerImpl2.getLogger().contextLocalStorage?.getStore() ?? {};
    let rawMessage = void 0;
    let msg = void 0;
    function realizeMessage() {
      if (msg == null || rawMessage == null) {
        msg = callback((tpl, ...values) => {
          rawMessage = tpl;
          return renderMessage(tpl, values);
        });
        if (rawMessage == null) throw new TypeError("No log record was made.");
      }
      return [msg, rawMessage];
    }
    this.emit({
      category: this.category,
      level,
      get message() {
        return realizeMessage()[0];
      },
      get rawMessage() {
        return realizeMessage()[1];
      },
      timestamp: Date.now(),
      properties: {
        ...implicitContext,
        ...properties
      }
    });
  }
  logTemplate(level, messageTemplate, values, properties = {}) {
    const implicitContext = LoggerImpl2.getLogger().contextLocalStorage?.getStore() ?? {};
    this.emit({
      category: this.category,
      level,
      message: renderMessage(messageTemplate, values),
      rawMessage: messageTemplate,
      timestamp: Date.now(),
      properties: {
        ...implicitContext,
        ...properties
      }
    });
  }
  trace(message, ...values) {
    if (typeof message === "string") this.log("trace", message, values[0] ?? {});
    else if (typeof message === "function") this.logLazily("trace", message);
    else if (!Array.isArray(message)) this.log("trace", "{*}", message);
    else this.logTemplate("trace", message, values);
  }
  debug(message, ...values) {
    if (typeof message === "string") this.log("debug", message, values[0] ?? {});
    else if (typeof message === "function") this.logLazily("debug", message);
    else if (!Array.isArray(message)) this.log("debug", "{*}", message);
    else this.logTemplate("debug", message, values);
  }
  info(message, ...values) {
    if (typeof message === "string") this.log("info", message, values[0] ?? {});
    else if (typeof message === "function") this.logLazily("info", message);
    else if (!Array.isArray(message)) this.log("info", "{*}", message);
    else this.logTemplate("info", message, values);
  }
  warn(message, ...values) {
    if (typeof message === "string") this.log("warning", message, values[0] ?? {});
    else if (typeof message === "function") this.logLazily("warning", message);
    else if (!Array.isArray(message)) this.log("warning", "{*}", message);
    else this.logTemplate("warning", message, values);
  }
  warning(message, ...values) {
    this.warn(message, ...values);
  }
  error(message, ...values) {
    if (typeof message === "string") this.log("error", message, values[0] ?? {});
    else if (typeof message === "function") this.logLazily("error", message);
    else if (!Array.isArray(message)) this.log("error", "{*}", message);
    else this.logTemplate("error", message, values);
  }
  fatal(message, ...values) {
    if (typeof message === "string") this.log("fatal", message, values[0] ?? {});
    else if (typeof message === "function") this.logLazily("fatal", message);
    else if (!Array.isArray(message)) this.log("fatal", "{*}", message);
    else this.logTemplate("fatal", message, values);
  }
};
var LoggerCtx = class LoggerCtx2 {
  logger;
  properties;
  constructor(logger2, properties) {
    this.logger = logger2;
    this.properties = properties;
  }
  get category() {
    return this.logger.category;
  }
  get parent() {
    return this.logger.parent;
  }
  getChild(subcategory) {
    return this.logger.getChild(subcategory).with(this.properties);
  }
  with(properties) {
    return new LoggerCtx2(this.logger, {
      ...this.properties,
      ...properties
    });
  }
  log(level, message, properties, bypassSinks) {
    this.logger.log(level, message, typeof properties === "function" ? () => ({
      ...this.properties,
      ...properties()
    }) : {
      ...this.properties,
      ...properties
    }, bypassSinks);
  }
  logLazily(level, callback) {
    this.logger.logLazily(level, callback, this.properties);
  }
  logTemplate(level, messageTemplate, values) {
    this.logger.logTemplate(level, messageTemplate, values, this.properties);
  }
  emit(record) {
    const recordWithContext = {
      ...record,
      properties: {
        ...this.properties,
        ...record.properties
      }
    };
    this.logger.emit(recordWithContext);
  }
  trace(message, ...values) {
    if (typeof message === "string") this.log("trace", message, values[0] ?? {});
    else if (typeof message === "function") this.logLazily("trace", message);
    else if (!Array.isArray(message)) this.log("trace", "{*}", message);
    else this.logTemplate("trace", message, values);
  }
  debug(message, ...values) {
    if (typeof message === "string") this.log("debug", message, values[0] ?? {});
    else if (typeof message === "function") this.logLazily("debug", message);
    else if (!Array.isArray(message)) this.log("debug", "{*}", message);
    else this.logTemplate("debug", message, values);
  }
  info(message, ...values) {
    if (typeof message === "string") this.log("info", message, values[0] ?? {});
    else if (typeof message === "function") this.logLazily("info", message);
    else if (!Array.isArray(message)) this.log("info", "{*}", message);
    else this.logTemplate("info", message, values);
  }
  warn(message, ...values) {
    if (typeof message === "string") this.log("warning", message, values[0] ?? {});
    else if (typeof message === "function") this.logLazily("warning", message);
    else if (!Array.isArray(message)) this.log("warning", "{*}", message);
    else this.logTemplate("warning", message, values);
  }
  warning(message, ...values) {
    this.warn(message, ...values);
  }
  error(message, ...values) {
    if (typeof message === "string") this.log("error", message, values[0] ?? {});
    else if (typeof message === "function") this.logLazily("error", message);
    else if (!Array.isArray(message)) this.log("error", "{*}", message);
    else this.logTemplate("error", message, values);
  }
  fatal(message, ...values) {
    if (typeof message === "string") this.log("fatal", message, values[0] ?? {});
    else if (typeof message === "function") this.logLazily("fatal", message);
    else if (!Array.isArray(message)) this.log("fatal", "{*}", message);
    else this.logTemplate("fatal", message, values);
  }
};
var metaLogger = LoggerImpl.getLogger(["logtape", "meta"]);
function parseMessageTemplate(template, properties) {
  const length = template.length;
  if (length === 0) return [""];
  if (!template.includes("{")) return [template];
  const message = [];
  let startIndex = 0;
  for (let i = 0; i < length; i++) {
    const char = template[i];
    if (char === "{") {
      const nextChar = i + 1 < length ? template[i + 1] : "";
      if (nextChar === "{") {
        i++;
        continue;
      }
      const closeIndex = template.indexOf("}", i + 1);
      if (closeIndex === -1) continue;
      const beforeText = template.slice(startIndex, i);
      message.push(beforeText.replace(/{{/g, "{").replace(/}}/g, "}"));
      const key = template.slice(i + 1, closeIndex);
      let prop;
      const trimmedKey = key.trim();
      if (trimmedKey === "*") prop = key in properties ? properties[key] : "*" in properties ? properties["*"] : properties;
      else if (key !== trimmedKey) prop = key in properties ? properties[key] : properties[trimmedKey];
      else prop = properties[key];
      message.push(prop);
      i = closeIndex;
      startIndex = i + 1;
    } else if (char === "}" && i + 1 < length && template[i + 1] === "}") i++;
  }
  const remainingText = template.slice(startIndex);
  message.push(remainingText.replace(/{{/g, "{").replace(/}}/g, "}"));
  return message;
}
function renderMessage(template, values) {
  const args = [];
  for (let i = 0; i < template.length; i++) {
    args.push(template[i]);
    if (i < values.length) args.push(values[i]);
  }
  return args;
}

// node_modules/@logtape/logtape/dist/util.node.js
var util_node_exports = {};
__export(util_node_exports, {
  inspect: () => inspect
});
import util from "node:util";
function inspect(obj, options) {
  return util.inspect(obj, options);
}

// node_modules/@logtape/logtape/dist/formatter.js
var levelAbbreviations = {
  "trace": "TRC",
  "debug": "DBG",
  "info": "INF",
  "warning": "WRN",
  "error": "ERR",
  "fatal": "FTL"
};
var inspect2 = typeof document !== "undefined" || typeof navigator !== "undefined" && navigator.product === "ReactNative" ? (v) => JSON.stringify(v) : "Deno" in globalThis && "inspect" in globalThis.Deno && typeof globalThis.Deno.inspect === "function" ? (v, opts) => globalThis.Deno.inspect(v, {
  strAbbreviateSize: Infinity,
  iterableLimit: Infinity,
  ...opts
}) : util_node_exports != null && "inspect" in util_node_exports && typeof inspect === "function" ? (v, opts) => inspect(v, {
  maxArrayLength: Infinity,
  maxStringLength: Infinity,
  ...opts
}) : (v) => JSON.stringify(v);
function padZero(num) {
  return num < 10 ? `0${num}` : `${num}`;
}
function padThree(num) {
  return num < 10 ? `00${num}` : num < 100 ? `0${num}` : `${num}`;
}
var timestampFormatters = {
  "date-time-timezone": (ts) => {
    const d = new Date(ts);
    const year = d.getUTCFullYear();
    const month = padZero(d.getUTCMonth() + 1);
    const day = padZero(d.getUTCDate());
    const hour = padZero(d.getUTCHours());
    const minute = padZero(d.getUTCMinutes());
    const second = padZero(d.getUTCSeconds());
    const ms = padThree(d.getUTCMilliseconds());
    return `${year}-${month}-${day} ${hour}:${minute}:${second}.${ms} +00:00`;
  },
  "date-time-tz": (ts) => {
    const d = new Date(ts);
    const year = d.getUTCFullYear();
    const month = padZero(d.getUTCMonth() + 1);
    const day = padZero(d.getUTCDate());
    const hour = padZero(d.getUTCHours());
    const minute = padZero(d.getUTCMinutes());
    const second = padZero(d.getUTCSeconds());
    const ms = padThree(d.getUTCMilliseconds());
    return `${year}-${month}-${day} ${hour}:${minute}:${second}.${ms} +00`;
  },
  "date-time": (ts) => {
    const d = new Date(ts);
    const year = d.getUTCFullYear();
    const month = padZero(d.getUTCMonth() + 1);
    const day = padZero(d.getUTCDate());
    const hour = padZero(d.getUTCHours());
    const minute = padZero(d.getUTCMinutes());
    const second = padZero(d.getUTCSeconds());
    const ms = padThree(d.getUTCMilliseconds());
    return `${year}-${month}-${day} ${hour}:${minute}:${second}.${ms}`;
  },
  "time-timezone": (ts) => {
    const d = new Date(ts);
    const hour = padZero(d.getUTCHours());
    const minute = padZero(d.getUTCMinutes());
    const second = padZero(d.getUTCSeconds());
    const ms = padThree(d.getUTCMilliseconds());
    return `${hour}:${minute}:${second}.${ms} +00:00`;
  },
  "time-tz": (ts) => {
    const d = new Date(ts);
    const hour = padZero(d.getUTCHours());
    const minute = padZero(d.getUTCMinutes());
    const second = padZero(d.getUTCSeconds());
    const ms = padThree(d.getUTCMilliseconds());
    return `${hour}:${minute}:${second}.${ms} +00`;
  },
  "time": (ts) => {
    const d = new Date(ts);
    const hour = padZero(d.getUTCHours());
    const minute = padZero(d.getUTCMinutes());
    const second = padZero(d.getUTCSeconds());
    const ms = padThree(d.getUTCMilliseconds());
    return `${hour}:${minute}:${second}.${ms}`;
  },
  "date": (ts) => {
    const d = new Date(ts);
    const year = d.getUTCFullYear();
    const month = padZero(d.getUTCMonth() + 1);
    const day = padZero(d.getUTCDate());
    return `${year}-${month}-${day}`;
  },
  "rfc3339": (ts) => new Date(ts).toISOString(),
  "none": () => null
};
var levelRenderersCache = {
  ABBR: levelAbbreviations,
  abbr: {
    trace: "trc",
    debug: "dbg",
    info: "inf",
    warning: "wrn",
    error: "err",
    fatal: "ftl"
  },
  FULL: {
    trace: "TRACE",
    debug: "DEBUG",
    info: "INFO",
    warning: "WARNING",
    error: "ERROR",
    fatal: "FATAL"
  },
  full: {
    trace: "trace",
    debug: "debug",
    info: "info",
    warning: "warning",
    error: "error",
    fatal: "fatal"
  },
  L: {
    trace: "T",
    debug: "D",
    info: "I",
    warning: "W",
    error: "E",
    fatal: "F"
  },
  l: {
    trace: "t",
    debug: "d",
    info: "i",
    warning: "w",
    error: "e",
    fatal: "f"
  }
};
function getTextFormatter(options = {}) {
  const timestampRenderer = (() => {
    const tsOption = options.timestamp;
    if (tsOption == null) return timestampFormatters["date-time-timezone"];
    else if (tsOption === "disabled") return timestampFormatters["none"];
    else if (typeof tsOption === "string" && tsOption in timestampFormatters) return timestampFormatters[tsOption];
    else return tsOption;
  })();
  const categorySeparator = options.category ?? "\xB7";
  const valueRenderer = options.value ?? inspect2;
  const levelRenderer = (() => {
    const levelOption = options.level;
    if (levelOption == null || levelOption === "ABBR") return (level) => levelRenderersCache.ABBR[level];
    else if (levelOption === "abbr") return (level) => levelRenderersCache.abbr[level];
    else if (levelOption === "FULL") return (level) => levelRenderersCache.FULL[level];
    else if (levelOption === "full") return (level) => levelRenderersCache.full[level];
    else if (levelOption === "L") return (level) => levelRenderersCache.L[level];
    else if (levelOption === "l") return (level) => levelRenderersCache.l[level];
    else return levelOption;
  })();
  const formatter = options.format ?? (({ timestamp, level, category, message }) => `${timestamp ? `${timestamp} ` : ""}[${level}] ${category}: ${message}`);
  return (record) => {
    const msgParts = record.message;
    const msgLen = msgParts.length;
    let message;
    if (msgLen === 1) message = msgParts[0];
    else if (msgLen <= 6) {
      message = "";
      for (let i = 0; i < msgLen; i++) message += i % 2 === 0 ? msgParts[i] : valueRenderer(msgParts[i]);
    } else {
      const parts = new Array(msgLen);
      for (let i = 0; i < msgLen; i++) parts[i] = i % 2 === 0 ? msgParts[i] : valueRenderer(msgParts[i]);
      message = parts.join("");
    }
    const timestamp = timestampRenderer(record.timestamp);
    const level = levelRenderer(record.level);
    const category = typeof categorySeparator === "function" ? categorySeparator(record.category) : record.category.join(categorySeparator);
    const values = {
      timestamp,
      level,
      category,
      message,
      record
    };
    return `${formatter(values)}
`;
  };
}
var defaultTextFormatter = getTextFormatter();
var RESET = "\x1B[0m";
var ansiColors = {
  black: "\x1B[30m",
  red: "\x1B[31m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  blue: "\x1B[34m",
  magenta: "\x1B[35m",
  cyan: "\x1B[36m",
  white: "\x1B[37m"
};
var ansiStyles = {
  bold: "\x1B[1m",
  dim: "\x1B[2m",
  italic: "\x1B[3m",
  underline: "\x1B[4m",
  strikethrough: "\x1B[9m"
};
var defaultLevelColors = {
  trace: null,
  debug: "blue",
  info: "green",
  warning: "yellow",
  error: "red",
  fatal: "magenta"
};
function getAnsiColorFormatter(options = {}) {
  const format = options.format;
  const timestampStyle = typeof options.timestampStyle === "undefined" ? "dim" : options.timestampStyle;
  const timestampColor = options.timestampColor ?? null;
  const timestampPrefix = `${timestampStyle == null ? "" : ansiStyles[timestampStyle]}${timestampColor == null ? "" : ansiColors[timestampColor]}`;
  const timestampSuffix = timestampStyle == null && timestampColor == null ? "" : RESET;
  const levelStyle = typeof options.levelStyle === "undefined" ? "bold" : options.levelStyle;
  const levelColors = options.levelColors ?? defaultLevelColors;
  const categoryStyle = typeof options.categoryStyle === "undefined" ? "dim" : options.categoryStyle;
  const categoryColor = options.categoryColor ?? null;
  const categoryPrefix = `${categoryStyle == null ? "" : ansiStyles[categoryStyle]}${categoryColor == null ? "" : ansiColors[categoryColor]}`;
  const categorySuffix = categoryStyle == null && categoryColor == null ? "" : RESET;
  return getTextFormatter({
    timestamp: "date-time-tz",
    value(value) {
      return inspect2(value, { colors: true });
    },
    ...options,
    format({ timestamp, level, category, message, record }) {
      const levelColor = levelColors[record.level];
      timestamp = `${timestampPrefix}${timestamp}${timestampSuffix}`;
      level = `${levelStyle == null ? "" : ansiStyles[levelStyle]}${levelColor == null ? "" : ansiColors[levelColor]}${level}${levelStyle == null && levelColor == null ? "" : RESET}`;
      return format == null ? `${timestamp} ${level} ${categoryPrefix}${category}:${categorySuffix} ${message}` : format({
        timestamp,
        level,
        category: `${categoryPrefix}${category}${categorySuffix}`,
        message,
        record
      });
    }
  });
}
var ansiColorFormatter = getAnsiColorFormatter();
function getJsonLinesFormatter(options = {}) {
  if (!options.categorySeparator && !options.message && !options.properties) return (record) => {
    if (record.message.length === 3) return JSON.stringify({
      "@timestamp": new Date(record.timestamp).toISOString(),
      level: record.level === "warning" ? "WARN" : record.level.toUpperCase(),
      message: record.message[0] + JSON.stringify(record.message[1]) + record.message[2],
      logger: record.category.join("."),
      properties: record.properties
    }) + "\n";
    if (record.message.length === 1) return JSON.stringify({
      "@timestamp": new Date(record.timestamp).toISOString(),
      level: record.level === "warning" ? "WARN" : record.level.toUpperCase(),
      message: record.message[0],
      logger: record.category.join("."),
      properties: record.properties
    }) + "\n";
    let msg = record.message[0];
    for (let i = 1; i < record.message.length; i++) msg += i & 1 ? JSON.stringify(record.message[i]) : record.message[i];
    return JSON.stringify({
      "@timestamp": new Date(record.timestamp).toISOString(),
      level: record.level === "warning" ? "WARN" : record.level.toUpperCase(),
      message: msg,
      logger: record.category.join("."),
      properties: record.properties
    }) + "\n";
  };
  const isTemplateMessage = options.message === "template";
  const propertiesOption = options.properties ?? "nest:properties";
  let joinCategory;
  if (typeof options.categorySeparator === "function") joinCategory = options.categorySeparator;
  else {
    const separator = options.categorySeparator ?? ".";
    joinCategory = (category) => category.join(separator);
  }
  let getProperties;
  if (propertiesOption === "flatten") getProperties = (properties) => properties;
  else if (propertiesOption.startsWith("prepend:")) {
    const prefix = propertiesOption.substring(8);
    if (prefix === "") throw new TypeError(`Invalid properties option: ${JSON.stringify(propertiesOption)}. It must be of the form "prepend:<prefix>" where <prefix> is a non-empty string.`);
    getProperties = (properties) => {
      const result = {};
      for (const key in properties) result[`${prefix}${key}`] = properties[key];
      return result;
    };
  } else if (propertiesOption.startsWith("nest:")) {
    const key = propertiesOption.substring(5);
    getProperties = (properties) => ({ [key]: properties });
  } else throw new TypeError(`Invalid properties option: ${JSON.stringify(propertiesOption)}. It must be "flatten", "prepend:<prefix>", or "nest:<key>".`);
  let getMessage;
  if (isTemplateMessage) getMessage = (record) => {
    if (typeof record.rawMessage === "string") return record.rawMessage;
    let msg = "";
    for (let i = 0; i < record.rawMessage.length; i++) msg += i % 2 < 1 ? record.rawMessage[i] : "{}";
    return msg;
  };
  else getMessage = (record) => {
    const msgLen = record.message.length;
    if (msgLen === 1) return record.message[0];
    let msg = "";
    for (let i = 0; i < msgLen; i++) msg += i % 2 < 1 ? record.message[i] : JSON.stringify(record.message[i]);
    return msg;
  };
  return (record) => {
    return JSON.stringify({
      "@timestamp": new Date(record.timestamp).toISOString(),
      level: record.level === "warning" ? "WARN" : record.level.toUpperCase(),
      message: getMessage(record),
      logger: joinCategory(record.category),
      ...getProperties(record.properties)
    }) + "\n";
  };
}
var jsonLinesFormatter = getJsonLinesFormatter();
var logLevelStyles = {
  "trace": "background-color: gray; color: white;",
  "debug": "background-color: gray; color: white;",
  "info": "background-color: white; color: black;",
  "warning": "background-color: orange; color: black;",
  "error": "background-color: red; color: white;",
  "fatal": "background-color: maroon; color: white;"
};
function defaultConsoleFormatter(record) {
  let msg = "";
  const values = [];
  for (let i = 0; i < record.message.length; i++) if (i % 2 === 0) msg += record.message[i];
  else {
    msg += "%o";
    values.push(record.message[i]);
  }
  const date = new Date(record.timestamp);
  const time = `${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}:${date.getUTCSeconds().toString().padStart(2, "0")}.${date.getUTCMilliseconds().toString().padStart(3, "0")}`;
  return [
    `%c${time} %c${levelAbbreviations[record.level]}%c %c${record.category.join("\xB7")} %c${msg}`,
    "color: gray;",
    logLevelStyles[record.level],
    "background-color: default;",
    "color: gray;",
    "color: default;",
    ...values
  ];
}

// node_modules/@logtape/logtape/dist/sink.js
function getConsoleSink(options = {}) {
  const formatter = options.formatter ?? defaultConsoleFormatter;
  const levelMap = {
    trace: "debug",
    debug: "debug",
    info: "info",
    warning: "warn",
    error: "error",
    fatal: "error",
    ...options.levelMap ?? {}
  };
  const console2 = options.console ?? globalThis.console;
  const baseSink = (record) => {
    const args = formatter(record);
    const method = levelMap[record.level];
    if (method === void 0) throw new TypeError(`Invalid log level: ${record.level}.`);
    if (typeof args === "string") {
      const msg = args.replace(/\r?\n$/, "");
      console2[method](msg);
    } else console2[method](...args);
  };
  if (!options.nonBlocking) return baseSink;
  const nonBlockingConfig = options.nonBlocking === true ? {} : options.nonBlocking;
  const bufferSize = nonBlockingConfig.bufferSize ?? 100;
  const flushInterval = nonBlockingConfig.flushInterval ?? 100;
  const buffer = [];
  let flushTimer = null;
  let disposed = false;
  let flushScheduled = false;
  const maxBufferSize = bufferSize * 2;
  function flush() {
    if (buffer.length === 0) return;
    const records = buffer.splice(0);
    for (const record of records) try {
      baseSink(record);
    } catch {
    }
  }
  function scheduleFlush() {
    if (flushScheduled) return;
    flushScheduled = true;
    setTimeout(() => {
      flushScheduled = false;
      flush();
    }, 0);
  }
  function startFlushTimer() {
    if (flushTimer !== null || disposed) return;
    flushTimer = setInterval(() => {
      flush();
    }, flushInterval);
  }
  const nonBlockingSink = (record) => {
    if (disposed) return;
    if (buffer.length >= maxBufferSize) buffer.shift();
    buffer.push(record);
    if (buffer.length >= bufferSize) scheduleFlush();
    else if (flushTimer === null) startFlushTimer();
  };
  nonBlockingSink[Symbol.dispose] = () => {
    disposed = true;
    if (flushTimer !== null) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
    flush();
  };
  return nonBlockingSink;
}

// node_modules/@logtape/logtape/dist/config.js
var currentConfig = null;
var strongRefs = /* @__PURE__ */ new Set();
var disposables = /* @__PURE__ */ new Set();
var asyncDisposables = /* @__PURE__ */ new Set();
function isLoggerConfigMeta(cfg) {
  return cfg.category.length === 0 || cfg.category.length === 1 && cfg.category[0] === "logtape" || cfg.category.length === 2 && cfg.category[0] === "logtape" && cfg.category[1] === "meta";
}
async function configure(config) {
  if (currentConfig != null && !config.reset) throw new ConfigError("Already configured; if you want to reset, turn on the reset flag.");
  await reset();
  try {
    configureInternal(config, true);
  } catch (e) {
    if (e instanceof ConfigError) await reset();
    throw e;
  }
}
function configureInternal(config, allowAsync) {
  currentConfig = config;
  let metaConfigured = false;
  const configuredCategories = /* @__PURE__ */ new Set();
  for (const cfg of config.loggers) {
    if (isLoggerConfigMeta(cfg)) metaConfigured = true;
    const categoryKey = Array.isArray(cfg.category) ? JSON.stringify(cfg.category) : JSON.stringify([cfg.category]);
    if (configuredCategories.has(categoryKey)) throw new ConfigError(`Duplicate logger configuration for category: ${categoryKey}. Each category can only be configured once.`);
    configuredCategories.add(categoryKey);
    const logger2 = LoggerImpl.getLogger(cfg.category);
    for (const sinkId of cfg.sinks ?? []) {
      const sink = config.sinks[sinkId];
      if (!sink) throw new ConfigError(`Sink not found: ${sinkId}.`);
      logger2.sinks.push(sink);
    }
    logger2.parentSinks = cfg.parentSinks ?? "inherit";
    if (cfg.lowestLevel !== void 0) logger2.lowestLevel = cfg.lowestLevel;
    for (const filterId of cfg.filters ?? []) {
      const filter = config.filters?.[filterId];
      if (filter === void 0) throw new ConfigError(`Filter not found: ${filterId}.`);
      logger2.filters.push(toFilter(filter));
    }
    strongRefs.add(logger2);
  }
  LoggerImpl.getLogger().contextLocalStorage = config.contextLocalStorage;
  for (const sink of Object.values(config.sinks)) {
    if (Symbol.asyncDispose in sink) if (allowAsync) asyncDisposables.add(sink);
    else throw new ConfigError("Async disposables cannot be used with configureSync().");
    if (Symbol.dispose in sink) disposables.add(sink);
  }
  for (const filter of Object.values(config.filters ?? {})) {
    if (filter == null || typeof filter === "string") continue;
    if (Symbol.asyncDispose in filter) if (allowAsync) asyncDisposables.add(filter);
    else throw new ConfigError("Async disposables cannot be used with configureSync().");
    if (Symbol.dispose in filter) disposables.add(filter);
  }
  if ("process" in globalThis && !("Deno" in globalThis)) {
    const proc = globalThis.process;
    if (proc?.on) proc.on("exit", allowAsync ? dispose : disposeSync);
  } else addEventListener("unload", allowAsync ? dispose : disposeSync);
  const meta = LoggerImpl.getLogger(["logtape", "meta"]);
  if (!metaConfigured) meta.sinks.push(getConsoleSink());
  meta.info("LogTape loggers are configured.  Note that LogTape itself uses the meta logger, which has category {metaLoggerCategory}.  The meta logger purposes to log internal errors such as sink exceptions.  If you are seeing this message, the meta logger is automatically configured.  It's recommended to configure the meta logger with a separate sink so that you can easily notice if logging itself fails or is misconfigured.  To turn off this message, configure the meta logger with higher log levels than {dismissLevel}.  See also <https://logtape.org/manual/categories#meta-logger>.", {
    metaLoggerCategory: ["logtape", "meta"],
    dismissLevel: "info"
  });
}
async function reset() {
  await dispose();
  resetInternal();
}
function resetInternal() {
  const rootLogger = LoggerImpl.getLogger([]);
  rootLogger.resetDescendants();
  delete rootLogger.contextLocalStorage;
  strongRefs.clear();
  currentConfig = null;
}
async function dispose() {
  disposeSync();
  const promises = [];
  for (const disposable of asyncDisposables) {
    promises.push(disposable[Symbol.asyncDispose]());
    asyncDisposables.delete(disposable);
  }
  await Promise.all(promises);
}
function disposeSync() {
  for (const disposable of disposables) disposable[Symbol.dispose]();
  disposables.clear();
}
var ConfigError = class extends Error {
  /**
  * Constructs a new configuration error.
  * @param message The error message.
  */
  constructor(message) {
    super(message);
    this.name = "ConfigureError";
  }
};

// node_modules/@logtape/pretty/dist/terminal.js
function isTerminal() {
  try {
    if (typeof Deno !== "undefined") {
      if (Deno.stdout.isTerminal) return Deno.stdout.isTerminal();
    }
    if (typeof process !== "undefined" && process.stdout) return Boolean(process.stdout.isTTY);
    if (typeof window !== "undefined") return false;
    return false;
  } catch {
    return false;
  }
}
function getTerminalWidth() {
  try {
    if (typeof Deno !== "undefined") {
      if (Deno.consoleSize) {
        const size = Deno.consoleSize();
        return size?.columns || null;
      }
    }
    if (typeof process !== "undefined" && process.stdout) return process.stdout.columns || null;
    const envColumns = typeof Deno !== "undefined" ? Deno.env.get("COLUMNS") : process?.env?.COLUMNS;
    if (envColumns) {
      const parsed = parseInt(envColumns, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  } catch {
    return null;
  }
}
function getOptimalWordWrapWidth(defaultWidth = 80) {
  if (!isTerminal()) return defaultWidth;
  const terminalWidth = getTerminalWidth();
  return terminalWidth || defaultWidth;
}

// node_modules/@logtape/pretty/dist/truncate.js
function truncateCategory(category, maxWidth, separator = ".", strategy = "middle") {
  if (!strategy || maxWidth <= 0) return category.join(separator);
  const full = category.join(separator);
  if (full.length <= maxWidth) return full;
  const minWidth = 5;
  if (maxWidth < minWidth) return "\u2026";
  if (strategy === "end") return full.substring(0, maxWidth - 1) + "\u2026";
  if (category.length <= 2) return full.substring(0, maxWidth - 1) + "\u2026";
  const first = category[0];
  const last = category[category.length - 1];
  const ellipsis = "\u2026";
  const minimalLength = first.length + ellipsis.length + last.length;
  if (minimalLength > maxWidth) return full.substring(0, maxWidth - 1) + "\u2026";
  return `${first}${ellipsis}${last}`;
}

// node_modules/@logtape/pretty/dist/wcwidth.js
var ANSI_PATTERN = /\x1b\[[0-9;]*m/g;
function stripAnsi(text) {
  return text.replace(ANSI_PATTERN, "");
}
function getDisplayWidth(text) {
  const cleanText = stripAnsi(text);
  if (cleanText.length === 0) return 0;
  let width = 0;
  let i = 0;
  while (i < cleanText.length) {
    const code = cleanText.codePointAt(i);
    if (code === void 0) {
      i++;
      continue;
    }
    const charWidth = wcwidth(code);
    if (charWidth >= 0) width += charWidth;
    i += code > 65535 ? 2 : 1;
  }
  return width;
}
function wcwidth(code) {
  if (code < 32 || code >= 127 && code < 160) return -1;
  if (isZeroWidth(code)) return 0;
  if (isWideCharacter(code)) return 2;
  return 1;
}
var ZERO_WIDTH_RANGES = [
  [768, 879],
  [1155, 1161],
  [1425, 1469],
  [1473, 1474],
  [1476, 1477],
  [1552, 1562],
  [1611, 1631],
  [1750, 1756],
  [1759, 1764],
  [1767, 1768],
  [1770, 1773],
  [1840, 1866],
  [1958, 1968],
  [2027, 2035],
  [2070, 2073],
  [2075, 2083],
  [2085, 2087],
  [2089, 2093],
  [2137, 2139],
  [2259, 2273],
  [2275, 2306],
  [2369, 2376],
  [2385, 2391],
  [2402, 2403],
  [2497, 2500],
  [2530, 2531],
  [2561, 2562],
  [2625, 2626],
  [2631, 2632],
  [2635, 2637],
  [2672, 2673],
  [2689, 2690],
  [2753, 2757],
  [2759, 2760],
  [2786, 2787],
  [2810, 2815],
  [2881, 2884],
  [2901, 2902],
  [2914, 2915],
  [3134, 3136],
  [3142, 3144],
  [3146, 3149],
  [3157, 3158],
  [3170, 3171],
  [3276, 3277],
  [3298, 3299],
  [3328, 3329],
  [3387, 3388],
  [3426, 3427],
  [3538, 3540],
  [3636, 3642],
  [3655, 3662],
  [3764, 3772],
  [3784, 3789],
  [3864, 3865],
  [3953, 3966],
  [3968, 3972],
  [3974, 3975],
  [3981, 3991],
  [3993, 4028],
  [4141, 4144],
  [4146, 4151],
  [4153, 4154],
  [4157, 4158],
  [4184, 4185],
  [4190, 4192],
  [4209, 4212],
  [4229, 4230],
  [4957, 4959],
  [5906, 5908],
  [5938, 5940],
  [5970, 5971],
  [6002, 6003],
  [6068, 6069],
  [6071, 6077],
  [6089, 6099],
  [6155, 6157],
  [6277, 6278],
  [6432, 6434],
  [6439, 6440],
  [6457, 6459],
  [6679, 6680],
  [6744, 6750],
  [6757, 6764],
  [6771, 6780],
  [6832, 6846],
  [6912, 6915],
  [6966, 6970],
  [7019, 7027],
  [7040, 7041],
  [7074, 7077],
  [7080, 7081],
  [7083, 7085],
  [7144, 7145],
  [7151, 7153],
  [7212, 7219],
  [7222, 7223],
  [7376, 7378],
  [7380, 7392],
  [7394, 7400],
  [7416, 7417],
  [7616, 7673],
  [7675, 7679],
  [8203, 8207],
  [8234, 8238],
  [8288, 8292],
  [8294, 8303],
  [65024, 65039],
  [65056, 65071]
];
var ZERO_WIDTH_SINGLES = /* @__PURE__ */ new Set([
  1471,
  1479,
  1648,
  1809,
  2045,
  2362,
  2364,
  2381,
  2433,
  2492,
  2509,
  2558,
  2620,
  2641,
  2677,
  2748,
  2765,
  2817,
  2876,
  2879,
  2893,
  2946,
  3008,
  3021,
  3072,
  3076,
  3201,
  3260,
  3263,
  3270,
  3393,
  3396,
  3405,
  3457,
  3530,
  3542,
  3633,
  3761,
  3893,
  3895,
  3897,
  4038,
  4226,
  4237,
  4253,
  6086,
  6109,
  6313,
  6450,
  6683,
  6742,
  6752,
  6754,
  6783,
  6964,
  6972,
  6978,
  7142,
  7149,
  7405,
  7412,
  65279
]);
function isInRanges(code, ranges) {
  let left = 0;
  let right = ranges.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const [start, end] = ranges[mid];
    if (code >= start && code <= end) return true;
    else if (code < start) right = mid - 1;
    else left = mid + 1;
  }
  return false;
}
function isZeroWidth(code) {
  return ZERO_WIDTH_SINGLES.has(code) || isInRanges(code, ZERO_WIDTH_RANGES);
}
function isWideCharacter(code) {
  return code >= 4352 && code <= 4447 || code >= 8986 && code <= 8987 || code >= 9001 && code <= 9002 || code >= 9193 && code <= 9196 || code === 9200 || code === 9203 || code >= 9725 && code <= 9726 || code >= 9748 && code <= 9749 || code >= 9800 && code <= 9811 || code === 9855 || code === 9875 || code === 9888 || code === 9889 || code === 9898 || code === 9899 || code >= 9917 && code <= 9918 || code >= 9924 && code <= 9925 || code === 9934 || code === 9940 || code >= 9962 && code <= 9962 || code >= 9970 && code <= 9971 || code === 9973 || code === 9978 || code === 9981 || code >= 9989 && code <= 9989 || code >= 9994 && code <= 9995 || code === 10024 || code === 10060 || code === 10062 || code >= 10067 && code <= 10069 || code === 10071 || code >= 10133 && code <= 10135 || code === 10160 || code === 10175 || code >= 11035 && code <= 11036 || code === 11088 || code === 11093 || code >= 11904 && code <= 11929 || code >= 11931 && code <= 12019 || code >= 12032 && code <= 12245 || code >= 12272 && code <= 12283 || code >= 12288 && code <= 12350 || code >= 12353 && code <= 12438 || code >= 12441 && code <= 12543 || code >= 12549 && code <= 12591 || code >= 12593 && code <= 12686 || code >= 12688 && code <= 12771 || code >= 12784 && code <= 12830 || code >= 12832 && code <= 12871 || code >= 12880 && code <= 19903 || code >= 19968 && code <= 40959 || code >= 43360 && code <= 43391 || code >= 44032 && code <= 55203 || code >= 55216 && code <= 55238 || code >= 63744 && code <= 64255 || code >= 65040 && code <= 65049 || code >= 65072 && code <= 65135 || code >= 65280 && code <= 65376 || code >= 65504 && code <= 65510 || code >= 94176 && code <= 94180 || code >= 94192 && code <= 94193 || code >= 94208 && code <= 100343 || code >= 100352 && code <= 101589 || code >= 101632 && code <= 101640 || code >= 110576 && code <= 110579 || code >= 110581 && code <= 110587 || code >= 110589 && code <= 110590 || code >= 110592 && code <= 110882 || code >= 110928 && code <= 110930 || code >= 110948 && code <= 110951 || code >= 110960 && code <= 111355 || code === 126980 || code === 127183 || code >= 127374 && code <= 127374 || code >= 127377 && code <= 127386 || code >= 127462 && code <= 127487 || code >= 127488 && code <= 127490 || code >= 127504 && code <= 127547 || code >= 127552 && code <= 127560 || code >= 127568 && code <= 127569 || code >= 127584 && code <= 127589 || code >= 127744 && code <= 128727 || code >= 128736 && code <= 128748 || code >= 128752 && code <= 128764 || code >= 128768 && code <= 128883 || code >= 128896 && code <= 128984 || code >= 128992 && code <= 129003 || code >= 129008 && code <= 129008 || code >= 129024 && code <= 129035 || code >= 129040 && code <= 129095 || code >= 129104 && code <= 129113 || code >= 129120 && code <= 129159 || code >= 129168 && code <= 129197 || code >= 129200 && code <= 129201 || code >= 129280 && code <= 129619 || code >= 129632 && code <= 129645 || code >= 129648 && code <= 129660 || code >= 129664 && code <= 129672 || code >= 129680 && code <= 129725 || code >= 129727 && code <= 129733 || code >= 129742 && code <= 129755 || code >= 129760 && code <= 129768 || code >= 129776 && code <= 129784 || code >= 131072 && code <= 196605 || code >= 196608 && code <= 262141;
}

// node_modules/@logtape/pretty/dist/wordwrap.js
function wrapText(text, maxWidth, messageContent) {
  if (maxWidth <= 0) return text;
  const displayWidth = getDisplayWidth(text);
  if (displayWidth <= maxWidth && !text.includes("\n")) return text;
  const firstLineWords = messageContent.split(" ");
  const firstWord = firstLineWords[0];
  const plainText = stripAnsi(text);
  const messageStartIndex = plainText.indexOf(firstWord);
  let indentWidth = 0;
  if (messageStartIndex >= 0) {
    const prefixText = plainText.slice(0, messageStartIndex);
    indentWidth = getDisplayWidth(prefixText);
  }
  const indent = " ".repeat(Math.max(0, indentWidth));
  if (text.includes("\n")) {
    const lines = text.split("\n");
    const wrappedLines = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineDisplayWidth = getDisplayWidth(line);
      if (lineDisplayWidth <= maxWidth) if (i === 0) wrappedLines.push(line);
      else wrappedLines.push(indent + line);
      else {
        const wrappedLine = wrapSingleLine(line, maxWidth, indent);
        if (i === 0) wrappedLines.push(wrappedLine);
        else {
          const subLines = wrappedLine.split("\n");
          for (let j = 0; j < subLines.length; j++) if (j === 0) wrappedLines.push(indent + subLines[j]);
          else wrappedLines.push(subLines[j]);
        }
      }
    }
    return wrappedLines.join("\n");
  }
  return wrapSingleLine(text, maxWidth, indent);
}
function wrapSingleLine(text, maxWidth, indent) {
  const lines = [];
  let currentLine = "";
  let currentDisplayWidth = 0;
  let i = 0;
  while (i < text.length) {
    if (text[i] === "\x1B" && text[i + 1] === "[") {
      let j = i + 2;
      while (j < text.length && text[j] !== "m") j++;
      if (j < text.length) {
        j++;
        currentLine += text.slice(i, j);
        i = j;
        continue;
      }
    }
    const char = text[i];
    if (currentDisplayWidth >= maxWidth && char !== " ") {
      const breakPoint = currentLine.lastIndexOf(" ");
      if (breakPoint > 0) {
        lines.push(currentLine.slice(0, breakPoint));
        currentLine = indent + currentLine.slice(breakPoint + 1) + char;
        currentDisplayWidth = getDisplayWidth(currentLine);
      } else {
        lines.push(currentLine);
        currentLine = indent + char;
        currentDisplayWidth = getDisplayWidth(currentLine);
      }
    } else {
      currentLine += char;
      currentDisplayWidth = getDisplayWidth(currentLine);
    }
    i++;
  }
  if (currentLine.trim()) lines.push(currentLine);
  const filteredLines = lines.filter((line) => line.trim().length > 0);
  return filteredLines.join("\n");
}

// node_modules/@logtape/pretty/dist/util.node.js
import util2 from "node:util";
function inspect3(obj, options) {
  return util2.inspect(obj, options);
}

// node_modules/@logtape/pretty/dist/formatter.js
var RESET2 = "\x1B[0m";
var DIM = "\x1B[2m";
var defaultColors = {
  trace: "rgb(167,139,250)",
  debug: "rgb(96,165,250)",
  info: "rgb(52,211,153)",
  warning: "rgb(251,191,36)",
  error: "rgb(248,113,113)",
  fatal: "rgb(220,38,38)",
  category: "rgb(100,116,139)",
  message: "rgb(148,163,184)",
  timestamp: "rgb(100,116,139)"
};
var styles = {
  reset: RESET2,
  bold: "\x1B[1m",
  dim: DIM,
  italic: "\x1B[3m",
  underline: "\x1B[4m",
  strikethrough: "\x1B[9m"
};
var ansiColors2 = {
  black: "\x1B[30m",
  red: "\x1B[31m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  blue: "\x1B[34m",
  magenta: "\x1B[35m",
  cyan: "\x1B[36m",
  white: "\x1B[37m"
};
var RGB_PATTERN = /^rgb\((\d+),(\d+),(\d+)\)$/;
var HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
function colorToAnsi(color) {
  if (color === null) return "";
  if (color in ansiColors2) return ansiColors2[color];
  const rgbMatch = color.match(RGB_PATTERN);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `\x1B[38;2;${r};${g};${b}m`;
  }
  const hexMatch = color.match(HEX_PATTERN);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `\x1B[38;2;${r};${g};${b}m`;
  }
  return "";
}
function styleToAnsi(style) {
  if (style === null) return "";
  if (Array.isArray(style)) return style.map((s) => styles[s] || "").join("");
  return styles[style] || "";
}
function prepareCategoryPatterns(categoryColorMap) {
  const patterns = [];
  for (const [prefix, color] of categoryColorMap) patterns.push({
    prefix,
    color
  });
  return patterns.sort((a, b) => b.prefix.length - a.prefix.length);
}
function matchCategoryColor(category, patterns) {
  for (const pattern of patterns) if (categoryMatches(category, pattern.prefix)) return pattern.color;
  return null;
}
function categoryMatches(category, prefix) {
  if (prefix.length > category.length) return false;
  for (let i = 0; i < prefix.length; i++) if (category[i] !== prefix[i]) return false;
  return true;
}
var defaultIcons = {
  trace: "\u{1F50D}",
  debug: "\u{1F41B}",
  info: "\u2728",
  warning: "\u26A1",
  error: "\u274C",
  fatal: "\u{1F480}"
};
function normalizeIconSpacing(iconMap) {
  const entries = Object.entries(iconMap);
  const maxWidth = Math.max(...entries.map(([, icon]) => getDisplayWidth(icon)));
  return Object.fromEntries(entries.map(([level, icon]) => [level, icon + " ".repeat(maxWidth - getDisplayWidth(icon))]));
}
function getPrettyFormatter(options = {}) {
  const { timestamp = "none", timestampColor = "rgb(100,116,139)", timestampStyle = "dim", level: levelFormat = "full", levelColors = {}, levelStyle = "underline", icons = true, categorySeparator = "\xB7", categoryColor = "rgb(100,116,139)", categoryColorMap = /* @__PURE__ */ new Map(), categoryStyle = ["dim", "italic"], categoryWidth = 20, categoryTruncate = "middle", messageColor = "rgb(148,163,184)", messageStyle = "dim", colors: useColors = true, align = true, inspectOptions = {}, wordWrap = true } = options;
  const baseIconMap = icons === false ? {
    trace: "",
    debug: "",
    info: "",
    warning: "",
    error: "",
    fatal: ""
  } : icons === true ? defaultIcons : {
    ...defaultIcons,
    ...icons
  };
  const iconMap = normalizeIconSpacing(baseIconMap);
  const resolvedLevelColors = {
    trace: defaultColors.trace,
    debug: defaultColors.debug,
    info: defaultColors.info,
    warning: defaultColors.warning,
    error: defaultColors.error,
    fatal: defaultColors.fatal,
    ...levelColors
  };
  const levelMappings = {
    "ABBR": {
      trace: "TRC",
      debug: "DBG",
      info: "INF",
      warning: "WRN",
      error: "ERR",
      fatal: "FTL"
    },
    "L": {
      trace: "T",
      debug: "D",
      info: "I",
      warning: "W",
      error: "E",
      fatal: "F"
    },
    "abbr": {
      trace: "trc",
      debug: "dbg",
      info: "inf",
      warning: "wrn",
      error: "err",
      fatal: "ftl"
    },
    "l": {
      trace: "t",
      debug: "d",
      info: "i",
      warning: "w",
      error: "e",
      fatal: "f"
    }
  };
  const formatLevel = (level) => {
    if (typeof levelFormat === "function") return levelFormat(level);
    if (levelFormat === "FULL") return level.toUpperCase();
    if (levelFormat === "full") return level;
    return levelMappings[levelFormat]?.[level] ?? level;
  };
  const timestampFormatters2 = {
    "date-time-timezone": (ts) => {
      const iso = new Date(ts).toISOString();
      return iso.replace("T", " ").replace("Z", " +00:00");
    },
    "date-time-tz": (ts) => {
      const iso = new Date(ts).toISOString();
      return iso.replace("T", " ").replace("Z", " +00");
    },
    "date-time": (ts) => {
      const iso = new Date(ts).toISOString();
      return iso.replace("T", " ").replace("Z", "");
    },
    "time-timezone": (ts) => {
      const iso = new Date(ts).toISOString();
      return iso.replace(/.*T/, "").replace("Z", " +00:00");
    },
    "time-tz": (ts) => {
      const iso = new Date(ts).toISOString();
      return iso.replace(/.*T/, "").replace("Z", " +00");
    },
    "time": (ts) => {
      const iso = new Date(ts).toISOString();
      return iso.replace(/.*T/, "").replace("Z", "");
    },
    "date": (ts) => new Date(ts).toISOString().replace(/T.*/, ""),
    "rfc3339": (ts) => new Date(ts).toISOString()
  };
  let timestampFn = null;
  if (timestamp === "none" || timestamp === "disabled") timestampFn = null;
  else if (typeof timestamp === "function") timestampFn = timestamp;
  else timestampFn = timestampFormatters2[timestamp] ?? null;
  const wordWrapEnabled = wordWrap !== false;
  let wordWrapWidth;
  if (typeof wordWrap === "number") wordWrapWidth = wordWrap;
  else if (wordWrap === true) wordWrapWidth = getOptimalWordWrapWidth(80);
  else wordWrapWidth = 80;
  const categoryPatterns = prepareCategoryPatterns(categoryColorMap);
  const allLevels = [
    "trace",
    "debug",
    "info",
    "warning",
    "error",
    "fatal"
  ];
  const levelWidth = Math.max(...allLevels.map((l) => formatLevel(l).length));
  return (record) => {
    const icon = iconMap[record.level] || "";
    const level = formatLevel(record.level);
    const categoryStr = truncateCategory(record.category, categoryWidth, categorySeparator, categoryTruncate);
    let message = "";
    const messageColorCode = useColors ? colorToAnsi(messageColor) : "";
    const messageStyleCode = useColors ? styleToAnsi(messageStyle) : "";
    const messagePrefix = useColors ? `${messageStyleCode}${messageColorCode}` : "";
    for (let i = 0; i < record.message.length; i++) if (i % 2 === 0) message += record.message[i];
    else {
      const value = record.message[i];
      const inspected = inspect3(value, {
        colors: useColors,
        ...inspectOptions
      });
      if (inspected.includes("\n")) {
        const lines = inspected.split("\n");
        const formattedLines = lines.map((line, index) => {
          if (index === 0) if (useColors && (messageColorCode || messageStyleCode)) return `${RESET2}${line}${messagePrefix}`;
          else return line;
          else if (useColors && (messageColorCode || messageStyleCode)) return `${line}${messagePrefix}`;
          else return line;
        });
        message += formattedLines.join("\n");
      } else if (useColors && (messageColorCode || messageStyleCode)) message += `${RESET2}${inspected}${messagePrefix}`;
      else message += inspected;
    }
    const finalCategoryColor = useColors ? matchCategoryColor(record.category, categoryPatterns) || categoryColor : null;
    const formattedIcon = icon;
    let formattedLevel = level;
    let formattedCategory = categoryStr;
    let formattedMessage = message;
    let formattedTimestamp = "";
    if (useColors) {
      const levelColorCode = colorToAnsi(resolvedLevelColors[record.level]);
      const levelStyleCode = styleToAnsi(levelStyle);
      formattedLevel = `${levelStyleCode}${levelColorCode}${level}${RESET2}`;
      const categoryColorCode = colorToAnsi(finalCategoryColor);
      const categoryStyleCode = styleToAnsi(categoryStyle);
      formattedCategory = `${categoryStyleCode}${categoryColorCode}${categoryStr}${RESET2}`;
      formattedMessage = `${messagePrefix}${message}${RESET2}`;
    }
    if (timestampFn) {
      const ts = timestampFn(record.timestamp);
      if (ts !== null) if (useColors) {
        const timestampColorCode = colorToAnsi(timestampColor);
        const timestampStyleCode = styleToAnsi(timestampStyle);
        formattedTimestamp = `${timestampStyleCode}${timestampColorCode}${ts}${RESET2}  `;
      } else formattedTimestamp = `${ts}  `;
    }
    if (align) {
      const levelColorLength = useColors ? colorToAnsi(resolvedLevelColors[record.level]).length + styleToAnsi(levelStyle).length + RESET2.length : 0;
      const categoryColorLength = useColors ? colorToAnsi(finalCategoryColor).length + styleToAnsi(categoryStyle).length + RESET2.length : 0;
      const paddedLevel = formattedLevel.padEnd(levelWidth + levelColorLength);
      const paddedCategory = formattedCategory.padEnd(categoryWidth + categoryColorLength);
      let result = `${formattedTimestamp}${formattedIcon} ${paddedLevel} ${paddedCategory} ${formattedMessage}`;
      if (wordWrapEnabled || message.includes("\n")) result = wrapText(result, wordWrapEnabled ? wordWrapWidth : Infinity, message);
      return result + "\n";
    } else {
      let result = `${formattedTimestamp}${formattedIcon} ${formattedLevel} ${formattedCategory} ${formattedMessage}`;
      if (wordWrapEnabled || message.includes("\n")) result = wrapText(result, wordWrapEnabled ? wordWrapWidth : Infinity, message);
      return result + "\n";
    }
  };
}
var prettyFormatter = getPrettyFormatter();

// utils/logger.ts
var isConfigured = false;
async function setupLogger(debugMode) {
  if (isConfigured) {
    return;
  }
  const lowestLevel = debugMode ? "debug" : "info";
  await configure({
    sinks: {
      console: getConsoleSink({
        formatter: getPrettyFormatter({
          icons: false,
          // Remove emoji icons
          align: false,
          // Disable column alignment for cleaner output
          inspectOptions: {
            depth: Infinity,
            // Unlimited depth for complex objects
            colors: true,
            // Keep syntax highlighting
            compact: false
            // Use readable formatting
          }
        })
      })
    },
    loggers: [
      {
        category: [],
        lowestLevel,
        sinks: ["console"]
      },
      // Suppress LogTape meta logger info messages
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks: ["console"]
      }
    ]
  });
  isConfigured = true;
}
var logger = {
  // CLI and startup logging
  cli: getLogger(["cli"]),
  // Chat handling and streaming
  chat: getLogger(["chat"]),
  // History and conversation management
  history: getLogger(["history"]),
  // API handlers
  api: getLogger(["api"]),
  // General application logging
  app: getLogger(["app"])
};

// handlers/projects.ts
async function handleProjectsRequest(c) {
  try {
    const homeDir = getHomeDir();
    if (!homeDir) {
      return c.json({ error: "Home directory not found" }, 500);
    }
    const claudeConfigPath = `${homeDir}/.claude.json`;
    try {
      const configContent = await readTextFile(claudeConfigPath);
      const config = JSON.parse(configContent);
      if (config.projects && typeof config.projects === "object") {
        const projectPaths = Object.keys(config.projects);
        const projects = [];
        for (const path of projectPaths) {
          const encodedName = await getEncodedProjectName(path);
          if (encodedName) {
            projects.push({
              path,
              encodedName
            });
          }
        }
        const response = { projects };
        return c.json(response);
      } else {
        const response = { projects: [] };
        return c.json(response);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("No such file")) {
        const response = { projects: [] };
        return c.json(response);
      }
      throw error;
    }
  } catch (error) {
    logger.api.error("Error reading projects: {error}", { error });
    return c.json({ error: "Failed to read projects" }, 500);
  }
}

// history/parser.ts
async function parseHistoryFile(filePath) {
  try {
    const content = await readTextFile(filePath);
    const lines = content.trim().split("\n").filter((line) => line.trim());
    if (lines.length === 0) {
      return null;
    }
    const messages = [];
    const messageIds = /* @__PURE__ */ new Set();
    let startTime = "";
    let lastTime = "";
    let lastMessagePreview = "";
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        messages.push(parsed);
        if (parsed.message?.role === "assistant" && parsed.message?.id) {
          messageIds.add(parsed.message.id);
        }
        if (!startTime || parsed.timestamp < startTime) {
          startTime = parsed.timestamp;
        }
        if (!lastTime || parsed.timestamp > lastTime) {
          lastTime = parsed.timestamp;
        }
        if (parsed.message?.role === "assistant" && parsed.message?.content) {
          const content2 = parsed.message.content;
          if (Array.isArray(content2)) {
            for (const item of content2) {
              if (typeof item === "object" && item && "text" in item) {
                lastMessagePreview = String(item.text).substring(0, 100);
                break;
              }
            }
          } else if (typeof content2 === "string") {
            lastMessagePreview = content2.substring(0, 100);
          }
        }
      } catch (parseError) {
        logger.history.error(`Failed to parse line in ${filePath}: {error}`, {
          error: parseError
        });
      }
    }
    const fileName = filePath.split("/").pop() || "";
    const sessionId = fileName.replace(".jsonl", "");
    return {
      sessionId,
      filePath,
      messages,
      messageIds,
      startTime,
      lastTime,
      messageCount: messages.length,
      lastMessagePreview: lastMessagePreview || "No preview available"
    };
  } catch (error) {
    logger.history.error(`Failed to read history file ${filePath}: {error}`, {
      error
    });
    return null;
  }
}
async function getHistoryFiles(historyDir) {
  try {
    const files = [];
    for await (const entry of readDir(historyDir)) {
      if (entry.isFile && entry.name.endsWith(".jsonl")) {
        files.push(`${historyDir}/${entry.name}`);
      }
    }
    return files;
  } catch {
    return [];
  }
}
async function parseAllHistoryFiles(historyDir) {
  const filePaths = await getHistoryFiles(historyDir);
  const results = [];
  for (const filePath of filePaths) {
    const parsed = await parseHistoryFile(filePath);
    if (parsed) {
      results.push(parsed);
    }
  }
  return results;
}
function isSubset(subset, superset) {
  if (subset.size > superset.size) {
    return false;
  }
  for (const item of subset) {
    if (!superset.has(item)) {
      return false;
    }
  }
  return true;
}

// history/grouping.ts
function groupConversations(conversationFiles) {
  if (conversationFiles.length === 0) {
    return [];
  }
  const sortedConversations = [...conversationFiles].sort((a, b) => {
    return a.messageIds.size - b.messageIds.size;
  });
  const uniqueConversations = [];
  for (const currentConv of sortedConversations) {
    const isSubsetOfExisting = uniqueConversations.some(
      (existingConv) => isSubset(currentConv.messageIds, existingConv.messageIds)
    );
    if (!isSubsetOfExisting) {
      uniqueConversations.push(currentConv);
    }
  }
  const summaries = uniqueConversations.map(
    (conv) => createConversationSummary(conv)
  );
  summaries.sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  return summaries;
}
function createConversationSummary(conversationFile) {
  return {
    sessionId: conversationFile.sessionId,
    startTime: conversationFile.startTime,
    lastTime: conversationFile.lastTime,
    messageCount: conversationFile.messageCount,
    lastMessagePreview: conversationFile.lastMessagePreview
  };
}

// handlers/histories.ts
async function handleHistoriesRequest(c) {
  try {
    const encodedProjectName = c.req.param("encodedProjectName");
    if (!encodedProjectName) {
      return c.json({ error: "Encoded project name is required" }, 400);
    }
    if (!validateEncodedProjectName(encodedProjectName)) {
      return c.json({ error: "Invalid encoded project name" }, 400);
    }
    logger.history.debug(
      `Fetching histories for encoded project: ${encodedProjectName}`
    );
    const homeDir = getHomeDir();
    if (!homeDir) {
      return c.json({ error: "Home directory not found" }, 500);
    }
    const historyDir = `${homeDir}/.claude/projects/${encodedProjectName}`;
    logger.history.debug(`History directory: ${historyDir}`);
    try {
      const dirInfo = await stat(historyDir);
      if (!dirInfo.isDirectory) {
        return c.json({ error: "Project not found" }, 404);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("No such file")) {
        return c.json({ error: "Project not found" }, 404);
      }
      throw error;
    }
    const conversationFiles = await parseAllHistoryFiles(historyDir);
    logger.history.debug(
      `Found ${conversationFiles.length} conversation files`
    );
    const conversations = groupConversations(conversationFiles);
    logger.history.debug(
      `After grouping: ${conversations.length} unique conversations`
    );
    const response = {
      conversations
    };
    return c.json(response);
  } catch (error) {
    logger.history.error("Error fetching conversation histories: {error}", {
      error
    });
    return c.json(
      {
        error: "Failed to fetch conversation histories",
        details: error instanceof Error ? error.message : String(error)
      },
      500
    );
  }
}

// history/timestampRestore.ts
function restoreTimestamps(messages) {
  const timestampMap = /* @__PURE__ */ new Map();
  for (const msg of messages) {
    if (msg.type === "assistant" && msg.message?.id) {
      const messageId = msg.message.id;
      if (!timestampMap.has(messageId)) {
        timestampMap.set(messageId, msg.timestamp);
      } else {
        const existingTimestamp = timestampMap.get(messageId);
        if (msg.timestamp < existingTimestamp) {
          timestampMap.set(messageId, msg.timestamp);
        }
      }
    }
  }
  return messages.map((msg) => {
    if (msg.type === "assistant" && msg.message?.id) {
      const restoredTimestamp = timestampMap.get(msg.message.id);
      if (restoredTimestamp) {
        return {
          ...msg,
          timestamp: restoredTimestamp
        };
      }
    }
    return msg;
  });
}
function sortMessagesByTimestamp(messages) {
  return [...messages].sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
}
function calculateConversationMetadata(messages) {
  if (messages.length === 0) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return {
      startTime: now,
      endTime: now,
      messageCount: 0
    };
  }
  const sortedMessages = sortMessagesByTimestamp(messages);
  const startTime = sortedMessages[0].timestamp;
  const endTime = sortedMessages[sortedMessages.length - 1].timestamp;
  return {
    startTime,
    endTime,
    messageCount: messages.length
  };
}
function processConversationMessages(messages, _sessionId) {
  const restoredMessages = restoreTimestamps(messages);
  const sortedMessages = sortMessagesByTimestamp(restoredMessages);
  const metadata = calculateConversationMetadata(sortedMessages);
  return {
    messages: sortedMessages,
    metadata
  };
}

// history/conversationLoader.ts
async function loadConversation(encodedProjectName, sessionId) {
  if (!validateEncodedProjectName(encodedProjectName)) {
    throw new Error("Invalid encoded project name");
  }
  if (!validateSessionId(sessionId)) {
    throw new Error("Invalid session ID format");
  }
  const homeDir = getHomeDir();
  if (!homeDir) {
    throw new Error("Home directory not found");
  }
  const historyDir = `${homeDir}/.claude/projects/${encodedProjectName}`;
  const filePath = `${historyDir}/${sessionId}.jsonl`;
  if (!await exists(filePath)) {
    return null;
  }
  try {
    const conversationHistory = await parseConversationFile(
      filePath,
      sessionId
    );
    return conversationHistory;
  } catch (error) {
    throw error;
  }
}
async function parseConversationFile(filePath, sessionId) {
  const content = await readTextFile(filePath);
  const lines = content.trim().split("\n").filter((line) => line.trim());
  if (lines.length === 0) {
    throw new Error("Empty conversation file");
  }
  const rawLines = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      rawLines.push(parsed);
    } catch (parseError) {
      logger.history.error(`Failed to parse line in ${filePath}: {error}`, {
        error: parseError
      });
    }
  }
  const { messages: processedMessages, metadata } = processConversationMessages(
    rawLines,
    sessionId
  );
  return {
    sessionId,
    messages: processedMessages,
    metadata
  };
}
function validateSessionId(sessionId) {
  if (!sessionId) {
    return false;
  }
  const dangerousChars = /[<>:"|?*\x00-\x1f\/\\]/;
  if (dangerousChars.test(sessionId)) {
    return false;
  }
  if (sessionId.length > 255) {
    return false;
  }
  if (sessionId.startsWith(".")) {
    return false;
  }
  return true;
}

// handlers/conversations.ts
async function handleConversationRequest(c) {
  try {
    const encodedProjectName = c.req.param("encodedProjectName");
    const sessionId = c.req.param("sessionId");
    if (!encodedProjectName) {
      return c.json({ error: "Encoded project name is required" }, 400);
    }
    if (!sessionId) {
      return c.json({ error: "Session ID is required" }, 400);
    }
    if (!validateEncodedProjectName(encodedProjectName)) {
      return c.json({ error: "Invalid encoded project name" }, 400);
    }
    logger.history.debug(
      `Fetching conversation details for project: ${encodedProjectName}, session: ${sessionId}`
    );
    const conversationHistory = await loadConversation(
      encodedProjectName,
      sessionId
    );
    if (!conversationHistory) {
      return c.json(
        {
          error: "Conversation not found",
          sessionId
        },
        404
      );
    }
    logger.history.debug(
      `Loaded conversation with ${conversationHistory.messages.length} messages`
    );
    return c.json(conversationHistory);
  } catch (error) {
    logger.history.error("Error fetching conversation details: {error}", {
      error
    });
    if (error instanceof Error) {
      if (error.message.includes("Invalid session ID")) {
        return c.json(
          {
            error: "Invalid session ID format",
            details: error.message
          },
          400
        );
      }
      if (error.message.includes("Invalid encoded project name")) {
        return c.json(
          {
            error: "Invalid project name",
            details: error.message
          },
          400
        );
      }
    }
    return c.json(
      {
        error: "Failed to fetch conversation details",
        details: error instanceof Error ? error.message : String(error)
      },
      500
    );
  }
}

// handlers/chat.ts
import { query, tool as sdkTool, createSdkMcpServer } from "@anthropic-ai/claude-code";
import { z } from "zod/v3";

// Global map: requestId -> Map<questionId, resolve>
var globalPendingAnswers = /* @__PURE__ */ new Map();
var questionIdCounter = 0;

async function* executeClaudeCommand(message, requestId, requestAbortControllers, cliPath, sessionId, allowedTools, workingDirectory, permissionMode, injectMessage) {
  let abortController;
  try {
    let processedMessage = message;
    abortController = new AbortController();
    requestAbortControllers.set(requestId, abortController);

    // Per-request resolvers for pending questions
    const pendingResolvers = new Map();
    globalPendingAnswers.set(requestId, pendingResolvers);

    // Create SDK MCP server with AskUser tool
    const askUserMcp = createSdkMcpServer({
      name: "ask-user-webui",
      tools: [
        sdkTool(
          "AskUserQuestion",
          "Ask the user a question with multiple-choice options. Use this when you need clarification, want the user to choose between approaches, or need input to proceed. Each question can have 2-4 options. The user can also provide free-text input via an 'Other' option that is always available.",
          {
            questions: z.array(z.object({
              question: z.string().describe("The question to ask"),
              header: z.string().describe("Short label for the question (max 12 chars)"),
              options: z.array(z.object({
                label: z.string().describe("Display text for this option (1-5 words)"),
                description: z.string().describe("Explanation of what this option means")
              })).min(2).max(4),
              multiSelect: z.boolean().describe("Whether multiple options can be selected")
            })).min(1).max(4)
          },
          async (args) => {
            const questionId = "q_" + (++questionIdCounter);
            logger.chat.debug("AskUserQuestion MCP tool called, questionId: " + questionId);

            // Create deferred promise for the user's answer
            let resolveAnswer;
            const answerPromise = new Promise((resolve) => { resolveAnswer = resolve; });
            pendingResolvers.set(questionId, resolveAnswer);

            // Inject the question into the NDJSON stream for the frontend
            if (injectMessage) {
              injectMessage({
                type: "ask_user_question",
                questionId,
                requestId,
                questions: args.questions || []
              });
            }

            // Wait for the user's answer (resolved by /api/answer endpoint)
            const answers = await answerPromise;
            pendingResolvers.delete(questionId);
            logger.chat.debug("AskUserQuestion answered, questionId: " + questionId);

            // Return answers as tool result
            return {
              content: [{ type: "text", text: JSON.stringify(answers) }]
            };
          }
        )
      ]
    });

    // Signal to close the streaming prompt (resolves when result message is received)
    let closePrompt;
    const closePromptPromise = new Promise((resolve) => { closePrompt = resolve; });

    // Streaming prompt generator - stays open for MCP control channel until result
    async function* streamingPrompt() {
      yield {
        type: "user",
        message: { role: "user", content: processedMessage },
        parent_tool_use_id: null
      };
      // Keep stream open until we receive a result message or abort
      await Promise.race([
        closePromptPromise,
        new Promise((resolve) => {
          abortController.signal.addEventListener("abort", resolve);
        })
      ]);
    }

    for await (const sdkMessage of query({
      prompt: streamingPrompt(),
      options: {
        abortController,
        pathToClaudeCodeExecutable: cliPath,
        permissionMode: "bypassPermissions",
        env: { ...process.env, CLAUDECODE: "" },
        stderr: (data) => { logger.chat.error("CLI stderr: " + data); },
        ...sessionId ? { resume: sessionId } : {},
        ...workingDirectory ? { cwd: workingDirectory } : {},
        allowedTools: ["Bash", "Read", "Write", "Edit", "Glob", "Grep", "WebFetch", "WebSearch", "Task", "NotebookEdit"],
        disallowedTools: ["AskUserQuestion"],
        mcpServers: { "ask-user-webui": askUserMcp },
        appendSystemPrompt: "IMPORTANT: When you need to ask the user a question with options, use the mcp__ask-user-webui__AskUserQuestion tool. This is the correct tool for asking user questions in this web interface."
      }
    })) {
      logger.chat.debug("Claude SDK Message: {sdkMessage}", { sdkMessage });
      yield {
        type: "claude_json",
        data: sdkMessage
      };
      // When we receive the "result" message, signal the streaming prompt to close
      // This lets the CLI process exit cleanly
      if (sdkMessage && sdkMessage.type === "result") {
        closePrompt();
      }
    }
    yield { type: "done" };
  } catch (error) {
    {
      logger.chat.error("Claude Code execution failed: {error}", { error });
      yield {
        type: "error",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  } finally {
    // Abort to release the streaming prompt generator's await
    if (abortController && !abortController.signal.aborted) {
      abortController.abort();
    }
    if (requestAbortControllers.has(requestId)) {
      requestAbortControllers.delete(requestId);
    }
    globalPendingAnswers.delete(requestId);
  }
}
async function handleChatRequest(c, requestAbortControllers) {
  const chatRequest = await c.req.json();
  const { cliPath } = c.var.config;
  logger.chat.debug(
    "Received chat request {*}",
    chatRequest
  );
  const stream = new ReadableStream({
    async start(controller) {
      // injectMessage callback: push data into the NDJSON stream from MCP tool handler
      const injectMessage = (msg) => {
        try {
          const data = JSON.stringify(msg) + "\n";
          controller.enqueue(new TextEncoder().encode(data));
        } catch (e) {
          logger.chat.error("Failed to inject message: {e}", { e });
        }
      };
      // Heartbeat to keep connection alive during long tool executions
      let streamDone = false;
      const heartbeat = setInterval(() => {
        if (streamDone) return;
        try {
          controller.enqueue(new TextEncoder().encode(JSON.stringify({ type: "heartbeat", ts: Date.now() }) + "\n"));
        } catch (e) {}
      }, 10000);
      try {
        for await (const chunk of executeClaudeCommand(
          chatRequest.message,
          chatRequest.requestId,
          requestAbortControllers,
          cliPath,
          chatRequest.sessionId,
          chatRequest.allowedTools,
          chatRequest.workingDirectory,
          chatRequest.permissionMode,
          injectMessage
        )) {
          const data = JSON.stringify(chunk) + "\n";
          controller.enqueue(new TextEncoder().encode(data));
        }
        streamDone = true;
        clearInterval(heartbeat);
        controller.close();
      } catch (error) {
        streamDone = true;
        clearInterval(heartbeat);
        const errorResponse = {
          type: "error",
          error: error instanceof Error ? error.message : String(error)
        };
        controller.enqueue(
          new TextEncoder().encode(JSON.stringify(errorResponse) + "\n")
        );
        controller.close();
      }
    }
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  });
}

// handlers/abort.ts
function handleAbortRequest(c, requestAbortControllers) {
  const requestId = c.req.param("requestId");
  if (!requestId) {
    return c.json({ error: "Request ID is required" }, 400);
  }
  logger.api.debug(`Abort attempt for request: ${requestId}`);
  logger.api.debug(
    `Active requests: ${Array.from(requestAbortControllers.keys())}`
  );
  const abortController = requestAbortControllers.get(requestId);
  if (abortController) {
    abortController.abort();
    requestAbortControllers.delete(requestId);
    logger.api.debug(`Aborted request: ${requestId}`);
    return c.json({ success: true, message: "Request aborted" });
  } else {
    return c.json({ error: "Request not found or already completed" }, 404);
  }
}

// app.ts
function createApp(runtime2, config) {
  const app = new Hono();
  const requestAbortControllers = /* @__PURE__ */ new Map();
  app.use(
    "*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type"]
    })
  );
  app.use(
    "*",
    createConfigMiddleware({
      debugMode: config.debugMode,
      runtime: runtime2,
      cliPath: config.cliPath
    })
  );
  app.get("/api/projects", (c) => handleProjectsRequest(c));
  app.get(
    "/api/projects/:encodedProjectName/histories",
    (c) => handleHistoriesRequest(c)
  );
  app.get(
    "/api/projects/:encodedProjectName/histories/:sessionId",
    (c) => handleConversationRequest(c)
  );
  app.post(
    "/api/abort/:requestId",
    (c) => handleAbortRequest(c, requestAbortControllers)
  );
  app.post("/api/chat", (c) => handleChatRequest(c, requestAbortControllers));
  // Process tree endpoint - shows child processes with kill capability
  app.get("/api/processes", async (c) => {
    try {
      const pid = process.pid;
      const isWin = getPlatform() === "windows";
      if (isWin) {
        const { execSync: ex } = await import("node:child_process");
        // Get all processes and build tree from our PID down
        const raw = ex('wmic process get ProcessId,ParentProcessId,Name,CommandLine /format:csv', {
          encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore']
        }).trim();
        const lines = raw.split('\n').filter(l => l.trim()).slice(1); // skip header
        const allProcs = [];
        for (const line of lines) {
          const cols = line.trim().split(',');
          if (cols.length >= 5) {
            // CSV format: Node,CommandLine,Name,ParentProcessId,ProcessId
            const cmdLine = cols.slice(1, cols.length - 3).join(','); // CommandLine may contain commas
            allProcs.push({
              pid: parseInt(cols[cols.length - 1]),
              ppid: parseInt(cols[cols.length - 2]),
              name: cols[cols.length - 3],
              cmd: cmdLine.substring(0, 200)
            });
          }
        }
        // Find all descendants of our PID
        function getDescendants(parentPid, depth = 0) {
          if (depth > 10) return [];
          const children = allProcs.filter(p => p.ppid === parentPid && p.pid !== parentPid);
          const result = [];
          for (const child of children) {
            result.push({ ...child, depth });
            result.push(...getDescendants(child.pid, depth + 1));
          }
          return result;
        }
        const tree = getDescendants(pid);
        return c.json({ pid, children: tree });
      } else {
        // Unix: use ps
        const { execSync: ex } = await import("node:child_process");
        const raw = ex(`ps -eo pid,ppid,comm --no-headers`, { encoding: 'utf8', timeout: 5000 }).trim();
        const allProcs = raw.split('\n').map(l => {
          const parts = l.trim().split(/\s+/);
          return { pid: parseInt(parts[0]), ppid: parseInt(parts[1]), name: parts.slice(2).join(' '), cmd: '' };
        });
        function getDescendants(parentPid, depth = 0) {
          if (depth > 10) return [];
          const children = allProcs.filter(p => p.ppid === parentPid && p.pid !== parentPid);
          const result = [];
          for (const child of children) {
            result.push({ ...child, depth });
            result.push(...getDescendants(child.pid, depth + 1));
          }
          return result;
        }
        const tree = getDescendants(process.pid);
        return c.json({ pid: process.pid, children: tree });
      }
    } catch (e) {
      return c.json({ pid: process.pid, children: [], error: e.message || String(e) });
    }
  });
  app.post("/api/processes/:pid/kill", async (c) => {
    try {
      const targetPid = parseInt(c.req.param("pid"));
      if (!targetPid || targetPid === process.pid) {
        return c.json({ error: "Cannot kill server process" }, 400);
      }
      const { execSync: ex } = await import("node:child_process");
      if (getPlatform() === "windows") {
        ex(`taskkill /F /T /PID ${targetPid}`, { stdio: "ignore", timeout: 5000 });
      } else {
        process.kill(targetPid, "SIGTERM");
      }
      return c.json({ success: true, killed: targetPid });
    } catch (e) {
      return c.json({ error: e.message || String(e) }, 500);
    }
  });
  // Docs discovery endpoint
  app.get("/api/docs", async (c) => {
    const dir = c.req.query("dir");
    if (!dir) return c.json({ error: "dir parameter required" }, 400);
    const docFolders = ["docs", "doc", "documents", "documentation"];
    const docExtensions = [".md", ".txt", ".pdf", ".rst", ".adoc", ".html", ".htm"];
    var results = [];
    for (const folder of docFolders) {
      const folderPath = join(dir, folder);
      if (await exists(folderPath)) {
        try {
          const s = await stat(folderPath);
          if (!s.isDirectory) continue;
          async function scanDir(dirPath, prefix) {
            for await (const entry of readDir(dirPath)) {
              const entryPath = join(dirPath, entry.name);
              if (entry.isDirectory) {
                await scanDir(entryPath, prefix + entry.name + "/");
              } else if (entry.isFile) {
                const ext = entry.name.toLowerCase().slice(entry.name.lastIndexOf("."));
                if (docExtensions.includes(ext)) {
                  results.push({ folder: folder, name: prefix + entry.name, path: entryPath });
                }
              }
            }
          }
          await scanDir(folderPath, "");
        } catch(e) {}
      }
    }
    // Also check for root-level doc files (README, CLAUDE.md, etc.)
    try {
      for await (const entry of readDir(dir)) {
        if (entry.isFile) {
          const lower = entry.name.toLowerCase();
          if (lower === "readme.md" || lower === "claude.md" || lower === "contributing.md" || lower === "changelog.md" || lower === "license" || lower === "license.md") {
            results.push({ folder: "root", name: entry.name, path: join(dir, entry.name) });
          }
        }
      }
    } catch(e) {}
    return c.json(results);
  });
  // Read a doc file
  app.get("/api/docs/read", async (c) => {
    const filePath = c.req.query("path");
    if (!filePath) return c.json({ error: "path parameter required" }, 400);
    try {
      const content = await readTextFile(filePath);
      return c.json({ content: content });
    } catch(e) {
      return c.json({ error: "Could not read file" }, 404);
    }
  });
  // Open file in default system editor
  app.post("/api/open-file", async (c) => {
    const { filePath } = await c.req.json();
    if (!filePath) return c.json({ error: "filePath required" }, 400);
    if (!(await exists(filePath))) return c.json({ error: "File not found" }, 404);
    try {
      const { exec } = await import("node:child_process");
      const platform = process.platform;
      let cmd;
      if (platform === "win32") cmd = `start "" "notepad++" "${filePath}" || notepad "${filePath}"`;
      else if (platform === "darwin") cmd = `open "${filePath}"`;
      else cmd = `xdg-open "${filePath}"`;
      exec(cmd);
      return c.json({ success: true });
    } catch(e) {
      return c.json({ error: "Failed to open file" }, 500);
    }
  });
  // Endpoint for frontend to submit answers to AskUserQuestion
  app.post("/api/answer/:requestId", async (c) => {
    const requestId = c.req.param("requestId");
    const { questionId, answers } = await c.req.json();
    logger.api.debug(`Answer received for request: ${requestId}, question: ${questionId}`);
    const resolvers = globalPendingAnswers.get(requestId);
    if (resolvers && resolvers.has(questionId)) {
      resolvers.get(questionId)(answers);
      return c.json({ success: true });
    }
    return c.json({ error: "Question not found or already answered" }, 404);
  });
  const serveStatic2 = runtime2.createStaticFileMiddleware({
    root: config.staticPath
  });
  app.use("/assets/*", serveStatic2);
  app.get("*", async (c) => {
    const path = c.req.path;
    if (path.startsWith("/api/")) {
      return c.text("Not found", 404);
    }
    try {
      const indexPath = `${config.staticPath}/index.html`;
      const indexFile = await readBinaryFile(indexPath);
      return c.html(new TextDecoder().decode(indexFile));
    } catch (error) {
      logger.app.error("Error serving index.html: {error}", { error });
      return c.text("Internal server error", 500);
    }
  });
  return app;
}

// runtime/node.ts
import { spawn } from "node:child_process";
import process3 from "node:process";
import { serve } from "@hono/node-server";
import { Hono as Hono2 } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
var NodeRuntime = class {
  async findExecutable(name) {
    const platform = getPlatform();
    const candidates = [];
    if (platform === "windows") {
      const executableNames = [
        name,
        `${name}.exe`,
        `${name}.cmd`,
        `${name}.bat`
      ];
      for (const execName of executableNames) {
        const result = await this.runCommand("where", [execName]);
        if (result.success && result.stdout.trim()) {
          const paths = result.stdout.trim().split("\n").map((p) => p.trim()).filter((p) => p);
          candidates.push(...paths);
        }
      }
    } else {
      const result = await this.runCommand("which", [name]);
      if (result.success && result.stdout.trim()) {
        candidates.push(result.stdout.trim());
      }
    }
    return candidates;
  }
  runCommand(command, args, options) {
    return new Promise((resolve) => {
      const isWindows = getPlatform() === "windows";
      const spawnOptions = {
        stdio: ["ignore", "pipe", "pipe"],
        env: options?.env ? { ...process3.env, ...options.env } : process3.env
      };
      let actualCommand = command;
      let actualArgs = args;
      if (isWindows) {
        actualCommand = "cmd.exe";
        actualArgs = ["/c", command, ...args];
      }
      const child = spawn(actualCommand, actualArgs, spawnOptions);
      const textDecoder = new TextDecoder();
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", (data) => {
        stdout += textDecoder.decode(data, { stream: true });
      });
      child.stderr?.on("data", (data) => {
        stderr += textDecoder.decode(data, { stream: true });
      });
      child.on("close", (code) => {
        resolve({
          success: code === 0,
          code: code ?? 1,
          stdout,
          stderr
        });
      });
      child.on("error", (error) => {
        resolve({
          success: false,
          code: 1,
          stdout: "",
          stderr: error.message
        });
      });
    });
  }
  serve(port, hostname, handler) {
    const app = new Hono2();
    app.all("*", async (c) => {
      const response = await handler(c.req.raw);
      return response;
    });
    serve({
      fetch: app.fetch,
      port,
      hostname
    });
    console.log(`Listening on http://${hostname}:${port}/`);
  }
  createStaticFileMiddleware(options) {
    return serveStatic(options);
  }
};

// cli/args.ts
import { program } from "commander";

// cli/version.ts
var VERSION = "0.1.56";

// cli/args.ts
function parseCliArgs() {
  const version = VERSION;
  const defaultPort = parseInt(getEnv("PORT") || "8080", 10);
  program.name("claude-code-webui").version(version, "-v, --version", "display version number").description("Claude Code Web UI Backend Server").option(
    "-p, --port <port>",
    "Port to listen on",
    (value) => {
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) {
        throw new Error(`Invalid port number: ${value}`);
      }
      return parsed;
    },
    defaultPort
  ).option(
    "--host <host>",
    "Host address to bind to (use 0.0.0.0 for all interfaces)",
    "127.0.0.1"
  ).option(
    "--claude-path <path>",
    "Path to claude executable (overrides automatic detection)"
  ).option("-d, --debug", "Enable debug mode", false);
  program.parse(getArgs(), { from: "user" });
  const options = program.opts();
  const debugEnv = getEnv("DEBUG");
  const debugFromEnv = debugEnv?.toLowerCase() === "true" || debugEnv === "1";
  return {
    debug: options.debug || debugFromEnv,
    port: options.port,
    host: options.host,
    claudePath: options.claudePath
  };
}

// cli/validation.ts
import { dirname, join as join2 } from "node:path";
var DOUBLE_BACKSLASH_REGEX = /\\\\/g;
async function parseCmdScript(cmdPath) {
  try {
    logger.cli.debug(`Parsing Windows .cmd script: ${cmdPath}`);
    const cmdContent = await readTextFile(cmdPath);
    const cmdDir = dirname(cmdPath);
    const execLineMatch = cmdContent.match(/"%_prog%"[^"]*"(%dp0%\\[^"]+)"/);
    if (execLineMatch) {
      const fullPath = execLineMatch[1];
      const pathMatch = fullPath.match(/%dp0%\\(.+)/);
      if (pathMatch) {
        const relativePath = pathMatch[1];
        const absolutePath = join2(cmdDir, relativePath);
        logger.cli.debug(`Found CLI script reference: ${relativePath}`);
        logger.cli.debug(`Resolved absolute path: ${absolutePath}`);
        if (await exists(absolutePath)) {
          logger.cli.debug(`.cmd parsing successful: ${absolutePath}`);
          return absolutePath;
        } else {
          logger.cli.debug(`Resolved path does not exist: ${absolutePath}`);
        }
      } else {
        logger.cli.debug(`Could not extract relative path from: ${fullPath}`);
      }
    } else {
      logger.cli.debug(`No CLI script execution pattern found in .cmd content`);
    }
    return null;
  } catch (error) {
    logger.cli.debug(
      `Failed to parse .cmd script: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}
function getWindowsWrapperScript(traceFile, nodePath) {
  return `@echo off
echo %~1 >> "${traceFile}"
"${nodePath}" %*`;
}
function getUnixWrapperScript(traceFile, nodePath) {
  return `#!/bin/bash
echo "$1" >> "${traceFile}"
exec "${nodePath}" "$@"`;
}
async function detectClaudeCliPath(runtime2, claudePath) {
  const platform = getPlatform();
  const isWindows = platform === "windows";
  let pathWrappingResult = null;
  try {
    pathWrappingResult = await withTempDir(async (tempDir) => {
      const traceFile = `${tempDir}/trace.log`;
      const nodeExecutables = await runtime2.findExecutable("node");
      if (nodeExecutables.length === 0) {
        return null;
      }
      const originalNodePath = nodeExecutables[0];
      const wrapperFileName = isWindows ? "node.bat" : "node";
      const wrapperScript = isWindows ? getWindowsWrapperScript(traceFile, originalNodePath) : getUnixWrapperScript(traceFile, originalNodePath);
      await writeTextFile(
        `${tempDir}/${wrapperFileName}`,
        wrapperScript,
        isWindows ? void 0 : { mode: 493 }
      );
      const currentPath = getEnv("PATH") || "";
      const modifiedPath = isWindows ? `${tempDir};${currentPath}` : `${tempDir}:${currentPath}`;
      const executionResult = await runtime2.runCommand(
        claudePath,
        ["--version"],
        {
          env: { PATH: modifiedPath }
        }
      );
      if (!executionResult.success) {
        return null;
      }
      const versionOutput = executionResult.stdout.trim();
      let traceContent;
      try {
        traceContent = await readTextFile(traceFile);
      } catch {
        return { scriptPath: "", versionOutput };
      }
      if (!traceContent.trim()) {
        return { scriptPath: "", versionOutput };
      }
      const traceLines = traceContent.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
      for (const traceLine of traceLines) {
        let scriptPath = traceLine.trim();
        if (scriptPath) {
          if (isWindows) {
            scriptPath = scriptPath.replace(DOUBLE_BACKSLASH_REGEX, "\\");
          }
        }
        if (scriptPath) {
          return { scriptPath, versionOutput };
        }
      }
      return { scriptPath: "", versionOutput };
    });
  } catch (error) {
    logger.cli.debug(
      `PATH wrapping detection failed: ${error instanceof Error ? error.message : String(error)}`
    );
    pathWrappingResult = null;
  }
  if (pathWrappingResult && pathWrappingResult.scriptPath) {
    return pathWrappingResult;
  }
  if (isWindows && claudePath.endsWith(".cmd")) {
    logger.cli.debug(
      "PATH wrapping method failed, trying .cmd parsing fallback..."
    );
    try {
      const cmdParsedPath = await parseCmdScript(claudePath);
      if (cmdParsedPath) {
        let versionOutput = pathWrappingResult?.versionOutput || "";
        if (!versionOutput) {
          try {
            const versionResult = await runtime2.runCommand(claudePath, [
              "--version"
            ]);
            if (versionResult.success) {
              versionOutput = versionResult.stdout.trim();
            }
          } catch {
          }
        }
        return { scriptPath: cmdParsedPath, versionOutput };
      }
    } catch (fallbackError) {
      logger.cli.debug(
        `.cmd parsing fallback failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
      );
    }
  }
  return {
    scriptPath: "",
    versionOutput: pathWrappingResult?.versionOutput || ""
  };
}
async function validateClaudeCli(runtime2, customPath) {
  try {
    const platform = getPlatform();
    const isWindows = platform === "windows";
    let claudePath = "";
    if (customPath) {
      claudePath = customPath;
      logger.cli.info(`\u{1F50D} Validating custom Claude path: ${customPath}`);
    } else {
      logger.cli.info("\u{1F50D} Searching for Claude CLI in PATH...");
      const candidates = await runtime2.findExecutable("claude");
      if (candidates.length === 0) {
        logger.cli.error("\u274C Claude CLI not found in PATH");
        logger.cli.error("   Please install claude-code globally:");
        logger.cli.error(
          "   Visit: https://claude.ai/code for installation instructions"
        );
        exit(1);
      }
      if (isWindows && candidates.length > 1) {
        const cmdCandidate = candidates.find((path) => path.endsWith(".cmd"));
        claudePath = cmdCandidate || candidates[0];
        logger.cli.debug(
          `Found Claude CLI candidates: ${candidates.join(", ")}`
        );
        logger.cli.debug(
          `Using Claude CLI path: ${claudePath} (Windows .cmd preferred)`
        );
      } else {
        claudePath = candidates[0];
        logger.cli.debug(
          `Found Claude CLI candidates: ${candidates.join(", ")}`
        );
        logger.cli.debug(`Using Claude CLI path: ${claudePath}`);
      }
    }
    const isCmdFile = claudePath.endsWith(".cmd");
    if (isWindows && isCmdFile) {
      logger.cli.debug(
        "Detected Windows .cmd file - fallback parsing available if needed"
      );
    }
    logger.cli.info("\u{1F50D} Detecting actual Claude CLI script path...");
    const detection = await detectClaudeCliPath(runtime2, claudePath);
    if (detection.scriptPath) {
      logger.cli.info(`\u2705 Claude CLI script detected: ${detection.scriptPath}`);
      if (detection.versionOutput) {
        logger.cli.info(`\u2705 Claude CLI found: ${detection.versionOutput}`);
      }
      return detection.scriptPath;
    } else {
      logger.cli.warn("\u26A0\uFE0F  Claude CLI script path detection failed");
      logger.cli.warn(
        "   Falling back to using the claude executable directly."
      );
      logger.cli.warn("   This may not work properly, but continuing anyway.");
      logger.cli.warn("");
      logger.cli.warn(`   Using fallback path: ${claudePath}`);
      if (detection.versionOutput) {
        logger.cli.info(`\u2705 Claude CLI found: ${detection.versionOutput}`);
      }
      return claudePath;
    }
  } catch (error) {
    logger.cli.error("\u274C Failed to validate Claude CLI");
    logger.cli.error(
      `   Error: ${error instanceof Error ? error.message : String(error)}`
    );
    exit(1);
  }
}

// cli/node.ts
import { fileURLToPath } from "node:url";
import { dirname as dirname2, join as join3 } from "node:path";
async function main(runtime2) {
  const args = parseCliArgs();
  await setupLogger(args.debug);
  if (args.debug) {
    logger.cli.info("\u{1F41B} Debug mode enabled");
  }
  const cliPath = await validateClaudeCli(runtime2, args.claudePath);
  const __dirname = import.meta.dirname ?? dirname2(fileURLToPath(import.meta.url));
  const staticPath = join3(__dirname, "../static");
  const app = createApp(runtime2, {
    debugMode: args.debug,
    staticPath,
    cliPath
  });
  logger.cli.info(`\u{1F680} Server starting on ${args.host}:${args.port}`);
  runtime2.serve(args.port, args.host, app.fetch);
}
var runtime = new NodeRuntime();

// Process cleanup: PID file + Windows Job Object
import { execSync, spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync, mkdirSync } from "node:fs";
var PID_FILE = join(homedir(), ".claude", "webui.pid");

function writePidFile() {
  try {
    mkdirSync(join(homedir(), ".claude"), { recursive: true });
    writeFileSync(PID_FILE, String(process.pid), "utf8");
  } catch (e) {}
}
function removePidFile() {
  try { unlinkSync(PID_FILE); } catch (e) {}
}

// Windows Job Object: ensures ALL child processes die when this process exits
// (even on hard close / X button). The Job Object is tied to this process's lifetime.
function setupWindowsJobObject() {
  if (getPlatform() !== "windows") return;
  try {
    const pid = process.pid;
    // PowerShell creates a Job Object with KILL_ON_JOB_CLOSE and assigns this process to it.
    // The Job Object handle is held by the PowerShell process which waits for us to exit.
    // When we die (any reason), PS exits, handle closes, Windows kills all children.
    const ps1 = `
Add-Type @'
using System; using System.Runtime.InteropServices;
public class JO {
  [DllImport("kernel32.dll")] public static extern IntPtr CreateJobObject(IntPtr a, string n);
  [DllImport("kernel32.dll")] public static extern bool SetInformationJobObject(IntPtr h, int c, ref JELI i, int s);
  [DllImport("kernel32.dll")] public static extern bool AssignProcessToJobObject(IntPtr j, IntPtr p);
  [DllImport("kernel32.dll")] public static extern IntPtr OpenProcess(int a, bool b, int pid);
  [DllImport("kernel32.dll")] public static extern bool CloseHandle(IntPtr h);
  [StructLayout(LayoutKind.Sequential)] public struct JBLI { public long a,b; public int LimitFlags; public UIntPtr c,d; public int e; public long f; public int g,h; }
  [StructLayout(LayoutKind.Sequential)] public struct IOC { public ulong a,b,c,d,e,f; }
  [StructLayout(LayoutKind.Sequential)] public struct JELI { public JBLI Basic; public IOC Io; public UIntPtr a,b,c,d; }
}
'@
$j = [JO]::CreateJobObject([IntPtr]::Zero, $null)
$i = New-Object JO+JELI; $i.Basic.LimitFlags = 0x2000
[JO]::SetInformationJobObject($j, 9, [ref]$i, [Runtime.InteropServices.Marshal]::SizeOf($i)) | Out-Null
$h = [JO]::OpenProcess(0x1F0FFF, $false, ${pid})
[JO]::AssignProcessToJobObject($j, $h) | Out-Null
[JO]::CloseHandle($h) | Out-Null
# Hold the job handle alive until the node process exits
try { (Get-Process -Id ${pid}).WaitForExit() } catch {}
`;
    // Fire-and-forget: PS holds the Job Object handle in the background
    const child = spawn("powershell", ["-ExecutionPolicy", "Bypass", "-WindowStyle", "Hidden", "-Command", ps1], {
      detached: true,
      stdio: "ignore"
    });
    child.unref();
    console.log(`[JobObject] Process protection active (PID ${pid})`);
  } catch (e) {
    console.log(`[JobObject] Warning: could not set up process protection: ${e.message || e}`);
  }
}

writePidFile();
setupWindowsJobObject();

process.on("SIGINT", () => { removePidFile(); process.exit(0); });
process.on("SIGTERM", () => { removePidFile(); process.exit(0); });
process.on("exit", removePidFile);

main(runtime).catch((error) => {
  console.error("Failed to start server:", error);
  removePidFile();
  exit(1);
});
//# sourceMappingURL=node.js.map
