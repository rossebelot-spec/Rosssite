/**
 * Single source for `ALLOWED_ADMIN_EMAILS` parsing (comma-separated, case-insensitive).
 * Used by NextAuth callbacks, requireAdmin(), and requireApiSession().
 */
export function parseAllowedAdminEmails(): string[] {
  return (process.env.ALLOWED_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  const allowed = parseAllowedAdminEmails();
  if (allowed.length === 0) return false;
  return allowed.includes((email ?? "").toLowerCase());
}
