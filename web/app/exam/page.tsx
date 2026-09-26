import type { Metadata } from 'next';

import { View } from '@/components/view';
import { pages } from '@/lib/app/server';

export const metadata: Metadata = { title: 'Practice exam' };

// The exam's overview. The exam is made from the seed saved in the browser (guest-only for now),
// so the browser fills this in.
export default function ExamPage() {
  return <View view="exam" html={pages.examHome()} />;
}
