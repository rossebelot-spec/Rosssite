import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { essays } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const [essay] = await db
    .select()
    .from(essays)
    .where(and(eq(essays.slug, slug), eq(essays.published, true)));
  if (!essay) return {};
  return { title: essay.title, description: essay.description };
}

export default async function EssayPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();
  const [essay] = await db
    .select()
    .from(essays)
    .where(and(eq(essays.slug, slug), eq(essays.published, true)));

  if (!essay) notFound();

  return (
    <main className="mx-auto w-full max-w-screen-sm px-6 py-16">
      <header className="mb-10 border-b border-border pb-8">
        <time className="text-xs tracking-widest uppercase text-muted-foreground">
          {essay.publishedAt
            ? new Date(essay.publishedAt).toLocaleDateString("en-CA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : ""}
        </time>
        <h1 className="font-heading text-4xl mt-2">{essay.title}</h1>
        {essay.description && (
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {essay.description}
          </p>
        )}
        {essay.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {essay.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs tracking-widest uppercase">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <article
        className="prose prose-invert prose-sm max-w-none font-sans leading-relaxed"
        dangerouslySetInnerHTML={{ __html: essay.bodyHtml }}
      />
    </main>
  );
}
