import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-screen-lg px-6 py-16">
      <p className="text-muted-foreground text-sm mb-4">Collection not found.</p>
      <Link href="/op-eds" className="text-sm underline underline-offset-4">
        Back to Op-eds
      </Link>
    </main>
  );
}
