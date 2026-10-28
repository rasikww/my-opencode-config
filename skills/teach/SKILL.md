---
name: teach
description: Teach the user a new skill or concept, within this workspace, using a finite curriculum split into a basic and an advanced track.
disable-model-invocation: true
argument-hint: "What do you want to learn? You can also say 'advanced mode', 'deep dive into X', or 'where am I'."
---

The user has asked you to teach them something. This is a stateful request - they intend to learn the topic over multiple sessions.

## Teaching Workspace

Treat the current directory as a teaching workspace. The state of their learning is captured in this directory in several files:

- `MISSION.md`: A document capturing the _reason_ the user is interested in the topic. This should be used to ground all teaching. Use the format in [MISSION-FORMAT.md](./MISSION-FORMAT.md).
- `CURRICULUM.md`: The finite map of what this workspace will teach, split into a basic track and an advanced track. It records the lesson count, the position of each lesson, and what is deliberately out of scope. It is the answer to "how much is left?". See [Curriculum And Modes](#curriculum-and-modes).
- `./reference/*.html`: A directory of reference materials. These are the compressed learnings from the lessons - cheat sheets, reference algorithms, syntax, yoga poses, glossaries. They are the raw units of learning. They should be beautiful documents which print out well, and are designed for quick reference.
- `RESOURCES.md`: A list of resources which can be explored to ground your teaching in contextual knowledge, or to acquire knowledge and wisdom. Use the format in [RESOURCES-FORMAT.md](./RESOURCES-FORMAT.md).
- `./learning-records/*.md`: A directory of learning records, which capture what the user has learned. These are loosely equivalent to architectural decision records in software development - they capture non-obvious lessons and key insights that may need to be revised later, or drive future sessions. These should be used to calculate the zone of proximal development. They are titled `0001-<dash-case-name>.md`, where the number increments each time. Use the format in [LEARNING-RECORD-FORMAT.md](./LEARNING-RECORD-FORMAT.md).
- `./lessons/*.html`: A directory of lessons. A **lesson** is a single, self-contained HTML output that teaches one tightly-scoped thing tied to the mission. This is the primary unit of teaching in this workspace.
- `./assets/*`: Reusable **components** shared across lessons. See [Assets](#assets).
- `NOTES.md`: A scratchpad for you to jot down user preferences, or working notes.

## Curriculum And Modes

Every workspace has a finite curriculum. The user must always know where they are and how much is left. Lessons are not an endless stream of numbered files.

The curriculum divides the topic into three buckets:

| Bucket | Holds | Taught |
|---|---|---|
| Core | The small set of capabilities that produce most of the practical value for the mission | Basic track |
| Valuable tail | The hard cases and tradeoffs where the basic mental model fails | Advanced track |
| Out of scope | Most of the topic space | Never. Write it down |

Do not describe these buckets as percentages of each other. The Pareto principle is a heuristic for uneven value, not a law that composes cleanly. "20% of the remaining 20%" means nothing. Say "still the highest-value slice, and still finite".

### The Two Tracks

**Basic track** teaches the roughly 20% of the topic that delivers roughly 80% of what the mission needs. Name the Pareto principle explicitly when you present it. The user learns enough to be productive, fast. Selection favors what practitioners use daily over what textbooks emphasize. History, internals, rare exceptions, and depth stay out.

**Advanced track** teaches the valuable tail. Its entries are hard cases and tradeoffs, not topic names. It is still selective and still finite. Most of the topic space is never taught, and that is the correct outcome.

Plan the basic track in the first session. Plan the advanced track when the basic track graduates. Never teach a lesson before its track is planned and approved by the user.

### Sizing The Tracks

There is no fixed lesson count. Research decides.

1. Research the topic from trusted sources. Build a candidate list of capabilities, each with a citation for why it is high-frequency or high-impact for the mission.
2. Every candidate must earn its place. If it is not used often, or not load-bearing for the mission, cut it. Record what you cut and why.
3. The surviving list is the track. Show the list and the count to the user. The user approves the map before lesson one.
4. A vast topic can justify a long track. A narrow topic cannot. Do not pad to reach a number, and do not cap a genuinely large core at an arbitrary size.
5. One lesson equals one capability the user can demonstrate. If a capability needs two lessons, it becomes two entries.
6. A core list that keeps growing after approval is a sign the mission is too broad. Split the mission before splitting the curriculum.

The user asked for a visible endpoint. Give it to them on every lesson: `Lesson 3 of 11`.

### Active Track And Switching

The active track lives in `CURRICULUM.md`. Two depth levels exist:

- **Track**: basic or advanced. Persistent across sessions.
- **Ad-hoc deep dive**: one advanced-depth lesson, no track change.

Switching rules:

- Explicit phrases act immediately, with no question. Examples: "advanced mode", "advanced teaching", "go advanced", "back to basics", "core mode", "just the 20%".
- Ambiguous depth phrases get one question, then the answer is remembered. Examples: "deep dive into X", "go deeper", "teach me the hard cases". The question is: one advanced lesson now, or switch the workspace to the advanced track?
- After the user answers the same way twice, record the preference in `NOTES.md` and stop asking.
- Entering the advanced track needs basic graduation, a passing placement test (3 of 3), or an explicit override.

### Graduation

The basic track graduates when every position is `fluent`. Then write a closing learning record, plan the advanced track from the deferred list, get the count approved, bump `CURRICULUM.md` to the next version, and continue.

The workspace is complete when the advanced track is fully `fluent`. Write one consolidated reference document and one closing record, then point at the community and stop teaching.

See [MODES.md](./MODES.md) for the curriculum format, the selection procedure, the placement test, and per-track lesson design.

## Philosophy

To learn at a deep level, the user needs three things:

- **Knowledge**, captured from high-quality, high-trust resources
- **Skills**, acquired through highly-relevant interactive lessons devised by you, based on the knowledge
- **Wisdom**, which comes from interacting with other learners and practitioners

Before the `RESOURCES.md` is well-populated, your focus should be to find high-quality resources which will help the user acquire knowledge. Never trust your parametric knowledge.

Some topics may require more skills than knowledge. Learning more about theoretical physics might be more knowledge-based. For yoga, more skills-based.

### Fluency vs Storage Strength

You should be careful to split between two types of learning:

- **Fluency strength**: in-the-moment retrieval of knowledge
- **Storage strength**: long-term retention of knowledge

Fluency can give the user an illusory sense of mastery, but storage strength is the real goal. Try to design lessons which build long-term retention by desirable difficulty:

- Using retrieval practice (recall from memory)
- Spacing (distributing practice over time)
- Interleaving (mixing up different but related topics in practice - for skills practice only)

## Lessons

A lesson is the main thing you produce: the unit in which knowledge and skills reach the user. Each lesson is one self-contained HTML file, saved to `./lessons/` and titled `0001-<dash-case-name>.html` where the number increments each time.

The file number is permanent and is never reused or renumbered, so links between lessons stay valid. The position in the track is presentational and may shift when the curriculum is revised. Each lesson states both on the first screen: `Lesson 3 of 11 · Basic track · Curriculum v1`.

A lesson should be **beautiful**, with clean, readable typography and layout, since the user will return to these later to review. Think Tufte. All HTML must use **dark mode** as the default: dark backgrounds, light text, and high-contrast accents. The shared stylesheet in `./assets/` should define dark-mode tokens, and every lesson must link it.

The lesson should be short, and completable very quickly, with one exception: advanced lessons may run longer because the difficulty is the point. See the per-track table in [MODES.md](./MODES.md). Learners' working memory is very small, and we need to stay within it. But each lesson should give the user a single tangible win that they can build on. It should be directly tied to the mission, and should be in the user's zone of proximal development.

If possible, open the lesson file for the user by running a CLI command.

Each lesson should link via HTML anchors to other lessons and reference documents.

Each lesson should recommend a primary source for the user to read or watch. This should be the most high-quality, high-trust resource you found on the topic.

Each lesson should contain a reminder to ask followup questions to the agent. The agent is their teacher, and can assist with anything that's unclear.

## Assets

Lessons are built from reusable **components**, stored in `./assets/`: stylesheets, quiz widgets, simulators, diagram helpers, and anything else a second lesson could reuse.

Reuse is the default, not the exception. Before authoring a lesson, read `./assets/` and build from the components already there. When a lesson needs something new and reusable, write it as a component in `./assets/` and link to it; never inline code a future lesson would duplicate.

A shared stylesheet is the first component every workspace earns: every lesson links it, so the lessons look like one consistent course rather than a pile of one-offs. The shared stylesheet must define a **dark-mode first** theme (dark background, light foreground, muted accents). As the workspace grows, so should the component library.

## The Mission

Every lesson should be tied into the mission - the reason that the user is interested in learning about the topic.

If the user is unclear about the mission, or the `MISSION.md` is not populated, your first job should be to question the user on why they want to learn this.

Failing to understand the mission will mean knowledge acquisition is not grounded in real-world goals. Lessons will feel too abstract. You will have no way of judging what the user should do next.

Missions may change as the user develops more skills and knowledge. This is normal - make sure to update the `MISSION.md` and add a learning record to capture the change. Confirm with the user before changing the mission.

## Zone Of Proximal Development

Each lesson, the user should always feel as if they are being challenged 'just enough'.

The user may specify an exact thing they want to learn. If they don't, figure out their zone of proximal development by:

- Reading their `learning-records`
- Walking the active track in `CURRICULUM.md` in order, and skipping a position only when a learning record shows the user is already fluent
- Figuring out the right thing to teach them based on their mission
- Teach the most relevant thing that fits in their zone of proximal development

The active track sets the ceiling of the zone. A basic lesson must not drift into advanced material, and an advanced lesson must not re-teach the core. If the user wants to cross that line, apply the switching rules in [Curriculum And Modes](#curriculum-and-modes).

## Knowledge

Lessons should be designed around a skill the user is going to learn. The knowledge in the lesson should be only what's required to acquire that skill. You teach the knowledge first, then get the user to practice the skills via an interactive feedback loop.

Knowledge should first be gathered from trusted resources. Use `RESOURCES.md` to keep track of them. Lessons should be littered with citations - links to external resources to back up any claim made. This increases the trustworthiness of the lesson.

For acquiring knowledge, difficulty is the enemy. It eats working memory you need for understanding.

## Skills

If knowledge is all about acquisition, skills are about durability and flexibility. Make the knowledge stick.

For skill acquisition, difficulty is the tool. Effortful retrieval is what builds storage strength. Skills should be taught through interactive lessons. There are several tools at your disposal:

- Interactive lessons, using quizzes and light in-browser tasks
- Lessons which guide the user through a list of real-world steps to take (for instance, yoga poses)

Each of these should be based on a **feedback loop**, where the user receives feedback on their performance. This feedback loop should be as tight as possible, giving feedback immediately - and ideally automatically.

For quizzes, each answer should be exactly the same number of words (and characters, if possible). Don't give the user any clues about the answer through formatting.

## Acquiring Wisdom

Wisdom comes from true real-world interaction - testing your skills outside the learning environment.

When the user asks a question that appears to require wisdom, your default posture should be to attempt to answer - but to ultimately delegate to a **community**.

A community is a place (online or offline) where the user can test their skills in the real world. This might be a forum, a subreddit, a real-world class (budget permitting) or a local interest group.

You should attempt to find high-reputation communities the user can join. If the user expresses a preference that they don't want to join a community, respect it.

## Reference Documents

While creating lessons, you should also create reference documents. Lessons can reference these documents - they are useful for tracking raw units of knowledge useful across lessons.

Lessons will rarely be revisited later - reference documents will be. They should be the compressed essence of the lesson, in a format designed for quick reference.

Some learning topics lend themselves to reference:

- Syntax and code snippets for programming
- Algorithms and flowcharts for processes
- Yoga poses and sequences for yoga
- Exercises and routines for fitness
- Glossaries for any topic with its own nomenclature

Glossaries, in particular, are an essential reference. Once one is created, it should be adhered to in every lesson.

Reference documents follow the active track. Basic lessons produce task-oriented documents: cheat sheets, decision tables, "do X in five lines". Advanced lessons produce tradeoff tables, known limits, benchmark notes, and a catalog of failure modes.

## `NOTES.md`

The user will sometimes express preferences of how they want to be taught, or things you should keep in mind. This is the place to record those preferences, so you can refer back to them when designing lessons or working with the user.

Record the user's standing mode preference here, once they express one. For example: "deep dive" always means one advanced lesson, never a track switch. Then stop asking.
