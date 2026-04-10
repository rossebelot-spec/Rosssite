import Link from "next/link";

export default function CollectionNotFound() {
  return (
    <main className="mx-auto w-full max-w-screen-xl px-6 py-16 text-center">
      <h1 className="font-heading text-3xl mb-4">Collection Not Found</h1>
      <p className="text-muted-foreground text-sm mb-8">
        The collection you&rsquo;re looking for doesn&rsquo;t exist or
        isn&rsquo;t published yet.
      </p>
      <Link
        href="/video"
        className="text-xs tracking-widest uppercase px-4 py-2 border border-border hover:border-warm-accent hover:text-warm-accent transition-colors"
      >
        Back to Video
      </Link>
    </main>
  );
}
