/**
 * Setup Demo Data Script
 * Creates sample data needed for full workflow demonstration
 * Run this before your presentation: node scripts/setup-demo-data.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDemoData() {
  console.log('🚀 Setting up demo data for presentation...\n');

  try {
    // 1. Create Fiscal Year
    console.log('1. Creating fiscal year...');
    const { data: fiscalYear, error: fyError } = await supabase
      .from('fiscal_years')
      .insert([
        {
          year: 2024,
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          status: 'active',
          total_budget: 1000000000000.00
        }
      ])
      .select()
      .single();

    if (fyError && !fyError.message.includes('duplicate')) {
      console.error('   ❌ Error:', fyError.message);
    } else {
      const fyId = fiscalYear?.id || (await supabase.from('fiscal_years').select('id').limit(1).single()).data?.id;
      console.log('   ✅ Fiscal year created:', fyId);
    }

    // Get or create fiscal year ID
    let fiscalYearId = fiscalYear?.id;
    if (!fiscalYearId) {
      const { data: existingFy } = await supabase.from('fiscal_years').select('id').limit(1).single();
      fiscalYearId = existingFy?.id;
    }

    // 2. Create Budget Categories
    console.log('2. Creating budget categories...');
    const { data: categories, error: catError } = await supabase
      .from('budget_categories')
      .insert([
        { name: 'Capital Expenditure', code: 'CAPEX', description: 'Infrastructure projects' },
        { name: 'Operating Expenditure', code: 'OPEX', description: 'Day-to-day operations' },
        { name: 'Maintenance', code: 'MAINT', description: 'Maintenance and repairs' }
      ])
      .select();

    if (catError && !catError.message.includes('duplicate')) {
      console.error('   ⚠️  Categories error:', catError.message);
    } else {
      console.log('   ✅ Categories created/verified');
    }

    // Get category ID
    const { data: category } = await supabase.from('budget_categories').select('id').limit(1).single();
    const categoryId = category?.id;

    // 3. Create Ministries
    console.log('3. Creating ministries...');
    const { data: ministries, error: minError } = await supabase
      .from('ministries')
      .insert([
        {
          name: 'Ministry of Infrastructure',
          code: 'INFRA',
          description: 'Roads, bridges, and public works',
          minister_name: 'Eng. Mike Johnson',
          minister_email: 'minister@infrastructure.gov',
          status: 'active'
        }
      ])
      .select()
      .single();

    if (minError && !minError.message.includes('duplicate')) {
      console.error('   ⚠️  Ministry error:', minError.message);
    } else {
      console.log('   ✅ Ministry created/verified');
    }

    // Get ministry ID
    const { data: ministry } = await supabase.from('ministries').select('id').limit(1).single();
    const ministryId = ministry?.id;

    // 4. Create Contractor
    console.log('4. Creating contractor...');
    const { data: contractor, error: contError } = await supabase
      .from('contractors')
      .insert([
        {
          name: 'ABC Construction Ltd',
          registration_number: 'RC-12345',
          email: 'contact@abcconstruction.com',
          phone: '+234-123-456-7890',
          address: '123 Main Street, Lagos',
          verification_status: 'verified',
          status: 'active'
        }
      ])
      .select()
      .single();

    if (contError && !contError.message.includes('duplicate')) {
      console.error('   ⚠️  Contractor error:', contError.message);
    } else {
      console.log('   ✅ Contractor created/verified');
    }

    // Get contractor ID
    const { data: existingContractor } = await supabase.from('contractors').select('id').limit(1).single();
    const contractorId = existingContractor?.id;

    // 5. Create Government Official (for created_by field)
    console.log('5. Creating government official...');
    const { data: official, error: offError } = await supabase
      .from('government_officials')
      .insert([
        {
          employee_id: 'GOV-001',
          first_name: 'Admin',
          last_name: 'User',
          email: 'admin@government.gov',
          password_hash: 'demo_hash', // In real system, properly hashed
          role: 'SUPER_ADMIN',
          position: 'System Administrator',
          is_active: true,
          ministry_id: ministryId
        }
      ])
      .select()
      .single();

    if (offError && !offError.message.includes('duplicate')) {
      console.error('   ⚠️  Official error:', offError.message);
    } else {
      console.log('   ✅ Government official created/verified');
    }

    // Get official ID
    const { data: existingOfficial } = await supabase.from('government_officials').select('id').limit(1).single();
    const officialId = existingOfficial?.id;

    // 6. Create Budget Allocation
    console.log('6. Creating budget allocation...');
    const projectCode = 'PROJ-2024-DEMO-' + Date.now().toString().slice(-4);
    const { data: allocation, error: allocError } = await supabase
      .from('budget_allocations')
      .insert([
        {
          fiscal_year_id: fiscalYearId,
          ministry_id: ministryId,
          category_id: categoryId,
          project_name: 'Demo Road Construction Project',
          project_description: 'Sample project for presentation demonstration',
          allocated_amount: 50000000,
          project_code: projectCode,
          priority_level: 5,
          expected_start_date: '2024-01-15',
          expected_end_date: '2024-12-31',
          status: 'approved',
          created_by: officialId,
          approved_by: officialId,
          approved_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (allocError) {
      console.error('   ❌ Allocation error:', allocError.message);
      console.log('   ⚠️  This might be due to missing base data');
    } else {
      console.log('   ✅ Budget allocation created:', allocation.id);
      console.log('   📝 Project Code:', projectCode);
    }

    // 7. Create Disbursement
    if (allocation && contractorId) {
      console.log('7. Creating disbursement...');
      const { data: disbursement, error: disbError } = await supabase
        .from('disbursements')
        .insert([
          {
            allocation_id: allocation.id,
            contractor_id: contractorId,
            amount: 25000000,
            disbursement_type: 'initial',
            disbursement_reason: 'Initial payment for project commencement',
            disbursement_date: new Date().toISOString().split('T')[0],
            status: 'disbursed',
            approved_by: officialId,
            disbursed_by: officialId,
            disbursed_at: new Date().toISOString(),
            blockchain_tx_hash: '0x' + 'demo'.repeat(16) // Demo hash
          }
        ])
        .select()
        .single();

      if (disbError) {
        console.error('   ❌ Disbursement error:', disbError.message);
      } else {
        console.log('   ✅ Disbursement created:', disbursement.id);
      }
    }

    console.log('\n✅ Demo data setup complete!');
    console.log('\n📋 You can now:');
    console.log('   1. Go to http://localhost:3000/verify');
    console.log('   2. Search for project code:', projectCode || 'PROJ-2024-DEMO-XXXX');
    console.log('   3. View the verification results');
    console.log('\n🎯 The full workflow is now ready for demonstration!');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

setupDemoData();

