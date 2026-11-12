@login

Feature: Authentication and session management

  Scenario Outline: <role> signs in with username
    Given I am on the login page
    When I sign in as "<role>"
    Then I should be on the dashboard
    And the navigation bar should show user "<username>" with role "<role>"

    Examples:
      | role         | username    |
      | Viewer       | viewer      |
      | Action Taker | actiontaker |

  Scenario Outline: <role> signs in with email address
    Given I am on the login page
    When I sign in as "<role>" using the email address
    Then I should be on the dashboard

    Examples:
      | role         |
      | Viewer       |
      | Action Taker |

  Scenario: Username is not case-sensitive
    Given I am on the login page
    When I sign in with username "VIEWER" and password "Viewer@123"
    Then I should be on the dashboard

  Scenario Outline: Sign-in is rejected for <case>
    Given I am on the login page
    When I sign in with username "<username>" and password "<password>"
    Then I should see the login error "Invalid username or password."
    And I should still be on the login page

    Examples:
      | case           | username     | password       |
      | wrong password | viewer       | wrong-password |
      | unknown user   | no-such-user | whatever       |

  Scenario: Spaces-only credentials are rejected by the server
    Given I am on the login page
    When I sign in with username "   " and password "   "
    Then I should see the login error "Please enter both username/email and password."
    And I should still be on the login page

  Scenario: Empty form is stopped by the browser
    Given I am on the login page
    When I click Sign In without entering credentials
    Then the browser should flag the username as required
    And I should still be on the login page

  Scenario Outline: <path> redirects to the login page when signed out
    When I open the "<path>" page
    Then I should be redirected to the login page

    Examples:
      | path     |
      | /        |
      | /Plants  |
      | /Alerts  |
      | /Reports |

  Scenario: User returns to the requested page after signing in
    When I open the "/Alerts" page
    And I sign in as "Viewer"
    Then I should be on the "/Alerts" page

  Scenario: A return address on another website is ignored
    When I open the "/Account/Login?ReturnUrl=https%3A%2F%2Fevil.example%2Fphish" page
    And I sign in as "Viewer"
    Then I should be on the dashboard

  Scenario: Signed-in user who opens the login page goes to the dashboard
    Given I am signed in as "Viewer"
    When I open the "/Account/Login" page
    Then I should be on the dashboard

  Scenario: Session cookie is protected and ends with the browser session
    Given I am signed in as "Viewer"
    Then the session cookie should be HttpOnly
    And the session cookie should expire with the browser session

  Scenario: Keep me signed in extends the session
    Given I am on the login page
    When I sign in as "Viewer" with Keep me signed in ticked
    Then the session cookie should last about 7 days

  Scenario: Signing out ends the session
    Given I am signed in as "Viewer"
    When I sign out
    Then I should see the confirmation "You have been signed out successfully."
    When I open the "/Alerts" page
    Then I should be redirected to the login page

  Scenario: Login request without the anti-forgery token is rejected
    Then a login request without the anti-forgery token should be rejected