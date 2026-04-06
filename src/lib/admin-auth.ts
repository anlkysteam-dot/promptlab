import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { normalizeEmail } from "@/lib/password";

/** Vercel / .env’de bazen değer `"mail@x.com"` şeklinde tırnaklı kaydedilir; eşleşmeyi bozmamak için sökülür. */
function normalizeAdminEnv(raw: string | undefined): string | null {
  if (!raw) return null;
  let s = raw.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  const n = normalizeEmail(s);
  return n || null;
}

function clerkUserEmails(u: NonNullable<Awaited<ReturnType<typeof currentUser>>>): string[] {
  const set = new Set<string>();
  const primary = u.primaryEmailAddress?.emailAddress;
  if (primary) set.add(normalizeEmail(primary));
  for (const row of u.emailAddresses ?? []) {
    if (row.emailAddress) set.add(normalizeEmail(row.emailAddress));
  }
  return [...set];
}

/** Yalnızca `ADMIN_EMAIL` ile Clerk’e giriş yapan kullanıcı erişebilir. */
export async function assertAdmin() {
  const { userId } = await auth();
  if (!userId) redirect("/auth");

  const expected = normalizeAdminEnv(process.env.ADMIN_EMAIL);
  if (!expected) redirect("/");

  const u = await currentUser();
  if (!u) redirect("/auth");

  const emails = clerkUserEmails(u);
  if (!emails.includes(expected)) redirect("/");
}

export function getAdminEmail(): string | null {
  return normalizeAdminEnv(process.env.ADMIN_EMAIL);
}
