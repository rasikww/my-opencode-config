# Learning Modes

This workspace teaches in two tracks, and only one track is active at a time. The active track lives in `CURRICULUM.md`.

- **Basic** covers the roughly 20% of the topic that delivers roughly 80% of what the mission needs.
- **Advanced** covers the valuable tail: the hard cases and tradeoffs where the basic mental model fails.

Read [SKILL.md](./SKILL.md) first. This document covers the mechanics: how to pick the 20%, how to size a track, the curriculum format, lesson design per track, and the gates between them.

## What The Buckets Are Not

The Pareto principle describes uneven value. It is not a law that composes.

- Never write "20% of the remaining 20%". It means nothing.
- Never promise that the advanced track holds "the other 20% of the value". It holds a mission-filtered slice of the tail. The rest of the tail is worthless for this user and stays out.
- Never imply the workspace reaches full mastery. The endpoint is a scope boundary that the user approved, not a claim of complete knowledge.

State this plainly when the user asks how much there is to learn.

## Selecting The Basic Track

The basic track is a research output, not a guess. Build it in this order.

### 1. Gather evidence

Prefer sources that show what people actually do, over sources that show what the field knows.

- Official quickstarts and getting-started pages. Vendors encode what they consider essential.
- Syllabi of reputable introductory courses. They encode what teachers consider load-bearing.
- Practitioner write-ups describing what they use daily, and what they never touch.
- Task lists, job postings, or workflow descriptions from the user's own mission context. Weight these highest.
- Bug reports and post-mortems from beginners. They show what bites first.

### 2. Rank candidates

Score each candidate on two axes:

- **Frequency**: how often a competent practitioner doing this mission reaches for it.
- **Impact**: how much breaks, or how much time is lost, when the user does not know it.

Teach high-frequency first. Teach high-impact next, even when it is rarer. Cite the evidence for each entry in `CURRICULUM.md`. Ask the user only when the ordering genuinely changes the plan.

### 3. Cut ruthlessly

Remove a candidate when any of these is true:

- It is rare in practice, even if it is intellectually central.
- It can be looked up in ten seconds and never needs to be recalled.
- It is interesting but off-mission.
- A learning record shows the user is already fluent.
- It only matters after the tail is learned.
- It is a variant of something already on the list.

Record every cut in the revision history with one short reason. The cut list is evidence that the selection was deliberate.

### 4. Present and get approval

Show the user the list, the count, and the cuts. The count becomes the `Y` in `Lesson X of Y`. Do not write lesson one until the user approves.

## Selecting The Advanced Track

Plan this only after the basic track graduates. The source material is the `Deferred to advanced` list plus the failure modes the user hit during the basic track.

Advanced entries are written as questions, not topics:

- "What breaks when a cached value hides a stale write?"
- "When do you choose a queue over a lock?"
- "Why does the default retry policy amplify an outage?"

Good advanced material comes from:

- The failure modes of the basic model. Every "where this breaks" line from the basic lessons is a candidate.
- Decisions with genuine tradeoffs, where the answer depends on context.
- Cases where the standard recipe produces the wrong result.
- What practitioners say separates competent from expert.
- Debugging and diagnosis, not construction.

The advanced track is still selective. Hold it to the same rule: each entry must earn its place.

## Sizing A Track

There is no fixed lesson count. Research decides.

- A narrow topic lands on a short track. A vast topic can justify a long one, and a long one is not a failure. Report the count the evidence supports.
- Never pad to look thorough. Never cap a genuinely large core at an arbitrary number.
- One lesson equals one capability the user can demonstrate. Split the entry instead of merging two capabilities.
- A track that keeps growing after approval is a sign the mission is too broad. Split the mission before adding more lessons.
- Report the count as a fact. If research supports fourteen lessons, say fourteen.

## CURRICULUM.md Format

`CURRICULUM.md` lives at the workspace root. It is the only file that changes when the plan changes.

```md
# Curriculum: {Topic}

Version: 1
Active track: basic
Approved by user: yes

## Basic track — 11 lessons

Covers the ~20% of {topic} that delivers ~80% of what this mission needs.
Selection: 17 candidates, 11 kept, 6 cut. See Revision history.

| Pos | Lesson | Capability | Status |
|---|---|---|---|
| 1 | 0001-setup-loop | Run the edit-run loop unaided | fluent |
| 2 | 0002-error-handling | Recover from a failed call | covered |
| 3 | 0003-... | ... | planned |
| 8 | — | ... | planned |

## Deferred to advanced

- Caching and stale writes — because the basic model assumes fresh reads.
- Retry policy under partial failure — because the basic model retries blindly.

## Advanced track

Not planned yet. Opens after basic graduation.

## Out of scope

- {Declared and never taught. One line each.}

## Revision history

- v1 — basic track approved, 11 lessons. Cut 6 candidates, listed above.
```

### Fields

- **Version**: increments on any change to a track count, a position, or an entry. Link the matching learning record.
- **Active track**: `basic` or `advanced`. This is the persistent mode.
- **Pos**: position in the track, 1-based. Drives the `of Y` in the lesson label.
- **Lesson**: the permanent file number and slug, or `—` when the entry is planned but not written.
- **Status**: `planned`, `covered`, `fluent`, or `dropped`.
  - `covered` means the lesson was taught. It does not count toward graduation.
  - `fluent` means the user demonstrated the capability unaided. It counts.
  - `dropped` keeps its file number and gets a one-line reason in the revision history.

### Rules

- File numbers are global and sequential. They are permanent, never reused, never renumbered.
- Positions can shift when the curriculum is revised. File numbers cannot.
- A missing core topic found mid-track is inserted into the basic track and the version is bumped. Teach it at basic depth, then resume the advanced lesson.
- A count change needs the user's approval. Record the approval in the `Approved by user` line.
- Never delete a revision history line, even for a change that was later reverted.

## Lesson Design Per Track

| | Basic | Advanced |
|---|---|---|
| Working time | Under 10 minutes | 20 to 40 minutes |
| Shape | One concept, one worked example, one practice rep | One hard case, no recipe |
| Scaffolding | Full. Show the path before asking for recall | None. The user must choose a path |
| Feedback | Immediate and automatic | Delayed, self-assessed, or revealed after an attempt |
| Difficulty | Designed out. Difficulty is the enemy of acquisition | Designed in. Difficulty is the tool for retention |
| Sources | Quickstarts, docs, intro material | Specs, source code, papers, post-mortems, expert books |
| Recall | Short retrieval at the end | Prediction before the answer, teach-back at the end |
| Ends with | "Where this breaks" | "What you would do differently next time" |

Two rules apply to both tracks:

- **Basic lessons never hide their own limits.** Every basic lesson ends with one honest line about where the simplification fails. That line feeds `Deferred to advanced`.
- **Advanced lessons never re-teach the core.** If the user needs a core capability, mark it in the basic track and teach it there.

## The Placement Test

Use this when the user asks for the advanced track without evidence of basic fluency.

1. Pick three tasks, one from each major area of the basic track.
2. Ask the user to do them unaided. No hints, no links.
3. Score out of three.

| Score | Action |
|---|---|
| 3 of 3 | Skip the basic track. Plan the advanced track now. |
| 2 of 3 | Start the basic track at the failed area, then move on. |
| 0 to 1 of 3 | Run the full basic track. |

Write the result as a learning record with the evidence. If the user explicitly overrides the gate, respect it and record the override.

## Graduation Checklist

Before the advanced track opens:

1. Every basic position is `fluent`.
2. A closing learning record exists for the basic phase.
3. The deferred list is reviewed, cut, and ordered.
4. The advanced track is selected and its count is approved by the user.
5. `CURRICULUM.md` moves to the next version with one revision line.
6. The active track is set to `advanced`.

The workspace is complete when every advanced position is `fluent`. Then write one consolidated reference document, one closing learning record, and point the user at the community. Stop teaching.

## Trigger Phrases

| Phrase | Scope | Action |
|---|---|---|
| "advanced mode", "advanced teaching", "advanced learning", "go advanced", "skip the basics, I am fluent" | Track | Switch to advanced. Gate applies. No question. |
| "back to basics", "core mode", "just the 20%", "Pareto mode" | Track | Switch to basic. No question. |
| "deep dive into X", "go deeper", "the hard cases of X" | Ambiguous | Ask: one advanced lesson now, or switch the workspace to the advanced track? |
| "where am I", "how many lessons left" | Read-only | Print the progress table from `CURRICULUM.md`. |
| "new topic", "start over" | New workspace | New mission, new curriculum, new mode. Do not reuse the old one. |

Ask the ambiguous question at most twice. Record the answer in `NOTES.md` and follow it from then on.

## Anti-Patterns

- **Padding a track to look thorough.** The count must come from evidence.
- **Recursive percentage claims.** See [What The Buckets Are Not](#what-the-buckets-are-not).
- **An advanced track that reads like a reading list.** Every entry is a decision or a failure case.
- **Silent renumbering.** It breaks links and destroys trust in the progress count.
- **Teaching before the map is approved.** The user asked for an endpoint. Give it to them first.
- **Flip-flopping the active track without a record.** Mode changes are learning events. Write them down.
