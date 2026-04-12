interface VideoEssayProps {
  html: string;
}

export function VideoEssay({ html }: VideoEssayProps) {
  if (!html) return null;
  return (
    <div className="reading-theme">
      <article
        className="essay-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
