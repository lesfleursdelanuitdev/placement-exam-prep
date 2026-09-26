import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { app } from '@/lib/app/server';
import { Deck, deckMetadata } from '../../deck';

type Props = { params: Promise<{ name: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const section = app.paths.sectionBySlug((await params).name);
  return section ? deckMetadata({ section }) : {};
}

export default async function SectionDeckPage({ params }: Props) {
  const section = app.paths.sectionBySlug((await params).name);
  if (!section) redirect('/flashcards');
  return <Deck spec={{ section }} mode="all" />;
}
