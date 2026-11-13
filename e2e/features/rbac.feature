Feature: Role-based authorization and privilege boundaries

  # RBAC-01, RBAC-02
  Scenario Outline: <role> can open <path>
    Given I am signed in as "<role>"
    When I open the "<path>" page
    Then I should see the page heading "<heading>"

    Examples:
      | role         | path             | heading                   |
      | Viewer       | /                | Fleet Dashboard           |
      | Viewer       | /Plants          | Solar Plants              |
      | Viewer       | /Plants/Detail/1 | Rajasthan Solar Farm Alpha |
      | Viewer       | /Alerts          | Alerts & Notifications    |
      | Viewer       | /Reports         | Energy Reports            |
      | Action Taker | /                | Fleet Dashboard           |
      | Action Taker | /Plants          | Solar Plants              |
      | Action Taker | /Plants/Detail/1 | Rajasthan Solar Farm Alpha |
      | Action Taker | /Alerts          | Alerts & Notifications    |
      | Action Taker | /Reports         | Energy Reports            |

  # RBAC-03
  Scenario Outline: User menu shows the role of <role>
    Given I am signed in as "<role>"
    When I open the user menu
    Then the user menu should show "<role line>"

    Examples:
      | role         | role line         |
      | Viewer       | Role: Viewer      |
      | Action Taker | Role: ActionTaker |

  # RBAC-04
  Scenario: Viewer cannot acknowledge Critical or Warning alerts in the UI
    Given I am signed in as "Viewer"
    When I open the "/Alerts" page
    Then the Acknowledge button should be disabled on every "Critical" alert
    And the Acknowledge button should be disabled on every "Warning" alert

  # RBAC-05 / BUG-03: the button is enabled on Info alerts for every role
  @bug @BUG-03 @fail
  Scenario: Viewer cannot acknowledge Info alerts in the UI
    Given I am signed in as "Viewer"
    When I open the "/Alerts" page
    Then the Acknowledge button should be disabled on every "Info" alert

  # RBAC-06
  Scenario: Action Taker can acknowledge every active alert
    Given I am signed in as "Action Taker"
    When I open the "/Alerts" page
    Then the Acknowledge button should be enabled on every active alert

  # RBAC-07 / BUG-01: the endpoint does not check the Action Taker role
  @bug @BUG-01 @fail
  Scenario: Viewer cannot acknowledge an alert by sending the request directly
    Given I am signed in as "Viewer"
    When I open the "/Alerts" page
    Then a direct acknowledge request should be refused as forbidden

  # RBAC-08
  Scenario: Anonymous user cannot acknowledge an alert
    Then an acknowledge request without signing in should be redirected to the login page

  # RBAC-09 / BUG-02: Plant Detail allows anonymous access
  @bug @BUG-02 @fail
  Scenario: Anonymous user cannot open a Plant Detail page
    When I open the "/Plants/Detail/1" page
    Then I should be redirected to the login page

  # RBAC-10
  Scenario: Access Denied page explains the restriction
    Given I am signed in as "Viewer"
    When I open the "/Account/AccessDenied" page
    Then I should see the Access Denied page for user "viewer"