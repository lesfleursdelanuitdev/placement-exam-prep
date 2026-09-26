// The app in the browser: loaded once per page load, after the page is on screen (the engine is
// about 1 MB of script). The engine goes on window.MX, the plain page's browser files (editor,
// store, grapher, stopwatch) run on the window as they did, and app.mjs boots on top; account.mjs
// adds a signed-in person's progress in their account (NEXTJS-PLAN.md step 4).
import { createAccount, settleOwner } from './account.mjs';

let ready = null;

// who is signed in, as the layout put it on <body> (from the gate's headers); null: a guest
export function whoOnPage(body) {
  const a = Number(body?.dataset.account);
  return Number.isSafeInteger(a) && a > 0 ? { account: a, username: body.dataset.username || '', del: body.dataset.del === '1' } : null;
}
// the site's gate is in front (it tells guests too): sign-in links make sense
export const gateOnPage = (body) => body?.dataset.gate === '1';

export function loadApp() {
  if (!ready) {
    ready = (async () => {
      const [{ MX }, { createModel }, { installBrowser }, { createApp }] = await Promise.all([
        import('../../engine/mx.mjs'),
        import('../../engine/model.mjs'),
        import('../../engine/browser.mjs'),
        import('./app.mjs'),
      ]);
      // whose progress the browser holds is settled before store.js and the stopwatch read it
      const who = whoOnPage(document.body);
      settleOwner(window, who);
      window.MX = MX;
      installBrowser(window);
      const account = createAccount(window, who, gateOnPage(document.body));
      const app = createApp({ MX, model: createModel(MX), Store: MX.Store, win: window, account });
      app.boot();
      account.start(app);
      return Object.assign(app, { account });
    })();
  }
  return ready;
}
