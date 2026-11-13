# Solar Monitor IoT - QA automation

![E2E tests](https://github.com/katariapinakinwork/solar-monitor-iot-qa/actions/workflows/ci.yml/badge.svg)

This repo has the Solar Monitor IoT app (ASP.NET Core MVC + PostgreSQL) and the end-to-end test suite I wrote for it. The tests are in TypeScript, written as Cucumber feature files and run on Playwright through `playwright-bdd`.

In numbers: 130 scenarios, 15 bugs logged (see [BUG_REPORT.md](BUG_REPORT.md)), and CI runs the whole suite on every push to `main`.

The app's original README is in [docs/APP_README.md](docs/APP_README.md).

## Prerequisites

- Docker Desktop (with Docker Compose)
- Node.js 18 or newer (CI uses 22)
- Only if you want to run the app without Docker: .NET 10 SDK and PostgreSQL 14+

## Running the app

### With Docker

This is how I run it:

```bash
docker compose up --build -d
```

On first start the app creates the database and seeds it: 5 plants, about a month of energy readings, 10 alerts (6 active, 4 resolved) and two users. It's then on http://localhost:8080.

| User | Password | Can do |
|---|---|---|
| `viewer` | `Viewer@123` | Read only |
| `actiontaker` | `Action@123` | Everything, including acknowledging alerts |

`docker compose down -v` deletes the database, and the next start seeds it again. I do that before every full local test run (see below for why).

### Without Docker

1. Start PostgreSQL. The easiest way is to start just the database container with `docker compose up -d db`. If you'd rather use your own server, create a database `solarmonitor` with user `solaruser` and password `solarpass` (the connection string is in `appsettings.json`).
2. From the repo root, run `dotnet run`. The app migrates and seeds the database and listens on http://localhost:5036.
3. Point the tests at it with `BASE_URL=http://localhost:5036`.

## Running the tests

```bash
cd e2e
npm ci
npx playwright install --with-deps chromium
npm test
```

Other ways to run it:

```bash
npm run test:headed                                # watch it in a real browser
npm run test:ui                                    # Playwright UI mode
npm test -- --debug                                # step through
npm test -- alerts.feature                         # one feature file
npm test -- --grep "Search ignores letter case"    # one scenario
npm test -- --grep "@bug"                          # only the bug scenarios
npx playwright show-report                         # open the last HTML report
```

To test a different address, set `BASE_URL` (in PowerShell: `$env:BASE_URL="http://localhost:5036"; npm test`).

Two things to know before running locally:

- **Reset the database before a full run.** Three of the Alerts scenarios acknowledge alerts, and that can't be undone from the UI. CI starts from a fresh database every time, so it isn't a problem there.
- **If the app isn't running, the suite tells you.** `global-setup.ts` waits up to 30 seconds for the login page. If it never answers, the run stops with a message saying what to start, instead of every test failing on a connection error.

## How the suite is organised

```
e2e/
  features/        feature files, one per area
  steps/           step definitions
  pages/           page objects
  fixtures/        custom fixtures (page objects + a per-scenario context)
  hooks/           before/after hooks
  constants/       routes and fixed values
  types/           shared types
  test-data/       seeded accounts
  utils/           number parsing, chart reading, dates
  global-setup.ts  checks the app is up before anything runs
  playwright.config.ts
```

Some decisions and the reasons for them:

**Gherkin with playwright-bdd.** I wanted the scenarios to be readable by someone who won't open the step code. `playwright-bdd` turns the feature files into ordinary Playwright tests, so I still get Playwright's runner, HTML report, traces and screenshots. Each scenario has its test case ID in a comment above it (AUTH-01, ALERT-09 and so on).

**Page objects.** One class per page, with the XPath locators declared at the top and one method per user action. Steps call page methods and don't touch selectors directly.

**Fixtures.** The page objects, plus a small context object, are injected into the steps. The context lets one step read numbers on one page and a later step compare them on another.

**Checking that numbers agree.** A lot of the coverage is comparisons rather than "is it visible": the dashboard's total capacity against the plant cards, the alert count on each plant card against the Alerts page filtered to that plant, and report totals across the hourly, daily and monthly views. Charts are checked through the data Chart.js was given, not through screenshots.

**Going around the UI where it matters.** For permissions and CSRF I also send the POST requests directly. A disabled button doesn't protect anything if the endpoint accepts the request anyway, which is exactly BUG-01.

**Known bugs, with CI still green.** Each bug scenario is tagged `@bug @BUG-xx @fail`. It asserts what should happen, so it fails while the bug exists, and `@fail` tells Playwright that failure is expected. The HTML report still shows each one with its error and screenshot. If a bug gets fixed, its scenario starts passing, Playwright flags that as unexpected, and that's the cue to remove the tag.

**Scenarios that change data.** These are tagged `@changes-data`. They never acknowledge the last alert of any severity, because the role tests need one of each. If there's nothing left to use, they skip with a "reset the database" message instead of failing or passing silently.

**One worker.** Every test shares one database, so they run one at a time to keep the counts predictable.

## CI

`.github/workflows/ci.yml` runs on pushes to `main`, on pull requests, and on demand. It:

1. builds and starts the app and database with `docker compose`
2. installs Node.js, the test packages and Chromium
3. waits for `/Account/Login` to respond on port 8080
4. runs `npm test` headless
5. uploads `playwright-report` and `test-results` (screenshots and traces) as artifacts, kept for 14 days

If anything fails, it also prints the app container's logs.

## Bugs found

Full write-ups, with steps, expected and actual behaviour, the scenario that catches each one, and where the problem is in the code, are in [BUG_REPORT.md](BUG_REPORT.md).

| ID | Severity | Summary |
|---|---|---|
| BUG-01 | Critical | A Viewer can acknowledge alerts by sending the request directly |
| BUG-02 | High | Plant Detail pages open without signing in |
| BUG-03 | High | A Viewer gets a working Acknowledge button on Info alerts |
| BUG-04 | Medium | An alert can be acknowledged with a blank name |
| BUG-05 | Medium | A resolved alert can be acknowledged again, overwriting who resolved it |
| BUG-06 | Medium | The credential quick-fill buttons are missing from the login page |
| BUG-12 | Medium | The footer is stuck to the first screen and covers content |
| BUG-14 | Medium | Grey text on dark backgrounds is unreadable |
| BUG-15 | Medium | Reports' Peak Power for All Plants is one plant's reading |
| BUG-07 | Low | Plant search is case-sensitive |
| BUG-08 | Low | Panels Faulty also counts Underperforming panels |
| BUG-09 | Low | The Degraded badge is a different colour on the detail page |
| BUG-10 | Low | A start date after the end date gives an empty report with no explanation |
| BUG-11 | Low | The login error text isn't aligned with its icon |
| BUG-13 | Low | The empty password field looks already filled in |

## What I'd do with more time

- Give the data-changing scenarios their own freshly seeded database (or a reset endpoint), instead of carefully rationing the seeded alerts.
- Add Firefox and WebKit. I kept to Chromium for this assignment.
- Use visual comparisons for the layout bugs (footer, contrast) instead of measuring positions and colours.
- Split the bug scenarios into their own CI job, so the main job is purely "everything that should work".
