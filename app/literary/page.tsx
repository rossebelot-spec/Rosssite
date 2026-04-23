import type { Metadata } from "next";
import Image from "next/image";
import { getDb } from "@/db";
import { books, literaryPublications } from "@/db/schema";
import { asc, eq, desc } from "drizzle-orm";
import { absoluteUrl } from "@/lib/seo";
import { SectionHeader } from "@/components/section-header";

export const dynamic = "force-dynamic";

const literaryDesc =
  "Poetry collections, journal appearances, anthology inclusions, and prize shortlists.";

export async function generateMetadata(): Promise<Metadata> {
  const db = getDb();
  const firstBook = await db
    .select({ coverImageUrl: books.coverImageUrl })
    .from(books)
    .where(eq(books.published, true))
    .orderBy(asc(books.displayOrder), asc(books.year))
    .limit(1);
  const imageUrl = firstBook[0]?.coverImageUrl ?? undefined;

  return {
    title: "Literary",
    description: literaryDesc,
    alternates: { canonical: "/literary" },
    openGraph: {
      type: "website",
      locale: "en_CA",
      siteName: "Ross Belot",
      title: "Literary | Ross Belot",
      description: literaryDesc,
      url: absoluteUrl("/literary"),
      ...(imageUrl && { images: [{ url: imageUrl }] }),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: "Literary | Ross Belot",
      description: literaryDesc,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

const KIND_LABELS: Record<string, string> = {
  journal: "Journal",
  anthology: "Anthology",
  translation: "Translation",
  prize: "Prize",
  award: "Award",
};

export default async function LiteraryPage() {
  const db = getDb();

  const [bookRows, pubRows] = await Promise.all([
    db
      .select()
      .from(books)
      .where(eq(books.published, true))
      .orderBy(asc(books.displayOrder), asc(books.year)),
    db
      .select()
      .from(literaryPublications)
      .where(eq(literaryPublications.published, true))
      .orderBy(desc(literaryPublications.date)),
  ]);

  const firstBookCoverIndex = bookRows.findIndex((b) => b.coverImageUrl);

  return (
    <main className="mx-auto w-full max-w-screen-xl px-6 py-16">
      <SectionHeader
        title="Literary"
        description="Poetry collections, journal appearances, anthology inclusions, translations, and prize shortlists."
      />

      {/* ── Books ─────────────────────────────────────────────────────── */}
      <section className="mb-20">
        <h2 className="font-heading text-2xl mb-8">Books</h2>

        {bookRows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No books listed yet.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {bookRows.map((book, i) => (
              <li key={book.id}>
                {book.buyUrl ? (
                  <a
                    href={book.buyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                    onClick={() => window.umami?.track({ event: 'book_click', label: book.title })}
                  >
                    <BookCard
                      book={book}
                      priority={i === firstBookCoverIndex}
                    />
                  </a>
                ) : (
                  <div className="group">
                    <BookCard
                      book={book}
                      priority={i === firstBookCoverIndex}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── In Print ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="font-heading text-2xl mb-8">In Print</h2>

        {pubRows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No publication appearances listed yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {pubRows.map((pub) => (
              <li key={pub.id} className="py-5 flex gap-4">
                <div className="shrink-0 w-12 text-right">
                  <time className="text-xs tracking-widest text-muted-foreground leading-relaxed">
                    {pub.date.slice(0, 4)}
                  </time>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    {pub.url ? (
                      <a
                        href={pub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-heading text-base leading-snug hover:text-warm-accent transition-colors"
                        onClick={() => window.umami?.track({ event: 'literary_publication_click', label: pub.title })}
                      >
                        {pub.title}
                      </a>
                    ) : (
                      <span className="font-heading text-base leading-snug">
                        {pub.title}
                      </span>
                    )}
                    <span className="text-[10px] tracking-widest uppercase text-muted-foreground border border-border px-1.5 py-0.5 rounded shrink-0">
                      {KIND_LABELS[pub.kind] ?? pub.kind}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pub.publication}
                  </p>
                  {pub.description && (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {pub.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

type BookRow = {
  title: string;
  subtitle: string;
  publisher: string;
  year: number;
  description: string;
  coverImageUrl: string | null;
  buyUrl: string | null;
};

function BookCard({ book, priority = false }: { book: BookRow; priority?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full aspect-[2/3] bg-muted rounded overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
        {book.coverImageUrl ? (
          <Image
            src={book.coverImageUrl}
            alt={`Cover of ${book.title}`}
            fill
            priority={priority}
            className="object-cover transition-transform group-hover:scale-[1.02]"
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <span className="font-heading text-lg text-muted-foreground leading-snug">
              {book.title}
            </span>
          </div>
        )}
      </div>
      <div>
        <h3 className="font-heading text-lg leading-snug group-hover:text-warm-accent transition-colors">
          {book.title}
        </h3>
        {book.subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{book.subtitle}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {book.publisher} · {book.year}
        </p>
        {book.description && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-4">
            {book.description}
          </p>
        )}
        {book.buyUrl && (
          <p className="text-xs tracking-widest uppercase text-warm-accent mt-3">
            Order →
          </p>
        )}
      </div>
    </div>
  );
}
