import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { View } from '@/components/view';
import { app, pages } from '@/lib/app/server';

type Props = { params: Promise<{ part: string }> };

const partOf = (s: string) => {
  const m = /^part-([123])$/.exec(s);
  return m ? (Number(m[1]) as 1 | 2 | 3) : null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = partOf((await params).part);
  return p ? { title: `Part ${app.PART_NUM[p]}: ${app.PART_NAME[p]} · Practice exam` } : {};
}

// One part of the exam per page: the frame from the server, the questions from the browser
export default async function PartPage({ params }: Props) {
  const p = partOf((await params).part);
  if (!p) redirect('/exam');
  return <View view="part" className="v-exam" params={{ part: p }} html={pages.part(p)} />;
}
