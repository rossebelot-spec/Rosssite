/** Shared site navigation links for `Nav` and collection reader menu overlay. */
export const siteNavLinks = [
  { href: "/", label: "Home" },
  { href: "/essays", label: "Essays" },
  { href: "/op-eds", label: "Op-eds" },
  { href: "/book-reviews", label: "Books" },
  { href: "/photography", label: "Photography" },
  { href: "/video", label: "Video" },
  { href: "/press", label: "Press" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
] as const;

export const siteNavLinksWithAdmin = [
  ...siteNavLinks,
  { href: "/admin", label: "Admin" },
] as const;
