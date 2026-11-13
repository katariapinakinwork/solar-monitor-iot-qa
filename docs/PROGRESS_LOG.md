# Solar Monitor IoT QA assignment - progress log

Pinakin Kataria · 13 Nov 2026

## Where it stands

Everything in the assignment is done. CI is green with 130 scenarios passing, and 15 bugs are logged, each with an automated check.

| # | Requirement | Status |
|---|---|---|
| 1 | Public GitHub repo with the app source | Done |
| 1 | App runs from a fresh checkout (Docker or .NET SDK) | Done |
| 1 | Test suite and CI workflow in the repo | Done: `e2e/` and `.github/workflows/ci.yml` |
| 2 | Tests: authentication and session management | Done (20 scenarios) |
| 2 | Tests: role-based access (Viewer vs Action Taker) | Done (19 scenarios) |
| 2 | Tests: navigation and data workflows | Done (Navigation, Dashboard, Solar Plants, Plant Detail, Alerts, Reports) |
| 2 | Tests: defect identification | Done (15 bugs, each with a scenario) |
| 3 | GitHub Actions: build, health check, headless run, artifacts | Done, green, 130 passed |
| 4 | README with setup, run modes and architecture | Done |
| 4 | Bug report | Done: `BUG_REPORT.md` |

Also covered: an incremental commit history, a clear error when the app isn't running, and a run that works on a Linux CI machine.

## What I did, in order

### 1. Repo and app setup

1. Created the public repo `solar-monitor-iot-qa` on GitHub, empty, so the first push wouldn't clash with anything.
2. Unzipped the provided project, removed `package.json` and `package-lock.json` from `.gitignore` (the test project needs both, and `npm ci` in CI fails without the lock file), and pushed the source as the first commit.
3. Installed Git, Docker Desktop and Node.js, then started the app with `docker compose up --build`. It seeds its own data on first start: 5 plants, about a month of readings, 10 alerts and two users.

### 2. Playwright setup

1. Created the test project in `e2e/` with `npm init playwright@latest` (TypeScript).
2. Set the base URL to http://localhost:8080, used Chromium only and one worker (all tests share one database), and kept traces and screenshots on failure.
3. Added `global-setup.ts`, which waits for the login page and stops the run with a clear message if the app isn't up. I tested it by stopping the app container and reading the error.

### 3. Structure

I moved the suite to Cucumber feature files run through `playwright-bdd`, so the scenarios read as plain Given/When/Then but still use Playwright's runner and report. The rest of `e2e/` is split into `features`, `steps`, `pages` (page objects with XPath locators and one method per action), `fixtures`, `hooks`, `constants`, `types`, `test-data` and `utils`.

### 4. Test cases first

Before automating the rest, I wrote out all the test cases in a sheet (ID, feature, objective, role, precondition, steps, expected result, priority, automation status, result, bug ID): 102 cases across authentication, roles, navigation, Dashboard, Solar Plants, Plant Detail, Alerts, Reports and layout. That sheet also has a Defects tab with the evidence for each bug.

Bugs came from three places:

- reading the source code (two are even marked `// BUG` in `AlertsController.cs`)
- going through the whole site by hand and recording it
- the automated runs themselves (for example, the footer blocking a click)

### 5. Automation, one area per commit

| Area | Scenarios | Bug checks |
|---|---|---|
| Authentication | 20 | - |
| Roles | 19 | BUG-01, BUG-02, BUG-03 |
| Navigation and Dashboard | 20 | BUG-12 (footer covers the Recent Alerts link) |
| Solar Plants and Plant Detail | 29 | BUG-07, BUG-08, BUG-09 |
| Alerts | 16 | BUG-04, BUG-05 |
| Reports | 19 | BUG-10, BUG-15 |
| Login and layout | 8 | BUG-06, BUG-11, BUG-12, BUG-13, BUG-14 |

Each bug scenario checks the correct behaviour and is tagged `@bug @BUG-xx @fail`, so it fails while the bug exists without turning CI red.

### 6. CI and docs

1. Added `.github/workflows/ci.yml`: build and start the stack, wait for port 8080, install Chromium, run headless, and upload the HTML report and traces. All runs green, 130 passed.
2. Moved `.dockerignore` to the repo root and kept `e2e/` out of the app build in `IoT_Test.csproj`.
3. Moved the app's README to `docs/APP_README.md`, and wrote `README.md` and `BUG_REPORT.md`.
4. Final check: fresh clone into a new folder, start it, run everything.

## Problems I hit and how I fixed them

### Setup

| Problem | Cause | Fix |
|---|---|---|
| `git` not recognised | Git wasn't installed | `winget install --id Git.Git -e` |
| Still not recognised after installing | The open PowerShell window had the old PATH | Refresh PATH in the window, or open a new one |
| `docker` not recognised | Docker Desktop wasn't installed | Installed it, then restarted the laptop (WSL 2) |
| Terminal flooded with text | Normal: the app logs every database query | Press `d` to detach, or use `docker compose up -d` |
| `node` not recognised | Node.js wasn't installed | `winget install --id OpenJS.NodeJS.LTS -e` |
| `npm.ps1 cannot be loaded` | PowerShell blocks scripts by default | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `npm test` couldn't find `package.json` | Run from the repo root instead of `e2e` | `cd e2e` first |

### Writing the tests

| Problem | Cause | Fix |
|---|---|---|
| Badge text checks failed | Badge text has line breaks around it, and regex checks don't ignore that | Allowed whitespace in the regex |
| "View all" click timed out | The footer (BUG-12) sits on top of the link at 1280x720 | Made it a bug scenario; the workflow tests use a taller window |
| Filter and Clear clicks failed with "strict mode" | The locators also matched the navbar's Sign Out button and Solar Plants link | Scoped both to the filter form |
| A role test failed after the Alerts tests ran | The acknowledge tests used up every Warning alert | Never acknowledge the last alert of any severity; skip with a reset message when none are left |
| Bug scenarios "passed" with no data | `@fail` counted a setup error as the expected failure | Those steps now skip instead of throwing |
| `.dockerignore` had no effect | It was in `e2e/`, but Docker only reads it from the build root | Moved it to the repo root |

## Useful commands

| Command | What it does |
|---|---|
| `docker compose up --build -d` | Build and start the app and database in the background |
| `docker compose down -v` | Stop and delete the database (next start re-seeds) |
| `docker compose logs app --tail 40` | Last 40 lines of the app log |
| `npm test` (in `e2e`) | Run the whole suite headless |
| `npm run test:headed` / `npm run test:ui` | Watch it run / Playwright UI mode |
| `npm test -- --grep "@bug"` | Only the bug scenarios |
| `npx playwright show-report` | Open the last HTML report |
| `git add .`, `git commit -m "..."`, `git push` | Save and upload changes |

## Logins

| Role | Username | Password |
|---|---|---|
| Viewer (read only) | `viewer` | `Viewer@123` |
| Action Taker | `actiontaker` | `Action@123` |
