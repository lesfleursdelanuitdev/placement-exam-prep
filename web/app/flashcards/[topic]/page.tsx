import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { MX } from '@/lib/engine';
import { Deck, deckMetadata } from '../deck';

type Props = { params: Promise<{ topic: string }> };
const deckOf = (id: string) => (MX.byId[id] && (MX.FLASH[id] || []).length ? id : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = deckOf((await params).topic);
  return id ? deckMetadata({ topic: id }) : {};
}

export default async function TopicDeckPage({ params }: Props) {
  const id = deckOf((await params).topic);
  if (!id) redirect('/flashcards');
  return <Deck spec={{ topic: id }} mode="all" />;
}
