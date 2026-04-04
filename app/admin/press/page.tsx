import { pressItems } from "@/data/press";

export default function AdminPressPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl mb-8">Press</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Edit{" "}
        <code className="text-xs bg-surface px-1 py-0.5 rounded">data/press.ts</code>{" "}
        to add or remove press entries.
      </p>
      {pressItems.length === 0 ? (
        <p className="text-muted-foreground text-sm">No press entries yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {pressItems.map((item, i) => (
            <li key={i} className="py-4">
              <p className="font-heading text-lg">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.outlet} &middot; {new Date(item.date).toLocaleDateString("en-CA")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
