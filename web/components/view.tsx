'use client';

import { useEffect } from 'react';

import type { ViewName } from '@/lib/app/app.mjs';
import { loadApp } from '@/lib/app/runtime.mjs';

// One page's content: the HTML made on the server, then filled in by the app in the browser
// (the student's progress, the exam, the answer boxes). React sets the HTML and leaves it to the
// app afterwards; a new page (new `html`) replaces it.
export function View({ view, html, params, className }: { view: ViewName; html: string; params?: Record<string, unknown>; className?: string }) {
  const key = JSON.stringify(params ?? {});
  useEffect(() => {
    let live = true;
    let off: (() => void) | undefined;
    loadApp().then((app) => {
      if (live) off = app.mount(view, JSON.parse(key));
    });
    return () => {
      live = false;
      off?.();
    };
  }, [view, key, html]);
  return <section id={'v-' + view} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
