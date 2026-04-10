interface VideoPoemEssayProps {
  html: string;
}

export function VideoPoemEssay({ html }: VideoPoemEssayProps) {
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
