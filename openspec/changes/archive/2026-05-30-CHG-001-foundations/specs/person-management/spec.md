# Delta for person-management

## ADDED Requirements

### Requirement: Create Person

The system MUST allow creating a person with a mandatory name.

#### Scenario: Create person with valid name
- GIVEN the user provides a name "Juan Pérez"
- WHEN the system creates the person
- THEN the person SHALL be persisted with UUID v4 identity

#### Scenario: Reject person without name
- GIVEN the user provides an empty name
- WHEN the system attempts to create the person
- THEN the system MUST reject the operation and display an error

### Requirement: Manage Cards Per Person

The system MUST allow associating zero or more cards to a person.

Each card SHALL have:
- A name (e.g., "Visa Oro")
- A closing day (1–31)
- A due day (1–31)

#### Scenario: Create person with card
- GIVEN the user provides a person named "María"
- AND a card with name "Visa", closingDay=15, dueDay=5
- WHEN the system creates the person with the card
- THEN the person SHALL be persisted with the card configuration

#### Scenario: Day values clamped to valid range
- GIVEN the user provides closingDay=32
- WHEN the system validates the input
- THEN the system MUST reject or clamp to the last valid day of the month

### Requirement: Delete Person

The system MUST allow deleting a person and all associated data.

#### Scenario: Cascade delete person
- GIVEN a person exists with associated purchases and installments
- WHEN the user deletes the person
- THEN all related purchases, installments, and payments SHALL also be deleted
