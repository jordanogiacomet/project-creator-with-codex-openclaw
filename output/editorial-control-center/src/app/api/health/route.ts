import { NextResponse } from "next/server";
import { getPayload } from "payload";

import config from "@payload-config";
import { verifyDatabaseConnection } from "@/lib/db";
import {
  serializeError,
  logWarn,
  withRequestLogging,
} from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SERVICE_NAME = "editorial-control-center";

function getConfiguredPort(): string {
  return process.env.PORT?.trim() || "3000";
}

async function getHealthStatus() {
  const timestamp = new Date().toISOString();

  try {
    await getPayload({ config });
    const database = await verifyDatabaseConnection();

    return NextResponse.json({
      database: {
        ...database,
        status: "ok",
      },
      port: getConfiguredPort(),
      payload: {
        status: "ready",
      },
      service: {
        name: SERVICE_NAME,
        status: "ok",
      },
      status: "ok",
      timestamp,
    });
  } catch (error) {
    logWarn("Health check failed", {
      error: serializeError(error),
      route: "/api/health",
    });

    return NextResponse.json(
      {
        database: {
          connected: false,
          status: "error",
        },
        error: error instanceof Error ? error.message : "Unknown error",
        port: getConfiguredPort(),
        payload: {
          status: "unavailable",
        },
        service: {
          name: SERVICE_NAME,
          status: "degraded",
        },
        status: "error",
        timestamp,
      },
      {
        status: 503,
      },
    );
  }
}

export const GET = withRequestLogging(getHealthStatus, "health");
