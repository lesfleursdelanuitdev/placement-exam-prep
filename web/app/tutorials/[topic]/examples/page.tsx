import { TutorialTab, tabMetadata, type TopicProps } from '../tab';

export const generateMetadata = (props: TopicProps) => tabMetadata(props, 'examples');

export default function Page(props: TopicProps) {
  return TutorialTab(props, 'examples');
}
