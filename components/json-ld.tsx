"use client";

/**
 * Injects JSON-LD structured data via useServerInsertedHTML so the <script>
 * tag is emitted into the SSR'd HTML but is never part of the client-side
 * React component tree. This avoids the React 19 warning:
 * "Encountered a script tag while rendering React component."
 */
import { useServerInsertedHTML } from "next/navigation";

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  useServerInsertedHTML(() => (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  ));
  // Renders nothing on the client — the script is already in the SSR'd HTML.
  return null;
}
