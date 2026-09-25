# Math 098 Final Prep

A practice-exam generator for a Math 098 (intermediate algebra) final. It was built from three sample final exams and produces an unlimited supply of new exams on the same topics, with instant grading, a tutorial for every topic, and saved progress.

**Open it:** `docs/index.html` is a single self-contained page. Open it in a browser, or turn on GitHub Pages for this repo (Settings → Pages → deploy from branch, folder `/docs`).

## What it does

- **Generated exams.** Every exam has one problem for each of the 30 skill topics and 17 word problems (one per word-problem type found on the sample finals). About 175 points, graded part by part like the paper exam.
- **Word problems vary within their group.** The 17 word-problem slots are grouped into 11 general families (distance-rate-time, mixtures, Pythagorean, similar triangles, linear systems, and more). Each exam draws a different variation from the family, and every word problem comes with an SVG diagram drawn from its own numbers.
- **Quiz-style checking.** Answers are typed in (`3x^2-4x+1`, `(x+2)/(x-3)`, `5t^6√(2t)`, `(-2+-√10)/3`, `x >= -3`, `(3, -2)`, `3.2 x 10^5`). The checker tests mathematical equivalence *and* the required form. For example, "factor completely" rejects a leftover GCF, "simplify" rejects `√50`, and "positive exponents" rejects `m^-2`. A form problem is a free nudge; only a wrong value costs points.
- **Tutorials.** A **Tutorial** button sits on every problem. Each tutorial has a short lesson, worked examples and practice exercises with unlimited tries, plus a button that adds 3 more exercises (mixed, or one chosen variation). Tutorials are fixed: generating a new exam doesn't change them.
- **Saved progress.** The current exam, its score, exam history, per-topic accuracy and tutorial practice are saved. Leaving the exam for a tutorial never resets it. After finishing, **Generate a new exam** starts the next one.
- **Storage.** Progress is always saved in the browser (localStorage). When the page runs as a Claude artifact with the `db` and `user` capabilities, it also saves a private per-user document so progress follows the person across devices.

## Catalog

Built from Sample Final Exams 1–3.

### Skill topics (30)

| Section | Topic | On the sample finals | Variations |
|---|---|---|---|
| Polynomials & exponents | Adding & subtracting polynomials | Exam 1 #1, Exam 2 #1 | Subtract two trinomials; Subtract a multiple; Add and subtract three polynomials |
| Polynomials & exponents | Dividing a polynomial by a monomial | Exam 1 #2, Exam 3 #9 | Two variables; Negative divisor |
| Polynomials & exponents | Special products | Exam 1 #3, Exam 2 #3, Exam 3 #4 | Conjugates with two radicals; Conjugates with a whole number; Square of a binomial |
| Polynomials & exponents | Exponent rules | Exam 1 #5, #6, Exam 2 #2, Exam 3 #1 | Powers of products; Quotient with negative exponents; Zero and negative exponents |
| Polynomials & exponents | Scientific notation | Exam 1 #10, Exam 2 #7 | Write a number in scientific notation; Multiply; Divide |
| Polynomials & exponents | Negative signs and powers | Exam 3 #20 | Evaluate and compare; Evaluate an expression |
| Factoring | Factoring trinomials | Exam 1 #11a, Exam 2 #11, Exam 3 #12 | Leading coefficient not 1; GCF first; GCF with a variable |
| Factoring | Factoring by grouping | Exam 1 #11b, Exam 3 #13 | Two variables; With coefficients; Cubic, then difference of squares |
| Factoring | Difference of squares | Exam 2 #12 | Two variables; GCF first; Factor twice |
| Rational expressions | Simplifying rational expressions | Exam 1 #8, Exam 2 #5 | Cancel one factor; Factor top and bottom; Opposite factors |
| Rational expressions | Multiplying & dividing rational expressions | Exam 1 #7, Exam 2 #10, Exam 3 #17 | Opposite binomials; Factor everything first; Multiply |
| Rational expressions | Adding & subtracting rational expressions | Exam 1 #4, Exam 2 #4, Exam 3 #6 | Different binomial denominators; Monomial denominators; Same binomial after factoring |
| Rational expressions | Solving rational equations | Exam 3 #15 | Variable in one denominator; Proportion (cross-multiply); Check for extraneous solutions |
| Radicals | Simplifying radicals | Exam 1 #9, Exam 2 #6 | One variable; Two variables |
| Radicals | Adding & subtracting radicals | Exam 3 #18 | Two radicals; With coefficients |
| Radicals | Simplifying (a ± √b)/c | Exam 3 #7 | Reduces to a fraction; Denominator divides out |
| Radicals | Radicals as rational exponents | Exam 3 #26 | nth root of a power; Power of an nth root; Square root |
| Radicals | Radical equations | Exam 1 #13, Exam 2 #13, Exam 3 #8 | Radical equals a negative; Square both sides; Radicals on both sides; Isolate the radical first |
| Equations & inequalities | Linear equations | Exam 2 #9, #15, Exam 3 #2 | Distribute first; Fractions on both sides; Fraction times a binomial |
| Equations & inequalities | Solving a formula for a variable | Exam 1 #16, Exam 2 #28, Exam 3 #3 | Formula with a fraction; Formula with a sum; Other formulas |
| Equations & inequalities | Linear inequalities | Exam 1 #18, Exam 2 #18 | Fraction coefficient; Negative outside parentheses; Variables on both sides |
| Equations & inequalities | Exponential equations (same base) | Exam 1 #12, Exam 2 #16, Exam 3 #10 | Rewrite the right side; Different bases, same root; Negative exponent |
| Equations & inequalities | Solving quadratics by factoring | Exam 1 #14, Exam 2 #14, Exam 3 #14 | Trinomial; Common factor; Cubic with a GCF; Leading coefficient not 1 |
| Equations & inequalities | Square root property | Exam 1 #15, Exam 2 #8, Exam 3 #5 | Squared binomial; Whole-number answers; Radical answers |
| Equations & inequalities | Quadratic formula | Exam 1 #17, Exam 2 #26, Exam 3 #24 | Rational answers; Round to hundredths; Rearrange first |
| Graphs, lines & systems | Intercepts & slope-intercept form | Exam 1 #20, Exam 3 #11 | Find intercepts and y = mx + b; Graph from standard form |
| Graphs, lines & systems | Line through two points | Exam 1 #24, Exam 2 #27 | Fraction slope; Whole-number slope |
| Graphs, lines & systems | Parabolas: intercepts, vertex, graph | Exam 1 #19, Exam 2 #22, Exam 3 #27 | Opens up; Opens down |
| Graphs, lines & systems | Solving systems of equations | Exam 1 #25, Exam 2 #24, Exam 3 #16 | Multiply both equations; Multiply one equation; Decimal coefficients |
| Graphs, lines & systems | Direct & inverse variation | Exam 1 #22, Exam 2 #17 | Direct variation; Inverse variation; Varies as the square |

### Word-problem groups (11 groups, 17 slots per exam)

| Group | Slots (source question) | Variations |
|---|---|---|
| Distance, rate & time | Distance, rate & time (Exam 1 #28) | Moving toward each other; Moving apart; Catching up; Round trip; With and against a current; Average speed |
| Mixture problems | Value mixture (Exam 1 #26)<br>Percent mixture (Exam 2 #29) | Blend by price; Two interest rates; Two solutions; Diluting with water; Metal alloy |
| Linear systems in context | Linear systems (Exam 3 #23) | Ticket sales; Coins; Two orders; Two numbers; Comparing two plans |
| Pythagorean theorem | Find a side (Exam 1 #27)<br>Rectangles and diagonals (Exam 2 #21)<br>Algebraic side lengths (Exam 3 #21) | Ladder against a wall; Guy wire; Kite string; Walking at right angles; Diagonal of a rectangle; Side from the diagonal; Legs x and x + d; Consecutive integer sides; Legs x and 2x + b |
| Similar triangles & triangles | Triangles (Exam 3 #22) | Shadows; Mirror on the ground; Nested triangles (ramp); Angle sum; Triangle perimeter; Triangle area (quadratic) |
| Perimeter & dimensions | Perimeter & dimensions (Exam 2 #20) | Rectangle perimeter; Three-sided fence; Rectangle area (quadratic) |
| Proportions & rates | Proportion (Exam 1 #21)<br>Proportion (Exam 2 #19) | Sales tax; Recipe scaling; Unit price; Map scale; Fuel use; Hourly pay; Paint coverage |
| Percent | Percent (Exam 2 #25) | Percent correct; Tip; Percent increase or decrease; Sale price; Find the whole |
| Inequalities from words | Inequalities from words (Exam 3 #19) | Translate a phrase; Budget; Average needed |
| Scientific notation in context | Scientific notation (Exam 3 #25) | Multiply large numbers; Divide large numbers; Very small quantities |
| Linear models | Interpret the slope (Exam 1 #23)<br>Graph and solve (Exam 2 #23)<br>Build the equation (Exam 3 #28) | Interpret the slope; Graph and solve; Build the equation |

## Development

No dependencies. Node 18+.

```
node build.mjs            # bundle src/ into docs/index.html (and dist/artifact.html)
node test/selftest.mjs    # generate every variant with many seeds and check the answer keys
node test/dump.mjs w-pyth # print sample problems + solutions for a topic (prefix match)
node test/catalog.mjs     # print the catalog above
```

| File | Purpose |
|---|---|
| `src/core.js` | namespace, seeded RNG, exact fractions, polynomial formatting |
| `src/texmath.js` | tiny TeX-subset → HTML renderer (fractions, radicals, exponents) with no fonts or libraries |
| `src/parse.js` | parser for typed answers, evaluation, polynomial/rational forms |
| `src/check.js` | graders for each answer type (`num`, `nums`, `expr`, `factor`, `eq`, `system`, `ineq`, `point(s)`, `sci`, `radpm`, `choice`) |
| `src/svg.js` | theme-aware SVG drawing kit (planes, number lines, illustrations) |
| `src/topics/t*.js` | skill-topic generators and lessons |
| `src/topics/w*.js` | word-problem groups, variations, visuals and lessons |
| `src/store.js` | saving progress (localStorage + optional Claude artifact db) |
| `src/app.js` | exam, tutorial and progress views |

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

Run `node test/selftest.mjs` afterward: it fails if any generated answer key is rejected by its own checker, if an obvious wrong answer is accepted, or if a word problem lacks a visual.
