import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "ichtys_session";
const SESSION_DURATION_DAYS = 14;

type SessionData = {
  email: string;
};

function getSessionSecret(): string {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "APP_SESSION_SECRET no configurada. Define un secreto fuerte para firmar sesion."
    );
  }
  return secret;
}

async function getSecretKey(): Promise<Uint8Array> {
  return new TextEncoder().encode(getSessionSecret());
}

export async function createSessionToken(email: string): Promise<string> {
  const secret = await getSecretKey();
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(secret);
}

export async function verifySessionToken(
  token: string
): Promise<SessionData | null> {
  try {
    const secret = await getSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    const email = typeof payload.email === "string" ? payload.email : "";
    if (!email) {
      return null;
    }
    return { email };
  } catch {
    return null;
  }
}

export async function setSessionCookie(email: string) {
  const token = await createSessionToken(email);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionFromCookies(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function getSessionFromRequest(
  request: NextRequest
): Promise<SessionData | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

