import { type LegalDoc } from './legal-docs.data';

/**
 * The bodies of the legal documents.
 *
 * Separate from legal-docs.data.ts on purpose. That file is the route manifest
 * and is imported eagerly by app.routes.ts to title the route; this one holds
 * the copy and is reached only from the lazily loaded legal page. Keeping them
 * apart is what stops several pages of policy text from being downloaded by
 * every visitor to the homepage.
 */

/** A block of contact details, printed at the foot of a document. */
export interface LegalContact {
  readonly entity: string;
  readonly email: string;
  readonly addressLines: readonly string[];
}

/**
 * One numbered section of a document.
 *
 * Every field below `heading` is optional, and the template renders only what a
 * section actually has: a section with no list does not render an empty one.
 * `body` runs before the list and `closing` after it, which is the order these
 * documents read in.
 */
export interface LegalSection {
  /** The in-page anchor. Used by the contents list and the heading's id. */
  readonly id: string;
  readonly heading: string;
  readonly body?: readonly string[];
  readonly list?: readonly string[];
  readonly closing?: readonly string[];
  readonly contact?: LegalContact;
}

export interface LegalDocument {
  readonly slug: LegalDoc;
  /** Printed under the title, and the date the copy below was last changed. */
  readonly updated: string;
  readonly intro: string;
  readonly sections: readonly LegalSection[];
}

/**
 * The privacy policy.
 *
 * Written against what this site verifiably does, not against a template. The
 * three statements that matter — no cookies or storage, no analytics, no form —
 * are properties of the code: nothing in the app writes to localStorage,
 * sessionStorage or document.cookie (see core/theme.service.ts, which says so
 * of the theme toggle in particular), index.html loads no analytics or tag
 * manager, and the contact section is mailto: and tel: links rather than a
 * form. Google Fonts is the one third-party origin the site loads, so it is the
 * one named here.
 *
 * Jurisdiction is Egypt — Law No. 151 of 2018 — which is what the rights and
 * children's sections are framed against.
 */
const PRIVACY: LegalDocument = {
  slug: 'privacy',
  updated: '6 September 2026',
  intro:
    'Business World Group (BWG) respects the privacy of everyone who visits this website. This policy explains what this site does and does not collect, what happens to information you choose to send us, and the rights available to you under Egyptian data protection law.',
  sections: [
    {
      id: 'introduction',
      heading: 'Introduction',
      body: [
        'This Privacy Policy describes how Business World Group (BWG) handles personal data in connection with this website. It is written to be read alongside Egypt’s Personal Data Protection Law (Law No. 151 of 2018), which is the law that governs it.',
        'It applies to this website only. Where a page links out to a site operated by someone else, that site is governed by its own privacy policy and not by this one.',
        'This site is published for corporate, partnership and investor audiences. It is informational: there is nothing on it to sign up for, log in to, or submit.',
      ],
    },
    {
      id: 'information-we-collect',
      heading: 'Information We Collect',
      body: [
        'The website itself collects nothing. It is delivered as pre-built static pages, and it contains no contact form, no account or login, no comment field, no file upload, and no analytics or tracking of any kind. No page on this site asks you for personal data or transmits personal data to BWG.',
        'We receive personal data in one circumstance only: when you choose to contact us yourself, using the details published on this site.',
      ],
      list: [
        'By email — if you write to us, we receive your email address, the name your email account sends under, and whatever you choose to put in your message and its attachments.',
        'By telephone — if you call us, we receive your telephone number and whatever you choose to tell us during the call.',
      ],
      closing: [
        'That is the whole of it. We do not obtain personal data about visitors from data brokers or other third parties, we do not build profiles of visitors, and we do not sell, rent or trade personal data.',
      ],
    },
    {
      id: 'how-we-use-information',
      heading: 'How We Use Information',
      body: ['We use what you send us only for the purpose you sent it for:'],
      list: [
        'to read your enquiry, answer it, and correspond with you about it;',
        'to discuss a partnership, investment, supply or other commercial relationship, where that is the subject of your enquiry;',
        'to keep an ordinary record of our business correspondence, and to establish, exercise or defend a legal claim if one arises.',
      ],
      closing: [
        'We do not use your information for automated decision-making or profiling. We do not add correspondents to a marketing list, and we do not send marketing to an address that reached us through an enquiry unless you have asked us to.',
      ],
    },
    {
      id: 'cookies',
      heading: 'Cookies and Similar Technologies',
      body: [
        'This website sets no cookies. It also writes nothing to your browser’s local storage or session storage, and it runs no tracking pixel, advertising tag, session recorder or analytics script on any page.',
        'Nothing is stored on your device by this site, and nothing about your visit is retained. That is why you are not asked to accept cookies here and why there are no cookie settings to manage — there is nothing to consent to and nothing to switch off.',
      ],
    },
    {
      id: 'third-party-services',
      heading: 'Third-Party Services',
      body: [
        'This site loads its typefaces from Google Fonts, at fonts.googleapis.com and fonts.gstatic.com. To send the font files to your browser, Google receives your IP address and standard request information such as your browser type and operating system. BWG does not receive that information, cannot access it, and does not use it. Google’s handling of it is governed by Google’s own privacy policy.',
        'Google Fonts is the only third-party service this website loads. There is no analytics provider, no advertising network, no social media pixel, no chat widget and no embedded third-party content anywhere on this site.',
        'The site is delivered as pre-built static pages and runs no server-side application that records who visits it. No visitor log, IP record or browsing history is created or kept by BWG.',
      ],
    },
    {
      id: 'data-storage-and-security',
      heading: 'Data Storage and Security',
      body: [
        'Correspondence you send us is held in BWG’s ordinary business email and telephone systems, and is available only to the BWG personnel who need it in order to deal with your enquiry.',
        'We apply reasonable technical and organisational measures to protect personal data in our possession against loss, misuse, and unauthorised access, alteration or disclosure. This website is served to your browser over an encrypted HTTPS connection.',
        'No method of transmitting information over the internet and no method of electronic storage is completely secure, and we cannot guarantee absolute security. Email in particular is not a secure channel: please do not send us sensitive personal data, identity documents, banking details or confidential material in an unsolicited email.',
      ],
    },
    {
      id: 'data-retention',
      heading: 'Data Retention',
      body: [
        'Because the website collects nothing, there is no visitor data for us to keep.',
        'Correspondence you send us is kept for as long as it is needed for the purpose it was sent for, and after that for as long as we are required to keep business records or may reasonably need it to establish, exercise or defend a legal claim. Once neither applies, it is deleted.',
        'You can ask us to delete your correspondence sooner. See Your Rights below.',
      ],
    },
    {
      id: 'your-rights',
      heading: 'Your Rights',
      body: [
        'Under Egypt’s Personal Data Protection Law (Law No. 151 of 2018), you have the following rights in respect of personal data we hold about you:',
      ],
      list: [
        'to know whether we hold personal data about you, and to access and view it;',
        'to withdraw a consent you have given us to keep or process your personal data;',
        'to have your personal data corrected, amended, updated, completed or erased;',
        'to limit our processing of your personal data to a defined purpose;',
        'to be informed of any breach or violation affecting your personal data;',
        'to object to the processing of your personal data, or to its results, where that processing conflicts with your fundamental rights and freedoms.',
      ],
      closing: [
        'To exercise any of these, write to us using the details below. We may need to ask you for enough information to satisfy ourselves who you are and to locate the correspondence you are asking about. We will respond within the period the applicable law requires, and we do not charge for this.',
        'If you are outside Egypt, your local law may give you further or different rights. Write to us and we will deal with your request.',
      ],
    },
    {
      id: 'childrens-privacy',
      heading: 'Children’s Privacy',
      body: [
        'This is a corporate and investor-facing website. It is not directed at children, none of its content is aimed at or intended for them, and it offers nothing for a child to sign up for or submit.',
        'We do not knowingly collect personal data from children. Under Egyptian law, processing a child’s personal data requires the consent of the holder of guardianship over that child.',
        'If you believe a child has sent us personal data, please contact us and we will delete it.',
      ],
    },
    {
      id: 'changes',
      heading: 'Changes to This Privacy Policy',
      body: [
        'We may update this policy from time to time — to reflect a change in what the website does, a change in how we handle enquiries, or a change in the law.',
        'When we do, we will publish the revised policy on this page and change the date shown beneath the title. That date is always the date of the version you are reading. Where a change is material, we will make that clear on this page rather than relying on the date alone.',
        'Please review this page from time to time. Continuing to use the site after a change is published means the revised policy applies to your use of it.',
      ],
    },
    {
      id: 'contact',
      heading: 'Contact Information',
      body: [
        'For any question about this Privacy Policy, or to exercise any of the rights described above, contact us at:',
      ],
      contact: {
        entity: 'Business World Group (BWG)',
        email: 'info@bwg-trading.com',
        addressLines: [
          'Sama Towers, Tower Z, 9th Floor, Office 91',
          'Zahraa El Maadi, Maadi Ring Road',
          'Cairo, Egypt',
        ],
      },
      closing: [
        'If you are not satisfied with how we have handled your personal data, you may also complain to the Personal Data Protection Centre in Egypt, which supervises the application of Law No. 151 of 2018.',
      ],
    },
  ],
};

/**
 * The published documents, by slug.
 *
 * Deliberately partial: LEGAL_DOCS lists the routes that exist, and this lists
 * the ones that have copy. `terms` is a route with no document yet, and the
 * page renders an honest "not published" state for it rather than inventing
 * terms nobody has written.
 */
const DOCUMENTS: Partial<Record<LegalDoc, LegalDocument>> = {
  privacy: PRIVACY,
};

/** The document for a raw route param, or null when there is nothing to show. */
export const findLegalDoc = (slug: string): LegalDocument | null =>
  DOCUMENTS[slug as LegalDoc] ?? null;
