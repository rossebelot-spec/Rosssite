import { redirect } from "next/navigation";

/** Old URL; canonical bio lives at `/about`. */
export default function AboutBioRedirect() {
  redirect("/about");
}
