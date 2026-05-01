# Delta for purchase-registration

## ADDED Requirements

### Requirement: Cycle-Based Installment Generation

The system MUST generate payment installments based on the results of the `billing-cycle-calculation` capability instead of simple month addition.

#### Scenario: Accurate first installment date
- GIVEN a purchase made on April 10th
- GIVEN a card with `closingDay` = 15 and `dueDay` = 5
- WHEN the system generates installments
- THEN the first installment MUST be due on May 5th.

#### Scenario: Accurate first installment date (late purchase)
- GIVEN a purchase made on April 16th
- GIVEN a card with `closingDay` = 15 and `dueDay` = 5
- WHEN the system generates installments
- THEN the first installment MUST be due on June 5th.

#### Scenario: Consistency of subsequent due dates
- GIVEN a first installment due on May 5th
- WHEN generating a 3-installment plan
- THEN installment 2 MUST be due on June 5th AND installment 3 MUST be due on July 5th.

#### Scenario: Handling month-end overflow for subsequent installments
- GIVEN a first installment due on January 31st
- WHEN generating a 2-installment plan
- THEN installment 2 MUST be due on February 28th (or 29th in leap years).
