import type { Metadata } from "next";
import { opEds } from "@/data/op-eds";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = { title: "Op-eds" };

export default function OpEdsPage() {
  const sorted = [...opEds].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <main className="mx-auto w-full max-w-screen-md px-6 py-16">
      <SectionHeader
        title="Op-eds"
        description="Published opinion and analysis on energy, climate, and the environment."
      />
      <ul className="divide-y divide-border">
        {sorted.map((item) => (
          <li key={item.url} className="py-8">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="flex items-baseline gap-4">
                <time className="text-xs tracking-widest uppercase text-muted-foreground shrink-0">
                  {new Date(item.date).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span className="text-xs tracking-widest uppercase text-warm-accent">
                  {item.publication}
                </span>
              </div>
              <h2 className="font-heading text-2xl mt-1 group-hover:text-warm-accent transition-colors">
                {item.title}
              </h2>
              {item.summary && (
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                  {item.summary}
                </p>
              )}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
