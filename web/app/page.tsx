import { View } from '@/components/view';
import { pages } from '@/lib/app/server';

// Home: the three choices and the progress snapshot (the snapshot is filled in by the browser)
export default function HomePage() {
  return <View view="home" html={pages.home()} />;
}
