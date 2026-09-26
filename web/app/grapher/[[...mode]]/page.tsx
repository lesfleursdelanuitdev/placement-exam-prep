import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { View } from '@/components/view';
import { pages } from '@/lib/app/server';

type Props = { params: Promise<{ mode?: string[] }> };

// /grapher and /grapher/draw are one page: switching modes changes the address, not the page
const modeOf = (m?: string[]) => (!m || m.length === 0 ? 'graph' : m.length === 1 && m[0] === 'draw' ? 'draw' : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: modeOf((await params).mode) === 'draw' ? 'Draw a graph · Grapher' : 'Grapher' };
}

export default async function GrapherPage({ params }: Props) {
  const mode = modeOf((await params).mode);
  if (!mode) redirect('/grapher');
  return <View view="grapher" params={{ mode }} html={pages.grapher()} />;
}
