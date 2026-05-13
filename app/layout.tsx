// The real root layout (html/body, fonts, providers) lives under
// app/[locale]/layout.tsx. Next.js requires *something* to export a
// default at the root, but next-intl owns the html element so that
// `lang` and `dir` can be set per locale.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
