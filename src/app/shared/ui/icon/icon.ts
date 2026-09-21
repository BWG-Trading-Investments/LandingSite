import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The names this component can draw. Adding one means adding a case below and
 * nothing else — the leader data references icons by name, so a typo is a
 * compile error rather than a blank space on the page.
 */
export type IconName =
  | 'compass'
  | 'megaphone'
  | 'growth'
  | 'spark'
  | 'screen'
  | 'bulb'
  | 'briefcase'
  | 'book'
  | 'globe'
  | 'users'
  | 'pulse'
  | 'handshake'
  | 'layers'
  | 'shield'
  | 'diamond'
  | 'tag'
  | 'gear'
  | 'chip'
  | 'clock'
  | 'coins'
  | 'bullion'
  | 'fish'
  | 'jar'
  // Drawn for MADAAAD: the sectors its slide names, the capabilities it lists
  // and the supply categories the platform itself carries. Generic enough to be
  // reused — a school is a school — but nothing else asks for them yet.
  | 'school'
  | 'cap'
  | 'building'
  | 'cart'
  | 'checklist'
  | 'truck'
  | 'printer'
  | 'pen'
  | 'spray'
  | 'chair'
  // Drawn for TOMEYYA: a restaurant platform needs a till, a kitchen, a place
  // setting, a handset and a picture frame, and none of those were here.
  | 'register'
  | 'chef'
  | 'cutlery'
  | 'phone'
  | 'image';

/**
 * A line icon from the site's set.
 *
 * Drawn in the same 20-unit space and at the same 1.15 stroke weight as every
 * other icon on the site, and it inherits `currentColor`, so where it is gold is
 * decided by the stylesheet using it rather than by the icon.
 *
 * It exists because the leader cards, the project cards and the detail pages
 * behind both draw from one set; before this, an icon meant a `@switch` block
 * copied into each template.
 */
@Component({
  selector: 'bwg-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'bwg-icon' },
  styles: `
    :host {
      display: inline-flex;
    }

    svg {
      display: block;
    }
  `,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      stroke-width="1.15"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('compass') {
          <circle cx="10" cy="10" r="7.2" />
          <path d="m12.8 7.2-1.7 3.9-3.9 1.7 1.7-3.9z" />
        }
        @case ('megaphone') {
          <path d="M3.2 8.2v3.6a1 1 0 0 0 1 1h2l6.4 3.4V3.8L6.2 7.2h-2a1 1 0 0 0-1 1z" />
          <path d="M15.4 7.4a3.4 3.4 0 0 1 0 5.2" />
        }
        @case ('growth') {
          <path d="M3.2 16.4h13.6" />
          <path d="M6 16.4v-3.8M9.4 16.4v-6.2M12.8 16.4v-2.6" />
          <path d="m4.4 8.6 3.6-3.6 2.6 2.6L15.2 3" />
          <path d="M12.6 3h2.8v2.8" />
        }
        @case ('spark') {
          <path d="M10 2.6 11.7 8l5.4 1.7-5.4 1.7L10 16.8 8.3 11.4 2.9 9.7 8.3 8z" />
        }
        @case ('screen') {
          <rect x="2.8" y="4" width="14.4" height="9.4" rx="1.2" />
          <path d="M7.4 16.6h5.2M10 13.4v3.2" />
        }
        @case ('bulb') {
          <path d="M7.6 13.2a4.6 4.6 0 1 1 4.8 0v1.6H7.6z" />
          <path d="M8.4 17h3.2" />
        }
        @case ('briefcase') {
          <rect x="2.8" y="6.4" width="14.4" height="9.6" rx="1.2" />
          <path d="M7.4 6.4V5.2a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4v1.2" />
          <path d="M2.8 10.4h14.4" />
        }
        @case ('book') {
          <path d="M3.4 4.4h4.8A2.4 2.4 0 0 1 10 6.6v9.2a1.8 1.8 0 0 0-1.8-1.4H3.4z" />
          <path d="M16.6 4.4h-4.8A2.4 2.4 0 0 0 10 6.6v9.2a1.8 1.8 0 0 1 1.8-1.4h4.8z" />
        }
        @case ('globe') {
          <circle cx="10" cy="10" r="7.2" />
          <path
            d="M10 2.8c1.9 2 2.9 4.5 2.9 7.2s-1 5.2-2.9 7.2c-1.9-2-2.9-4.5-2.9-7.2s1-5.2 2.9-7.2z"
          />
          <path d="M3.1 7.8h13.8M3.1 12.2h13.8" />
        }
        @case ('users') {
          <circle cx="8" cy="7.4" r="2.8" />
          <path d="M2.8 16.2a5.2 5.2 0 0 1 10.4 0" />
          <path d="M13.4 5.2a2.6 2.6 0 0 1 0 4.8" />
          <path d="M15 16.2a4.6 4.6 0 0 0-1.6-3.5" />
        }
        @case ('pulse') {
          <path d="M2.6 10h3.2l1.8-4.4 3 9 1.9-4.6h4.9" />
        }
        @case ('handshake') {
          <path d="m10 7.6 2.1-2.1a1.9 1.9 0 0 1 2.7 0L17 7.7v4.4l-2.4 2.4a1.4 1.4 0 0 1-2 0L10 12.5" />
          <path d="M10 7.6 7.9 5.5a1.9 1.9 0 0 0-2.7 0L3 7.7v4.4l2.4 2.4a1.4 1.4 0 0 0 2 0L10 12.5" />
        }
        @case ('layers') {
          <path d="m10 2.8 7 3.6-7 3.6-7-3.6z" />
          <path d="m3 10.4 7 3.6 7-3.6" />
          <path d="m3 14 7 3.6L17 14" />
        }
        @case ('shield') {
          <path d="M10 2.8 16 5v4.6c0 3.5-2.4 6.5-6 7.6-3.6-1.1-6-4.1-6-7.6V5z" />
          <path d="m7.4 9.8 1.9 1.9 3.4-3.6" />
        }
        @case ('diamond') {
          <path d="M10 3.4 17 8l-7 8.6L3 8z" />
          <path d="M3 8h14M10 3.4 7.4 8l2.6 8.6L12.6 8z" />
        }
        @case ('tag') {
          <path d="M9.2 2.8H16a1.2 1.2 0 0 1 1.2 1.2v6.8l-7.4 7.4a1.2 1.2 0 0 1-1.7 0l-5.5-5.5a1.2 1.2 0 0 1 0-1.7z" />
          <circle cx="13.4" cy="6.6" r="1.2" />
        }
        @case ('gear') {
          <circle cx="10" cy="10" r="2.6" />
          <path
            d="M16.2 12a1.4 1.4 0 0 0 .3 1.5l.1.1a1.6 1.6 0 1 1-2.3 2.3l-.1-.1a1.4 1.4 0 0 0-2.4 1v.2a1.6 1.6 0 1 1-3.2 0v-.1a1.4 1.4 0 0 0-2.4-1l-.1.1a1.6 1.6 0 1 1-2.3-2.3l.1-.1a1.4 1.4 0 0 0-1-2.4H2.6a1.6 1.6 0 1 1 0-3.2h.1a1.4 1.4 0 0 0 1-2.4l-.1-.1a1.6 1.6 0 1 1 2.3-2.3l.1.1a1.4 1.4 0 0 0 2.4-1V2.6a1.6 1.6 0 1 1 3.2 0v.1a1.4 1.4 0 0 0 2.4 1l.1-.1a1.6 1.6 0 1 1 2.3 2.3l-.1.1a1.4 1.4 0 0 0 1 2.4h.2a1.6 1.6 0 1 1 0 3.2h-.1a1.4 1.4 0 0 0-1.2.4z"
          />
        }
        @case ('chip') {
          <rect x="6" y="6" width="8" height="8" rx="1.2" />
          <path
            d="M8.2 3v3M11.8 3v3M8.2 14v3M11.8 14v3M3 8.2h3M3 11.8h3M14 8.2h3M14 11.8h3"
          />
        }
        @case ('clock') {
          <circle cx="10" cy="10" r="7.2" />
          <path d="M10 5.8V10l2.8 1.8" />
        }
        @case ('coins') {
          <ellipse cx="10" cy="5.6" rx="6" ry="2.6" />
          <path d="M4 5.6v4c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-4" />
          <path d="M4 9.6v4c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-4" />
        }
        @case ('bullion') {
          <path d="M5.4 11.2h9.2l2 5H3.4z" />
          <path d="M7.4 7.2h5.2l1.4 4H6z" />
        }
        @case ('fish') {
          <path
            d="M14.4 10c-1.6 2.2-3.8 3.3-6.5 3.3S3 12.2 1.4 10c1.6-2.2 3.8-3.3 6.5-3.3s4.9 1.1 6.5 3.3z"
          />
          <path d="m14.4 10 3-2.2v4.4z" />
          <circle cx="5" cy="9.2" r="0.6" />
        }
        @case ('jar') {
          <path d="M5 5.2h10v2.2H5z" />
          <path d="M5.6 7.4h8.8l.9 8.1a1.4 1.4 0 0 1-1.4 1.5H6.1a1.4 1.4 0 0 1-1.4-1.5z" />
          <circle cx="10" cy="12" r="2.2" />
        }
        @case ('school') {
          <path d="m2.8 8 7.2-4.2L17.2 8" />
          <path d="M4.6 8v8.4h10.8V8" />
          <path d="M8.2 16.4v-3.8h3.6v3.8" />
          <path d="M10 3.8V2.2h2.4l-1 1 1 1H10" />
        }
        @case ('cap') {
          <path d="m10 3.6-7.2 3.5L10 10.6l7.2-3.5z" />
          <path d="M6 8.8v3.8c0 1.3 1.8 2.4 4 2.4s4-1.1 4-2.4V8.8" />
          <path d="M17.2 7.1v4.5" />
        }
        @case ('building') {
          <path d="M3.4 16.6V5a1.2 1.2 0 0 1 1.2-1.2h5.2A1.2 1.2 0 0 1 11 5v11.6" />
          <path d="M11 8.6h4.4a1.2 1.2 0 0 1 1.2 1.2v6.8" />
          <path d="M5.8 6.8h2.8M5.8 9.6h2.8M5.8 12.4h2.8M13 11.4h1.4M13 14h1.4" />
          <path d="M2.4 16.6h15.2" />
        }
        @case ('cart') {
          <path d="M2.6 3.8h2l1.9 8.4h7.6l1.8-6.2H6.3" />
          <path d="m8.8 8.4 1.3 1.3 2.7-2.9" />
          <circle cx="8.4" cy="15.6" r="1.3" />
          <circle cx="13.8" cy="15.6" r="1.3" />
        }
        @case ('checklist') {
          <rect x="4.2" y="2.9" width="11.6" height="14.2" rx="1.4" />
          <path d="m7 7 1 1 1.8-2" />
          <path d="m7 11.4 1 1 1.8-2" />
          <path d="M11.6 7.2h1.8M11.6 11.6h1.8" />
        }
        @case ('truck') {
          <rect x="2.4" y="5.4" width="8.4" height="7.8" rx="1.1" />
          <path d="M10.8 8.4h3l2.8 2.6v2.2h-5.8z" />
          <circle cx="6.2" cy="15.4" r="1.4" />
          <circle cx="13.8" cy="15.4" r="1.4" />
        }
        @case ('printer') {
          <path d="M6 7.4V3.8h8v3.6" />
          <rect x="2.8" y="7.4" width="14.4" height="5.8" rx="1.2" />
          <path d="M6 12h8v4.6H6z" />
          <circle cx="14.6" cy="9.6" r="0.6" fill="currentColor" stroke="none" />
        }
        @case ('pen') {
          <path d="m3.4 16.6 1-3.5 8-8 2.5 2.5-8 8z" />
          <path d="m12.4 5.1 1.9-1.9a1.2 1.2 0 0 1 1.7 0l.8.8a1.2 1.2 0 0 1 0 1.7l-1.9 1.9" />
          <path d="m4.4 13.1 2.5 2.5" />
        }
        @case ('spray') {
          <path d="M7.4 7.6h4.8a1.3 1.3 0 0 1 1.3 1.3v6.9a1.3 1.3 0 0 1-1.3 1.3H7.4a1.3 1.3 0 0 1-1.3-1.3V8.9a1.3 1.3 0 0 1 1.3-1.3z" />
          <path d="M8.4 7.6V5h3v2.6" />
          <path d="M8.4 5H6.2L4.6 3.4" />
          <path d="M6.1 11.4h7.4" />
        }
        @case ('chair') {
          <path d="M5.6 9.4V5.4a1.6 1.6 0 0 1 1.6-1.6h5.6a1.6 1.6 0 0 1 1.6 1.6v4" />
          <path d="M4.4 9.4h11.2a1.2 1.2 0 0 1 1.2 1.2v1.4a1.2 1.2 0 0 1-1.2 1.2H4.4a1.2 1.2 0 0 1-1.2-1.2v-1.4a1.2 1.2 0 0 1 1.2-1.2z" />
          <path d="M5.6 13.2v3.2M14.4 13.2v3.2" />
        }
        @case ('register') {
          <rect x="3.4" y="3.4" width="13.2" height="7.8" rx="1.2" />
          <path d="M6.4 6.2h7.2M6.4 8.6h4.2" />
          <path d="M7.4 11.2v2.2h5.2v-2.2" />
          <path d="M3.6 13.4h12.8a1.1 1.1 0 0 1 1.1 1.1v1.1a1.1 1.1 0 0 1-1.1 1.1H3.6a1.1 1.1 0 0 1-1.1-1.1v-1.1a1.1 1.1 0 0 1 1.1-1.1z" />
        }
        @case ('chef') {
          <path d="M6.2 11.2a3.3 3.3 0 1 1 1.6-6.2 3.2 3.2 0 0 1 4.4 0 3.3 3.3 0 1 1 1.6 6.2z" />
          <path d="M6.2 11.2h7.6v4.4a1.2 1.2 0 0 1-1.2 1.2H7.4a1.2 1.2 0 0 1-1.2-1.2z" />
          <path d="M8.4 13.2v1.6M11.6 13.2v1.6" />
        }
        @case ('cutlery') {
          <path d="M4.6 3v4a2.2 2.2 0 0 0 4.4 0V3" />
          <path d="M6.8 3v4M6.8 9.2V17" />
          <path d="M15.2 17V3c-1.7 0-2.6 1.4-2.6 3.4s.9 3.4 2.6 3.4" />
        }
        @case ('phone') {
          <rect x="5.6" y="2.6" width="8.8" height="14.8" rx="1.8" />
          <path d="M8.6 4.8h2.8M9 15.2h2" />
        }
        @case ('image') {
          <rect x="2.8" y="4.4" width="14.4" height="11.2" rx="1.4" />
          <circle cx="7.2" cy="8.4" r="1.2" />
          <path d="m3.4 13.9 3.8-3.5 2.6 2.3 3.1-3.3 3.5 4.5" />
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  /** Edge length in pixels. The viewBox is square, so one number does it. */
  readonly size = input(20);
}
