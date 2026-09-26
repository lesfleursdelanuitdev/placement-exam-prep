'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import type { AccountSnapshot } from '@/lib/app/account.mjs';

import { loadApp } from '@/lib/app/runtime.mjs';

// The bar, the phone menu and the stopwatch's place (src/shell.html), with links for the sections.
// The app (loaded after the page is on screen) fills in the score chip and the menu's exam, opens
// and closes the menu, and follows links without reloading.
const SECTIONS = [
  { key: 'home', href: '/', label: 'Home', icon: <path d="M4 11.2 12 4.5l8 6.7V20h-5.5v-5.5h-5V20H4z" /> },
  { key: 'exam', href: '/exam', label: 'Exam', icon: <><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" /></> },
  { key: 'tutorials', href: '/tutorials', label: 'Tutorials', icon: <><path d="M3.5 6.2c3-1.6 6-1.6 8.5.6 2.5-2.2 5.5-2.2 8.5-.6v13c-3-1.6-6-1.6-8.5.6-2.5-2.2-5.5-2.2-8.5-.6z" /><path d="M12 6.8v13" /></> },
  { key: 'flashcards', href: '/flashcards', label: 'Flashcards', icon: <><rect x="3.5" y="8" width="13.5" height="11" rx="2" /><path d="M7 5h11.5a2 2 0 0 1 2 2v8.5" /></> },
  { key: 'grapher', href: '/grapher', label: 'Grapher', icon: <><path d="M4 4v16h16" /><path d="M6 17c3-9 6-10 8-6s3 3 5-4" /></> },
  { key: 'progress', href: '/progress', label: 'Progress', icon: <><path d="M4 4v16h16" /><path d="M8.5 16v-4M12.5 16V8.5M16.5 16v-6" /></> },
] as const;

const sectionOf = (path: string) => (path === '/' ? 'home' : (path.split('/')[1] ?? 'home'));

export function Chrome() {
  const pathname = usePathname();
  const router = useRouter();
  const swHost = useRef<HTMLDivElement>(null);
  // what the page says about saving: guest, or signed in (account.mjs, NEXTJS-PLAN.md S4-5)
  const [saving, setSaving] = useState<AccountSnapshot | null>(null);
  useEffect(() => {
    let live = true;
    let off: (() => void) | undefined;
    loadApp().then((app) => {
      if (!live) return;
      off = app.account.subscribe(setSaving);
      app.attach({ push: (href) => router.push(href), replace: (href) => router.replace(href) });
      // the stopwatch puts itself at the end of <body>; keep it in its place here instead
      const sw = document.getElementById('stopwatch');
      if (sw && swHost.current && sw.parentNode !== swHost.current) swHost.current.appendChild(sw);
    });
    return () => {
      live = false;
      off?.();
    };
  }, [router]);
  const current = sectionOf(pathname);
  const here = (key: string) => (key === current ? ('page' as const) : undefined);
  return (
    <>
      <header className="bar">
        <button type="button" id="menu-btn" className="menu-btn" data-act="menu-open" aria-label="Open menu" aria-expanded="false" aria-controls="drawer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <a className="brand" href="/" aria-label="Placement Exam Prep: home"><span className="brand-mark"><i>x</i><sup>2</sup></span><span className="brand-t">Placement Exam Prep</span></a>
        <nav className="tabs" aria-label="Sections">
          {SECTIONS.map((s) => <a key={s.key} href={s.href} aria-current={here(s.key)}>{s.label}</a>)}
        </nav>
        <div id="score-chip" className="chip" aria-live="polite" />
        {saving && (saving.username || saving.links.length > 0) && (
          <a className="acct-link" href={saving.username ? '/progress' : saving.links[0]!.href} title={saving.text}>
            {saving.username ?? saving.links[0]!.text}
          </a>
        )}
      </header>
      <div id="scrim" className="scrim" data-act="menu-close" aria-hidden="true" />
      <aside id="drawer" className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" inert>
        <div className="drawer-h">
          <span className="brand-mark" aria-hidden="true"><i>x</i><sup>2</sup></span><span id="drawer-title" className="drawer-t">Placement Exam Prep</span>
          <button type="button" className="drawer-x" data-act="menu-close" aria-label="Close menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
        </div>
        <nav className="dnav" aria-label="Sections">
          {SECTIONS.map((s) => <a key={s.key} href={s.href} aria-current={here(s.key)}><svg viewBox="0 0 24 24" aria-hidden="true">{s.icon}</svg><span>{s.label}</span></a>)}
        </nav>
        <div id="drawer-exam" className="drawer-exam" />
        <div className="drawer-foot">
          {saving?.username && <p className="acct-who">Signed in as <b>{saving.username}</b></p>}
          <p>{saving?.text ?? 'Your work saves as you go.'}</p>
          {saving && (saving.links.length > 0 || saving.signOut) && (
            <p className="acct-links">
              {saving.links.map((l) => <a key={l.href} href={l.href}>{l.text}</a>)}
              {saving.signOut && <button type="button" className="linkish" data-act="sign-out">Sign out</button>}
            </p>
          )}
        </div>
      </aside>
      <div ref={swHost} id="sw-host" />
    </>
  );
}
