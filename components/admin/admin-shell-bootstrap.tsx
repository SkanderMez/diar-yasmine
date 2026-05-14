/**
 * Sync theme bootstrap — emitted at the very start of the admin layout
 * body to set `documentElement.dataset.theme` BEFORE first paint, so the
 * user never sees a flash of the wrong theme.
 *
 * Reads `localStorage["dy-admin-theme"]` first, then falls back to the
 * user's `prefers-color-scheme`. Defaults to dark.
 */
export function AdminShellBootstrap() {
  const script = `(function(){try{var s=localStorage.getItem('dy-admin-theme');var p=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches;var t=s||(p?'light':'dark');document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
