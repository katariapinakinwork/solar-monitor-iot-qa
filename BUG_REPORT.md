# Bug Report: Solar Monitor IoT

15 defects found through manual exploration, source code review and the automated suite. Every defect has an automated scenario tagged `@bug @BUG-xx` that asserts the correct behaviour and fails while the defect exists.

**Severity scale**
- **Critical:** a security or permission failure that lets a user change data they must not change
- **High:** a security or permission gap, or a defect that blocks a core workflow
- **Medium:** wrong data or behaviour in a feature, or a significant usability or accessibility problem
- **Low:** a minor functional, cosmetic or consistency issue with a workaround

Seeded accounts: Viewer `viewer` / `Viewer@123`, Action Taker `actiontaker` / `Action@123`.

---

## BUG-01: A Viewer can acknowledge alerts by sending the request directly
**Severity:** Critical · **Area:** Alerts / authorization
**Test:** `e2e/features/rbac.feature`: *Viewer cannot acknowledge an alert by sending the request directly*

**Steps to reproduce**
1. Sign in as `viewer`.
2. Send `POST /Alerts/Acknowledge` with an alert `id`, any `acknowledgedBy` and the page's anti-forgery token (or use the Info alert button, see BUG-03).

**Expected:** the server refuses the request (403 or redirect to Access Denied); the Viewer role is read-only.
**Actual:** the request succeeds and the alert is resolved.
**Cause:** `AlertsController.Acknowledge` has `[Authorize]` but no `Roles = ActionTaker` restriction (marked `BUG` in the source). Hiding the button in the UI is not access control.

## BUG-02: Plant Detail pages open without signing in
**Severity:** High · **Area:** Plant Detail / authentication
**Test:** `e2e/features/rbac.feature`: *Anonymous user cannot open a Plant Detail page*

**Steps to reproduce**
1. Sign out, or open a private browser window.
2. Open `http://localhost:8080/Plants/Detail/1`.

**Expected:** redirect to the sign-in page, like every other page.
**Actual:** the full plant page loads, with capacity, coordinates, panel inventory and active alerts.
**Cause:** `PlantsController.Detail` is marked `[AllowAnonymous]`, overriding the controller's `[Authorize]`.

## BUG-03: A Viewer gets a working Acknowledge button on Info alerts
**Severity:** High · **Area:** Alerts / authorization
**Test:** `e2e/features/rbac.feature`: *Viewer cannot acknowledge Info alerts in the UI*

**Steps to reproduce**
1. Sign in as `viewer` and open **Alerts**.
2. Look at the Acknowledge button on an **Info** alert, click it and confirm.

**Expected:** the button is disabled, as it is on Critical and Warning alerts.
**Actual:** the button is enabled, the acknowledge window opens, and with BUG-01 the alert is resolved.
**Cause:** `Views/Alerts/Index.cshtml` shows the active button when the user is an Action Taker **or** the alert is Info.

## BUG-04: An alert can be acknowledged with a blank name
**Severity:** Medium · **Area:** Alerts
**Test:** `e2e/features/alerts.feature`: *An alert cannot be acknowledged without a name*

**Steps to reproduce**
1. Sign in as `actiontaker` and open **Alerts**.
2. Click **Acknowledge** on an alert, leave **Your Name / ID** empty, click **Confirm Acknowledge**.

**Expected:** submission is blocked with a message; the alert stays active.
**Actual:** the alert is resolved with no name recorded. The window contradicts itself: the field is marked required (*), but the hint says "Leave blank to submit anonymously".
**Cause:** no check on `acknowledgedBy` in `AlertsController.Acknowledge` (marked `BUG` in the source), and no `required` attribute on the input.

## BUG-05: A resolved alert can be acknowledged again, overwriting its audit trail
**Severity:** Medium · **Area:** Alerts
**Test:** `e2e/features/alerts.feature`: *A resolved alert cannot be acknowledged again*

**Steps to reproduce**
1. As `actiontaker`, acknowledge an alert as "QA First".
2. Send `POST /Alerts/Acknowledge` for the same alert id as "QA Second".
3. Open the **Resolved** tab.

**Expected:** the second request is rejected; the record still shows "By: QA First" and the original resolved time.
**Actual:** the record now shows "By: QA Second" with a new resolved time.
**Cause:** `Acknowledge` never checks `IsResolved` before writing.

## BUG-06: Credential quick-fill buttons are missing from the login page
**Severity:** Medium · **Area:** Login
**Test:** `e2e/features/ui.feature`: *The login page offers quick-fill buttons for the seeded accounts*

**Steps to reproduce:** open the sign-in page.
**Expected:** controls that fill in the Viewer and Action Taker credentials, as described in the app's documentation.
**Actual:** no such controls. `Views/Account/Login.cshtml` defines a `fillCreds()` function, but nothing calls it.

## BUG-07: Plant search is case-sensitive
**Severity:** Low · **Area:** Solar Plants
**Test:** `e2e/features/plants.feature`: *Search ignores letter case*

**Steps to reproduce:** on **Solar Plants**, search `rajasthan` (lower case).
**Expected:** Rajasthan Solar Farm Alpha is listed.
**Actual:** "No plants found". Searching `Rajasthan` works.
**Cause:** `PlantsController.Index` filters with `Name.Contains(search)`, which PostgreSQL evaluates case-sensitively.

## BUG-08: "Panels Faulty" also counts Underperforming panels
**Severity:** Low · **Area:** Plant Detail
**Test:** `e2e/features/plant-detail.feature`: *Panels Faulty matches the inventory*

**Steps to reproduce:** open any plant's detail page; compare the **Panels Faulty** card with the panel table.
**Expected:** the card equals the number of panels with status Faulty (1).
**Actual:** the card shows 2. The table has 1 Faulty and 1 Underperforming panel.
**Cause:** `FaultyPanels` counts `Faulty or Underperforming`.

## BUG-09: The Degraded status colour differs between pages
**Severity:** Low · **Area:** Plant Detail / consistency
**Test:** `e2e/features/plant-detail.feature`: *Degraded status uses the same colour on the list and the detail page*

**Steps to reproduce:** compare Andhra Pradesh Solar Hub's **Degraded** badge on **Solar Plants** with the one on its detail page.
**Expected:** the same colour on every page.
**Actual:** orange on the Dashboard and Solar Plants; red, the same as Offline, on the detail page.
**Cause:** `Views/Plants/Detail.cshtml` maps Degraded to `danger`; the list maps it to `orange`.

## BUG-10: A start date after the end date gives an unexplained empty report
**Severity:** Low · **Area:** Energy Reports
**Test:** `e2e/features/reports.feature`: *A start date after the end date is corrected or explained*

**Steps to reproduce:** on **Reports**, set Start Date later than End Date and click **Generate Report**.
**Expected:** a validation message, or the dates swapped.
**Actual:** "No data for selected parameters", as if there were no readings.
**Cause:** `ReportsController.Index` never compares the two dates.

## BUG-11: The login error text is not aligned with its icon
**Severity:** Low · **Area:** Login / visual
**Test:** `e2e/features/ui.feature`: *The login error message is aligned with its icon*

**Steps to reproduce:** sign in with a wrong password.
**Expected:** the warning icon and "Invalid username or password." on one line.
**Actual:** the icon sits alone on the first line, with the message underneath.
**Cause:** each message is wrapped in its own block `<div>` after the icon.

## BUG-12: The footer is pinned to the first screen and covers content
**Severity:** Medium · **Area:** Layout (all pages)
**Tests:** `e2e/features/ui.feature`: *The footer does not cover page content*; `e2e/features/navigation.feature`: *View all in Recent Alerts opens the Alerts page*

**Steps to reproduce**
1. Open any page taller than the window, e.g. **Alerts** at 1280×720.
2. Scroll.

**Expected:** the footer sits below all content at the end of the page.
**Actual:** a dark footer band stays at the bottom of the *first* screen and scrolls with the page, covering whatever is under it: chart areas, plant cards, alert rows. At 1280×720 it covers the Dashboard's Recent Alerts **View all** link, so the link can't be clicked.
**Cause:** `_Layout.cshtml.css` positions `.footer` absolutely at `bottom: 0` while `site.css` lays the page out for a footer in the normal flow.

## BUG-13: The empty password field looks already filled in
**Severity:** Low · **Area:** Login / usability
**Test:** `e2e/features/ui.feature`: *The empty password field does not look filled in*

**Steps to reproduce:** open the sign-in page and look at the Password field.
**Expected:** an empty field that reads as empty, with a descriptive placeholder or none.
**Actual:** the placeholder is eight mask dots (`••••••••`), the same characters the browser shows for typed passwords, so the empty field looks pre-filled. The placeholder does disappear correctly when typing starts.

## BUG-14: Grey text on dark backgrounds is unreadable
**Severity:** Medium · **Area:** Layout / accessibility
**Test:** `e2e/features/ui.feature`: *"…" is readable against its background* (4 examples)

**Steps to reproduce:** sign in, open the user menu, and look at the footer and the navbar.
**Expected:** all text meets the WCAG AA contrast ratio of 4.5:1.
**Actual:** "Signed in as", "Role: …", the footer copyright and version, and the navbar clock all use the dark-grey muted style on dark backgrounds and are barely visible or invisible.
**Cause:** `text-muted` (dark grey, meant for light backgrounds) is used inside `bg-dark` and `dropdown-menu-dark` elements.

## BUG-15: Report "Peak Power" for All Plants shows one plant's reading
**Severity:** Medium · **Area:** Energy Reports
**Test:** `e2e/features/reports.feature`: *Peak Power for All Plants reflects the whole fleet*

**Steps to reproduce:** on **Reports**, choose All Plants and Hourly, then click **Generate Report**.
**Expected:** Peak Power is the fleet's highest combined output, so at least as large as the highest hourly energy.
**Actual:** Peak Power is about 5,380 kW, while single hours show about 15,000 kWh generated across the fleet.
**Cause:** `ReportsController.Index` takes the maximum *single* reading across all plants instead of summing plants per time slot.