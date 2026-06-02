# Delta for dashboard

## ADDED Requirements

### Requirement: Display Total Debt

The system MUST calculate and display the total outstanding debt.

The total debt SHALL be computed as:
`sum of all pending installment amounts + adjustments − sum of all payments`

#### Scenario: Total debt reflects pending installments
- GIVEN there are installments totaling $100,000 with no payments
- WHEN the dashboard loads
- THEN the total debt SHALL display $100,000

#### Scenario: Total debt reflects payments applied
- GIVEN there are installments totaling $100,000
- AND a payment of $30,000 has been applied
- WHEN the dashboard loads
- THEN the total debt SHALL display $70,000

### Requirement: Reactive UI Updates

The system MUST use Angular Signals to ensure any change in debt data is reflected instantly in the UI without page reload.

#### Scenario: Purchase added while dashboard is open
- GIVEN the dashboard is displaying current debt
- WHEN a new purchase is added
- THEN the total debt SHALL update immediately via computed signals

### Requirement: Per-Person Balance Display

The system MUST show a list of persons with their individual outstanding balance.

#### Scenario: Person list with balances
- GIVEN two persons exist with different debts
- WHEN the dashboard loads
- THEN each person SHALL be listed with their corresponding balance
