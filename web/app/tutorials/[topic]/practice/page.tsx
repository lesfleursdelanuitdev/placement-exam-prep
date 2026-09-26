import { TutorialTab, tabMetadata, type TopicProps } from '../tab';

export const generateMetadata = (props: TopicProps) => tabMetadata(props, 'practice');

export default function Page(props: TopicProps) {
  return TutorialTab(props, 'practice');
}
