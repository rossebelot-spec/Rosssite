import { redirect } from "next/navigation";

/** Canonical public calendar is `/events`. */
export default function AboutEventsRedirect() {
  redirect("/events");
}
