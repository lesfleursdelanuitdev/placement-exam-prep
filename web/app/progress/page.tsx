import type { Metadata } from 'next';

import { View } from '@/components/view';
import { pages } from '@/lib/app/server';

export const metadata: Metadata = { title: 'Progress' };

export default function ProgressPage() {
  return <View view="progress" html={pages.progress()} />;
}
