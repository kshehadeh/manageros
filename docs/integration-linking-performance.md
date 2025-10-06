# Integration Linking Performance Analysis

## Current Flow
- **UI triggers server actions:** The Jira and GitHub linking widgets import their mutations from the umbrella `@/lib/actions` module, so each click invokes the respective server action on the server. 【F:src/components/jira-account-linker.tsx†L5-L41】【F:src/components/github-account-linker.tsx†L5-L47】
- **Server-side steps:** Each action authenticates the caller, re-validates that the person belongs to the current organization, loads the caller's stored credentials, reaches out to the third-party API to resolve the remote account, and then persists the linkage. 【F:src/lib/actions/jira.ts†L107-L175】【F:src/lib/actions/github.ts†L77-L138】
- **Third-party lookups:** Jira search uses `/rest/api/3/user/search` with a `maxResults` of 50 and filters the results locally, while GitHub fetches the entire `/users/{username}` payload before extracting the fields it needs. 【F:src/lib/jira-api.ts†L88-L165】【F:src/lib/github-api.ts†L55-L111】

## Bottlenecks Observed
- **Large server action bundles:** Importing actions via the monolithic `@/lib/actions` barrel meant the runtime had to load code for dozens of unrelated mutations whenever a linking action executed, increasing cold start latency. 【F:src/components/jira-account-linker.tsx†L5-L8】
- **Sequential database round-trips:** The linking actions fetch the person record and the stored credentials in separate awaits instead of running the reads concurrently, so the server pays two back-to-back Prisma queries before even starting the remote API call. 【F:src/lib/actions/jira.ts†L117-L145】【F:src/lib/actions/github.ts†L87-L114】
- **Expensive remote resolution:** The Jira lookup retrieves up to 50 records per request only to filter them locally, and both integrations wait for the remote call to complete before responding to the client, so any latency or throttling from Jira/GitHub translates directly into slow UI feedback. 【F:src/lib/jira-api.ts†L156-L165】【F:src/lib/github-api.ts†L91-L111】
- **Full-page revalidation:** After the mutation, `revalidatePath('/people/{personId}')` invalidates the entire person edit route, triggering its heavy data fetches (`getTeams`, `getPeople`, `getJobRolesForSelection`, etc.) on the next navigation, which can extend the perceived completion time. 【F:src/lib/actions/jira.ts†L157-L174】【F:src/app/people/[id]/edit/page.tsx†L27-L53】

## Recommended Improvements
- **Import actions directly:** Swap the barrel import for direct imports from `@/lib/actions/jira` and `@/lib/actions/github` so the server action bundle only contains the code it truly needs.
- **Parallelize local checks:** Fetch the person and credential records using `Promise.all` to cut one Prisma round-trip out of the critical path before the third-party request. 【F:src/lib/actions/jira.ts†L117-L145】【F:src/lib/actions/github.ts†L87-L114】
- **Trim external lookups:** Limit the Jira search to `maxResults=1` (or switch to the account ID endpoint when the email is known) and project only the required fields from GitHub to reduce payload size and time-to-first-byte. 【F:src/lib/jira-api.ts†L156-L165】【F:src/lib/github-api.ts†L91-L111】
- **Consider async refresh:** Instead of waiting for the remote response before acknowledging the link, persist the association immediately and kick off the third-party enrichment in a background job, showing optimistic UI feedback while the status refreshes.
