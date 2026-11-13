Feature: Login page and layout details

  # AUTH-16 / BUG-06: quick-fill helpers are described but not rendered
  @bug @BUG-06 @fail
  Scenario: The login page offers quick-fill buttons for the seeded accounts
    Given I am on the login page
    When I click the quick-fill control for "Viewer"
    Then the login form should hold username "viewer" and password "Viewer@123"

  # AUTH-17 / BUG-11: the error text wraps below its icon
  @bug @BUG-11 @fail
  Scenario: The login error message is aligned with its icon
    Given I am on the login page
    When I sign in with username "viewer" and password "wrong-password"
    Then the error message should sit on the same line as its warning icon

  # AUTH-18 / BUG-13: a dots placeholder makes the empty field look filled in
  @bug @BUG-13 @fail
  Scenario: The empty password field does not look filled in
    Given I am on the login page
    Then the empty password field should not show mask dots as its placeholder

  # UI-01 / BUG-12: the footer is pinned to the first screen and covers content
  @bug @BUG-12 @fail
  Scenario: The footer does not cover page content
    Given I am signed in as "Viewer"
    When I open the "/Alerts" page
    Then the footer should sit below the page content

  # UI-02 / BUG-14: muted grey text on dark backgrounds
  @bug @BUG-14 @fail
  Scenario Outline: "<text>" is readable against its background
    Given I am signed in as "Viewer"
    When I open the "/" page
    And I open the user menu
    Then the "<text>" text should have a contrast ratio of at least 4.5 to 1

    Examples:
      | text             |
      | Signed in as     |
      | Role line        |
      | Footer copyright |
      | Navbar clock     |