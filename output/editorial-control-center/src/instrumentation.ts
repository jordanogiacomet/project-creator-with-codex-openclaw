import type { Instrumentation } from "next";

import { logDebug, logError, registerProcessErrorHandlers } from "@/lib/logger";

export function register() {
  registerProcessErrorHandlers();

  logDebug("Registered Next.js instrumentation", {
    source: "next",
  });
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  logError("Unhandled request error", error, {
    method: request.method,
    pathname: request.path,
    renderSource: context.renderSource,
    revalidateReason: context.revalidateReason,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    source: "next",
  });
};
