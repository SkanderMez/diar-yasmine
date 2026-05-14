interface PropertyStoryCalloutProps {
  eyebrow?: string;
  title: string;
  body: string;
}

/**
 * Maquette `.story-callout` — sand-bg block with a giant decorative quote
 * mark in turquoise-light at 15% opacity, then a script eyebrow, italic
 * Fraunces heading and soft body copy.
 */
export function PropertyStoryCallout({
  eyebrow = "L'histoire du nom",
  title,
  body,
}: PropertyStoryCalloutProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-sand p-8">
      <span
        aria-hidden
        className="pointer-events-none absolute right-5 top-[-20px] select-none font-heading text-turquoise-light"
        style={{ fontSize: "12rem", lineHeight: 0.8, opacity: 0.2 }}
      >
        &ldquo;
      </span>
      <div className="relative">
        <p className="mb-2 font-script text-[1.3rem] font-semibold text-primary">
          {eyebrow}
        </p>
        <h3 className="mb-3 font-heading text-2xl italic text-charcoal">
          {title}
        </h3>
        <p className="text-charcoal-soft">{body}</p>
      </div>
    </div>
  );
}
