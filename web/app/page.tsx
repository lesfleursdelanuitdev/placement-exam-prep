import { Button } from '@/components/ui/button';
import { model, MX } from '@/lib/engine';

// Step 1 of NEXTJS-PLAN.md: a placeholder home, made on the server from the engine, to show the
// pieces work together. The real pages are step 2.
export default function Home() {
  const sections = model.bySection();
  const cards = Object.values(MX.FLASH).reduce((n, deck) => n + deck.length, 0);
  const exam = model.buildExam('home-preview');
  const first = exam[0];
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="font-cond text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Placement Exam Prep</p>
        <h1 className="mt-1 text-2xl font-semibold">The new version is being built</h1>
        <p className="mt-3 text-muted-foreground">
          {model.orderedTopics().length} topics in {sections.length} sections, {exam.length} questions per exam, {cards} flashcards: all made on the server.
        </p>
        {first && (
          <section className="mt-6 border-t border-border pt-4" aria-label="A sample question">
            <h2 className="font-cond text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Question 1 · {first.topic.title}</h2>
            {/* engine HTML: made by our own code from our own generators, never from visitors' input */}
            <div className="mt-2 font-math text-lg" dangerouslySetInnerHTML={{ __html: MX.rich(first.q.prompt) }} />
          </section>
        )}
        <div className="mt-6">
          <Button asChild>
            <a href="https://examprep.lesfleursdelanuit.com/">Open the current version</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
