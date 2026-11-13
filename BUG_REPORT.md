# Bug report - Solar Monitor IoT

I found these 15 issues while going through the app by hand, reading the source, and running the suite. Each one has a scenario tagged `@bug` that checks the correct behaviour, so it fails for as long as the bug is there.

How I rated severity:

- **Critical:** someone can change data their role shouldn't allow.
- **High:** a security gap, or something that blocks a core task.
- **Medium:** wrong data or behaviour in a feature, or a real usability or accessibility problem.
- **Low:** minor, cosmetic or inconsistent, with an easy workaround.

Logins used: `viewer` / `Viewer@123` and `actiontaker` / `Action@123`.

| ID | Severity | Summary |
|---|---|---|
| BUG-01 | Critical | A Viewer can acknowledge alerts by sending the request directly |
| BUG-02 | High | Plant Detail pages open without signing in |
| BUG-03 | High | A Viewer gets a working Acknowledge button on Info alerts |
| BUG-04 | Medium | An alert can be acknowledged with a blank name |
| BUG-05 | Medium | A resolved alert can be acknowledged again |
| BUG-06 | Medium | Credential quick-fill buttons are missing from the login page |
| BUG-12 | Medium | The footer is stuck to the first screen and covers content |
| BUG-14 | Medium | Grey text on dark backgrounds is unreadable |
| BUG-15 | Medium | Reports' Peak Power for All Plants is one plant's reading |
| BUG-07 | Low | Plant search is case-sensitive |
| BUG-08 | Low | Panels Faulty also counts Underperforming panels |
| BUG-09 | Low | The Degraded badge is a different colour on the detail page |
| BUG-10 | Low | A start date after the end date gives an unexplained empty report |
| BUG-11 | Low | The login error text isn't aligned with its icon |
| BUG-13 | Low | The empty password field looks already filled in |

---

## BUG-01: A Viewer can acknowledge alerts by sending the request directly

Severity: Critical. Area: Alerts, permissions.
Caught by: `features/rbac.feature`, "Viewer cannot acknowledge an alert by sending the request directly".

Steps:
1. Sign in as `viewer`.
2. Send `POST /Alerts/Acknowledge` with an alert id, any name, and the anti-forgery token from the page. (Clicking the Info alert button, see BUG-03, does the same thing.)

Expected: the request is refused with 403 or a redirect to Access Denied. Viewers are read-only.

Actual: the request goes through and the alert is resolved. I saw this in the UI as well: as `viewer` I resolved alert #5, and the active count dropped from 6 to 5.

Where: `AlertsController.Acknowledge` only has `[Authorize]`, with no ActionTaker role check. There's even a `// BUG` comment on that line. Hiding the button doesn't help when the endpoint itself accepts the request.

## BUG-02: Plant Detail pages open without signing in

Severity: High. Area: Plant Detail, authentication.
Caught by: `features/rbac.feature`, "Anonymous user cannot open a Plant Detail page".

Steps:
1. Open a private browser window, or sign out.
2. Go to http://localhost:8080/Plants/Detail/1.

Expected: redirect to the sign-in page, as on every other page.

Actual: the whole page loads, with capacity, coordinates, panel serial numbers and active alerts.

Where: `PlantsController.Detail` has `[AllowAnonymous]`, which overrides the `[Authorize]` on the controller.

## BUG-03: A Viewer gets a working Acknowledge button on Info alerts

Severity: High. Area: Alerts, permissions.
Caught by: `features/rbac.feature`, "Viewer cannot acknowledge Info alerts in the UI".

Steps:
1. Sign in as `viewer` and open Alerts.
2. Look at the Acknowledge button on an Info alert, then click it and confirm.

Expected: the button is disabled, like on Critical and Warning alerts.

Actual: it's enabled, the acknowledge window opens, and (because of BUG-01) the alert is resolved.

Where: `Views/Alerts/Index.cshtml` shows the active button if the user is an Action Taker *or* the alert is Info.

## BUG-04: An alert can be acknowledged with a blank name

Severity: Medium. Area: Alerts.
Caught by: `features/alerts.feature`, "An alert cannot be acknowledged without a name".

Steps:
1. Sign in as `actiontaker` and open Alerts.
2. Click Acknowledge on any alert, leave "Your Name / ID" empty, and click Confirm Acknowledge.

Expected: the form refuses to submit, and the alert stays active.

Actual: the alert is resolved with no name recorded. The window also contradicts itself: the field has a red required asterisk, but the hint underneath says "Leave blank to submit anonymously".

Where: no check on `acknowledgedBy` in `AlertsController.Acknowledge` (another `// BUG` comment), and no `required` attribute on the input.

## BUG-05: A resolved alert can be acknowledged again

Severity: Medium. Area: Alerts.
Caught by: `features/alerts.feature`, "A resolved alert cannot be acknowledged again".

Steps:
1. As `actiontaker`, acknowledge an alert as "QA First".
2. Send `POST /Alerts/Acknowledge` again for the same alert id, as "QA Second".
3. Open the Resolved tab.

Expected: the second request is rejected, and the record still says "By: QA First" with the original time.

Actual: the record now says "By: QA Second" with a new resolved time, so the audit trail can be rewritten.

Where: `Acknowledge` never checks `IsResolved` before writing.

## BUG-06: Credential quick-fill buttons are missing from the login page

Severity: Medium. Area: Login.
Caught by: `features/ui.feature`, "The login page offers quick-fill buttons for the seeded accounts".

Steps: open the sign-in page.

Expected: buttons that fill in the Viewer and Action Taker credentials, as the app's documentation describes.

Actual: there aren't any. `Views/Account/Login.cshtml` has a `fillCreds()` function, but nothing on the page calls it.

## BUG-07: Plant search is case-sensitive

Severity: Low. Area: Solar Plants.
Caught by: `features/plants.feature`, "Search ignores letter case".

Steps: on Solar Plants, search for `rajasthan`.

Expected: Rajasthan Solar Farm Alpha shows up.

Actual: "No plants found". `Rajasthan` with a capital R works.

Where: `PlantsController.Index` uses `Name.Contains(search)`, which is case-sensitive on PostgreSQL.

## BUG-08: Panels Faulty also counts Underperforming panels

Severity: Low. Area: Plant Detail.
Caught by: `features/plant-detail.feature`, "Panels Faulty matches the inventory".

Steps: open any plant's detail page and compare the Panels Faulty card with the panel table.

Expected: 1, the number of rows with status Faulty.

Actual: 2. Every plant has one Faulty and one Underperforming panel, and the card counts both.

Where: `FaultyPanels` is calculated as Faulty *or* Underperforming.

## BUG-09: The Degraded badge is a different colour on the detail page

Severity: Low. Area: Plant Detail.
Caught by: `features/plant-detail.feature`, "Degraded status uses the same colour on the list and the detail page".

Steps: look at Andhra Pradesh Solar Hub's Degraded badge on Solar Plants, then on its detail page.

Expected: the same colour on both.

Actual: orange on the Dashboard and Solar Plants, red on the detail page. Red is the colour for Offline, so it reads as more serious than it is.

Where: `Views/Plants/Detail.cshtml` maps Degraded to `danger`, while the list uses `orange`.

## BUG-10: A start date after the end date gives an unexplained empty report

Severity: Low. Area: Reports.
Caught by: `features/reports.feature`, "A start date after the end date is corrected or explained".

Steps: on Reports, set Start Date later than End Date and click Generate Report.

Expected: a message saying the range is wrong, or the dates swapped automatically.

Actual: "No data for selected parameters", which suggests there were no readings when the real problem is the input.

Where: `ReportsController.Index` never compares the two dates.

## BUG-11: The login error text isn't aligned with its icon

Severity: Low. Area: Login.
Caught by: `features/ui.feature`, "The login error message is aligned with its icon".

Steps: sign in with a wrong password.

Expected: the warning icon and "Invalid username or password." on the same line.

Actual: the icon sits on its own line and the message is underneath it.

Where: each error message is in its own `<div>` after the icon, which forces a line break.

## BUG-12: The footer is stuck to the first screen and covers content

Severity: Medium. Area: every page.
Caught by: `features/ui.feature`, "The footer does not cover page content", and `features/navigation.feature`, "View all in Recent Alerts opens the Alerts page".

Steps:
1. Open a page that's taller than the window, for example Alerts at 1280x720.
2. Scroll down.

Expected: the footer sits after all the content, at the end of the page.

Actual: a dark footer bar is fixed at the bottom of the *first* screen and scrolls away with the page, covering whatever is underneath: chart areas, plant cards, alert rows. At 1280x720 it sits on top of the Dashboard's Recent Alerts "View all" link, and the link can't be clicked.

Where: `_Layout.cshtml.css` positions `.footer` absolutely at `bottom: 0`, while `site.css` expects the footer to sit in the normal page flow.

## BUG-13: The empty password field looks already filled in

Severity: Low. Area: Login.
Caught by: `features/ui.feature`, "The empty password field does not look filled in".

Steps: open the sign-in page and look at the Password field.

Expected: an empty field that looks empty.

Actual: the placeholder is eight dots (`••••••••`), the same characters the browser shows for a typed password, so it looks like something is already entered. To be clear, the placeholder does disappear correctly once you start typing; the problem is how the empty field looks.

## BUG-14: Grey text on dark backgrounds is unreadable

Severity: Medium. Area: navbar, user menu, footer.
Caught by: `features/ui.feature`, the four readability examples.

Steps: sign in, open the user menu, and look at the footer and the top bar.

Expected: text that's readable, meeting the WCAG AA contrast ratio of 4.5:1.

Actual: "Signed in as", "Role: ...", the footer copyright and version, and the clock in the top bar are all dark grey on a dark background. The clock and footer text are basically invisible.

Where: `text-muted` (meant for light backgrounds) is used inside `bg-dark` and `dropdown-menu-dark`.

## BUG-15: Reports' Peak Power for All Plants is one plant's reading

Severity: Medium. Area: Reports.
Caught by: `features/reports.feature`, "Peak Power for All Plants reflects the whole fleet".

Steps: on Reports, choose All Plants and Hourly, then click Generate Report.

Expected: Peak Power is the highest combined output of the fleet, which has to be at least the biggest hourly energy figure.

Actual: Peak Power shows about 5,380 kW, while individual hours in the same report show about 15,000 kWh across the fleet.

Where: `ReportsController.Index` takes the highest single reading of any one plant, instead of adding the plants together for each time slot. You could argue it's intended, but labelled as the fleet's peak power it's misleading.
