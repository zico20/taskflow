/**
 * Brand aurora backdrop. Purely decorative, fixed behind all content, so the
 * Liquid Glass surfaces have something colourful to refract. Hidden when the
 * user prefers reduced transparency (see globals.css).
 */
export function Backdrop() {
  return <div className="tf-aurora" aria-hidden="true" />;
}
