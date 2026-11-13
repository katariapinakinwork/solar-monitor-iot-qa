Feature: Alerts management

  # ---------- Viewer: listing, filtering, tabs (read-only) ----------

  # ALERT-01
  Scenario: Summary counters add up and match the list
    Given I am signed in as "Viewer"
    When I open the "/Alerts" page
    Then the Active Alerts counter should equal Critical plus Warning plus Info
    And the Active tab badge and the list should both match the Active Alerts counter

  # ALERT-02
  Scenario: Active alerts are ordered by severity
    Given I am signed in as "Viewer"
    When I open the "/Alerts" page
    Then the active alerts should be ordered from most to least severe

  # ALERT-03
  Scenario: Each active alert shows its full details
    Given I am signed in as "Viewer"
    When I open the "/Alerts" page
    Then every active alert should show its title, plant, time, type and severity

  # ALERT-04
  Scenario Outline: Severity filter "<severity>" lists only <severity> alerts
    Given I am signed in as "Viewer"
    When I open the "/Alerts" page
    And I filter the alerts by severity "<severity>"
    Then only "<severity>" alerts should be listed
    And the severity filter should still show "<severity>"
    And the Active Alerts counter should be unchanged by the filter

    Examples:
      | severity |
      | Critical |
      | Warning  |
      | Info     |

  # ALERT-05
  Scenario: Plant filter lists only that plant's alerts
    Given I am signed in as "Viewer"
    Then filtering by each plant should list only that plants alerts

  # ALERT-06
  Scenario: Clear removes the alert filters
    Given I am signed in as "Viewer"
    When I open the "/Alerts?severity=Warning" page
    And I clear the alert filters
    Then the alert filters should be cleared

  # ALERT-07
  Scenario: Resolved tab lists resolved alerts and keeps the filter
    Given I am signed in as "Viewer"
    When I open the "/Alerts?severity=Warning" page
    And I open the Resolved tab
    Then the address should still contain "severity=Warning"
    And the severity filter should still show "Warning"
    And every resolved alert should be marked Resolved with its resolved time

  # ---------- Action Taker: acknowledge workflow ----------
  # These use a taller window so the footer (BUG-12) sits below the alert list
  # instead of covering Acknowledge buttons. BUG-12 has its own failing scenario.

  # ALERT-08
  Scenario: The acknowledge window is tied to the clicked alert, and Cancel changes nothing
    Given the browser window is 1280 by 1600 pixels
    And I am signed in as "Action Taker"
    When I open the "/Alerts" page
    Then the acknowledge window should open for the alert I click, and Cancel should change nothing

  # ALERT-09, ALERT-11, ALERT-14
  @changes-data
  Scenario: Acknowledging an alert resolves it everywhere and records the operator
    Given the browser window is 1280 by 1600 pixels
    And I am signed in as "Action Taker"
    And I have noted every plant on the Solar Plants page
    When I open the "/Alerts" page
    And I acknowledge an active alert as "<b>QA Bot</b> & co"
    Then I should see the acknowledgement confirmation for that alert
    And the alert should no longer be listed as active
    And the Active Alerts counter should have dropped by one
    And the alert should be listed under Resolved by "<b>QA Bot</b> & co"
    And the operator name should be shown as text, not markup
    And the plant of that alert should show one fewer active alert on the Solar Plants page

  # ALERT-10 / BUG-04: a blank name is accepted
  @bug @BUG-04 @fail @changes-data
  Scenario: An alert cannot be acknowledged without a name
    Given the browser window is 1280 by 1600 pixels
    And I am signed in as "Action Taker"
    When I open the "/Alerts" page
    And I try to acknowledge an active alert without entering a name
    Then the alert should still be listed as active

  # ALERT-15 / BUG-05: a resolved alert can be acknowledged again
  @bug @BUG-05 @fail @changes-data
  Scenario: A resolved alert cannot be acknowledged again
    Given the browser window is 1280 by 1600 pixels
    And I am signed in as "Action Taker"
    When I open the "/Alerts" page
    And I acknowledge an active alert as "QA First"
    And I send another acknowledge request for the same alert as "QA Second"
    Then the resolved alert should still show "QA First" and not "QA Second"

  # ALERT-12
  Scenario: Acknowledging an alert that does not exist returns Not Found
    Given I am signed in as "Action Taker"
    Then acknowledging alert "999999" directly should return status 404

  # ALERT-13
  Scenario: Acknowledge request without the anti-forgery token is rejected
    Given I am signed in as "Action Taker"
    Then an acknowledge request without the anti-forgery token should be rejected