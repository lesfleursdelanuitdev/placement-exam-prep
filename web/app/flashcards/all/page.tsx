import { Deck, deckMetadata } from '../deck';

export const metadata = deckMetadata({ all: 1 });

export default function AllDeckPage() {
  return <Deck spec={{ all: 1 }} mode="all" />;
}
