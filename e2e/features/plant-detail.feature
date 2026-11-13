Feature: Plant detail

  Background:
    Given I am signed in as "Viewer"
    And I have noted every plant on the Solar Plants page

  # DET-01, DET-02
  Scenario Outline: Detail page of <plant> matches its card
    When I open the detail page of "<plant>"
    Then the detail page should show the same name, status, location, capacity, panels and region as its card
    And kWh Today should match the plant card

    Examples:
      | plant                       |
      | Andhra Pradesh Solar Hub    |
      | Gujarat Sun Park            |
      | Maharashtra Sunrise Station |
      | Rajasthan Solar Farm Alpha  |
      | Tamil Nadu Coastal Array    |

  # DET-03, DET-04
  Scenario: Panel inventory is complete and agrees with Panels Active
    When I open the detail page of "Rajasthan Solar Farm Alpha"
    Then the panel inventory should be complete and well-formed
    And Panels Active should equal the number of Active panels in the inventory

  # DET-05 / BUG-08: Panels Faulty also counts Underperforming panels
  @bug @BUG-08 @fail
  Scenario: Panels Faulty matches the inventory
    When I open the detail page of "Rajasthan Solar Farm Alpha"
    Then Panels Faulty should equal the number of Faulty panels in the inventory

  # DET-06
  Scenario: Production charts are drawn and agree with the KPI cards
    When I open the detail page of "Gujarat Sun Park"
    Then both production charts should be drawn and add up to the KPI cards

  # DET-07
  Scenario: The active-alert banner matches the alert count of each plant
    Then the active-alert banner on each detail page should match the plant card

  # DET-08 / BUG-09: Degraded is orange on the list but red on the detail page
  @bug @BUG-09 @fail
  Scenario: Degraded status uses the same colour on the list and the detail page
    When I open the detail page of "Andhra Pradesh Solar Hub"
    Then the status badge should have the same colour as on the Solar Plants page

  # DET-09
  Scenario: A plant under maintenance shows zero generation without errors
    When I open the detail page of "Maharashtra Sunrise Station"
    Then the generation figures should all be zero