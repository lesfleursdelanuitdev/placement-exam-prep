import type { Metadata } from 'next';

import { View } from '@/components/view';
import { pages } from '@/lib/app/server';

export const metadata: Metadata = { title: 'Results · Practice exam' };

export default function ResultsPage() {
  return <View view="results" html={pages.results()} />;
}
