import type { Metadata } from "next";
import { AuthorBio } from "@/components/author-bio";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-screen-sm px-6 py-16">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="font-heading text-4xl">Ross Belot</h1>
      </header>
      <div className="text-muted-foreground leading-relaxed text-sm">
        <AuthorBio />
      </div>
    </main>
  );
}
