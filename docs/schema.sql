-- =============================================================================
-- DeboApp Database Schema
-- Version: 1.0.0
-- Description: Core financial ledger for debt and installment management.
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS
-- Users who own the account and manage their debts.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PERSONS
-- The entities (friends, family) to whom the user owes money.
CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PURCHASES
-- Original purchase events that generate installments.
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    total_cents BIGINT NOT NULL CHECK (total_cents >= 0),
    installment_count INT NOT NULL CHECK (installment_count > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. INSTALLMENTS (CUOTAS)
-- Individual payment periods generated from a purchase.
CREATE TABLE installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    number INT NOT NULL,
    amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ADJUSTMENTS (AJUSTES)
-- Extra charges like taxes, fees, or manual adjustments.
CREATE TABLE adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'TAX', 'FEE', 'MANUAL'
    amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. PAYMENTS
-- The act of paying money to a person.
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50), -- e.g., 'CASH', 'TRANSFER'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. PAYMENT ALLOCATIONS (Trazabilidad)
-- The bridge that links a payment to the specific debt item it covers.
-- This is the "Ledger" entry.
CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    installment_id UUID REFERENCES installments(id) ON DELETE CASCADE,
    adjustment_id UUID REFERENCES adjustments(id) ON DELETE CASCADE,
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure a payment allocation points to EXACTLY one debt item
    CONSTRAINT one_debt_target CHECK (
        (installment_id IS NOT NULL AND adjustment_id IS NULL) OR 
        (installment_id IS NULL AND adjustment_id IS NOT NULL)
    )
);

-- =============================================================================
-- INDEXES for Performance (Crucial for PaymentEngine sorting)
-- =============================================================================

-- Optimize finding all debts for a person ordered by due date
CREATE INDEX idx_installments_person_due ON installments(person_id, due_date);
CREATE INDEX idx_adjustments_person_due ON adjustments(person_id, due_date);

-- Optimize lookup of allocations for a specific debt item
CREATE INDEX idx_alloc_installment ON payment_allocations(installment_id);
CREATE INDEX idx_alloc_adjustment ON payment_allocations(adjustment_id);

-- Optimize payment history lookup
CREATE INDEX idx_payments_person ON payments(person_id);
