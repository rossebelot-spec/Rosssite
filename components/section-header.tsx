interface SectionHeaderProps {
  title: string;
  description?: string;
}

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="mb-12 border-b border-border pb-6">
      <h1 className="font-heading text-4xl tracking-wide">{title}</h1>
      {description && (
        <p className="mt-2 text-muted-foreground text-sm">{description}</p>
      )}
    </div>
  );
}
