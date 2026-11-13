# Solar Monitor IoT: QA Automation Suite

![E2E tests](https://github.com/katariapinakinwork/solar-monitor-iot-qa/actions/workflows/ci.yml/badge.svg)

End-to-end test suite for the **Solar Monitor IoT** web application (ASP.NET Core MVC + PostgreSQL), written in **TypeScript** with **Playwright** and **Cucumber/Gherkin** (via `playwright-bdd`).

- **130 scenarios** across authentication, role-based access, navigation, Dashboard, Solar Plants, Plant Detail, Alerts, Energy Reports and UI details
- **15 defects** found and documented, each with an automated scenario that detects it. See [BUG_REPORT.md](BUG_REPORT.md)
- Runs headless on **GitHub Actions** on every push, publishing the HTML report, screenshots and traces

The application's own documentation is in [docs/APP_README.md](docs/APP_README.md).

---

## 1. Prerequisites

| Tool | Version | Needed for |
|---|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop) | Recent, with Docker Compose v2 | Running the app and database (recommended) |
| [Node.js](https://nodejs.org) | 18 or later (CI uses 22) | Running the tests |
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.0 | Only for running the app without Docker |
| PostgreSQL | 14 or later | Only for running the app without Docker |

## 2. Run the application

### Option A: Docker (recommended)

From the repository root:

```bash
docker compose up --build -d
```

This starts PostgreSQL and the app. On first start the app creates its tables and seeds sample data: 5 plants, 100 panels, 31 days of readings, 10 alerts (6 active, 4 resolved) and two users. Open http://localhost:8080.

| Role | Username | Password |
|---|---|---|
| Viewer (read-only) | `viewer` | `Viewer@123` |
| Action Taker (can acknowledge alerts) | `actiontaker` | `Action@123` |

Useful commands:

```bash
docker compose ps                 # are both containers up?
docker compose logs app --tail 50 # app logs
docker compose down               # stop (keeps the data)
docker compose down -v            # stop and delete the data; next start re-seeds
```

### Option B: .NET SDK without Docker for the app

1. Start PostgreSQL. The quickest way is only the database container: `docker compose up -d db`. Or use your own PostgreSQL 14+ with a database `solarmonitor`, user `solaruser`, password `solarpass`. The connection string is in `appsettings.json` (`ConnectionStrings:DefaultConnection`).
2. From the repository root, run `dotnet run`. The app migrates and seeds the database, then listens on http://localhost:5036.
3. Point the tests at it with `BASE_URL=http://localhost:5036` (see below).

## 3. Run the tests

```bash
cd e2e
npm ci
npx playwright install --with-deps chromium
```

| Mode | Command |
|---|---|
| Headless (default, as in CI) | `npm test` |
| Headed (watch the browser) | `npm run test:headed` |
| Playwright UI mode | `npm run test:ui` |
| Debug, step by step | `npm test -- --debug` |
| One feature file | `npm test -- alerts.feature` |
| One scenario by name | `npm test -- --grep "Search ignores letter case"` |
| Only the defect scenarios | `npm test -- --grep "@bug"` |
| Another app address | `BASE_URL=http://localhost:5036 npm test` (PowerShell: `$env:BASE_URL="http://localhost:5036"; npm test`) |
| Open the last HTML report | `npx playwright show-report` |

**Reset the data before a full local run.** Three Alerts scenarios acknowledge alerts, which can't be undone through the UI. Run `docker compose down -v` and `docker compose up -d` first. CI always starts from a fresh database.

If the app isn't running, the suite stops in under a minute with a message saying what to start, instead of failing every test.

## 4. Suite architecture

```
e2e/
├── features/        Gherkin feature files, one per area (Given / When / Then)
├── steps/           Step definitions for those features
├── pages/           Page objects: XPath locators plus one method per user action
├── fixtures/        Custom fixtures: create the page objects and a per-scenario context
├── hooks/           Before / After hooks (e.g. attach the page URL when a scenario fails)
├── constants/       Routes, status names and other fixed values
├── types/           Shared TypeScript types (plant card, scenario context, user)
├── test-data/       Test data such as the seeded accounts
├── utils/           Helpers: number parsing, chart reading, dates
├── global-setup.ts  Health check before the run starts
└── playwright.config.ts
```

### Design patterns and decisions

- **BDD with Gherkin.** Scenarios read as business behaviour and map one-to-one to the test cases (IDs such as `ALERT-09` are in comments above each scenario). `playwright-bdd` runs them on Playwright's own runner, so the suite keeps Playwright's HTML report, traces, screenshots and parallel tooling.
- **Page Object Model.** Each page has one class. Locators are declared once as fields, and each user action is one method. Steps call page methods and never use raw selectors.
- **Fixtures for dependency injection.** Page objects and a per-scenario context (`ctx`) are injected into steps. The context carries values from one step to a later one, e.g. plant totals read on one page and compared on another.
- **Cross-page consistency checks.** Many scenarios check that figures agree across pages: dashboard totals against the plant list, alert counts on plant cards against the Alerts page, report totals across hourly, daily and monthly views.
- **Charts tested by their data.** Chart assertions read the data behind each Chart.js chart, not its pixels.
- **UI and request-level checks.** Authorization and CSRF protection are also checked by sending requests directly, the way an attacker would bypass a disabled button.
- **Known defects stay visible but keep CI green.** Each defect scenario is tagged `@bug @BUG-xx @fail`. It asserts the *correct* behaviour, so it fails while the defect exists, and `@fail` marks that failure as expected. The HTML report shows each one with its error, screenshot and trace. If a defect is fixed, the scenario starts passing, Playwright reports it as "expected to fail but passed", and the tag should be removed.
- **Data-changing scenarios are isolated.** They're tagged `@changes-data`, never take the last alert of any severity (other scenarios need one of each), and skip with a reset message when the data has run out.
- **Fail fast on environment problems.** `global-setup.ts` waits for the app and stops the run with a clear message if it's unreachable.
- **Deterministic runs.** One worker, because every scenario shares one database.

## 5. Continuous integration

`.github/workflows/ci.yml` runs on every push to `main`, on pull requests and on demand:

1. Builds and starts the app and database with Docker Compose
2. Installs Node.js, the test dependencies and Chromium
3. Waits for the health check on port 8080
4. Runs the whole suite headless
5. Uploads the HTML report (`playwright-report`) and screenshots and traces (`test-results`) as artifacts, kept for 14 days
6. Prints the app logs if anything fails, and stops the stack

## 6. Bug report

All 15 defects, with severity, steps to reproduce, expected and actual behaviour, and the scenario that detects each one, are in **[BUG_REPORT.md](BUG_REPORT.md)**.

| ID | Severity | Defect |
|---|---|---|
| BUG-01 | Critical | A Viewer can acknowledge alerts by sending the request directly |
| BUG-02 | High | Plant Detail pages open without signing in |
| BUG-03 | High | A Viewer gets a working Acknowledge button on Info alerts |
| BUG-04 | Medium | An alert can be acknowledged with a blank name |
| BUG-05 | Medium | A resolved alert can be acknowledged again, overwriting its audit trail |
| BUG-06 | Medium | Credential quick-fill buttons are missing from the login page |
| BUG-12 | Medium | The footer is pinned to the first screen and covers content |
| BUG-14 | Medium | Grey text on dark backgrounds is unreadable |
| BUG-15 | Medium | Report "Peak Power" for All Plants shows one plant's reading |
| BUG-07 | Low | Plant search is case-sensitive |
| BUG-08 | Low | "Panels Faulty" also counts Underperforming panels |
| BUG-09 | Low | The Degraded status colour differs between pages |
| BUG-10 | Low | A start date after the end date gives an unexplained empty report |
| BUG-11 | Low | The login error text is not aligned with its icon |
| BUG-13 | Low | The empty password field looks already filled in |