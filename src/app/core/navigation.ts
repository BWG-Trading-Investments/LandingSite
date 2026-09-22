/**
 * Site navigation — the single source of truth.
 *
 * The desktop bar and the mobile panel both render from NAV_ITEMS; neither holds
 * its own copy of the list. Adding, reordering or renaming a link here changes
 * both at once, and the `01`–`08` numerals in the mobile panel come from the
 * array index rather than being written out by hand.
 */

/**
 * How a link resolves.
 *
 * `anchor` — a section on the homepage. Clicking it scrolls, and from another
 *            route it navigates home first. See ScrollSpyService.goToSection.
 * `route`  — a real router path with its own page.
 */
export type NavKind = 'anchor' | 'route';

export interface NavItem {
  readonly label: string;
  readonly kind: NavKind;
  /** A section id for `anchor`, an absolute router path for `route`. */
  readonly target: string;
  /**
   * Every section this link should light up for, when that is more than one.
   *
   * The page has more sections than the bar has links, so some links stand for a
   * run of them. Without this, scrolling into a section no link claims left the
   * previous link lit — standing on `statement` lit the link for a section
   * further down, which is both the wrong link and ahead of the reader.
   *
   * `target` stays what clicking the link scrolls to. This is only about which
   * sections mark it active. Omit it and the link owns `target` alone.
   */
  readonly sections?: readonly string[];
}

/**
 * The eight primary links, in bar order.
 *
 * Home and Contact us were deliberately absent at first, on the reasoning that
 * the logo and the CTA already covered them. That call has been reversed — both
 * are explicit links now.
 *
 * The index of each entry is load-bearing: the mobile panel numbers its links
 * from it, so this array's order is what produces 01–08.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  // Home covers the opening run of the page: the hero and the statement that
  // follows it. Clicking still goes to `hero`.
  { label: 'Home', kind: 'anchor', target: 'hero', sections: ['hero', 'statement'] },
  { label: 'About BWG', kind: 'anchor', target: 'about' },
  { label: 'Our Ecosystem', kind: 'anchor', target: 'ecosystem' },
  // Our Leaders covers the whole leadership run: the Board of Directors, the
  // spotlight on its chairman, and the roster of the people behind the group.
  // Clicking goes to `board`, the first of the three in document order, so the
  // reader arrives at the top of the leadership story rather than partway down
  // it. The target follows that order — if these three are ever rearranged
  // again, it is whichever one comes first.
  {
    label: 'Our Leaders',
    kind: 'anchor',
    target: 'board',
    sections: ['board', 'ceo-spotlight', 'leaders'],
  },
  { label: 'Our Projects', kind: 'anchor', target: 'projects' },
  { label: 'Partnerships', kind: 'anchor', target: 'partnerships' },
  { label: 'Invest', kind: 'anchor', target: 'invest' },
  { label: 'Contact us', kind: 'anchor', target: 'contact' },
];

/**
 * The single call to action, rendered as a button rather than a link.
 *
 * It shares a destination with the Contact us link above. That is intentional —
 * one is navigation, one is an affordance — but only the link is allowed to
 * carry aria-current, so assistive technology is not told about the same
 * destination twice. See Navbar.currentFor.
 */
export const NAV_CTA: NavItem = {
  label: 'Get in Touch',
  kind: 'anchor',
  target: 'contact',
};

/**
 * Does this link stand for the section currently in view?
 *
 * The mapping lives here rather than in the navbar so there is one answer to the
 * question, and so a link that grows to cover another section is a one-line
 * change to NAV_ITEMS instead of an edit in two files.
 */
export function ownsSection(item: NavItem, activeId: string | null): boolean {
  if (item.kind !== 'anchor' || activeId === null) {
    return false;
  }
  return (item.sections ?? [item.target]).includes(activeId);
}

/**
 * Every homepage section, in scroll order.
 *
 * HomePage renders these ids and hands the list to the scroll-spy, which relies
 * on the order being document order when more than one section sits inside the
 * observer's active band.
 */
export const SECTION_IDS = [
  'hero',
  'statement',
  'about',
  'ecosystem',
  'board',
  'ceo-spotlight',
  'leaders',
  'projects',
  'partnerships',
  'invest',
  'contact',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];
