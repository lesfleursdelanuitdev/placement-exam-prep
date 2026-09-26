import { Deck, deckMetadata } from '../deck';

export const metadata = deckMetadata({ all: 1 });

// every card marked "Still learning", from every deck
export default function ReviewDeckPage() {
  return <Deck spec={{ all: 1 }} mode="learning" />;
}
