export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="mx-auto max-w-screen-xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          Ross Belot
        </p>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
