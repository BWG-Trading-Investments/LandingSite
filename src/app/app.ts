import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Footer } from './layout/footer/footer';
import { Navbar } from './layout/navbar/navbar';

/**
 * Application shell.
 *
 * It owns the page's landmarks and nothing else: the skip link, the single
 * <header> (rendered by Navbar), the single <main>, and the single <footer>
 * (rendered by Footer). Everything visual lives in a route component or a
 * section component.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
