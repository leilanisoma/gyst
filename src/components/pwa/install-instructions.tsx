export function InstallInstructions() {
  return (
    <section className="max-w-sm">
      <h2 className="text-sm font-semibold">Install gyst</h2>
      <dl className="text-muted-foreground mt-2 flex flex-col gap-3 text-sm">
        <div>
          <dt className="text-foreground font-medium">iPhone/iPad (Safari)</dt>
          <dd>
            Tap Share, then &quot;Add to Home Screen.&quot; Notifications and an
            app icon work like a native app.
          </dd>
        </div>
        <div>
          <dt className="text-foreground font-medium">Desktop (Chrome/Edge)</dt>
          <dd>
            Click the install icon in the address bar, or the browser menu →
            &quot;Install gyst.&quot;
          </dd>
        </div>
      </dl>
    </section>
  );
}
