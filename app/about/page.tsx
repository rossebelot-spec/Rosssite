import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-screen-sm px-6 py-16">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="font-heading text-4xl">Ross Belot</h1>
      </header>
      <div className="text-muted-foreground leading-relaxed space-y-4 text-sm">
        <p>
          Ross Belot is a poet, journalist, and environmental writer based in
          Canada. His work spans poetry, long-form journalism, photography, and
          video.
        </p>
        <p>
          He is a 2016 CBC Poetry Prize finalist and the author of{" "}
          <em>Moving to Climate Change Hours</em>.
        </p>
        <p>
          His writing on energy and the environment has appeared in{" "}
          <em>Maclean&rsquo;s</em>, <em>Canada&rsquo;s National Observer</em>,
          and elsewhere.
        </p>
      </div>
    </main>
  );
}
