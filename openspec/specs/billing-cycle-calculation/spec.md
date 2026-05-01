# billing-cycle-calculation Specification

## Purpose

Define the logic for determining credit card billing cycles, including the identification of the closing date and the calculation of the first payment due date.

## Requirements

### Requirement: Determine Closing Date

The system MUST determine the closing date of a purchase based on the purchase date and the card's configured `closingDay`.

#### Scenario: Purchase before closing day
- GIVEN a card with `closingDay` = 15
- WHEN a purchase is made on the 10th of the month
- THEN the closing date SHALL be the 15th of the current month.

#### Scenario: Purchase after closing day
- GIVEN a card with `closingDay` = 15
- WHEN a purchase is made on the 16th of the month
- THEN the closing date SHALL be the 15th of the following month.

#### Scenario: Purchase on closing day
- GIVEN a card with `closingDay` = 15
- WHEN a purchase is made on the 15th of the month
- THEN the closing date SHALL be the 15th of the current month.

#### Scenario: Closing day is 31st in a 30-day month
- GIVEN a card with `closingDay` = 31
- WHEN the current month has only 30 days
- THEN the closing date SHALL be the 30th of the month.

### Requirement: Calculate First Due Date

The system MUST calculate the first installment's due date based on the determined closing date and the card's configured `dueDay`.

#### Scenario: Due date in the month following closure
- GIVEN a closing date of April 15th
- GIVEN a card with `dueDay` = 5
- THEN the first due date SHALL be May 5th.

#### Scenario: Due date in the same month as closure (unlikely but possible)
- GIVEN a closing date of April 15th
- GIVEN a card with `dueDay` = 20
- THEN the first due date SHALL be April 20th.

#### Scenario: Due date is 31st in a February year
- GIVEN a closing date of January 15th
- GIVEN a card with `dueDay` = 31
- WHEN the current year is not a leap year
- THEN the first due date SHALL be February 28th.
