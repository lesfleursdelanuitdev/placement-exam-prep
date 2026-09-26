import type { Metadata } from 'next';

import { View } from '@/components/view';
import { pages } from '@/lib/app/server';

export const metadata: Metadata = { title: 'Flashcards' };

export default function FlashcardsPage() {
  return <View view="flashcards" html={pages.flashIndex()} />;
}
