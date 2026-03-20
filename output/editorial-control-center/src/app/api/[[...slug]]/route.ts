import config from "@payload-config";
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from "@payloadcms/next/routes";

import { withRequestLogging } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withRequestLogging(REST_GET(config), "payload-api");
export const POST = withRequestLogging(REST_POST(config), "payload-api");
export const DELETE = withRequestLogging(REST_DELETE(config), "payload-api");
export const PATCH = withRequestLogging(REST_PATCH(config), "payload-api");
export const PUT = withRequestLogging(REST_PUT(config), "payload-api");
export const OPTIONS = withRequestLogging(REST_OPTIONS(config), "payload-api");
