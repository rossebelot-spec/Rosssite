/**
 * Shared author bio copy (matches About). Used on essay footers and About page.
 */
export const siteAuthorName = "Ross Belot";

export function AuthorBio() {
  return (
    <>
      <p className="essay-bio-text">
        Ross Belot is a poet, journalist, and environmental writer based in Canada. His work
        spans poetry, long-form journalism, photography, and video.
      </p>
      <p className="essay-bio-text">
        He is a 2016 CBC Poetry Prize finalist and the author of{" "}
        <em>Moving to Climate Change Hours</em>.
      </p>
      <p className="essay-bio-text">
        His writing on energy and the environment has appeared in <em>Maclean&rsquo;s</em>,{" "}
        <em>Canada&rsquo;s National Observer</em>, and elsewhere.
      </p>
    </>
  );
}
