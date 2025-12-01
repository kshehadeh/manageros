---
id: github-integration
title: GitHub Integration
category: Integrations
---

# GitHub Integration

GitHub integration brings **development work into the same place as people, initiatives, and tasks**.

It helps you see not just _that_ work is happening, but **where and how** engineers are contributing in code.

---

## What You Get from the GitHub Integration

With GitHub connected you can:

- See **recent pull requests** for linked people directly in mpath.
- Understand how work on **initiatives and tasks** shows up in code.
- Use PR activity as input into:
  - Performance reviews and promotion discussions.
  - Weekly team reviews and incident post‑mortems.

The goal is not to create a separate “metrics dashboard”, but to **add GitHub context to the workflows you already use**.

---

## How to Set It Up (Step‑by‑Step)

### 1. Configure org‑level GitHub settings

1. Go to **Settings → GitHub Integration**.
2. Enter the required GitHub credentials (for your org or service account):
   - GitHub username (or app identity).
   - Personal Access Token (PAT) or app token with appropriate scopes.
3. Test the connection and save.

> Use the minimum required scopes and prefer fine‑grained tokens where possible.

### 2. Link people to their GitHub accounts

1. Open a person’s profile in mpath.
2. Use the **“Link GitHub Account”** action.
3. Search or enter their GitHub username.
4. Confirm the match.

Once linked:

- Their PR activity can appear in:
  - Person profiles.
  - Initiative and report views (e.g. Person Overview, AI Synopsis).

---

## How Engineers and Managers Use It Day‑to‑Day

### For engineers

- See your own **recent PRs** alongside tasks and initiatives.
- Use this context in 1:1s and reviews to:
  - Recall which pieces of work shipped.
  - Talk about collaboration (reviews, cross‑repo work).

### For managers and leads

- When looking at a person or initiative:
  - See **where code is landing** (repos, services).
  - Understand the balance between **feature work, maintenance, and incident‑driven work**.
- Use GitHub data as:
  - One input to performance discussions (not the only one).
  - A way to recognize invisible work like reviews and refactors.

---

## Security & Best Practices

- **Keep tokens scoped and rotated**:
  - Use fine‑grained PATs or app‑based integrations where possible.
  - Rotate regularly and remove tokens when no longer needed.
- **Respect repo access**:
  - Only fetch data for repositories your org is comfortable surfacing.
  - Follow your internal security and privacy policies.
- **Keep links current**:
  - Link GitHub accounts promptly for new hires.
  - Unlink accounts when people leave the organization.

If you see missing or unexpected data, check:

- Account linking.
- Token scopes and expiration.
- Repository permissions and GitHub API status.
