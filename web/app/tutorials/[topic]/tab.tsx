import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { View } from '@/components/view';
import type { TutTab } from '@/lib/app/app.mjs';
import { app, pages, topicById } from '@/lib/app/server';

export type TopicProps = { params: Promise<{ topic: string }> };

export async function tabMetadata({ params }: TopicProps, tab: TutTab): Promise<Metadata> {
  const t = topicById((await params).topic);
  return t ? { title: `${t.title} · ${app.tabName(tab)}` } : {};
}

// A tutorial's page: the lesson and the worked examples are made on the server (once), practice
// in the browser. An unknown topic goes to the list, as the plain page did.
export async function TutorialTab({ params }: TopicProps, tab: TutTab) {
  const id = (await params).topic;
  if (!topicById(id)) redirect('/tutorials');
  return <View view="tutorial" params={{ id, tab }} html={pages.tutorial(id, tab)} />;
}
