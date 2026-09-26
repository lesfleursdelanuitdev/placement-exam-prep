import type { Metadata } from 'next';

import { View } from '@/components/view';
import type { DeckMode, DeckSpec } from '@/lib/app/app.mjs';
import { app, pages } from '@/lib/app/server';

export const deckMetadata = (spec: DeckSpec): Metadata => ({ title: `${app.deckSpecTitle(spec)} · Flashcards` });

// A deck: the first card from the server, flipping and marks in the browser
export function Deck({ spec, mode }: { spec: DeckSpec; mode: DeckMode }) {
  return <View view="deck" params={{ spec, mode }} html={pages.deck(spec, mode)} />;
}
