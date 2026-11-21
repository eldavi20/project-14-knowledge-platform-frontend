# Documentation Style Guide

**Project:** SER 401 — Project 14: Permission-Aware Knowledge Agent

**Applies to:** backend and frontend repositories

**Last updated:** 20 Nov 2026

**Purpose:** Keep documentation across both repositories consistent in naming,
tone, structure, and formatting.

---

## 1. Naming

- Write the course name as **SER 401**.
- Write the product name as **Project 14 — Knowledge Platform** on first use;
  use **Permission-Aware Knowledge Agent** when referring to the full system.
- Use these repository names exactly:
  - `project-14-knowledge-platform` — backend
  - `project-14-knowledge-platform-frontend` — frontend
- Use **frontend** and **backend** in lowercase unless they begin a sentence or
  appear in a title.
- Use **sign-in** and **sign-out** as nouns or adjectives. Use **sign in** and
  **sign out** as verbs. Use **signup** for the `/signup` route and feature.
- Define an acronym on first use, then use the acronym consistently.

## 2. Voice and Tone

- Reference documentation uses a neutral third person voice.
- Procedural documentation uses direct, imperative instructions.
- Use **must** for security requirements, **should** for recommendations, and
  **may** for optional behavior.
- Avoid marketing language, rhetorical questions, and unnecessary filler.
- Prefer short paragraphs and concrete examples over long explanations.

## 3. Headings

- Use one H1 per document.
- Use Title Case for H1, H2, and H3 headings.
- Do not end headings with punctuation.
- Use **and** instead of `&` in headings and prose.
- Keep heading levels sequential; do not skip from H2 to H4.

## 4. Punctuation and Formatting

- Use an em dash (`—`) with surrounding spaces for a break in thought.
- Use the serial comma in lists of three or more items.
- Use one space after punctuation.
- Use fenced code blocks with a language tag (`bash`, `json`, `python`, `ts`,
  `text`).
- Put commands in executable order and show the expected result when useful.
- Use tables for comparisons and matrices; use lists for steps and options.

## 5. Dates and Times

- Use `D Mon YYYY` in prose, for example `20 Nov 2026`.
- Use ISO 8601 timestamps for machine-readable values, for example
  `2026-11-20T12:36:08Z`.
- State the timezone when a time could be ambiguous. Use **AZ** for Arizona
  time.
- Include a **Last verified** date when a document describes current behavior.

## 6. Links and References

- Use descriptive link text; do not use "click here".
- Use relative links for files inside the same repository.
- Use full GitHub URLs for cross-repository references.
- Reference Taiga items as `US-262` and `T-263`.
- Reference code paths in backticks, for example
  `app/services/retrieval/secure_retriever.py`.

## 7. Accuracy and Status

- Mark each substantive document as one of:
  - **Current** — describes implemented behavior.
  - **Target design** — describes planned behavior.
  - **Deprecated** — retained only for historical context.
- Never describe planned components as implemented.
- When behavior changes, update the relevant document and its **Last verified**
  date in the same pull request.
- Keep repository-structure documents aligned with the actual tree.

## 8. Cross-Repository Sync

- Shared architecture, planning, security, retrieval, and evaluation documents
  must stay consistent across both repositories.
- This guide is maintained in both repositories. Update both copies in the same
  documentation change series.
- If a rule differs by repository, document the exception explicitly instead of
  silently diverging.
