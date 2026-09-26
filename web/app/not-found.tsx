import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <section id="v-missing">
      <div className="page">
        <header className="page-h">
          <h1>Page not found</h1>
          <p>There is no page at this address.</p>
        </header>
        <p className="home-more"><a className="btn primary" href="/">Home</a> <a className="btn ghost" href="/tutorials">Tutorials</a></p>
      </div>
    </section>
  );
}
