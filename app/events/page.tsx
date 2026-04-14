import { redirect } from "next/navigation";

/** Top-level /events retired — calendar lives under About. */
export default function EventsRedirectPage() {
  redirect("/about/events");
}
