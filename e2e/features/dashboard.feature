Feature: Dashboard

  Background:
    Given I am signed in as "Viewer"

  # DASH-01
  Scenario: The four fleet KPI cards are shown
    When I open the "/" page
    Then I should see the KPI cards:
      | Total Capacity     |
      | Today's Generation |
      | Fleet Performance  |
      | CO₂ Avoided        |

  # DASH-02
  Scenario: Total capacity and plant count match the Solar Plants page
    Given I have noted every plant on the Solar Plants page
    When I open the "/" page
    Then the Total Capacity card should equal the sum of the plant capacities
    And the dashboard should report the same number of plants

  # DASH-03
  Scenario: Generation today matches the Solar Plants page
    Given I have noted every plant on the Solar Plants page
    When I open the "/" page
    Then the Today card should match the total generation of the plants today

  # DASH-04
  Scenario: Plant status tiles match the Solar Plants status filter
    Given I have counted the plants for each status on the Solar Plants page
    When I open the "/" page
    Then the "Online" tile should equal the number of "Online" plants
    And the "Offline" tile should equal the number of "Offline" plants
    And the "Maint./Degraded" tile should equal the number of "Maintenance" and "Degraded" plants
    And the status tiles should add up to the number of plants

  # DASH-05
  Scenario: Critical alerts tile matches the Alerts page
    Given I have noted the "Critical" count on the Alerts page
    When I open the "/" page
    Then the "Critical Alerts" tile should equal the noted "Critical" count

  # DASH-06
  Scenario: Fleet performance is a valid percentage that matches its ratio
    When I open the "/" page
    Then the fleet performance should be between 0 and 100 percent
    And the fleet performance should equal the PR ratio times 100

  # DASH-07
  Scenario: Hourly production chart shows ordered hours that add up
    When I open the "/" page
    Then the hourly production chart should show whole hours in time order
    And the hourly production chart should add up to the Today card

  # DASH-08
  Scenario: Plants Overview lists every plant
    Given I have noted every plant on the Solar Plants page
    When I open the "/" page
    Then the Plants Overview table should have one row per plant
    And every Plants Overview row should show a capacity and a status

  # DASH-09
  Scenario: Recent Alerts shows at most five alerts, each with a severity
    When I open the "/" page
    Then the Recent Alerts card should list between 1 and 5 alerts
    And every recent alert should show a severity badge