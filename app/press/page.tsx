import type { Metadata } from "next";
import { pressItems } from "@/data/press";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = { title: "Press" };

export default function PressPage() {
  const sorted = [...pressItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <main className="mx-auto w-full max-w-screen-md px-6 py-16">
      <SectionHeader title="Press" />
      {sorted.length === 0 ? (
        <p className="text-muted-foreground text-sm">No press items yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {sorted.map((item, i) => (
            <li key={i} className="py-6">
              <div className="flex items-baseline gap-4">
                <time className="text-xs tracking-widest uppercase text-muted-foreground shrink-0">
                  {new Date(item.date).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "long",
                  })}
                </time>
                <span className="text-xs tracking-widest uppercase text-warm-accent">
                  {item.outlet}
                </span>
              </div>
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-heading text-xl mt-1 block hover:text-warm-accent transition-colors"
                >
                  {item.title}
                </a>
              ) : (
                <p className="font-heading text-xl mt-1">{item.title}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
