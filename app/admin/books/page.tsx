import Link from "next/link";
import Image from "next/image";
import { getDb } from "@/db";
import { books } from "@/db/schema";
import { asc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminBooksPage() {
  const db = getDb();
  const rows = await db
    .select()
    .from(books)
    .orderBy(asc(books.displayOrder), asc(books.year));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl">Books</h1>
        <Link
          href="/admin/books/new"
          className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
        >
          New book
        </Link>
      </div>
      <p className="text-muted-foreground text-sm mb-8 max-w-prose">
        Published poetry collections shown in the Books section of{" "}
        <Link href="/literary" className="text-warm-accent hover:underline">
          /literary
        </Link>
        .
      </p>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No books yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((book) => (
            <li key={book.id} className="py-5 flex items-start gap-4">
              <div className="shrink-0 w-14 h-20 relative overflow-hidden bg-muted rounded">
                {book.coverImageUrl ? (
                  <Image
                    src={book.coverImageUrl}
                    alt={book.title}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-muted-foreground text-[9px] px-1 text-center">
                    No cover
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Link
                    href={`/admin/books/${book.id}`}
                    className="font-heading text-lg hover:text-warm-accent transition-colors"
                  >
                    {book.title}
                  </Link>
                  <Badge variant={book.published ? "default" : "secondary"}>
                    {book.published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {book.publisher} · {book.year}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
