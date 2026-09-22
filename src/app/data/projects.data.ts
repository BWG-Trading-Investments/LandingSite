import type { IconName } from '../shared/ui/icon/icon';

/**
 * The project portfolio.
 *
 * One record per project, read by both the homepage section and the detail
 * pages, so nothing about a project is written down twice — the same shape the
 * leadership roster uses in data/leaders.data.ts, and for the same reason.
 *
 * `name`, `cardSummary` and `url` are client copy, verbatim, and were the whole
 * of a project before it had a page of its own. Everything from `tagline` down
 * is the detail page: it elaborates that supplied one-liner into a sector, an
 * overview, a set of capability blocks and a list of highlights, and it makes no
 * claim the one-liner does not already support — no figures, no named partners,
 * no dates. Those go in here once BWG supplies them.
 *
 * Every block on a detail page is optional. A project with no overview, no
 * blocks or no highlights simply does not render those parts, rather than
 * rendering an empty heading.
 */

/** One of the capability blocks on a detail page. */
export interface ProjectBlock {
  readonly icon: IconName;
  readonly heading: string;
  /**
   * The line under the heading, where the material writes one. MOSHAREK's does
   * not: its slide lists what the platform provides as four named items and says
   * nothing further about them, so those blocks are a heading and a mark.
   */
  readonly body?: string;
  /**
   * The group the supplied material files this capability under, where it
   * groups them at all. Blocks carrying one are rendered together under that
   * name, in the order they appear here; a project whose material is a flat list
   * simply leaves it off, which is what all but TOMEYYA do.
   */
  readonly group?: string;
}

/** One item in a project's At a Glance grid. */
export interface ProjectHighlight {
  readonly icon: IconName;
  readonly label: string;
  /**
   * The line under the label, where the material gives each item one. Most
   * projects list their glance as bare labels and set nothing here.
   */
  readonly body?: string;
}

/**
 * The line a slide closes its description on, set in two weights: the lead-in,
 * and the part the slide emphasises.
 *
 * Two fields rather than one string with markup in it, so the copy stays plain
 * text — the emphasis is then a decision the stylesheet makes, and the wording
 * is still editable without touching a tag.
 */
export interface ProjectFocus {
  readonly lead: string;
  readonly emphasis: string;
}

export interface Project {
  /** URL segment: /projects/<slug>. */
  readonly slug: string;
  readonly name: string;
  /** The line under the name on the detail page. */
  readonly tagline: string;
  /** Where the project sits in the BWG ecosystem. Shown as a chip. */
  readonly sector: string;
  /** The mark on the card and at the head of the detail page. */
  readonly icon: IconName;
  /**
   * The live site, or null while the project has none.
   *
   * This is what decides whether the detail page offers a visit button. It is no
   * longer what decides whether the card is a link: every card now links to the
   * project's own page, and the outbound link lives there.
   */
  readonly url: string | null;
  /**
   * The host, used as the visit button's label. Kept beside `url` so nothing has
   * to parse a URL at render time, on the server or in the browser.
   */
  readonly urlLabel: string | null;
  /**
   * Card and page artwork, or null while there is none.
   *
   * These are brand marks, not photographs, so they are always fitted whole and
   * never cropped. Images belong in `src/assets/images/` and are referenced from
   * `/assets/…` — that is the directory the build actually copies; the `assets/`
   * folder at the repo root is not in angular.json and never reaches dist.
   */
  readonly image: string | null;
  /** The file's own pixel size, so the browser gets the right aspect hint. */
  readonly imageWidth: number | null;
  readonly imageHeight: number | null;
  /**
   * True when the mark needs a light ground under it.
   *
   * Two kinds of file do. One arrives on an opaque white background and cannot
   * sit straight on a dark card — it would read as a white slab. The other is
   * transparent but drawn in an ink dark enough to disappear against the dark
   * plate. Either way the answer is the same: a light plate behind it, with the
   * artwork itself never recoloured or overlaid.
   *
   * FISH LINK and MOSHAREK are both the second kind — marks cut out of the
   * lockups printed on their slides, in ink drawn for that white page. Set this
   * only for a file that genuinely needs it, and look at the file before you do:
   * a stale `true` on artwork that did not need it is a pale box on a dark card.
   */
  readonly imageOnPlate: boolean;
  /**
   * True when the artwork above is a small mark rather than a full-size one.
   *
   * MOSHAREK's is the symbol cut out of the lockup printed on its slide, and at
   * 128px across it is sharp on a card and beside a heading but soft in the
   * page's much larger frame. So the detail page sets it next to the name — the
   * way the slide sets it next to the wordmark — and leaves the project's icon
   * in the frame. A project whose artwork carries that frame leaves this unset,
   * which is what every other one does.
   */
  readonly smallMark?: boolean;
  /**
   * True when that small mark is a lockup rather than a single symbol.
   *
   * MA3DENHA's is the supplied logo whole — the symbol with its English and
   * Arabic names stacked beneath it — and three things stacked need more height
   * beside a heading than one symbol does, or the two lines of type under the
   * symbol are too small to read. MOSHAREK's is a bare symbol and leaves this
   * unset, so the two are sized for what they actually are.
   */
  readonly markIsLockup?: boolean;
  /** One line on the card, and the standfirst on the page. Client copy, verbatim. */
  readonly cardSummary: string;
  /** The opening line of the detail page, set larger than the body. */
  readonly intro: string;
  readonly overview: readonly string[];
  readonly blocks: readonly ProjectBlock[];
  readonly highlights: readonly ProjectHighlight[];
  /**
   * The heading above the highlights grid, when the supplied material names
   * that grid something of its own.
   *
   * Absent on every project that simply lists what it is at a glance, which is
   * why the page falls back to "At a Glance" rather than requiring each record
   * to repeat it. MA3DENHA sets it because its own material calls that row its
   * ecosystem partners, and calling them a glance would lose what they are.
   */
  readonly glanceHeading?: string;
  /**
   * Who the platform is built for, where the supplied material names them as a
   * list of its own rather than inside the prose.
   *
   * MADAAAD's slide does exactly that: its description ends on a colon and the
   * four sectors are set out beneath it, so they are kept as a list here rather
   * than folded back into a sentence they were never written as.
   */
  readonly serves?: readonly ProjectHighlight[];
  /** The line that closes the description, where the material sets one. */
  readonly focus?: ProjectFocus;
  /**
   * The supply categories the platform itself carries, where the material shows
   * them. Only MADAAAD's does.
   */
  readonly categories?: readonly ProjectHighlight[];
  /**
   * The separate products a project is, where it is more than one thing.
   *
   * TOMEYYA is three: a point-of-sale system, a web menu and a mobile app. They
   * are not capabilities of one product, so they are not `blocks`; a project
   * that ships as a single thing leaves this unset.
   */
  readonly experiences?: readonly ProjectBlock[];
  /**
   * The chain the material draws through the ecosystem, in order, where it
   * draws one. Rendered as a flow rather than as a grid.
   */
  readonly flow?: readonly ProjectHighlight[];
}

/** Shown in the homepage section, in this order. */
export const PROJECTS: readonly Project[] = [
  {
    slug: 'ma3danha',
    name: 'MA3DENHA',
    // The year, as every other project's slide sets it. The line it displaces
    // is not lost: it opens the overview below.
    tagline: '2026',
    sector: 'Loyalty & Financial Technology',
    icon: 'bullion',
    url: null,
    urlLabel: null,
    // The supplied logo, whole: the symbol with MA3DENHA and معدنها stacked
    // under it, every part of the artwork in assets/ma3denha_f.png and in its
    // own colours. What is not here is the white card it was exported on and
    // the rule drawn around that card — keyed out so the logo sits on the page
    // rather than in a box, with the ink recovered from under the white so no
    // edge is thickened, thinned or paled. The original file is untouched.
    //
    // It is a lockup rather than a bare mark, which is what markIsLockup says:
    // three things stacked need more height beside a heading than one symbol
    // does, or the two lines of type under the symbol stop being readable.
    //
    // imageOnPlate is for the card, and only for the card. Most of this logo is
    // drawn in black, which has nothing to stand on when the card turns dark.
    image: '/assets/images/ma3denha-logo.png',
    imageWidth: 666,
    imageHeight: 464,
    imageOnPlate: true,
    smallMark: true,
    markIsLockup: true,
    cardSummary:
      'MA3DENHA is designed to connect consumers, merchants, loyalty programs, payment providers, and precious-metal suppliers within an integrated digital ecosystem',
    intro:
      'Developed as an innovative B2B2C digital loyalty and financial technology platform that transforms customer loyalty points and rewards into precious metals, including gold, silver, and platinum',
    overview: [
      'Loyalty points and rewards, turned into precious metals',
      'MA3DENHA introduces a new approach to customer loyalty by transforming conventional points and rewards into value-based assets, creating additional value for both businesses and consumers',
      'The platform is designed to support large-scale merchant networks, financial institutions, payment providers, and strategic precious-metal partners, positioning MA3DENHA as an innovative bridge between loyalty, digital payments, and precious-metals investment',
    ],
    blocks: [
      {
        icon: 'coins',
        heading: 'Points into Metal',
        body: 'Conversion of loyalty points into precious metals',
      },
      {
        icon: 'bullion',
        heading: 'Digital Ownership',
        body: 'Digital gold, silver, and platinum ownership',
      },
      {
        icon: 'handshake',
        heading: 'Merchant Integration',
        body: 'Merchant and loyalty-program integration',
      },
      {
        icon: 'spark',
        heading: 'Rewards & Cashback',
        body: 'Customer rewards and cashback mechanisms',
      },
      {
        icon: 'screen',
        heading: 'Digital Wallet',
        body: 'Digital wallet and transaction management',
      },
      {
        icon: 'chip',
        heading: 'Payment & Financial Services',
        body: 'Integration with payment and financial service providers',
      },
      {
        icon: 'layers',
        heading: 'Supply & Fulfillment',
        body: 'Precious-metal supply and fulfillment',
      },
      {
        icon: 'pulse',
        heading: 'Analytics & Reporting',
        body: 'Business analytics and transaction reporting',
      },
    ],
    glanceHeading: 'OUR ECOSYSTEM PARTNERS',
    highlights: [
      { icon: 'handshake', label: 'Merchants' },
      { icon: 'tag', label: 'Loyalty Programs' },
      { icon: 'chip', label: 'Payment Providers' },
      { icon: 'briefcase', label: 'Financial Institutions' },
      { icon: 'bullion', label: 'Precious Metal Suppliers' },
      { icon: 'users', label: 'Consumers' },
    ],
  },

  {
    slug: 'business-hub',
    name: 'WHITE SQUARE BUSINESS HUB',
    // From the project's own slide: its name in full, the year under it as
    // every other project has, and the section of the profile it belongs to.
    // The line that used to sit here now opens the overview below.
    tagline: '2024',
    sector: '01 | Digital Transformation & Smart Platforms',
    icon: 'globe',
    url: null,
    urlLabel: null,
    image: null,
    imageWidth: null,
    imageHeight: null,
    imageOnPlate: false,
    // The slide's description is one sentence and it is the same sentence in
    // both places, so the page states it once: the summary is skipped where it
    // repeats the intro verbatim.
    cardSummary:
      'Designed, developed, and operated a specialized digital platform focused on international trade intelligence and trade facilitation',
    intro:
      'Designed, developed, and operated a specialized digital platform focused on international trade intelligence and trade facilitation',
    overview: [
      'Your Gateway to Global Trade Intelligence',
      'The platform covers information across 80+ countries, serving as a digital reference for businesses, investors, and international traders',
    ],
    // The slide's four positioning statements, in its order, each with the line
    // printed under it.
    blocks: [
      { icon: 'globe', heading: 'Global Coverage', body: '80+ Countries' },
      { icon: 'compass', heading: 'Trusted Information', body: 'Accurate. Updated. Reliable.' },
      { icon: 'layers', heading: 'Business Enablement', body: 'Empowering Global Trade' },
      { icon: 'handshake', heading: 'Smart & Secure', body: 'Digital by Design' },
    ],
    // The slide names this list rather than leaving it a glance, and what it
    // names is the line that introduces it.
    glanceHeading: 'The platform provides access to:',
    highlights: [
      { icon: 'layers', label: 'Trade laws and regulations' },
      { icon: 'tag', label: 'Customs procedures' },
      { icon: 'gear', label: 'International trade agreements' },
      { icon: 'briefcase', label: 'Import and export requirements' },
      { icon: 'chip', label: 'Investment regulations and opportunities' },
    ],
  },

  {
    slug: 'fish-link',
    name: 'FISH LINK',
    // The slide leads with the year under the wordmark, so the line that
    // normally carries a tagline carries the year here.
    tagline: '2026',
    sector: '01 | Digital Transformation & Smart Platforms',
    icon: 'fish',
    url: 'https://www.fishlink.co/',
    urlLabel: 'fishlink.co',
    // The symbol alone, cut from the lockup on the project's slide: the card
    // slot is a small square, and the mark reads there where the wordmark beside
    // it would not. Keyed off the near-white ground it is printed on, which is
    // what the plate below is for.
    //
    // Only the card reads this. FISH LINK's page is its own component and sets
    // the name in type rather than placing a file, so nothing here reaches it.
    image: '/assets/images/fish-link-mark.png',
    imageWidth: 108,
    imageHeight: 75,
    imageOnPlate: true,
    // The slide carries one description and no second line. It is the same
    // sentence in both places, and the detail page renders it once: the
    // summary is skipped where it repeats the intro verbatim.
    cardSummary:
      'Designed and developed an integrated digital ecosystem for supply-chain tracking and distribution management under the Smart Supply Chain Initiative of the National Fisheries Company',
    intro:
      'Designed and developed an integrated digital ecosystem for supply-chain tracking and distribution management under the Smart Supply Chain Initiative of the National Fisheries Company',
    overview: [],
    blocks: [
      {
        icon: 'globe',
        heading: 'End-to-End Visibility',
        body: 'Full visibility across the supply chain',
      },
      {
        icon: 'gear',
        heading: 'Efficiency & Control',
        body: 'Optimize operations and reduce costs',
      },
      {
        icon: 'shield',
        heading: 'Quality Assured',
        body: 'Ensure quality and compliance at every stage',
      },
      {
        icon: 'growth',
        heading: 'Data-Driven Decisions',
        body: 'Real-time insights for smarter decisions',
      },
    ],
    glanceHeading: 'KEY CAPABILITIES INCLUDE:',
    highlights: [
      { icon: 'tag', label: 'Product tracking' },
      { icon: 'layers', label: 'Warehouse management' },
      { icon: 'compass', label: 'Transportation management' },
      { icon: 'shield', label: 'Quality monitoring' },
      { icon: 'pulse', label: 'Operational analytics' },
    ],
  },

  {
    slug: 'mosharek',
    name: 'MOSHAREK',
    // Rewritten from the project's own slide, which is about investment
    // opportunities and franchise development rather than the connect-and-take-
    // part framing the earlier copy used. The slide sets the year under the
    // wordmark, as FISH LINK's and MADAAAD's do, so the tagline carries it.
    tagline: '2025',
    sector: '01 | Digital Transformation & Smart Platforms',
    icon: 'users',
    url: null,
    urlLabel: null,
    // The symbol alone, cut from the lockup on the project's slide. Keyed off
    // the near-white ground it is printed on, which is why it asks for the plate
    // on a card — see imageOnPlate — and why the page sets it beside the name
    // rather than in its frame, see smallMark.
    image: '/assets/images/mosharek-mark.png',
    imageWidth: 128,
    imageHeight: 79,
    imageOnPlate: true,
    smallMark: true,
    // One sentence, the same in both places, so the page states it once.
    cardSummary:
      'Developed a specialized digital platform for investment opportunities and franchise development, connecting investors with franchise owners and opportunity providers',
    intro:
      'Developed a specialized digital platform for investment opportunities and franchise development, connecting investors with franchise owners and opportunity providers',
    // The supplied material sets out five things: the platform's positioning,
    // what it is, what it helps people do, the sectors it covers, and why it is
    // worth using. The page has two list slots — the capability cards and the
    // glance — and they are spoken for by the four capabilities and the four
    // figures, so the rest runs as the body copy it was written as, in the
    // order the material puts it.
    overview: [
      'Invest. Connect. Grow — Empowering Investments. Building Futures',
      'Mosharek is a digital platform designed to connect investors with verified franchise opportunities and trusted franchise partners, providing a structured path from discovering an opportunity to participating in it',
      'The platform helps users discover verified franchise opportunities, explore investment models, access smart operating guides, connect with franchise owners and opportunity providers, search and evaluate opportunities across different sectors, and build connections with trusted partners',
      'Opportunities span sectors including Food & Beverage, Retail, Education, Health & Wellness, Services and Technology',
      'Why Mosharek: investor-to-franchisor connectivity, verified opportunities, end-to-end support, and a platform that is secure and transparent',
      'The platform provides:',
    ],
    blocks: [
      { icon: 'book', heading: 'Smart Operating Guides' },
      { icon: 'growth', heading: 'Investment Models' },
      { icon: 'building', heading: 'Franchise Opportunities' },
      { icon: 'handshake', heading: 'Investor-to-Franchisor Connectivity' },
    ],
    // The strip the slide closes on. The page's glance shows one line per item,
    // so each carries its figure and what the figure counts.
    highlights: [
      { icon: 'users', label: '500+ Investors' },
      { icon: 'tag', label: '300+ Franchise Brands' },
      { icon: 'layers', label: '20+ Sectors' },
      { icon: 'spark', label: '1000+ Opportunities' },
    ],
  },

  {
    slug: 'madaaad',
    name: 'MADAAAD',
    // The slide sets the year beneath the wordmark, as FISH LINK's does, so the
    // line that normally carries a tagline carries the year here.
    tagline: '2025',
    sector: '01 | Digital Transformation & Smart Platforms',
    icon: 'cart',
    url: 'https://www.madaaad.com/',
    urlLabel: 'madaaad.com',
    // Genuinely transparent, so it sits straight on the card with no plate.
    image: '/assets/images/app_mark.png',
    imageWidth: 1024,
    imageHeight: 1024,
    imageOnPlate: false,
    // The slide's description runs on into the four sectors set out beneath it,
    // which a card has no room for. The card names them inside the sentence; the
    // page lists them the way the slide does.
    cardSummary:
      'Developed a specialized digital procurement platform for managing and supplying the operational requirements of schools, universities, educational institutions, and corporations',
    intro:
      'Developed a specialized digital procurement platform for managing and supplying the operational requirements of:',
    // The slide carries no prose beyond that description and the line closing
    // it, and states its capabilities as labels rather than as paragraphs — so
    // there is nothing for either of these, and the page renders neither.
    overview: [],
    blocks: [],
    serves: [
      { icon: 'school', label: 'Schools' },
      { icon: 'cap', label: 'Universities' },
      { icon: 'book', label: 'Educational institutions' },
      { icon: 'building', label: 'Corporations' },
    ],
    focus: {
      lead: 'The platform focuses on the sourcing and supply of',
      emphasis: 'office equipment, stationery, and operational supplies',
    },
    highlights: [
      { icon: 'cart', label: 'Smart Procurement' },
      { icon: 'checklist', label: 'Wide Range of Products' },
      { icon: 'truck', label: 'Reliable Supply Chain' },
      { icon: 'shield', label: 'Quality Assurance' },
      { icon: 'growth', label: 'Real-time Management' },
    ],
    // The categories the platform itself carries, as its own storefront lists
    // them on the slide.
    categories: [
      { icon: 'printer', label: 'Office Equipment' },
      { icon: 'pen', label: 'Stationery' },
      { icon: 'layers', label: 'Paper Products' },
      { icon: 'screen', label: 'Technology' },
      { icon: 'spray', label: 'Cleaning Supplies' },
      { icon: 'chair', label: 'Furniture' },
    ],
  },

  {
    // TOMEYYA replaced AKIBAGOLD in this slot. Nothing of that project is left
    // here or anywhere else in the build — it was a savings concept, this is a
    // restaurant platform, and the two share no copy, palette or artwork.
    slug: 'tomeyya',
    name: 'TOMEYYA',
    tagline: 'A Complete Digital Restaurant Management & Ordering Ecosystem',
    sector: 'Digital Restaurant Technology',
    icon: 'cutlery',
    url: null,
    urlLabel: null,
    // The supplied logo, from assets/Tomeyya Logo Final.png. The file as
    // delivered is a 5463×3200 canvas with the lockup floating in the middle of
    // it — more than half of its width is empty — so what is served here is the
    // same artwork with those transparent margins cropped away and not one pixel
    // of the logo touched. Without that it would draw at under half the size of
    // the slot it sits in. It has a real alpha channel, so it needs no plate.
    image: '/assets/images/tomeyya-logo.png',
    imageWidth: 2453,
    imageHeight: 2570,
    imageOnPlate: false,
    cardSummary:
      'Connecting restaurant operations, point-of-sale, digital menus, and customer ordering across desktop, web, and mobile',
    intro:
      'Tomeyya is an integrated restaurant technology ecosystem that connects in-store operations, digital ordering, and customer experiences across desktop, web, and mobile platforms',
    overview: [
      'The platform is designed to support restaurants through a complete Point-of-Sale and cashier system, while providing customers with seamless digital menu and ordering experiences through both web and mobile applications',
      'Tomeyya brings restaurant operations into one connected digital ecosystem — from managing products, categories, branches, staff, and daily operations to handling customer menus, carts, orders, and checkout',
    ],
    // One platform, three experiences. These are products, not features, which
    // is why they are not in `blocks` with the capabilities.
    experiences: [
      {
        icon: 'register',
        heading: 'POS & Cashier System',
        body: 'A desktop-focused restaurant management and point-of-sale experience designed for staff and day-to-day restaurant operations',
      },
      {
        icon: 'screen',
        heading: 'Digital Menu Website',
        body: 'A customer-facing web experience where users can browse categories and products, view product details, build their cart, and place orders digitally',
      },
      {
        icon: 'phone',
        heading: 'Mobile Menu Application',
        body: 'A mobile-first menu and ordering experience designed to make browsing and ordering convenient for customers on mobile devices',
      },
    ],
    // The twelve capabilities, in the six groups the supplied material files
    // them under. Kept in group order: the page renders them in the order they
    // appear here and takes each group's name from the first block in it.
    blocks: [
      {
        icon: 'register',
        group: 'Restaurant Operations',
        heading: 'Point of Sale & Cashier',
        body: 'Manage restaurant sales and day-to-day cashier operations through a dedicated POS experience',
      },
      {
        icon: 'coins',
        group: 'Restaurant Operations',
        heading: 'Expenses & Operations',
        body: 'Support operational expense management and other day-to-day restaurant administration',
      },
      {
        icon: 'book',
        group: 'Menu & Products',
        heading: 'Product & Menu Management',
        body: 'Manage products, categories, pricing, product images, and menu content from a centralized system',
      },
      {
        icon: 'image',
        group: 'Menu & Products',
        heading: 'Product Images',
        body: 'Manage and upload product imagery to maintain a rich and engaging digital menu',
      },
      {
        icon: 'checklist',
        group: 'Orders',
        heading: 'Order Management',
        body: "Track and manage incoming orders across the restaurant's operational workflow",
      },
      {
        icon: 'truck',
        group: 'Kitchen & Delivery',
        heading: 'Kitchen & Delivery Operations',
        body: 'Dedicated operational views help staff manage orders through kitchen and delivery stages',
      },
      {
        icon: 'cart',
        group: 'Customers',
        heading: 'Digital Ordering',
        body: 'Allow customers to browse the restaurant menu, add products to their cart, and complete the ordering process digitally',
      },
      {
        icon: 'tag',
        group: 'Customers',
        heading: 'Cart & Checkout',
        body: 'Provide a complete customer ordering flow from product selection through cart management and checkout',
      },
      {
        icon: 'building',
        group: 'Management',
        heading: 'Branch Management',
        body: 'Support restaurant branches and their operational data through a centralized management system',
      },
      {
        icon: 'users',
        group: 'Management',
        heading: 'Staff & User Management',
        body: 'Manage restaurant users and staff with controlled access to the platform',
      },
      {
        icon: 'shield',
        group: 'Management',
        heading: 'Authentication & Access Control',
        body: 'Secure login and protected access across the different system experiences',
      },
      {
        icon: 'gear',
        group: 'Management',
        heading: 'Settings & Configuration',
        body: 'Centralized settings for managing the restaurant platform and its operational configuration',
      },
    ],
    // The connected ecosystem, in the order the material draws it: staff at one
    // end, the people eating at the other, and the platform in between.
    flow: [
      { icon: 'users', label: 'Restaurant Staff' },
      { icon: 'register', label: 'POS & Cashier' },
      { icon: 'chef', label: 'Kitchen & Operations' },
      { icon: 'truck', label: 'Orders & Delivery' },
      { icon: 'book', label: 'Digital Menu' },
      { icon: 'cutlery', label: 'Customers' },
    ],
    highlights: [
      {
        icon: 'register',
        label: 'POS & Cashier System',
        body: 'Desktop restaurant operations and point-of-sale',
      },
      {
        icon: 'screen',
        label: 'Web Ordering',
        body: 'Digital menu and online ordering experience',
      },
      {
        icon: 'phone',
        label: 'Mobile Ordering',
        body: 'Mobile menu and customer ordering experience',
      },
      {
        icon: 'gear',
        label: 'Restaurant Management',
        body: 'Products, branches, staff, expenses, settings, and operational management',
      },
      {
        icon: 'checklist',
        label: 'Order Operations',
        body: 'Order tracking, kitchen workflows, and delivery management',
      },
      {
        icon: 'users',
        label: 'Digital Customer Experience',
        body: 'A modern, responsive interface for browsing menus and placing orders',
      },
    ],
  },
];

export const findProject = (slug: string): Project | undefined =>
  PROJECTS.find((project) => project.slug === slug);
