# BwgV1

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Deployment

The app builds with `outputMode: 'static'` — every route is prerendered to HTML at
build time, so there is no Angular server at runtime. On a CDN host (Vercel,
Netlify, Cloudflare Pages) point the platform at `dist/bwg-v1/browser` and nothing
else is needed.

Railway runs a container rather than a CDN, so it needs a process listening on
`$PORT`. `server.mjs` is that process: a dependency-free static server that serves
the prerendered files, gzips text, pins content-hashed assets with a long
`Cache-Control`, and falls back to `index.csr.html` with a 404 status for unknown
URLs. `railway.json` wires it up, so a fresh Railway service needs no build or
start command set in the dashboard.

`railpack.json` repeats the start command for Railway's Railpack builder. Without
it, Railpack sees an Angular app whose `start` script is `ng serve`, switches to its
own static-site mode, and fails the build looking for the output in `browser/`
instead of `dist/bwg-v1/browser`. Keep the two start commands in step.

To check a production build locally exactly as Railway will serve it:

```bash
npm run preview
```

Note that `npm start` runs the Angular dev server and is for local development
only — it binds to localhost and must not be used as a deploy start command.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
