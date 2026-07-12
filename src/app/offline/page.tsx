// This page must render correctly with zero network access, including
// the stylesheet — the service worker (public/sw.js) only caches this
// document, not the CSS bundle. Inline styles instead of Tailwind
// classes so it never depends on anything that could fail to load.
export default function OfflinePage() {
  return (
    <main
      style={{
        display: "flex",
        minHeight: "100vh",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 24,
        textAlign: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#faf7f2",
        color: "#48372c",
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>You&apos;re offline</h1>
      <p style={{ maxWidth: 320, fontSize: 14, color: "#7a6a5c" }}>
        gyst needs a connection to load your data. Reconnect and try again —
        anything you had open will still be there.
      </p>
    </main>
  );
}
