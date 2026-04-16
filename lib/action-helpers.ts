import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { collections, collectionItems } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isAllowedAdminEmail } from "@/lib/admin-allowlist";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");
  if (!isAllowedAdminEmail(session.user.email)) {
    redirect("/api/auth/signin");
  }
}

/** Renumber `position` 0..n-1 for all rows in a collection (Neon HTTP: sequential updates). */
export async function reindexCollectionItemPositions(collectionId: number) {
  const db = getDb();
  const remaining = await db
    .select({ id: collectionItems.id })
    .from(collectionItems)
    .where(eq(collectionItems.collectionId, collectionId))
    .orderBy(asc(collectionItems.position));
  for (let i = 0; i < remaining.length; i++) {
    await db
      .update(collectionItems)
      .set({ position: i })
      .where(eq(collectionItems.id, remaining[i].id));
  }
}

export function contentPrimaryPaths(type: string, slug: string): string[] {
  if (type === "about") {
    return ["/about"];
  }
  if (type === "essay" || type === "blog") {
    return ["/essays", `/essays/${slug}`];
  }
  if (type === "event") {
    return ["/events", `/events/${slug}`];
  }
  return [];
}

export async function getCollectionSlugsForVideo(
  videoId: number
): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ slug: collections.slug })
    .from(collectionItems)
    .innerJoin(collections, eq(collectionItems.collectionId, collections.id))
    .where(
      and(
        eq(collectionItems.linkedType, "video"),
        eq(collectionItems.linkedId, videoId)
      )
    );
  return rows.map((r) => r.slug);
}

export function isVercelBlobStorageUrl(url: string | null | undefined): boolean {
  return !!url && url.includes(".blob.vercel-storage.com");
}
