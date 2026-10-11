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
    afterNextRender(() => this.spy.trackScroll());

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
}
