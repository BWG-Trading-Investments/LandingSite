/**
 * The legal documents that exist as routes.
 *
 * Single source of truth: the router uses it to render, and the prerenderer
 * uses it to decide which /legal/* pages to emit as static HTML. Adding a
 * document here is enough to make it build.
 *
 * This file is the route manifest and nothing more. It is imported eagerly —
 * app.routes.ts reads it to title the route — so the documents themselves live
 * in legal-content.data.ts, which only the lazily loaded page pulls in. Several
 * pages of policy text have no business in the bundle every visitor downloads.
 */
export const LEGAL_DOCS = ['privacy', 'terms'] as const;

export type LegalDoc = (typeof LEGAL_DOCS)[number];

/**
 * The published name of each document, and the one place it is written.
 *
 * Deliberately partial: a slug is listed in LEGAL_DOCS as soon as it is routed,
 * but it earns a name here only once there is a document to name. `terms` is
 * routed and has no copy yet, so it falls back to the generic title below and
 * the page renders its "not yet published" state.
 */
export const LEGAL_DOC_TITLES: Partial<Record<LegalDoc, string>> = {
  privacy: 'Privacy Policy',
};

/** The document's name for the route title and its heading. */
export const legalDocTitle = (slug: string): string =>
  LEGAL_DOC_TITLES[slug as LegalDoc] ?? 'Legal';
