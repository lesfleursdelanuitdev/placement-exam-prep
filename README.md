# Placement Exam Prep

A study app for an algebra placement exam. It started from three sample final exams for an intermediate algebra course and has grown to cover absolute value, piecewise functions, quadratics and transformations, and a full chapter's worth of linear equations and inequalities. It generates an unlimited supply of full-length practice exams, grades answers instantly, and has a tutorial and a flashcard deck for every topic. Progress is saved.

**Open it:** `docs/index.html` is a single self-contained page. Open it in a browser, or turn on GitHub Pages for this repo (Settings → Pages → deploy from branch, folder `/docs`).

## What it does

- **Home.** Three choices: the practice exam (start or continue), tutorials, and flashcards. A progress snapshot shows the last exam score, tutorials practiced, and flashcards learned. The top bar has Home · Exam · Tutorials · Flashcards · Grapher · Progress.
- **Pages with their own addresses.** Each part of the app is its own page with an address after `#`, so the browser's Back and Forward buttons, reloading, and bookmarks all work, and each page has its own tab title and remembers where you were scrolled:
  - `#/` home · `#/exam` the exam's overview (score, Start/Continue, each part's progress) · `#/exam/part-1`, `part-2`, `part-3` one page per part · `#/exam/results` after you finish
  - `#/tutorials` · `#/tutorials/<topic>` the lesson, then `/examples` and `/practice` (tabs at the top, and a Next button at the bottom)
  - `#/flashcards` · `#/flashcards/<topic>`, `/section/<name>`, `/all`, `/review` (all cards still learning)
  - `#/grapher` and `#/grapher/draw` · `#/progress`
- **Phones and tablets.** Up to 900px wide, the tabs become a hamburger button that slides out a menu from the left. The menu has the six sections, the current exam's score with a Start/Continue button, and jumps to Parts I–III. It closes with ×, a tap on the dimmed page, Escape, or a swipe to the left. While it's open, keyboard focus stays inside it and the page behind it doesn't scroll. On phones the pages run edge to edge, long math wraps after = or + signs, and wide tables scroll inside their own box. Every exam question, tutorial and flashcard is checked at 320px for sideways overflow.
- **Full-length generated exams.** Every exam covers all 72 topics in three parts, 102 questions and about 330–340 points, graded part by part like a paper exam:
  - **Part I · Skills:** 58 questions across 10 sections.
  - **Part II · Word problems:** 22 questions from 13 families.
  - **Part III · Linear equations & inequalities:** 22 questions, one for each skill in a full chapter on the topic (see below).

  The length can't be reduced. Instead, your work autosaves as you type, including answers you haven't checked yet. **Save and finish later** returns you to Home, and **Continue** reopens the same exam at the first unanswered question.
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
- **Absolute value and piecewise functions.** Absolute value expressions (simplifying, comparing, distance on the number line) and absolute value equations, including the one-solution and no-solution cases. Piecewise functions: evaluating, graphing, reading a graph, writing |x| piecewise, and piecewise pricing.
- **Quadratic equations & functions.** Factoring, the square root property and the quadratic formula, plus completing the square (solving and vertex form), the discriminant, equations in quadratic form (u-substitution with x², √x, fractional and negative exponents), vertex form and graphs, and quadratic inequalities. A quadratic word-problem group covers projectiles and maximum/minimum problems.
- **Transformations of functions.** Shifts, reflections, vertical stretches and compressions, and horizontal stretches (f(bx)) of the six basic graphs: describing, writing the equation, choosing the graph, moving a point, and reading the equation off a graph.
- **Part III: linear equations & inequalities.** Seven topics with 22 skills. All the questions are original and generated fresh for each exam:
  - general strategy, identities and contradictions, fractions and decimals
  - number, percent and simple-interest problems
  - solving formulas, geometry applications
  - coin, ticket, stamp, mixture and uniform-motion problems
  - interval notation, linear inequalities and their applications
  - compound inequalities ("and" / "or")
  - absolute value inequalities
- **Word problems vary within their group.** The 22 word-problem slots are grouped into 13 families (distance-rate-time, mixtures, Pythagorean, similar triangles, linear systems, exponential & log models, and more). Each exam draws a different variation from the family. Every word problem comes with an SVG diagram drawn from its own numbers.
- **A real math answer box.** Answers display as math while you type:
  - Typing `^` raises the cursor into an exponent.
  - Typing `/` stacks a fraction, and the term before it becomes the numerator.
  - `sqrt` draws a radical with a bar.
  - `log_2` makes a subscripted base.
  - `inf` becomes ∞, and `<=` becomes ≤.
  - The arrow keys move in and out of each piece.

  A button bar under the active box has the fraction, exponent, √, parentheses, ±, ≤ and ≥ buttons, plus context buttons: points, ×10ⁿ, log with base, ln, e, ∞, ∪, set braces, interval brackets, "all real numbers", "no solution" and "prime". It also has ← → ⌫ for phones. The box works with physical keyboards, phone keyboards, taps and paste, and it is reachable with Tab. Checked answers stay formatted.
- **Grading checks value and form.** The checker tests mathematical equivalence *and* the required form. For example:
  - "Factor completely" rejects a leftover GCF.
  - "Simplify" rejects `√50`.
  - "Positive exponents" rejects `m^-2`.
  - "Expand" rejects a log that could still be split.

  A form problem is a free nudge; only a wrong value costs points.
- **Tutorials.** A **Tutorial** button sits on every problem. Tutorials are listed by topic and grouped by section. Each one has a lesson, six worked examples, and practice exercises with unlimited tries, plus a button that adds 3 more exercises. The six examples are spread across the topic's problem types (every exam slot first, then the rest), each is labeled with its type, and a type that appears more than once gets different numbers each time. A "Skip to practice" link jumps past them. Tutorials are fixed: generating a new exam doesn't change them. Leaving the exam for a tutorial never resets the exam.
- **Clear lessons.** Every lesson is written in plain language: a short opening on what the topic is and why it matters, one idea per section, and one or two small worked examples laid out as "what you do | the math". Major ideas sit in colored boxes: **Definition** (blue), **Rule** or property (green), **How to** steps (violet) and **Watch out** for the common mistake (amber). The style follows OpenStax *Intermediate Algebra 2e*; no text or examples are copied from it (it is CC BY-NC-SA).
- **Grapher.** A tab for graphing and drawing:
  - **Graph functions:** up to 8 at once, each in a color you choose (8 preset swatches or a custom color), with show/hide. It graphs everything the answer box understands plus sin, cos, tan and π, piecewise functions (`x+1 if x<0; x^2 if x>=0`, with open and closed dots) and equations in x and y such as circles (`x^2 + y^2 = 9`) and vertical lines. Curves break at asymptotes and jumps and start exactly where a domain begins. Hovering shows each function's value.
  - **Window and grid:** the x and y range and the tick spacing (1, 2, 5, 10, 0.5…), with presets.
  - **Zoom and move:** on a computer, scroll the mouse wheel (or pinch a trackpad) to zoom around the pointer and drag to move the view; on a phone, pinch to zoom and drag with one finger (two fingers in draw mode, where one finger draws). Tap or hover to read values. With the graph focused, + and − zoom, the arrow keys move, and 0 resets. Tick spacing adjusts as you zoom.
  - **How to use the Grapher:** a help panel (button next to the mode tabs) explains graphing, what you can type, zooming and moving on computers and phones, the drawing tools and how drawings are checked.
  - **Draw a graph:** draw on the grid with a pen, points that snap to the grid, or two-point tools: a line through two points, a parabola from its vertex and one more point, a circle from its center and a point on it. Type what your drawing is the graph of and press **Check**. Pen strokes may wander about half a grid square; lines, parabolas and circles built from points must match closely; the drawing must cover the graph and pass through its intercepts and turning points. You can then show the correct graph on top of yours.
  - Your functions, colors, window and mode are saved.
- **Stopwatch.** A round timer button floats in the lower right corner on every page. Tap it and a panel slides out of it (the button and panel form one pill) with **Start**, then **Pause** / **Resume**, **Restart** and **Stop**, and the elapsed time once it's running. A dot on the closed button shows it is running (green) or paused (amber). The time keeps counting across pages and reloads (saved in this browser), and **Stop** keeps the last time on show.
- **Graphing by hand (practice).** A tutorial topic with "Graph it" problems (lines, parabolas, absolute value and square root graphs) answered by drawing on a grid with the same tools and checked the same way. It is practice only; exams stay the same length.
- **Flashcards.** There are 424 cards in 72 decks, one per topic, covering the rules, formulas and quick examples.
  - Tap a card and it turns over in 3D, lifting slightly as it turns. Tapping again mid-turn reverses it smoothly. New cards slide in from the side you're moving toward. With the system's reduce-motion setting on, the two sides simply fade instead.
  - Mark each card **Got it** or **Still learning**.
  - Shuffle the deck, or review only the cards marked still learning.
  - Study a whole section at once.
  - Keyboard shortcuts: Space flips, 1 and 2 mark a card, and ← → move.

  Tutorials link to their deck and decks link back. The marks are saved.
- **Saved progress.** The app saves the current exam, drafts, exam history, per-topic accuracy, tutorial practice and flashcard marks. After finishing, **Generate a new exam** starts the next one.
- **Storage.** Progress is always saved in the browser (localStorage). When the page runs as a Claude artifact with the `db` and `user` capabilities, it also saves a private per-user document so progress follows the person across devices.

## Catalog

Part I and Part II started from three sample final exams (Exams 1–3). Topics marked *added* are not on those exams; they were added to cover factoring patterns, logarithms, relations & functions, absolute value, piecewise functions, quadratics and transformations. Part III is all added material.

### Skill topics (52; 58 questions per exam)

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
| Absolute value | Absolute value expressions | *added* | 1 | Simplify; Order of operations; Compare values; Evaluate for given values; Distance on the number line | 7 |
| Absolute value | Absolute value equations | *added* | 1 | Two solutions; Isolate the absolute value first; Two absolute values; Equal to zero (one solution); No solution | 7 |
| Quadratic equations & functions | Solving quadratics by factoring | Exam 1 #14, Exam 2 #14, Exam 3 #14 | 1 | Trinomial; Common factor; Cubic with a GCF; Leading coefficient not 1 | 5 |
| Quadratic equations & functions | Square root property | Exam 1 #15, Exam 2 #8, Exam 3 #5 | 1 | Squared binomial; Whole-number answers; Radical answers | 5 |
| Quadratic equations & functions | Quadratic formula | Exam 1 #17, Exam 2 #26, Exam 3 #24 | 1 | Rational answers; Round to hundredths; Rearrange first | 5 |
| Quadratic equations & functions | Parabolas: intercepts, vertex, graph | Exam 1 #19, Exam 2 #22, Exam 3 #27 | 1 | Opens up; Opens down | 6 |
| Quadratic equations & functions | Completing the square | *added* | 1 | Make a perfect square; Solve (leading coefficient 1); Solve (leading coefficient not 1); Rewrite in vertex form | 7 |
| Quadratic equations & functions | The discriminant | *added* | 1 | Number and type of solutions; How many x-intercepts?; Choose a coefficient for one solution | 6 |
| Quadratic equations & functions | Equations in quadratic form | *added* | 1 | Fourth degree (u = x²); Substitute for a binomial; Square roots (u = √x); Fractional exponents; Negative exponents | 7 |
| Quadratic equations & functions | Vertex form and transformations | *added* | 1 | Vertex, axis and max/min; From standard form; Choose the graph; Describe the transformation; Equation from a graph | 6 |
| Quadratic equations & functions | Quadratic inequalities | *added* | 1 | Factorable; Rearrange first; Solve from a graph; No real roots or a double root | 6 |
| Logarithms | Exponential & logarithmic form | *added* | 1 | Log form to exponential form; Exponential form to log form; Natural log and e; Common log (base 10) | 6 |
| Logarithms | Evaluating logarithms | *added* | 1 | Whole-number answers; Negative and fractional answers; Special logs and inverse rules | 8 |
| Logarithms | Expanding logarithms | *added* | 1 | Product, quotient and power rules; With a number to evaluate; Roots and powers | 6 |
| Logarithms | Condensing logarithms | *added* | 1 | Coefficients to exponents; Fractional coefficients; Include a number | 6 |
| Logarithms | Change of base | *added* | 1 | Evaluate with change of base; Answers that are negative | 4 |
| Logarithms | Solving logarithmic equations | *added* | 1 | Rewrite in exponential form; Logs on both sides; Condense first (one answer is extraneous); Natural log (round the answer); No solution | 6 |
| Logarithms | Exponential equations using logs | *added* | 1 | Any base; Base e; Isolate the power first; Expression in the exponent | 5 |
| Graphs, lines & systems | Intercepts & slope-intercept form | Exam 1 #20, Exam 3 #11 | 1 | Find intercepts and y = mx + b; Graph from standard form | 6 |
| Graphs, lines & systems | Line through two points | Exam 1 #24, Exam 2 #27 | 1 | Fraction slope; Whole-number slope | 5 |
| Graphs, lines & systems | Solving systems of equations | Exam 1 #25, Exam 2 #24, Exam 3 #16 | 1 | Multiply both equations; Multiply one equation; Decimal coefficients | 5 |
| Graphs, lines & systems | Direct & inverse variation | Exam 1 #22, Exam 2 #17 | 1 | Direct variation; Inverse variation; Varies as the square | 5 |
| Relations & functions | Relations and functions | *added* | 1 | Ordered pairs; Table; Mapping diagram; Graph (vertical line test) | 6 |
| Relations & functions | Domain & range of a relation | *added* | 1 | Ordered pairs; Table; Mapping diagram; Graph of points | 4 |
| Relations & functions | Domain & range from a graph | *added* | 1 | Line segment; Parabola; Ray (one endpoint); Square-root curve | 6 |
| Relations & functions | Domain of a function from its formula | *added* | 1 | Fraction; Quadratic denominator; Square root; Polynomial; Square root in a denominator | 6 |
| Relations & functions | Range of a function from its formula | *added* | 1 | Parabola in vertex form; Parabola in standard form; Square root function; Absolute value function; Linear function | 5 |
| Relations & functions | Piecewise functions | *added* | 1 | Evaluate; Choose the graph; Read values from the graph; Absolute value as a piecewise function; Piecewise pricing | 6 |
| Relations & functions | Transformations of functions | *added* | 1 | Describe the transformation; Write the equation; Choose the graph; Move a point; Horizontal stretch or compression; Recognize a basic graph; Equation from a graph | 8 |

### Word-problem groups (13 groups, 22 slots per exam)

| Group | Slots (source question) | Variations | Cards |
|---|---|---|---|
| Proportions & rates | Proportion (Exam 1 #21)<br>Proportion (Exam 2 #19) | Sales tax; Recipe scaling; Unit price; Map scale; Fuel use; Hourly pay; Paint coverage | 5 |
| Percent | Percent (Exam 2 #25) | Percent correct; Tip; Percent increase or decrease; Sale price; Find the whole | 6 |
| Scientific notation in context | Scientific notation (Exam 3 #25) | Multiply large numbers; Divide large numbers; Very small quantities | 5 |
| Inequalities from words | Inequalities from words (Exam 3 #19) | Translate a phrase; Budget; Average needed | 6 |
| Perimeter & dimensions | Perimeter & dimensions (Exam 2 #20) | Rectangle perimeter; Three-sided fence; Rectangle area (quadratic) | 6 |
| Pythagorean theorem | Find a side (Exam 1 #27)<br>Rectangles and diagonals (Exam 2 #21)<br>Algebraic side lengths (Exam 3 #21) | Ladder against a wall; Guy wire; Kite string; Walking at right angles; Diagonal of a rectangle; Side from the diagonal; Legs x and x + d; Consecutive integer sides; Legs x and 2x + b | 6 |
| Similar triangles & triangles | Triangles (Exam 3 #22) | Shadows; Mirror on the ground; Nested triangles (ramp); Angle sum; Triangle perimeter; Triangle area (quadratic) | 6 |
| Linear models | Interpret the slope (Exam 1 #23)<br>Graph and solve (Exam 2 #23)<br>Build the equation (Exam 3 #28) | Interpret the slope; Graph and solve; Build the equation | 6 |
| Distance, rate & time | Distance, rate & time (Exam 1 #28) | Moving toward each other; Moving apart; Catching up; Round trip; With and against a current; Average speed | 6 |
| Mixture problems | Value mixture (Exam 1 #26)<br>Percent mixture (Exam 2 #29) | Blend by price; Two interest rates; Two solutions; Diluting with water; Metal alloy | 6 |
| Linear systems in context | Linear systems (Exam 3 #23) | Ticket sales; Coins; Two orders; Two numbers; Comparing two plans | 6 |
| Quadratic applications | Projectile motion (added)<br>Maximum and minimum (added) | When it hits the ground; When it reaches a height; Maximum height; Largest fenced area; Maximum revenue; Minimum cost | 7 |
| Exponential & log models | Money growth (added)<br>Growth and decay (added)<br>Log scales (added) | Compound interest; Continuous compounding; How long to reach a goal; Population growth; Doubling time; Half-life; pH; Decibels; Earthquake magnitude | 8 |

### Part III: linear equations & inequalities (7 topics, 22 questions per exam)

| Topic | Skills (one question each) | Variations | Cards |
|---|---|---|---|
| Linear equations: strategy and special cases | General strategy<br>Classify equations<br>Fraction or decimal coefficients | Distribute first; Like terms on both sides; Nested grouping symbols; Identity; Contradiction; Conditional; Fraction coefficients; Decimal coefficients | 7 |
| Problem solving: numbers, percents, interest | Number problems<br>Percent applications<br>Simple interest | Two numbers; Consecutive integers; Translate and solve; Commission; Markup; Find the discount rate; Find the original amount; Find the interest; Find the rate; Find the principal; Find the time | 7 |
| Formulas and geometry applications | Solve a formula for a variable<br>Geometry applications | Solve for y; Solve a formula; Angles of a triangle; Complementary and supplementary angles; Triangle area; Trapezoid area | 7 |
| Coins, tickets, mixtures and motion | Coin problems<br>Ticket and stamp problems<br>Mixture problems<br>Uniform motion | Coins; Tickets; Stamps; Price blend; Percent solution; Toward each other: when do they meet?; Two speeds on one trip; Late start: catching up | 6 |
| Linear inequalities and interval notation | Number line and interval notation<br>Solve linear inequalities<br>Translate and solve<br>Inequality applications | Inequality to interval notation; Graph to interval notation; Solve and graph; With fractions; Translate words; Break-even and profit; Budget limit; Reach a goal | 6 |
| Compound inequalities | “And” inequalities<br>“Or” inequalities<br>Compound inequality applications | Double inequality; Two inequalities joined by “and”; “Or” inequalities; Temperature range; Stay within a range | 6 |
| Absolute value inequalities | Absolute value “less than”<br>Absolute value “greater than”<br>Absolute value applications | Less than; Isolate first (less than); Greater than; Isolate first (greater than); Machine-part tolerance; Package weight | 7 |

Flashcards: 424 cards in 72 decks.

## Development

No dependencies: no React, no Next.js, no npm packages at all. The page is plain JavaScript and loads nothing external except the Google Fonts stylesheet. Node 18+ is needed only to build and test.

```
node build.mjs            # bundle src/ into docs/index.html (and dist/artifact.html)
node test/selftest.mjs    # generate every variant with many seeds and check the answer keys (add a topic id or file name to test just that)
node test/fuzz.mjs 400    # every variant with 400 fresh random seeds; prints a repro command for each failure
node test/editor.mjs      # rebuild every answer key in the math box (stacked fractions, exponents, radicals) and re-grade it; replay keystrokes
node test/security.mjs    # tampered saved progress must be cleaned before the page uses it
node test/grapher.mjs     # grapher: reading inputs, sampling (asymptotes, domain edges), contours, the drawing checker
node test/dump.mjs w-pyth # print sample problems + solutions for a topic (prefix match)
node test/catalog.mjs     # print the catalog above
```

| File | Purpose |
|---|---|
| `src/core.js` | namespace, seeded RNG, exact fractions, polynomial formatting |
| `src/texmath.js` | tiny TeX-subset → HTML renderer (fractions, radicals, exponents, logs) with no fonts or libraries |
| `src/parse.js` | parser for typed answers (including logs, e, ∞), evaluation, polynomial/rational forms |
| `src/verify.js` | independent answer checks: each generated part's `verify` re-derives the answer from the problem as shown (root finding, substitution, equivalence, region sampling) |
| `src/plot.js` | the grapher's math: reading functions and equations, adaptive sampling, contours, SVG planes, checking drawings |
| `src/stopwatch.js` | the floating stopwatch (icons from Lucide, ISC license) |
| `src/grapher.js` | the Grapher tab, and the drawing grid used by "graph it" practice |
| `src/check.js` | graders for each answer type (`num`, `nums`, `expr`, `factor`, `eq`, `system`, `ineq`, `point(s)`, `sci`, `radpm`, `eqform`, `set`, `interval`, `choice`) |
| `src/editor.js` | the WYSIWYG math answer box and its button bar; its value is the plain text the graders read |
| `src/svg.js` | theme-aware SVG drawing kit (planes, number lines, mappings, illustrations) |
| `src/topics/t*.js` | skill-topic generators and lessons |
| `src/topics/w*.js` | word-problem groups, variations, visuals and lessons |
| `src/topics/x*.js` | Part III topics (`part: 3`), shown after the word problems |
| `src/flashcards.js` | flashcard decks, one per topic |
| `src/store.js` | saving progress (localStorage + optional Claude artifact db); every load is sanitized, since saved data is untrusted input |
| `src/app.js` | home, exam, tutorial, flashcard and progress views |

### How answer keys are kept correct

The grader compares a student's answer with the stored key, so a generator that computes the key wrong would mark right answers wrong. Three layers stop that:

1. **Every part has an independent verifier.** `verify` is built from the problem as the student sees it (the displayed equation, expression, story numbers or plotted data), never from the generator's worked answer, and it gets to the answer a different way: numeric root finding (which also catches extraneous roots, holes, no-solution and identity cases), substituting into the stated relationships, equivalence at sample points, or sampling an inequality. Multiple-choice options carry what they show, so the verifier confirms that exactly one option is right and that it's the marked one. Rounded answers are checked for correct rounding of the exact value.
2. **The tests.** `test/selftest.mjs` requires a verifier on every part, runs it on the answer key, and also feeds it a deliberately broken key that it must reject. `test/fuzz.mjs` does the same with fresh random seeds. GitHub Actions runs the tests on every push and pull request, checks that `docs/index.html` matches the source, and runs a wide random-seed pass daily.
3. **A safety net in the app.** Before a question is shown (exam or tutorial), `MX.sound` checks that the grader accepts its key and the verifier agrees. A question that fails is replaced by one from the next seed and a warning is logged, so a rare bad case never reaches a student. Questions that pass keep their seed, so saved exams rebuild unchanged.

### Adding a topic

```js
MX.register({
  id: 'my-topic', section: 'Radicals', title: 'My topic', kind: 'skill',   // or kind: 'word' with slots; part: 3 puts it in Part III
  sources: ['Exam 1 #9'],
  lesson: MX.T`<p>Explanation with inline math \(x^{2}\).</p>`,
  variants: {
    basic: { name: 'Basic', gen(rng) { return { prompt, visual, parts: [{ kind: 'expr', answer: 'x+1', points: 3, verify: MX.V.equiv('(x^2-1)/(x-1)') }], solution: [...] }; } },
  },
});
```

Add its deck to `src/flashcards.js`. Then run `node test/selftest.mjs` and `node test/editor.mjs`. Every part needs a `verify` built from the displayed problem (see `src/verify.js` for the helpers: `solves`, `solvesFor`, `equiv`, `value`, `region`, `choiceRegion`, `choiceData`, `explicit`, `model`, `point`, `custom`). The self-test fails if any generated answer key is rejected by its own checker or by its verifier, if a verifier accepts a broken key, if an obvious wrong answer is accepted, or if a word problem lacks a visual. The editor test fails if an answer key stops grading as correct once it's built in the math box.
