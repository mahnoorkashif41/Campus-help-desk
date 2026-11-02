import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./session";

// bcrypt hashes look like $2b$12$ followed by 53 characters (60 in total).
const BCRYPT_FORMAT = /^\$2[aby]\$\d{2}\$.{53}$/;

let dummyHash: string | undefined;
function getDummyHash(): string {
  // Used when the email is wrong, so a wrong email takes as long to reject as a wrong password.
  dummyHash ??= bcrypt.hashSync(randomBytes(8).toString("hex"), 12);
  return dummyHash;
}

/** Checks the login against the single admin account stored in environment variables. */
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminEmail || !adminHash) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD_HASH must be set.");
  if (!BCRYPT_FORMAT.test(adminHash)) {
    throw new Error("ADMIN_PASSWORD_HASH is not a valid bcrypt hash. In .env every $ must be written as \\$ (the hash-password script prints it correctly).");
  }

  const emailMatches = email.trim().toLowerCase() === adminEmail;
  const passwordMatches = await bcrypt.compare(password, emailMatches ? adminHash : getDummyHash());
  return emailMatches && passwordMatches;
}

/** Is the visitor logged in as admin? Reads and verifies the session cookie. */
export async function getAdminSession(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : false;
}

/** For admin PAGES: sends visitors who are not logged in to the login page. */
export async function requireAdminPage(): Promise<void> {
  if (!(await getAdminSession())) redirect("/admin/login");
}

/** For admin API ROUTES: returns a 401 response when not logged in, otherwise null. Use it first in every handler. */
export async function requireAdminApi(): Promise<NextResponse | null> {
  if (await getAdminSession()) return null;
  return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401, headers: { "Cache-Control": "no-store" } });
}