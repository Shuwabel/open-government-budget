-- ============================================
-- DEMO DATA SETUP SCRIPT
-- Run this in Supabase SQL Editor
-- This creates all base data needed for full workflow demo
-- ============================================

-- 1. Insert Fiscal Year
INSERT INTO fiscal_years (year, start_date, end_date, status, total_budget) 
VALUES 
  (2024, '2024-01-01', '2024-12-31', 'active', 1000000000000.00)
ON CONFLICT (year) DO NOTHING;

-- 2. Insert Budget Categories
INSERT INTO budget_categories (name, code, description) 
VALUES 
  ('Capital Expenditure', 'CAPEX', 'Infrastructure and capital projects'),
  ('Operating Expenditure', 'OPEX', 'Day-to-day operational costs'),
  ('Grants and Subsidies', 'GRANTS', 'Government grants and subsidies'),
  ('Personnel Costs', 'PERSONNEL', 'Salaries and benefits'),
  ('Maintenance', 'MAINTENANCE', 'Maintenance and repairs')
ON CONFLICT (code) DO NOTHING;

-- 3. Insert Ministries
INSERT INTO ministries (name, code, description, minister_name, minister_email, status) 
VALUES 
  ('Ministry of Education', 'EDU', 'Education and human development', 'Dr. John Smith', 'minister@education.gov', 'active'),
  ('Ministry of Health', 'HEALTH', 'Public health and medical services', 'Dr. Jane Doe', 'minister@health.gov', 'active'),
  ('Ministry of Infrastructure', 'INFRA', 'Roads, bridges, and public works', 'Eng. Mike Johnson', 'minister@infrastructure.gov', 'active'),
  ('Ministry of Finance', 'FINANCE', 'Financial management and planning', 'Mr. David Wilson', 'minister@finance.gov', 'active')
ON CONFLICT (code) DO NOTHING;

-- 4. Insert Contractors
INSERT INTO contractors (
  name, 
  registration_number, 
  email, 
  phone, 
  address, 
  verification_status
) 
VALUES 
  (
    'ABC Construction Ltd', 
    'RC-12345', 
    'contact@abcconstruction.com', 
    '+234-123-456-7890', 
    '123 Main Street, Lagos, Nigeria', 
    'verified'
  ),
  (
    'XYZ Infrastructure Group', 
    'RC-67890', 
    'info@xyzinfra.com', 
    '+234-987-654-3210', 
    '456 Business District, Abuja, Nigeria', 
    'verified'
  )
ON CONFLICT (registration_number) DO NOTHING;

-- 5. Insert Government Official (for created_by field)
INSERT INTO government_officials (
  employee_id,
  first_name,
  last_name,
  email,
  password_hash,
  role,
  position,
  is_active,
  ministry_id
)
SELECT 
  'GOV-001',
  'Admin',
  'User',
  'admin@government.gov',
  'demo_password_hash', -- In production, this would be properly hashed
  'SUPER_ADMIN',
  'System Administrator',
  true,
  (SELECT id FROM ministries LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM government_officials WHERE employee_id = 'GOV-001'
);

-- 6. Create a Budget Allocation
INSERT INTO budget_allocations (
  fiscal_year_id,
  ministry_id,
  category_id,
  project_name,
  project_description,
  allocated_amount,
  project_code,
  priority_level,
  expected_start_date,
  expected_end_date,
  status,
  created_by,
  approved_by,
  approved_at
)
SELECT 
  (SELECT id FROM fiscal_years LIMIT 1),
  (SELECT id FROM ministries WHERE code = 'INFRA' LIMIT 1),
  (SELECT id FROM budget_categories WHERE code = 'CAPEX' LIMIT 1),
  'Demo Highway Construction Project',
  'Construction of a 50km highway connecting Lagos to Abuja. This is a demonstration project for the Government Budget Transparency System.',
  75000000.00,
  'PROJ-DEMO-2024-001',
  5,
  '2024-01-15',
  '2024-12-31',
  'approved',
  (SELECT id FROM government_officials LIMIT 1),
  (SELECT id FROM government_officials LIMIT 1),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM budget_allocations WHERE project_code = 'PROJ-DEMO-2024-001'
);

-- 7. Create a Disbursement for the Budget Allocation
INSERT INTO disbursements (
  allocation_id,
  contractor_id,
  amount,
  disbursement_type,
  disbursement_reason,
  disbursement_date,
  status,
  approved_by,
  disbursed_by,
  disbursed_at,
  blockchain_tx_hash
)
SELECT 
  (SELECT id FROM budget_allocations WHERE project_code = 'PROJ-DEMO-2024-001' LIMIT 1),
  (SELECT id FROM contractors LIMIT 1),
  25000000.00,
  'initial',
  'Initial payment for project commencement and mobilization',
  CURRENT_DATE,
  'disbursed',
  (SELECT id FROM government_officials LIMIT 1),
  (SELECT id FROM government_officials LIMIT 1),
  NOW(),
  '0x' || LPAD(MD5(RANDOM()::TEXT)::TEXT, 64, '0') -- Demo transaction hash
WHERE NOT EXISTS (
  SELECT 1 FROM disbursements 
  WHERE allocation_id = (SELECT id FROM budget_allocations WHERE project_code = 'PROJ-DEMO-2024-001' LIMIT 1)
);

-- 8. Create Another Budget Allocation (for variety)
INSERT INTO budget_allocations (
  fiscal_year_id,
  ministry_id,
  category_id,
  project_name,
  project_description,
  allocated_amount,
  project_code,
  priority_level,
  expected_start_date,
  expected_end_date,
  status,
  created_by,
  approved_by,
  approved_at
)
SELECT 
  (SELECT id FROM fiscal_years LIMIT 1),
  (SELECT id FROM ministries WHERE code = 'EDU' LIMIT 1),
  (SELECT id FROM budget_categories WHERE code = 'CAPEX' LIMIT 1),
  'School Renovation Program',
  'Renovation of 100 primary schools across the country. Includes infrastructure upgrades and modern facilities.',
  50000000.00,
  'PROJ-DEMO-2024-002',
  4,
  '2024-02-01',
  '2024-11-30',
  'approved',
  (SELECT id FROM government_officials LIMIT 1),
  (SELECT id FROM government_officials LIMIT 1),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM budget_allocations WHERE project_code = 'PROJ-DEMO-2024-002'
);

-- 9. Create Disbursement for Second Project
INSERT INTO disbursements (
  allocation_id,
  contractor_id,
  amount,
  disbursement_type,
  disbursement_reason,
  disbursement_date,
  status,
  approved_by,
  disbursed_by,
  disbursed_at,
  blockchain_tx_hash
)
SELECT 
  (SELECT id FROM budget_allocations WHERE project_code = 'PROJ-DEMO-2024-002' LIMIT 1),
  (SELECT id FROM contractors ORDER BY id LIMIT 1 OFFSET 1),
  15000000.00,
  'initial',
  'Initial funding for school renovation program',
  CURRENT_DATE,
  'disbursed',
  (SELECT id FROM government_officials LIMIT 1),
  (SELECT id FROM government_officials LIMIT 1),
  NOW(),
  '0x' || LPAD(MD5(RANDOM()::TEXT)::TEXT, 64, '0')
WHERE NOT EXISTS (
  SELECT 1 FROM disbursements 
  WHERE allocation_id = (SELECT id FROM budget_allocations WHERE project_code = 'PROJ-DEMO-2024-002' LIMIT 1)
);

-- ============================================
-- VERIFICATION: Check what was created
-- ============================================

-- View created data
SELECT 'Fiscal Years' as table_name, COUNT(*) as count FROM fiscal_years
UNION ALL
SELECT 'Budget Categories', COUNT(*) FROM budget_categories
UNION ALL
SELECT 'Ministries', COUNT(*) FROM ministries
UNION ALL
SELECT 'Contractors', COUNT(*) FROM contractors
UNION ALL
SELECT 'Government Officials', COUNT(*) FROM government_officials
UNION ALL
SELECT 'Budget Allocations', COUNT(*) FROM budget_allocations
UNION ALL
SELECT 'Disbursements', COUNT(*) FROM disbursements;

-- Show project codes you can verify
SELECT 
  project_code,
  project_name,
  allocated_amount,
  status
FROM budget_allocations
ORDER BY created_at DESC;

-- ============================================
-- DONE! Now you can:
-- ============================================
-- 1. Go to http://localhost:3000/verify
-- 2. Search for: PROJ-DEMO-2024-001
-- 3. Or search for: PROJ-DEMO-2024-002
-- 4. See full verification results!
-- ============================================

