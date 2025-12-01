---
id: task-status
title: Task Status
category: Tasks & Projects
---

# Task Status

Task status is the **story of where work really is**. Used well, it keeps you and your team aligned on what’s moving, what’s stuck, and what’s done.

---

## Overview

Every task in mpath has a status that represents its **current place in the lifecycle**:

- **To Do** – planned but not yet started
- **Doing** – actively being worked on
- **Blocked** – cannot move forward right now
- **Done** – completed and meets your acceptance criteria
- **Dropped** – intentionally cancelled or out of scope

Status is the fastest way to scan a list and understand **where to focus attention**.

---

## Why Task Status Matters (Benefits)

- **Clarity in standups and check‑ins**  
  You can quickly answer “What’s in flight?” and “What’s stuck?” without digging.

- **Less micro‑management**  
  Leads and stakeholders can see progress from status changes instead of asking for constant updates.

- **Better planning and re‑prioritization**  
  Knowing how many tasks are in **Doing** or **Blocked** helps you decide what to start (or not start) next.

- **Cleaner history**  
  Using **Done** and **Dropped** properly keeps backlogs readable over time.

---

## Key Statuses

### 📋 To Do

Use **To Do** for work that is **agreed but not started**:

- New tasks that just came in
- Items queued for the next sprint or cycle
- Ideas that have enough context to be actionable

> Tip: If something is still very fuzzy, keep it out of the task list until it’s clear enough to move into **To Do**.

### 🔄 Doing

Use **Doing** when **someone is actively working** on the task:

- It’s currently being picked up or in progress
- It’s expected to move within the current day or two
- It should be discussed in standups if it lingers too long

> If a task sits in **Doing** for many days without movement, either break it down or mark it **Blocked** with a clear reason.

### ⏸️ Blocked

Use **Blocked** whenever **progress depends on something else**:

- Waiting on another team, decision, or review
- Blocked by an incident or missing information
- Dependent on an upstream change that hasn’t landed yet

Always record **why** it’s blocked (e.g. in the task notes) so reviews can quickly unblock it.

### ✅ Done

Use **Done** only when the task is **truly complete**:

- Acceptance criteria are met
- Code is merged and deployed as agreed for your team
- Any necessary follow‑ups (docs, communication) are finished

> If something still requires more work, keep it in **Doing** or create follow‑up tasks instead of prematurely marking it **Done**.

### 🗑️ Dropped

Use **Dropped** for work you’ve **intentionally decided not to do**:

- Scope changes made an item obsolete
- You tried something and decided not to continue
- A competing initiative or task replaced this work

This helps keep history accurate without pretending everything “finished”.

---

## How to Use Status Effectively

### Daily workflow

1. **Create tasks** into **To Do** as work is discovered.
2. When someone picks up a task, move it to **Doing**.
3. If they hit an obstacle, move it to **Blocked** and document the reason.
4. When the work is truly finished, move it to **Done**.
5. If you decide not to do a task, move it to **Dropped** instead of deleting it.

### During standups and check‑ins

- Start by scanning **Blocked** tasks:
  - “What needs unblocking today?”
  - “Who can help remove these blockers?”
- Then look at **Doing**:
  - “What has been in Doing for too long?”
  - “Should we split any of these into smaller tasks?”
- Use **To Do** to decide **what to pull next**, aligning with priorities.

### For planning and retros

- Use the distribution of **To Do / Doing / Blocked / Done / Dropped** to:
  - Spot patterns (e.g. many tasks getting Dropped late in the cycle)
  - Understand whether work is being over‑started
  - Learn which dependencies frequently cause **Blocked** status

---

## Examples & Best Practices

### Example: Healthy flow

- New request comes in → task is created in **To Do**
- Engineer starts work → moves task to **Doing**
- Waiting on design sign‑off → moves to **Blocked** with a note
- Design approved → moves back to **Doing**
- Shipped and verified in production → moves to **Done**

### Example: Avoiding “everything is Doing”

Instead of:

- 10 tasks all in **Doing** with no clear progress,

Do this:

- Limit the number of **Doing** tasks per engineer.
- Keep future work in **To Do** until there is capacity.
- Move stalled items into **Blocked** with a clear reason.

### Quick best practices

- **Update status as part of your working habit**, not just before reviews.
- **Prefer Blocked over silent stagnation** – it invites help.
- **Use Dropped intentionally** to reflect real decisions.
- **Pair status with priority** (see `task-priorities`) for a full picture of _what_ to do and _when_.
