import type { Metadata } from 'next';

import { View } from '@/components/view';
import { pages } from '@/lib/app/server';

export const metadata: Metadata = { title: 'Tutorials' };

export default function TutorialsPage() {
  return <View view="tutorials" html={pages.tutIndex()} />;
}
