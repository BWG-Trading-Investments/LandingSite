import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

import { NAV_CTA, NAV_ITEMS, type NavItem, ownsSection } from '../../core/navigation';
import { ScrollSpyService } from '../../core/scroll-spy.service';
import { ThemeService } from '../../core/theme.service';

/** Applied to <body> while the mobile panel is open. Styled in base/_a11y.scss. */
const SCROLL_LOCK_CLASS = 'bwg-scroll-locked';

type Gsap = typeof import('gsap').gsap;

/**
 * How far the whole mark grows on hover, about its own centre. The centre stays
 * put and every edge moves out from it — 4px each way at the bar's full size.
 */
const LOGO_HOVER_SCALE = 1.06;

/**
 * The site header.
 *
 * Renders the one <header> landmark on the page. Both the desktop bar and the
 * mobile panel are driven from core/navigation.ts — this component holds no copy
 * of the link list.
 *
 * Everything motion-related is browser-only. During prerender the bar renders in
 * its transparent, unscrolled, closed state with every label present in the HTML.
 */
@Component({
  selector: 'bwg-navbar',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private readonly spy = inject(ScrollSpyService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly navItems = NAV_ITEMS;
  protected readonly cta = NAV_CTA;

  protected readonly scrolled = this.spy.scrolled;
  protected readonly progress = this.spy.progress;
  protected readonly activeId = this.spy.activeId;

  /** The active palette, for the toggle’s label and icon. */
  protected readonly theme = this.themeService.theme;

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  protected readonly menuOpen = signal(false);

  /**
   * The current path, as a signal.
   *
   * Router.url is a plain getter, so reading it from the template would leave
   * aria-current stale after a navigation — nothing would mark the component
   * dirty. This updates on every NavigationEnd instead.
   */
  private readonly currentUrl = signal(this.path());

  /** Set on pointerdown, so a click knows whether it came from a finger. */
  protected logoPointerType = '';

  private readonly logoImg = viewChild<ElementRef<HTMLImageElement>>('logoImg');

  /** Loaded after first render, so it stays out of the initial bundle. */
  private gsapLoad?: Promise<Gsap>;
  private gsap?: Gsap;

  /** Whether a mouse is over the mark right now — checked after GSAP loads. */
  private logoHovered = false;

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly burger = viewChild<ElementRef<HTMLButtonElement>>('burger');

  /** Suppresses the focus-restore effect on first render, before any open. */
  private hasOpened = false;

  constructor() {
    // Any navigation closes the panel — including a router link inside it.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.currentUrl.set(this.path());
        this.menuOpen.set(false);
      });

    // Scroll position drives the bar on every route, not just the homepage, so
    // the navbar owns this rather than the page that happens to have sections.
    afterNextRender(() => {
      this.spy.trackScroll();
      void this.loadGsap();
    });

    // Body scroll lock and focus handling, both driven off the same signal so
    // they can never disagree about whether the panel is open.
    effect(() => {
      const open = this.menuOpen();
      const panelEl = this.panel()?.nativeElement;

      if (!this.isBrowser) {
        return;
      }

      this.document.body.classList.toggle(SCROLL_LOCK_CLASS, open);

      // The panel is aria-modal, so everything behind it must leave the tab
      // order too — otherwise Tab walks invisible links under the overlay. The
      // bar itself is handled by an inert binding in the template.
      this.document.getElementById('main')?.toggleAttribute('inert', open);

      if (open && panelEl) {
        panelEl.querySelector<HTMLElement>('[data-panel-focus]')?.focus();
      } else if (!open && this.hasOpened) {
        this.burger()?.nativeElement.focus();
      }
    });

    // A component can be destroyed mid-navigation with the panel still open;
    // the class lives on <body>, so it would outlive it.
    inject(DestroyRef).onDestroy(() => {
      if (this.isBrowser) {
        this.document.body.classList.remove(SCROLL_LOCK_CLASS);
        this.document.getElementById('main')?.removeAttribute('inert');
        this.gsap?.killTweensOf(this.logoEl());
      }
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.menuOpen.set(false);
  }

  protected toggleMenu(): void {
    const next = !this.menuOpen();
    if (next) {
      this.hasOpened = true;
    }
    this.menuOpen.set(next);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  /**
   * Anchor links keep a real `href` so they can be opened in a new tab and work
   * as ordinary links, but a plain jump would skip the smooth scroll and would
   * not work from another route. The handler takes over for normal clicks only.
   */
  protected onAnchor(event: MouseEvent, item: NavItem): void {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    this.menuOpen.set(false);
    this.spy.goToSection(item.target);
  }

  /** aria-current: `location` for a section in view, `page` for the active route. */
  protected currentFor(item: NavItem): 'location' | 'page' | null {
    if (item.kind === 'route') {
      return this.currentUrl() === item.target ? 'page' : null;
    }
    // Which sections a link stands for is navigation.ts's business, not the
    // navbar's — some links cover a run of sections rather than just one.
    return ownsSection(item, this.activeId()) ? 'location' : null;
  }

  /** The current path, with any query string or fragment stripped. */
  private path(): string {
    return this.router.url.split(/[?#]/)[0];
  }

  protected isActive(item: NavItem): boolean {
    return this.currentFor(item) !== null;
  }

  /**
   * Mouse only: touch and pen fire pointerenter on a tap too, and have no
   * reliable leave, so they get the tap pulse instead. The image grows as one
   * piece about its centre; the box it sits in never moves.
   */
  protected onLogoEnter(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') {
      return;
    }
    this.logoHovered = true;
    this.withGsap((gsap) => {
      if (this.logoHovered) {
        this.expandLogo(gsap, 0.9, 'power3.out');
      }
    });
  }

  protected onLogoLeave(): void {
    this.logoHovered = false;
    this.withGsap((gsap) => this.settleLogo(gsap));
  }

  /**
   * The touch fallback: one brief expand and return per tap. On click rather
   * than pointerdown, so a scroll that starts on the logo never triggers it,
   * and nothing is prevented — the link still navigates.
   */
  protected onLogoTap(): void {
    if (this.logoPointerType === 'mouse' || this.logoPointerType === '') {
      return;
    }
    this.withGsap((gsap) => this.expandLogo(gsap, 0.35, 'power2.out', () => this.settleLogo(gsap)));
  }

  /** `overwrite` kills whatever the mark was doing, so rapid hovers never stack. */
  private expandLogo(gsap: Gsap, duration: number, ease: string, onComplete?: () => void): void {
    gsap.to(this.logoEl(), {
      scale: LOGO_HOVER_SCALE,
      transformOrigin: '50% 50%',
      duration,
      ease,
      overwrite: true,
      onComplete,
    });
  }

  /** Back to rest, then the transform is cleared so the mark sits exactly as drawn. */
  private settleLogo(gsap: Gsap): void {
    const logo = this.logoEl();
    gsap.to(logo, {
      scale: 1,
      duration: 0.7,
      ease: 'power3.inOut',
      overwrite: true,
      onComplete: () => gsap.set(logo, { clearProps: 'transform' }),
    });
  }

  private logoEl(): HTMLImageElement[] {
    const img = this.logoImg()?.nativeElement;
    return img ? [img] : [];
  }

  /** Runs `fn` once GSAP is in — straight away after the first load. Never with reduced motion. */
  private withGsap(fn: (gsap: Gsap) => void): void {
    if (!this.isBrowser || this.prefersReducedMotion()) {
      return;
    }
    if (this.gsap) {
      fn(this.gsap);
    } else {
      void this.loadGsap().then(fn);
    }
  }

  private loadGsap(): Promise<Gsap> {
    this.gsapLoad ??= import('gsap').then(({ gsap }) => (this.gsap = gsap));
    return this.gsapLoad;
  }

  private prefersReducedMotion(): boolean {
    return (
      this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false
    );
  }
}
