import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const COOKIE = "ftj_session";
const DAYS = 30;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const token = cookies().get(COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookies().set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  }
}

export async function getCurrentUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          profile: true,
          clientProfile: true,
          reviewsRecv: true,
        },
      },
    },
  });
  if (!session || session.expiresAt < new Date() || session.user.status !== "ACTIVE") {
    if (session) await prisma.session.deleteMany({ where: { id: session.id } });
    return null;
  }
  return session.user;
}

/** Average of published (non-hidden) reviews. */
export function avgRating(reviews: { rating: number; hidden?: boolean }[]) {
  const v = reviews.filter((r) => !r.hidden);
  if (!v.length) return null;
  const sum = v.reduce((a, r) => a + r.rating, 0);
  return Math.round((sum / v.length) * 10) / 10;
}

export function appUrl() {
  return (process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}
