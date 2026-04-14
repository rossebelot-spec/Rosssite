import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
}

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="mb-12 border-b border-border pb-6">
      <h1 className="font-heading text-4xl tracking-wide">{title}</h1>
      {description && (
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed max-w-prose">
          {description}
        </p>
      )}
    </div>
  );
}

interface SectionSubheadingProps {
  children: React.ReactNode;
  className?: string;
}

/** Uppercase rail label for subsections (same weight as News date/kind lines). */
export function SectionSubheading({ children, className }: SectionSubheadingProps) {
  return (
    <h2
      className={cn(
        "text-xs tracking-widest uppercase text-muted-foreground",
        className
      )}
    >
      {children}
    </h2>
  );
}
