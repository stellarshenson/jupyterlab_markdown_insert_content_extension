/**
 * Hierarchical numbering at the start of heading text, with or without the
 * trailing dot: "1 ", "1.2 ", "1. ", "1.2.3. ". The dotless form is the
 * default the extension writes, so a heading that starts with a bare number
 * and a space ("2024 Report") counts as numbered.
 */
export const NUMBERING_PATTERN = /^\d+(\.\d+)*\.?\s+/;

/**
 * Removes hierarchical numbering from heading text
 * Examples:
 *   "1 Introduction" -> "Introduction"
 *   "1.2.3. Deep Section" -> "Deep Section"
 */
export function stripNumbering(text: string): string {
  return text.replace(NUMBERING_PATTERN, '');
}

/**
 * Generates the anchor ID JupyterLab gives a rendered heading: the heading's
 * text content, case preserved, each space replaced with a hyphen.
 * Examples:
 *   "Technology Decision Summary" -> "Technology-Decision-Summary"
 *   "CPL-1: User Experience" -> "CPL-1:-User-Experience"
 *   "The `run` command" -> "The-run-command"
 */
export function generateHeadingId(text: string): string {
  return (
    text
      // Remove trailing pilcrow (¶) if present
      .replace(/¶+$/, '')
      // Rendering drops inline markup, so the ID must not carry it.
      // shortcut: one pass over code spans, *emphasis* and links - markup
      // nested inside other markup and _underscore_ emphasis stay; parse the
      // heading with the markdown renderer if those turn up in headings
      .replace(
        /`([^`]+)`|\*\*(\S(?:.*?\S)??)\*\*|\*(\S(?:.*?\S)??)\*|!?\[([^\]]*)\]\([^)]*\)/g,
        (_, code, bold, emphasis, link) => code ?? bold ?? emphasis ?? link
      )
      .trim()
      .replace(/\s+/g, '-')
  );
}
