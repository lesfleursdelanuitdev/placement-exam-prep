# Math 098 Final Prep

A study app for a Math 098 (intermediate algebra) final. It was built from three sample final exams. It generates an unlimited supply of full-length practice finals on the same topics, grades answers instantly, and has a tutorial and a flashcard deck for every topic. Progress is saved.

**Open it:** `docs/index.html` is a single self-contained page. Open it in a browser, or turn on GitHub Pages for this repo (Settings → Pages → deploy from branch, folder `/docs`).

## What it does

- **Home.** Three choices: the practice exam (start or continue), tutorials, and flashcards. A progress snapshot shows the last exam score, tutorials practiced, and flashcards learned. The top bar has Home · Exam · Tutorials · Flashcards · Progress.
- **Full-length generated exams.** Every exam covers all 55 topics: 49 skill questions plus 20 word problems, about 69 questions and 240–250 points, graded part by part like the paper exam. The length can't be reduced. Instead, your work autosaves as you type, including answers you haven't checked yet. **Save and finish later** returns you to Home, and **Continue** reopens the same exam at the first unanswered question.
- **All the factoring.** A special-patterns topic gives two each of a² − b², a³ − b³ and a³ + b³ plus a perfect-square trinomial on every exam. A factoring-strategy topic mixes GCF-only, prime ("doesn't factor") and mixed problems.
- **Logarithms.** Seven topics:
  - forms
  - evaluating (including ln, common logs and special values)
  - expanding
  - condensing
  - change of base
  - log equations (with extraneous answers)
  - exponential equations solved with logs

  There is also a log word-problem group: money, growth and decay, and log scales.
- **Relations & functions.** Five topics:
  - relation vs. function (ordered pairs, mappings, tables, graphs)
  - domain and range of a relation as sets
  - domain and range from a graph in interval notation
  - domain from a formula
  - range from a formula
- **Word problems vary within their group.** The 20 word-problem slots are grouped into 12 families (distance-rate-time, mixtures, Pythagorean, similar triangles, linear systems, exponential & log models, and more). Each exam draws a different variation from the family. Every word problem comes with an SVG diagram drawn from its own numbers.
- **A real math answer box.** Answers display as math while you type:
  - Typing `^` raises the cursor into an exponent.
  - Typing `/` stacks a fraction, and the term before it becomes the numerator.
  - `sqrt` draws a radical with a bar.
  - `log_2` makes a subscripted base.
  - `inf` becomes ∞, and `<=` becomes ≤.
  - The arrow keys move in and out of each piece.

  A button bar under the active box has the fraction, exponent, √, parentheses, ±, ≤ and ≥ buttons, plus context buttons: points, ×10ⁿ, log with base, ln, e, ∞, ∪, set braces, interval brackets, "all reals", "no solution" and "prime". It also has ← → ⌫ for phones. The box works with physical keyboards, phone keyboards, taps and paste, and it is reachable with Tab. Checked answers stay formatted.
- **Grading checks value and form.** The checker tests mathematical equivalence *and* the required form. For example:
  - "Factor completely" rejects a leftover GCF.
  - "Simplify" rejects `√50`.
  - "Positive exponents" rejects `m^-2`.
  - "Expand" rejects a log that could still be split.

  A form problem is a free nudge; only a wrong value costs points.
- **Tutorials.** A **Tutorial** button sits on every problem. Tutorials are listed by topic and grouped by section. Each one has a short lesson, worked examples, and practice exercises with unlimited tries, plus a button that adds 3 more exercises. Tutorials are fixed: generating a new exam doesn't change them. Leaving the exam for a tutorial never resets the exam.
- **Flashcards.** There are 311 cards in 55 decks, one per topic, covering the rules, formulas and quick examples.
  - Flip a card and mark it **Got it** or **Still learning**.
  - Shuffle the deck, or review only the cards marked still learning.
  - Study a whole section at once.
  - Keyboard shortcuts: Space flips, 1 and 2 mark a card, and ← → move.

  Tutorials link to their deck and decks link back. The marks are saved.
- **Saved progress.** The app saves the current exam, drafts, exam history, per-topic accuracy, tutorial practice and flashcard marks. After finishing, **Generate a new exam** starts the next one.
- **Storage.** Progress is always saved in the browser (localStorage). When the page runs as a Claude artifact with the `db` and `user` capabilities, it also saves a private per-user document so progress follows the person across devices.

## Catalog

Built from Sample Final Exams 1–3. Topics marked *added* are not on the sample finals; they were added to cover factoring patterns, logarithms, and relations & functions.

### Skill topics (43; 49 questions per exam)

| Section | Topic | On the sample finals | Per exam | Variations | Cards |
|---|---|---|---|---|---|
| Polynomials & exponents | Adding & subtracting polynomials | Exam 1 #1, Exam 2 #1 | 1 | Subtract two trinomials; Subtract a multiple; Add and subtract three polynomials | 6 |
| Polynomials & exponents | Dividing a polynomial by a monomial | Exam 1 #2, Exam 3 #9 | 1 | Two variables; Negative divisor | 5 |
| Polynomials & exponents | Special products | Exam 1 #3, Exam 2 #3, Exam 3 #4 | 1 | Conjugates with two radicals; Conjugates with a whole number; Square of a binomial | 6 |
| Polynomials & exponents | Exponent rules | Exam 1 #5, #6, Exam 2 #2, Exam 3 #1 | 1 | Powers of products; Quotient with negative exponents; Zero and negative exponents | 7 |
| Polynomials & exponents | Scientific notation | Exam 1 #10, Exam 2 #7 | 1 | Write a number in scientific notation; Multiply; Divide | 6 |
| Polynomials & exponents | Negative signs and powers | Exam 3 #20 | 1 | Evaluate and compare; Evaluate an expression | 5 |
| Factoring | Factoring trinomials | Exam 1 #11a, Exam 2 #11, Exam 3 #12 | 1 | Leading coefficient not 1; GCF first; GCF with a variable | 6 |
| Factoring | Factoring by grouping | Exam 1 #11b, Exam 3 #13 | 1 | Two variables; With coefficients; Cubic, then difference of squares | 5 |
| Factoring | Special factoring patterns | Exam 2 #12 (+ added types) | 7 | Difference of squares; Difference of squares with a GCF; Difference of squares twice; Difference of cubes; Difference of cubes, two variables; Difference of cubes with a GCF; Squares and cubes together; Sum of cubes; Sum of cubes, two variables; Sum of cubes with a GCF; Perfect-square trinomial; Perfect-square trinomial with a GCF | 11 |
| Factoring | Factoring strategy | *added* | 1 | Greatest common factor only; Prime polynomials; Choose the method | 7 |
| Rational expressions | Simplifying rational expressions | Exam 1 #8, Exam 2 #5 | 1 | Cancel one factor; Factor top and bottom; Opposite factors | 5 |
| Rational expressions | Multiplying & dividing rational expressions | Exam 1 #7, Exam 2 #10, Exam 3 #17 | 1 | Opposite binomials; Factor everything first; Multiply | 4 |
| Rational expressions | Adding & subtracting rational expressions | Exam 1 #4, Exam 2 #4, Exam 3 #6 | 1 | Different binomial denominators; Monomial denominators; Same binomial after factoring | 5 |
| Rational expressions | Solving rational equations | Exam 3 #15 | 1 | Variable in one denominator; Proportion (cross-multiply); Check for extraneous solutions | 5 |
| Radicals | Simplifying radicals | Exam 1 #9, Exam 2 #6 | 1 | One variable; Two variables | 6 |
| Radicals | Adding & subtracting radicals | Exam 3 #18 | 1 | Two radicals; With coefficients | 5 |
| Radicals | Simplifying (a ± √b)/c | Exam 3 #7 | 1 | Reduces to a fraction; Denominator divides out | 4 |
| Radicals | Radicals as rational exponents | Exam 3 #26 | 1 | nth root of a power; Power of an nth root; Square root | 5 |
| Radicals | Radical equations | Exam 1 #13, Exam 2 #13, Exam 3 #8 | 1 | Radical equals a negative; Square both sides; Radicals on both sides; Isolate the radical first | 5 |
| Equations & inequalities | Linear equations | Exam 2 #9, #15, Exam 3 #2 | 1 | Distribute first; Fractions on both sides; Fraction times a binomial | 5 |
| Equations & inequalities | Solving a formula for a variable | Exam 1 #16, Exam 2 #28, Exam 3 #3 | 1 | Formula with a fraction; Formula with a sum; Other formulas | 5 |
| Equations & inequalities | Linear inequalities | Exam 1 #18, Exam 2 #18 | 1 | Fraction coefficient; Negative outside parentheses; Variables on both sides | 5 |
| Equations & inequalities | Exponential equations (same base) | Exam 1 #12, Exam 2 #16, Exam 3 #10 | 1 | Rewrite the right side; Different bases, same root; Negative exponent | 6 |
| Equations & inequalities | Solving quadratics by factoring | Exam 1 #14, Exam 2 #14, Exam 3 #14 | 1 | Trinomial; Common factor; Cubic with a GCF; Leading coefficient not 1 | 5 |
| Equations & inequalities | Square root property | Exam 1 #15, Exam 2 #8, Exam 3 #5 | 1 | Squared binomial; Whole-number answers; Radical answers | 5 |
| Equations & inequalities | Quadratic formula | Exam 1 #17, Exam 2 #26, Exam 3 #24 | 1 | Rational answers; Round to hundredths; Rearrange first | 5 |
| Logarithms | Exponential & logarithmic form | *added* | 1 | Log form to exponential form; Exponential form to log form; Natural log and e; Common log (base 10) | 6 |
| Logarithms | Evaluating logarithms | *added* | 1 | Whole-number answers; Negative and fractional answers; Special logs and inverse rules | 8 |
| Logarithms | Expanding logarithms | *added* | 1 | Product, quotient and power rules; With a number to evaluate; Roots and powers | 6 |
| Logarithms | Condensing logarithms | *added* | 1 | Coefficients to exponents; Fractional coefficients; Include a number | 6 |
| Logarithms | Change of base | *added* | 1 | Evaluate with change of base; Answers that are negative | 4 |
| Logarithms | Solving logarithmic equations | *added* | 1 | Rewrite in exponential form; Logs on both sides; Condense first (one answer is extraneous); Natural log (round the answer); No solution | 6 |
| Logarithms | Exponential equations using logs | *added* | 1 | Any base; Base e; Isolate the power first; Expression in the exponent | 5 |
| Graphs, lines & systems | Intercepts & slope-intercept form | Exam 1 #20, Exam 3 #11 | 1 | Find intercepts and y = mx + b; Graph from standard form | 6 |
| Graphs, lines & systems | Line through two points | Exam 1 #24, Exam 2 #27 | 1 | Fraction slope; Whole-number slope | 5 |
| Graphs, lines & systems | Parabolas: intercepts, vertex, graph | Exam 1 #19, Exam 2 #22, Exam 3 #27 | 1 | Opens up; Opens down | 6 |
| Graphs, lines & systems | Solving systems of equations | Exam 1 #25, Exam 2 #24, Exam 3 #16 | 1 | Multiply both equations; Multiply one equation; Decimal coefficients | 5 |
| Graphs, lines & systems | Direct & inverse variation | Exam 1 #22, Exam 2 #17 | 1 | Direct variation; Inverse variation; Varies as the square | 5 |
| Relations & functions | Relations and functions | *added* | 1 | Ordered pairs; Table; Mapping diagram; Graph (vertical line test) | 6 |
| Relations & functions | Domain & range of a relation | *added* | 1 | Ordered pairs; Table; Mapping diagram; Graph of points | 4 |
| Relations & functions | Domain & range from a graph | *added* | 1 | Line segment; Parabola; Ray (one endpoint); Square-root curve | 6 |
| Relations & functions | Domain of a function from its formula | *added* | 1 | Fraction; Quadratic denominator; Square root; Polynomial; Square root in a denominator | 6 |
| Relations & functions | Range of a function from its formula | *added* | 1 | Parabola in vertex form; Parabola in standard form; Square root function; Absolute value function; Linear function | 5 |

### Word-problem groups (12 groups, 20 slots per exam)

| Group | Slots (source question) | Variations | Cards |
|---|---|---|---|
| Distance, rate & time | Distance, rate & time (Exam 1 #28) | Moving toward each other; Moving apart; Catching up; Round trip; With and against a current; Average speed | 6 |
| Mixture problems | Value mixture (Exam 1 #26)<br>Percent mixture (Exam 2 #29) | Blend by price; Two interest rates; Two solutions; Diluting with water; Metal alloy | 6 |
| Linear systems in context | Linear systems (Exam 3 #23) | Ticket sales; Coins; Two orders; Two numbers; Comparing two plans | 6 |
| Pythagorean theorem | Find a side (Exam 1 #27)<br>Rectangles and diagonals (Exam 2 #21)<br>Algebraic side lengths (Exam 3 #21) | Ladder against a wall; Guy wire; Kite string; Walking at right angles; Diagonal of a rectangle; Side from the diagonal; Legs x and x + d; Consecutive integer sides; Legs x and 2x + b | 6 |
| Similar triangles & triangles | Triangles (Exam 3 #22) | Shadows; Mirror on the ground; Nested triangles (ramp); Angle sum; Triangle perimeter; Triangle area (quadratic) | 6 |
| Perimeter & dimensions | Perimeter & dimensions (Exam 2 #20) | Rectangle perimeter; Three-sided fence; Rectangle area (quadratic) | 6 |
| Proportions & rates | Proportion (Exam 1 #21)<br>Proportion (Exam 2 #19) | Sales tax; Recipe scaling; Unit price; Map scale; Fuel use; Hourly pay; Paint coverage | 5 |
| Percent | Percent (Exam 2 #25) | Percent correct; Tip; Percent increase or decrease; Sale price; Find the whole | 6 |
| Inequalities from words | Inequalities from words (Exam 3 #19) | Translate a phrase; Budget; Average needed | 6 |
| Scientific notation in context | Scientific notation (Exam 3 #25) | Multiply large numbers; Divide large numbers; Very small quantities | 5 |
| Linear models | Interpret the slope (Exam 1 #23)<br>Graph and solve (Exam 2 #23)<br>Build the equation (Exam 3 #28) | Interpret the slope; Graph and solve; Build the equation | 6 |
| Exponential & log models | Money growth (added)<br>Growth and decay (added)<br>Log scales (added) | Compound interest; Continuous compounding; How long to reach a goal; Population growth; Doubling time; Half-life; pH; Decibels; Earthquake magnitude | 8 |

Flashcards: 311 cards in 55 decks.

## Development

No dependencies. Node 18+.

```
node build.mjs            # bundle src/ into docs/index.html (and dist/artifact.html)
node test/selftest.mjs    # generate every variant with many seeds and check the answer keys
node test/editor.mjs      # rebuild every answer key in the math box (stacked fractions, exponents, radicals) and re-grade it; replay keystrokes
node test/dump.mjs w-pyth # print sample problems + solutions for a topic (prefix match)
node test/catalog.mjs     # print the catalog above
```

| File | Purpose |
|---|---|
| `src/core.js` | namespace, seeded RNG, exact fractions, polynomial formatting |
| `src/texmath.js` | tiny TeX-subset → HTML renderer (fractions, radicals, exponents, logs) with no fonts or libraries |
| `src/parse.js` | parser for typed answers (including logs, e, ∞), evaluation, polynomial/rational forms |
| `src/check.js` | graders for each answer type (`num`, `nums`, `expr`, `factor`, `eq`, `system`, `ineq`, `point(s)`, `sci`, `radpm`, `eqform`, `set`, `interval`, `choice`) |
| `src/editor.js` | the WYSIWYG math answer box and its button bar; its value is the plain text the graders read |
| `src/svg.js` | theme-aware SVG drawing kit (planes, number lines, mappings, illustrations) |
| `src/topics/t*.js` | skill-topic generators and lessons |
| `src/topics/w*.js` | word-problem groups, variations, visuals and lessons |
| `src/flashcards.js` | flashcard decks, one per topic |
| `src/store.js` | saving progress (localStorage + optional Claude artifact db) |
| `src/app.js` | home, exam, tutorial, flashcard and progress views |

### Adding a topic

```js
MX.register({
  id: 'my-topic', section: 'Radicals', title: 'My topic', kind: 'skill',   // or kind: 'word' with slots
  sources: ['Exam 1 #9'],
  lesson: MX.T`<p>Explanation with inline math \(x^{2}\).</p>`,
  variants: {
    basic: { name: 'Basic', gen(rng) { return { prompt, visual, parts: [{ kind: 'expr', answer: 'x+1', points: 3 }], solution: [...] }; } },
  },
});
```

Add its deck to `src/flashcards.js`. Then run `node test/selftest.mjs` and `node test/editor.mjs`. The self-test fails if any generated answer key is rejected by its own checker, if an obvious wrong answer is accepted, or if a word problem lacks a visual. The editor test fails if an answer key stops grading as correct once it's built in the math box.
