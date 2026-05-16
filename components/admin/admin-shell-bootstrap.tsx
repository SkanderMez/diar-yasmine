/**
 * Sync theme bootstrap — emitted at the very start of the admin layout
 * body to set `documentElement.dataset.theme` BEFORE first paint, so the
 * user never sees a flash of the wrong theme.
 *
 * Reads `localStorage["dy-admin-theme"]` first, falls back to the user's
 * `prefers-color-scheme: dark` if explicitly set, otherwise defaults to
 * light — the modern PMS feels lighter, dark is now an opt-in.
 */
export function AdminShellBootstrap() {
  const script = `(function(){try{var s=localStorage.getItem('dy-admin-theme');var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s||(d?'dark':'light');document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
