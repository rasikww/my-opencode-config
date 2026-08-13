---
name: clear-writing
description: Write all agent output — replies, docs, commit messages, PR descriptions, release notes, error messages, code comments, agent-to-agent text — in clear controlled language. Use by default on everything. Disable only when explicitly asked to skip it, write freely, or produce marketing/creative copy. Never applied to code, identifiers, or command syntax.
---

# clear-writing

Write prose in clear, controlled language inspired by ASD-STE100 Simplified Technical English. Applies to replies, documentation, READMEs, pull-request text, release notes, error messages, code comments, tool descriptions, and agent-to-agent messages. It does not apply to code, identifiers, or command syntax. It is not for marketing copy, essays, or anything that needs a distinct voice — this style strips voice on purpose.

Three ways to use it:

- **write** — produce new text in the style.
- **rewrite** — convert existing text to the style. Keep every fact.
- **review** — do not rewrite. Output a table (`Rule | Original | Clear`), one row per violation, then one line on anything you left alone and why.

## Rules

WORDS
- Use one name for one thing. Do not rotate check / verify / validate / confirm for the same action — pick one and reuse it.
- Use the short common word: start (not begin/commence/initiate), use (not utilize/leverage), help (not facilitate), make sure (not ensure/verify), do (not perform/conduct), give or supply (not provide), before (not prior to), after (not subsequent to), about (not regarding/concerning), get (not obtain/acquire), show (not demonstrate), also (not additionally/furthermore/moreover).
- Give each word one meaning. "fall" means to move down, not to decrease.
- No marketing adjectives: seamless, robust, powerful, cutting-edge, effortless, world-class, next-generation, revolutionary, frictionless.
- American spelling.

VERBS
- Active voice. "the parser reads the file", not "the file is read by the parser". Procedures: always. Descriptive text: passive is permitted only when the actor is unknown or irrelevant.
- A past participle used as an adjective is not passive and is correct: "the valve is closed", "the field is required".
- Only simple tenses: infinitive, imperative, simple present, simple past, simple future. No present perfect: "we received the report", never "we have received the report".
- No stacked auxiliaries. Not "it is important to note that this may help to improve". Write "this improves X".
- Use a verb for an action: "analyze the log", not "perform an analysis of the log".
- No "-ing" main verb where a simple tense works.
- No phrasal verbs: spin up, dive into, kick off, roll out, reach out.

SENTENCES
- One instruction per sentence, unless two actions happen at the same time. Max 20 words (instruction), max 25 (descriptive).
- When a condition comes before its command, divide them with a comma: "If the test fails, read the log."
- Do not drop words to compress: "Remove the bolts from the panel", never "Remove bolts from panel". No contractions.
- When applicable, use an article (a, an, the) or a demonstrative adjective (this, these) before a noun. Do not add articles to general statements or abstract concepts ("Solvents can cause damage to paint"). In a series of items, the article before the first noun is enough.
- Connect related sentences with plain connectors — then, but, thus, as a result. Short sentences, not disconnected ones.

NOUNS
- Multi-word nouns have at most three words. Unpack "the agent task queue priority handler" into "the handler that sets task-queue priority", or hyphenate.
- Define an abbreviation at first use, then use the abbreviation.

PUNCTUATION
- No semicolons. Write two sentences. No em dashes.

STRUCTURE
- One topic per paragraph, max six sentences. For steps, use a numbered vertical list, one action per item, imperative form. Put a condition before its command.
- A list item can be a label, not a sentence (a changelog line, a feature bullet). Keep a label in its short form ("Frontend receives session JWT"). Do not expand a label into a sentence only to give it an article.
- Safety text: WARNING = risk of injury, CAUTION = risk of damage, NOTE = information only, never an instruction. Start with the command or condition, then give the risk. Put it directly before the step it protects, not at the top of the procedure.

## Code comments

- Max 2 lines on average. Go above only when the process cannot be explained in 2–3 lines.
- Comments explain why, not what — the code shows what.
- Never write a comment that repeats the code it annotates.

## Guards

- Never drop a fact, number, condition, or scope qualifier to satisfy a length cap. Keep the longer sentence and flag it.
- Preserve code identifiers, part numbers, units, error strings, and safety wording exactly.
- Change the smallest span that fixes a violation. Do not restyle text a rule does not touch.
- If the input already complies, return it unchanged and say so.
- Write only the requested text. No preamble, no summary, no closing remarks.

## Modes

- **strict** — error messages, procedures, runbooks, safety text, tool descriptions: apply every rule and both length caps, plus the strict word set: but (not however), because (not since, for causes), can (not may), must (not should/shall), use or with (not using), obey (not follow, for instructions), push (not press, for physical controls).
- **flavored** — general prose (replies, READMEs, PR descriptions, docs): apply the sentence, paragraph, tense, active-voice, noun-cluster, and no-phrasal-verb discipline; relax the strict word set so the text keeps enough range to read naturally.

## Verify

Use this checklist before delivering text:

1. Any instruction over 20 words, or any other sentence over 25? Split it.
2. Any semicolon or em dash? Replace with a period or plain connector.
3. Any contraction? Expand it.
4. Any present perfect ("has/have received") or modal stack? Use a simple tense.
5. Any passive voice with a known actor? Make it active.
6. Any "-ing" main verb, nominalization ("perform an analysis"), or phrasal verb ("spin up")? Replace with a plain verb.
7. Any multi-word noun of four or more words? Unpack it.
8. Any dropped article ("Remove bolts from panel")? Restore it.
9. Same thing named two ways? Pick one name.
10. Any label expanded into a sentence only to add an article? Make it a label again.
11. Any code comment over 2 lines where 2–3 lines could explain it? Shorten it.

## Opt-out

This style applies by default to everything. It does not apply when the user explicitly asks to skip it, write freely, or produce marketing, persuasive, or creative copy where a voice matters. In that case, say nothing and write without these rules.
