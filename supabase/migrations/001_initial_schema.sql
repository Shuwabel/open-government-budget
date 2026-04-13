-- Government Budget Transparency System Database Schema
-- Run this script in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Government Ministries/Departments
CREATE TABLE ministries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL, -- e.g., "EDU", "HEALTH", "INFRA"
    description TEXT,
    minister_name VARCHAR(255),
    minister_email VARCHAR(255),
    budget_code VARCHAR(20) UNIQUE, -- Government budget classification code
    blockchain_address VARCHAR(42), -- Ministry's wallet address
    public_key TEXT, -- For signature verification
    logo_url TEXT,
    contact_info JSONB, -- Phone, address, etc.
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget Categories
CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL, -- e.g., "CAPEX", "OPEX", "GRANTS"
    description TEXT,
    parent_category_id UUID REFERENCES budget_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fiscal Years
CREATE TABLE fiscal_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER UNIQUE NOT NULL, -- e.g., 2024
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'planning', -- planning, active, closed
    total_budget DECIMAL(20,2), -- Total government budget
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget Allocations
CREATE TABLE budget_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fiscal_year_id UUID REFERENCES fiscal_years(id),
    ministry_id UUID REFERENCES ministries(id),
    category_id UUID REFERENCES budget_categories(id),
    project_name VARCHAR(500) NOT NULL,
    project_description TEXT,
    allocated_amount DECIMAL(20,2) NOT NULL,
    project_code VARCHAR(50) UNIQUE, -- Government project code
    priority_level INTEGER DEFAULT 1, -- 1-5 priority levels
    expected_start_date DATE,
    expected_end_date DATE,
    status VARCHAR(20) DEFAULT 'allocated', -- allocated, approved, active, completed, suspended
    blockchain_tx_hash VARCHAR(66), -- Ethereum transaction hash
    created_by UUID, -- Admin who created this allocation
    approved_by UUID, -- Admin who approved this allocation
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contractors/Recipients
CREATE TABLE contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL, -- Business registration number
    company_type VARCHAR(50), -- LLC, Corporation, Individual, etc.
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    tax_id VARCHAR(50),
    bank_account_info JSONB, -- Bank details for payments
    blockchain_address VARCHAR(42),
    verification_status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
    verification_documents JSONB, -- Links to verification documents
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disbursements
CREATE TABLE disbursements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    allocation_id UUID REFERENCES budget_allocations(id),
    contractor_id UUID REFERENCES contractors(id),
    amount DECIMAL(20,2) NOT NULL,
    disbursement_type VARCHAR(50) NOT NULL, -- initial, milestone, final, emergency
    disbursement_reason TEXT,
    disbursement_date DATE NOT NULL,
    payment_method VARCHAR(50), -- bank_transfer, check, cash, crypto
    transaction_reference VARCHAR(100), -- Bank transaction reference
    blockchain_tx_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, disbursed, failed
    approved_by UUID, -- Admin who approved disbursement
    disbursed_by UUID, -- Admin who processed disbursement
    disbursed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenditure Reports
CREATE TABLE expenditure_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    disbursement_id UUID REFERENCES disbursements(id),
    contractor_id UUID REFERENCES contractors(id),
    report_type VARCHAR(50) NOT NULL, -- milestone, final, quarterly, annual
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_spent DECIMAL(20,2) NOT NULL,
    report_summary TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- draft, submitted, verified, approved, rejected
    submitted_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID, -- Admin who verified the report
    verified_at TIMESTAMP WITH TIME ZONE,
    blockchain_tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenditure Items
CREATE TABLE expenditure_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES expenditure_reports(id),
    item_description TEXT NOT NULL,
    category VARCHAR(100), -- materials, labor, equipment, etc.
    amount DECIMAL(20,2) NOT NULL,
    quantity DECIMAL(10,2),
    unit_price DECIMAL(20,2),
    supplier_name VARCHAR(255),
    invoice_number VARCHAR(100),
    invoice_date DATE,
    receipt_url TEXT, -- Link to uploaded receipt/invoice
    receipt_hash VARCHAR(64), -- Hash of the receipt file
    is_verified BOOLEAN DEFAULT false,
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Government Officials/Admins
CREATE TABLE government_officials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ministry_id UUID REFERENCES ministries(id),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- super_admin, ministry_admin, finance_officer, auditor
    position VARCHAR(255), -- Job title
    permissions JSONB, -- Granular permissions
    blockchain_address VARCHAR(42),
    digital_signature_public_key TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Public Users (Citizens/Auditors)
CREATE TABLE public_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    organization VARCHAR(255), -- Media, NGO, Research Institute, etc.
    user_type VARCHAR(50) DEFAULT 'citizen', -- citizen, journalist, researcher, auditor
    verification_status VARCHAR(20) DEFAULT 'pending',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Storage
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- allocation, disbursement, expenditure, contractor
    entity_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- invoice, receipt, contract, report
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT false,
    verification_notes TEXT
);

-- Audit Trail
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE, APPROVE, REJECT
    old_values JSONB,
    new_values JSONB,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- government_official, contractor, public_user
    ip_address INET,
    user_agent TEXT,
    reason TEXT,
    blockchain_tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification Requests
CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL, -- Public user requesting verification
    entity_type VARCHAR(50) NOT NULL, -- allocation, disbursement, expenditure
    entity_id UUID NOT NULL,
    verification_type VARCHAR(50) NOT NULL, -- blockchain_verification, document_verification
    status VARCHAR(20) DEFAULT 'pending', -- pending, verified, failed, expired
    verification_result JSONB,
    blockchain_tx_hash VARCHAR(66),
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_budget_allocations_fiscal_year ON budget_allocations(fiscal_year_id);
CREATE INDEX idx_budget_allocations_ministry ON budget_allocations(ministry_id);
CREATE INDEX idx_budget_allocations_status ON budget_allocations(status);
CREATE INDEX idx_disbursements_allocation ON disbursements(allocation_id);
CREATE INDEX idx_disbursements_contractor ON disbursements(contractor_id);
CREATE INDEX idx_disbursements_blockchain ON disbursements(blockchain_tx_hash);
CREATE INDEX idx_expenditure_reports_disbursement ON expenditure_reports(disbursement_id);
CREATE INDEX idx_expenditure_items_report ON expenditure_items(report_id);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_verification_requests_entity ON verification_requests(entity_type, entity_id);

-- Row Level Security (RLS) Policies
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenditure_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_officials ENABLE ROW LEVEL SECURITY;

-- Example RLS Policy: Public can read budget allocations
CREATE POLICY "Public can view budget allocations" ON budget_allocations
    FOR SELECT USING (true);

-- Example RLS Policy: Only ministry officials can modify their ministry's data
CREATE POLICY "Ministry officials can modify their allocations" ON budget_allocations
    FOR ALL USING (
        ministry_id IN (
            SELECT ministry_id FROM government_officials 
            WHERE id = auth.uid()
        )
    );

-- Insert sample data
INSERT INTO fiscal_years (year, start_date, end_date, status, total_budget) VALUES
(2024, '2024-01-01', '2024-12-31', 'active', 1000000000000.00);

INSERT INTO budget_categories (name, code, description) VALUES
('Capital Expenditure', 'CAPEX', 'Infrastructure and capital projects'),
('Operating Expenditure', 'OPEX', 'Day-to-day operational costs'),
('Grants and Subsidies', 'GRANTS', 'Government grants and subsidies'),
('Personnel Costs', 'PERSONNEL', 'Salaries and benefits'),
('Maintenance', 'MAINTENANCE', 'Maintenance and repairs');

INSERT INTO ministries (name, code, description, minister_name, minister_email) VALUES
('Ministry of Education', 'EDU', 'Education and human development', 'Dr. John Smith', 'minister@education.gov'),
('Ministry of Health', 'HEALTH', 'Public health and medical services', 'Dr. Jane Doe', 'minister@health.gov'),
('Ministry of Infrastructure', 'INFRA', 'Roads, bridges, and public works', 'Eng. Mike Johnson', 'minister@infrastructure.gov'),
('Ministry of Finance', 'FINANCE', 'Financial management and planning', 'Mr. David Wilson', 'minister@finance.gov');
