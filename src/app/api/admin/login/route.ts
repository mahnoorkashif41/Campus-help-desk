import { NextResponse } from "next/server";
import { verifyAdminCredentials } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOGIN_LIMIT = 10; // attempts per 15 minutes per IP address
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const GENERIC_ERROR = "Something went wrong on our side. Please try again in a moment.";

function reply(body: object, status: number, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...extraHeaders },
  });
}

export async function POST(request: Request) {
  try {
    const limit = await checkRateLimit(
      clientKey(request, "admin-login"),
      LOGIN_LIMIT,
      LOGIN_WINDOW_MS,
    );
    if (!limit.allowed) {
      const minutes = Math.ceil(limit.retryAfterSec / 60);
      const unit = minutes === 1 ? "minute" : "minutes";
      return reply(
        { error: `Too many login attempts. Please try again in about ${minutes} ${unit}.` },
        429,
        { "Retry-After": String(limit.retryAfterSec) },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return reply({ error: "We could not read your request." }, 400);
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return reply({ error: "Please enter a valid email and password." }, 400);
    }

    const ok = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
    // One generic message: it never says whether the email or the password was wrong.
    if (!ok) {
      return reply({ error: "Email or password is incorrect." }, 401);
    }

    const token = await createSessionToken();
    const response = reply({ ok: true }, 200);
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true, // JavaScript in the browser cannot read this cookie
      secure: process.env.NODE_ENV === "production", // HTTPS only when deployed
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    // Never log the email, password, or token. Configuration mistakes show up here.
    const reason = error instanceof Error ? error.message : "unknown error";
    console.error("Admin login failed:", reason);
    return reply({ error: GENERIC_ERROR }, 500);
  }
}