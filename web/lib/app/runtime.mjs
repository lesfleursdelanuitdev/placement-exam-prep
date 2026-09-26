// The app in the browser: loaded once per page load, after the page is on screen (the engine is
// about 1 MB of script). The engine goes on window.MX, the plain page's browser files (editor,
// store, grapher, stopwatch) run on the window as they did, and app.mjs boots on top.
let ready = null;

export function loadApp() {
  if (!ready) {
    ready = (async () => {
      const [{ MX }, { createModel }, { installBrowser }, { createApp }] = await Promise.all([
        import('../../engine/mx.mjs'),
        import('../../engine/model.mjs'),
        import('../../engine/browser.mjs'),
        import('./app.mjs'),
      ]);
      window.MX = MX;
      installBrowser(window);
      const app = createApp({ MX, model: createModel(MX), Store: MX.Store, win: window });
      app.boot();
      return app;
    })();
  }
  return ready;
}
