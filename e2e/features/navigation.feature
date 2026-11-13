Feature: Core page navigation

  Background:
    Given I am signed in as "Viewer"

  # NAV-01
  Scenario Outline: Navbar link "<link>" opens its page and is highlighted
    When I open the "<start>" page
    And I click the "<link>" link in the navigation bar
    Then I should be on the "<path>" page
    And only the "<link>" link should be highlighted in the navigation bar

    Examples:
      | start    | link         | path     |
      | /Reports | Dashboard    | /        |
      | /        | Solar Plants | /Plants  |
      | /        | Alerts       | /Alerts  |
      | /        | Reports      | /Reports |

  # NAV-02
  Scenario: Brand logo returns to the dashboard
    When I open the "/Reports" page
    And I click the SolarMonitor logo
    Then I should be on the dashboard

  # NAV-03
  Scenario: View All Plants on the dashboard opens Solar Plants
    When I open the "/" page
    And I click View All Plants on the dashboard
    Then I should be on the "/Plants" page

  # NAV-03 / BUG-12: the footer is drawn over the Recent Alerts "View all" link
  @bug @BUG-12 @fail
  Scenario: View all in Recent Alerts opens the Alerts page
    When I open the "/" page
    And I click View all in the Recent Alerts card
    Then I should be on the "/Alerts" page

  # NAV-04
  Scenario: A plant card opens its detail page and the breadcrumb leads back
    When I open the "/Plants" page
    And I click View Details on "Gujarat Sun Park"
    Then I should see the page heading "Gujarat Sun Park"
    When I click "Solar Plants" in the breadcrumb
    Then I should be on the "/Plants" page

  # NAV-05, NAV-06
  Scenario Outline: <case> returns Not Found
    Then opening "<path>" should return status 404

    Examples:
      | case             | path                      |
      | Unknown plant id | /Plants/Detail/999999     |
      | Unknown address  | /this/page/does/not/exist |

  # NAV-07
  Scenario: Navigation collapses behind a menu button on a phone-width screen
    Given the browser window is 390 pixels wide
    When I open the "/" page
    Then the "Alerts" link should be hidden in the navigation bar
    When I open the navigation menu
    And I click the "Alerts" link in the navigation bar
    Then I should be on the "/Alerts" page