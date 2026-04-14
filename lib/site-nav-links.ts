/** Shown beside the site name in the header (main nav + minimal collection chrome). */
export const siteHeaderTagline =
  "Poet · Journalist · Filmmaker · Translator";

/** Shared site navigation links for `Nav` and collection reader menu overlay. */
export const siteNavLinks = [
  { href: "/", label: "Home" },
  { href: "/multimedia", label: "Multimedia" },
  { href: "/work", label: "Works" },
  { href: "/happenings", label: "Happenings" },
  { href: "/about", label: "About" },
] as const;

export const siteNavLinksWithAdmin = [
  ...siteNavLinks,
  { href: "/admin", label: "Admin" },
] as const;
