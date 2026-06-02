# Delta for purchase-registration

## ADDED Requirements

### Requirement: Purchase with Card Association

The system MUST allow registering a purchase associated with a specific card, which determines the person responsible.

A purchase SHALL include:
- Description
- Total amount (in cents, integer)
- Number of installments
- Associated card ID

#### Scenario: Create purchase with valid data
- GIVEN a card exists with closingDay=15 and dueDay=5
- WHEN the user registers a purchase of $100,000 in 3 installments
- THEN the purchase SHALL be persisted
- AND 3 installments SHALL be generated with amounts [33334, 33333, 33333]

### Requirement: Installment Generation with Card Cycle

When generating installments, the system MUST calculate due dates based on the card's billing cycle (closing day and due day).

#### Scenario: First installment due date when purchase before closing
- GIVEN a purchase made on April 10th
- AND a card with closingDay=15 and dueDay=5
- WHEN the system generates installments
- THEN the first installment SHALL be due on May 5th

#### Scenario: First installment due date when purchase after closing
- GIVEN a purchase made on April 16th
- AND a card with closingDay=15 and dueDay=5
- WHEN the system generates installments
- THEN the first installment SHALL be due on June 5th

### Requirement: Atomic Purchase Creation

The system MUST create the purchase and all its installments in a single atomic transaction. If any installment fails, the entire operation SHALL be rolled back.

### Requirement: Input Validation

The system MUST reject purchases with:
- Total amount equal to zero or negative
- Installment count equal to zero or negative

#### Scenario: Reject zero-amount purchase
- GIVEN the user attempts to create a purchase with totalCents=0
- WHEN the system validates the input
- THEN the operation SHALL be rejected with an error message
