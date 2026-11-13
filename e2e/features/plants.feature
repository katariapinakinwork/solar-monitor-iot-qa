Feature: Solar Plants directory

  Background:
    Given I am signed in as "Viewer"

  # PLANT-01
  Scenario: All plants are listed in alphabetical order
    When I open the "/Plants" page
    Then the plants should be listed in alphabetical order
    And the Showing count should equal the number of plant cards

  # PLANT-02
  Scenario: Each card shows complete plant data
    When I open the "/Plants" page
    Then every plant card should show complete plant data

  # PLANT-03
  Scenario: Search by plant name
    When I open the "/Plants" page
    And I search the plants for "Gujarat"
    Then every listed plant should mention "Gujarat" in its name or location

  # PLANT-04
  Scenario: Search by location
    When I open the "/Plants" page
    And I search the plants for "Pune"
    Then only "Maharashtra Sunrise Station" should be listed

  # PLANT-05 / BUG-07: the search is case-sensitive
  @bug @BUG-07 @fail
  Scenario: Search ignores letter case
    When I open the "/Plants" page
    And I search the plants for "rajasthan"
    Then only "Rajasthan Solar Farm Alpha" should be listed

  # PLANT-06
  Scenario: Search with no match shows an empty state
    When I open the "/Plants" page
    And I search the plants for "zzz-no-such-plant"
    Then the No plants found message should be shown

  # PLANT-07
  Scenario Outline: Status filter "<status>" lists only <status> plants
    When I open the "/Plants" page
    And I filter the plants by status "<status>"
    Then every listed plant should have status "<status>"

    Examples:
      | status      |
      | Online      |
      | Offline     |
      | Maintenance |
      | Degraded    |

  # PLANT-07
  Scenario: The status filters together cover every plant
    Given I have counted the plants for each status on the Solar Plants page
    Then the status counts should add up to the number of plants

  # PLANT-08
  Scenario Outline: Region filter "<region>" lists only that region
    When I open the "/Plants" page
    And I filter the plants by region "<region>"
    Then every listed plant should be in region "<region>"

    Examples:
      | region      |
      | North India |
      | South India |
      | West India  |

  # PLANT-09, PLANT-10
  Scenario: Search, status and region combine and stay in the form
    When I open the "/Plants" page
    And I filter the plants with search "Solar", status "Online" and region "North India"
    Then only "Rajasthan Solar Farm Alpha" should be listed
    And the filter form should show search "Solar", status "Online" and region "North India"

  # PLANT-11
  Scenario: The clear button resets every filter
    Given I have noted every plant on the Solar Plants page
    When I open the "/Plants?search=Pune&status=Maintenance&region=West+India" page
    And I clear the plant filters
    Then every plant should be listed with empty filters

  # PLANT-12
  Scenario: The alert count on each card matches the Alerts page
    Given I have noted every plant on the Solar Plants page
    Then the alert count on each plant card should match the Alerts page

  # PLANT-13
  Scenario: Markup typed into Search is treated as text
    When I open the "/Plants" page
    And I search the plants for '"><img src=x onerror=window.__xss=1>'
    Then the search box should show '"><img src=x onerror=window.__xss=1>'
    And no script from the search text should have run