import Link from "next/link";
import { opEds } from "@/data/op-eds";

export default function AdminOpEdsPage() {
  const sorted = [...opEds].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl">Op-eds</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-8">
        Op-eds link to external publications. Edit{" "}
        <code className="text-xs bg-surface px-1 py-0.5 rounded">data/op-eds.ts</code>{" "}
        to add or remove entries.
      </p>
      <ul className="divide-y divide-border">
        {sorted.map((item) => (
          <li key={item.url} className="py-5">
            <div className="flex items-baseline gap-3">
              <time className="text-xs tracking-widest uppercase text-muted-foreground">
                {new Date(item.date).toLocaleDateString("en-CA")}
              </time>
              <span className="text-xs tracking-widest uppercase text-warm-accent">
                {item.publication}
              </span>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-heading text-xl mt-1 block hover:text-warm-accent transition-colors"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
