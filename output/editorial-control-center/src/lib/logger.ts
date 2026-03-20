import type { LoggerOptions } from "pino";

const SERVICE_NAME = "editorial-control-center";
const ERROR_FALLBACK_PREFIX = "NEXT_HTTP_ERROR_FALLBACK;";

export type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

type RouteLogContext = {
  method: string;
  pathname: string;
  responseTimeMs: number;
  routeKind: string;
  status: number;
} & LogContext;

type RouteHandler<TArgs extends unknown[] = []> = (
  request: Request,
  ...args: TArgs
) => Promise<Response> | Response;

declare global {
  var __editorialControlCenterProcessHandlersRegistered: boolean | undefined;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const DEFAULT_LOG_LEVEL: LogLevel =
  process.env.NODE_ENV === "development" ? "debug" : "info";

const payloadTimestamp = () => `,"timestamp":"${new Date().toISOString()}"`;

export const payloadLogger = {
  options: {
    enabled: process.env.NODE_ENV !== "test",
    formatters: {
      bindings: () => ({
        runtime: getRuntimeName(),
        service: SERVICE_NAME,
      }),
      level: (label) => ({ level: label }),
    },
    level: DEFAULT_LOG_LEVEL,
    messageKey: "message",
    timestamp: payloadTimestamp,
  } satisfies LoggerOptions,
};

function getRuntimeName(): string {
  const edgeRuntime =
    "EdgeRuntime" in globalThis
      ? (globalThis as typeof globalThis & { EdgeRuntime?: unknown }).EdgeRuntime
      : undefined;

  if (typeof edgeRuntime === "string") {
    return "edge";
  }

  if (typeof process !== "undefined" && process.release?.name === "node") {
    return "nodejs";
  }

  return "unknown";
}

function getConsoleMethod(level: LogLevel): typeof console.log {
  switch (level) {
    case "debug":
      return console.debug;
    case "warn":
      return console.warn;
    case "error":
      return console.error;
    case "info":
    default:
      return console.info;
  }
}

function shouldLog(level: LogLevel): boolean {
  return (
    LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[DEFAULT_LOG_LEVEL] &&
    process.env.NODE_ENV !== "test"
  );
}

function safeJSONStringify(value: unknown): string {
  return JSON.stringify(value, (_key, currentValue) => {
    if (typeof currentValue === "bigint") {
      return currentValue.toString();
    }

    if (currentValue instanceof Error) {
      return serializeError(currentValue);
    }

    return currentValue;
  });
}

function resolvePathname(request: Request): string {
  return new URL(request.url).pathname;
}

function resolveStatusLogLevel(status: number): LogLevel {
  if (status >= 500) {
    return "error";
  }

  if (status >= 400) {
    return "warn";
  }

  return "info";
}

export function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const digest =
      "digest" in error && typeof error.digest === "string" ? error.digest : undefined;
    const status =
      "status" in error && typeof error.status === "number" ? error.status : undefined;
    const cause = error.cause ? serializeError(error.cause) : undefined;

    return {
      cause,
      digest,
      message: error.message,
      name: error.name,
      stack: error.stack,
      status,
    };
  }

  if (error && typeof error === "object") {
    return { error };
  }

  return { error: String(error) };
}

export function log(level: LogLevel, message: string, context: LogContext = {}): void {
  if (!shouldLog(level)) {
    return;
  }

  getConsoleMethod(level)(
    safeJSONStringify({
      ...context,
      level,
      message,
      runtime: getRuntimeName(),
      service: SERVICE_NAME,
      timestamp: new Date().toISOString(),
    }),
  );
}

export function logDebug(message: string, context?: LogContext): void {
  log("debug", message, context);
}

export function logInfo(message: string, context?: LogContext): void {
  log("info", message, context);
}

export function logWarn(message: string, context?: LogContext): void {
  log("warn", message, context);
}

export function logError(message: string, error: unknown, context: LogContext = {}): void {
  log("error", message, {
    ...context,
    error: serializeError(error),
  });
}

export function startRequestTimer(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function getElapsedMilliseconds(startedAt: number): number {
  const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

  return Number((endedAt - startedAt).toFixed(2));
}

export function logRequestComplete(context: RouteLogContext): void {
  log(resolveStatusLogLevel(context.status), "Request completed", context);
}

export function isHttpErrorFallback(error: unknown, status: number): boolean {
  return (
    error instanceof Error &&
    "digest" in error &&
    error.digest === `${ERROR_FALLBACK_PREFIX}${status}`
  );
}

export function withRequestLogging<TArgs extends unknown[]>(
  handler: RouteHandler<TArgs>,
  routeKind: string,
): RouteHandler<TArgs> {
  return async function wrappedHandler(
    request: Request,
    ...args: TArgs
  ): Promise<Response> {
    const startedAt = startRequestTimer();
    const pathname = resolvePathname(request);

    try {
      const response = await handler(request, ...args);

      logRequestComplete({
        method: request.method,
        pathname,
        responseTimeMs: getElapsedMilliseconds(startedAt),
        routeKind,
        status: response.status,
      });

      return response;
    } catch (error) {
      logError("Unhandled route error", error, {
        method: request.method,
        pathname,
        responseTimeMs: getElapsedMilliseconds(startedAt),
        routeKind,
      });

      return Response.json({ message: "Internal server error." }, { status: 500 });
    }
  };
}

export function registerProcessErrorHandlers(): void {
  if (typeof process === "undefined" || typeof process.on !== "function") {
    return;
  }

  if (globalThis.__editorialControlCenterProcessHandlersRegistered) {
    return;
  }

  globalThis.__editorialControlCenterProcessHandlersRegistered = true;

  process.on("uncaughtException", (error) => {
    logError("Uncaught exception", error, {
      source: "process",
    });
  });

  process.on("unhandledRejection", (reason) => {
    if (typeof reason === "undefined") {
      return;
    }

    log("error", "Unhandled promise rejection", {
      error: serializeError(reason),
      source: "process",
    });
  });

  logDebug("Registered process error handlers", {
    source: "process",
  });
}
