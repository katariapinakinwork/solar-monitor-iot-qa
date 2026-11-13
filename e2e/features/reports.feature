Feature: Energy reports

  Background:
    Given I am signed in as "Viewer"

  # REP-01
  Scenario: Report opens with the last 30 days, Daily and All Plants
    When I open the "/Reports" page
    Then the report form should show the default parameters

  # REP-02
  Scenario: The form offers every plant and the three report types
    Given I have noted every plant on the Solar Plants page
    When I open the "/Reports" page
    Then the report form should offer every plant and the three report types

  # REP-03
  Scenario: Daily report lists one row per day in order
    When I open the "/Reports" page
    Then the daily rows should be unique, in date order and inside the last 30 days
    And the row count badge should match the number of rows

  # REP-04
  Scenario: KPI cards and footer agree with the table
    When I open the "/Reports" page
    Then the KPI cards and the table footer should agree with the table rows

  # REP-05
  Scenario: CO2 avoided is calculated from total energy
    When I open the "/Reports" page
    Then CO2 avoided should equal the total energy times 0.000716 tonnes per kWh

  # REP-06
  Scenario: Hourly report lists one row per hour
    When I open the "/Reports?reportType=hourly" page
    Then the hourly rows should be whole hours in time order

  # REP-07
  Scenario: Monthly report lists one row per month
    When I open the "/Reports?reportType=monthly" page
    Then the monthly rows should be calendar months, at most two of them

  # REP-08
  Scenario: The three report types show the same total energy
    Then the hourly, daily and monthly reports should show the same total energy

  # REP-09
  Scenario: Per-plant totals add up to the All Plants total
    Then the plant totals should add up to the All Plants total

  # REP-10
  Scenario: Chosen parameters stay in the form
    When I generate a "Monthly" report for "Gujarat Sun Park" from 10 days ago to 2 days ago
    Then the report form should show plant "Gujarat Sun Park", from 10 days ago to 2 days ago, type "Monthly"

  # REP-11
  Scenario: A plant with no readings shows an empty state
    When I generate the report for plant "Maharashtra Sunrise Station"
    Then the No data message should be shown

  # REP-12
  Scenario: A single-day range returns that day
    Then a report for a single past day should return exactly that day

  # REP-13
  Scenario: A range in the future has no data
    When I open the report from 10 to 20 days from now
    Then the No data message should be shown

  # REP-14 / BUG-10: an inverted range silently shows "No data"
  @bug @BUG-10 @fail
  Scenario: A start date after the end date is corrected or explained
    When I open a report whose start date is after its end date
    Then the report should either show data or explain the date problem

  # REP-15
  Scenario: The chart plots the table data
    When I open the "/Reports" page
    Then the chart should plot exactly the table data

  # REP-16
  Scenario: The reset button restores the defaults
    When I open the "/Reports?reportType=hourly" page
    And I click the reset button on the report form
    Then the report form should show the default parameters

  # REP-17
  Scenario: Invalid dates in the address fall back to the defaults
    When I open the "/Reports?startDate=not-a-date&endDate=nonsense" page
    Then the report form should show the default parameters

  # REP-18
  Scenario: Performance ratio is colour-coded by threshold
    When I open the "/Reports" page
    Then each Avg PR value should be coloured by its threshold

  # REP-19 / BUG-15: Peak Power is one plant's reading, not the fleet's
  @bug @BUG-15 @fail
  Scenario: Peak Power for All Plants reflects the whole fleet
    When I open the "/Reports?reportType=hourly" page
    Then Peak Power should be at least the highest hourly energy