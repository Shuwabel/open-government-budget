import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerBlockchainService } from '@/lib/blockchain/server-blockchain-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ministryId = searchParams.get('ministryId');
    const fiscalYear = searchParams.get('fiscalYear');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabaseAdmin
      .from('budget_allocations')
      .select(`
        *,
        ministries(name, code),
        budget_categories(name, code),
        fiscal_years(year)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (ministryId) {
      query = query.eq('ministry_id', ministryId);
    }
    if (fiscalYear) {
      query = query.eq('fiscal_year_id', fiscalYear);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: allocations, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch budget allocations', details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('budget_allocations')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: allocations,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fiscalYearId,
      ministryId,
      categoryId,
      projectName,
      projectDescription,
      allocatedAmount,
      projectCode,
      priorityLevel,
      expectedStartDate,
      expectedEndDate,
      createdBy
    } = body;

    // Validate required fields
    if (!ministryId || !categoryId || !projectName || !allocatedAmount) {
      return NextResponse.json(
        { error: 'Missing required fields', missing: { ministryId: !ministryId, categoryId: !categoryId, projectName: !projectName, allocatedAmount: !allocatedAmount } },
        { status: 400 }
      );
    }

    // Validate UUID format for ministry and category IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ministryId)) {
      return NextResponse.json(
        { error: 'Invalid ministry ID format. Please select a valid ministry.' },
        { status: 400 }
      );
    }
    if (!uuidRegex.test(categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID format. Please select a valid category.' },
        { status: 400 }
      );
    }

    // Get or create a default fiscal year if not provided
    let finalFiscalYearId = fiscalYearId;
    if (!finalFiscalYearId || finalFiscalYearId === '1' || finalFiscalYearId === '') {
      // Try to get the current fiscal year
      const { data: fiscalYears } = await supabaseAdmin
        .from('fiscal_years')
        .select('id')
        .order('year', { ascending: false })
        .limit(1);
      
      if (fiscalYears && fiscalYears.length > 0) {
        finalFiscalYearId = fiscalYears[0].id;
      } else {
        // Create a default fiscal year for 2024
        const { data: newFiscalYear, error: fiscalYearError } = await supabaseAdmin
          .from('fiscal_years')
          .insert([{ year: 2024, start_date: '2024-01-01', end_date: '2024-12-31', status: 'active' }])
          .select()
          .single();
        
        if (fiscalYearError) {
          console.error('Error creating fiscal year:', fiscalYearError);
          return NextResponse.json(
            { 
              error: 'Failed to create fiscal year', 
              details: fiscalYearError.message 
            },
            { status: 500 }
          );
        }
        
        finalFiscalYearId = newFiscalYear?.id;
      }
    }

    // Create budget allocation in database
    const { data: allocation, error: dbError } = await supabaseAdmin
      .from('budget_allocations')
      .insert([
        {
          fiscal_year_id: finalFiscalYearId,
          ministry_id: ministryId,
          category_id: categoryId,
          project_name: projectName,
          project_description: projectDescription || null,
          allocated_amount: parseFloat(allocatedAmount),
          project_code: projectCode || null,
          priority_level: priorityLevel ? parseInt(priorityLevel) : 1,
          expected_start_date: expectedStartDate || null,
          expected_end_date: expectedEndDate || null,
          status: 'allocated',
          created_by: (createdBy && createdBy !== 'system' && uuidRegex.test(createdBy)) ? createdBy : null // UUID field - set to null if invalid or 'system'
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to create budget allocation', 
          details: dbError.message,
          code: dbError.code,
          hint: dbError.hint
        },
        { status: 500 }
      );
    }

    // Create blockchain transaction
    let blockchainTxHash = null;
    let blockchainAllocationId = null;
    
    try {
      // Only attempt blockchain if private key is configured
      if (!process.env.BLOCKCHAIN_PRIVATE_KEY) {
        console.log('⚠️ BLOCKCHAIN_PRIVATE_KEY not set, skipping blockchain transaction');
      } else {
        const serverBlockchain = getServerBlockchainService();
      
        // Convert dates to Unix timestamps
        const startTimestamp = expectedStartDate 
          ? Math.floor(new Date(expectedStartDate).getTime() / 1000)
          : Math.floor(Date.now() / 1000);
        const endTimestamp = expectedEndDate
          ? Math.floor(new Date(expectedEndDate).getTime() / 1000)
          : startTimestamp + 365 * 24 * 60 * 60; // 1 year default

        // Get ministry and register on blockchain if needed
        const { data: ministry } = await supabaseAdmin
          .from('ministries')
          .select('id, name, code, blockchain_address')
          .eq('id', ministryId)
          .single();

        if (!ministry) {
          throw new Error('Ministry not found');
        }

        // Register or find ministry on blockchain
        console.log(`Registering/checking ministry ${ministry.name} on blockchain...`);
        const ministryWallet = ministry.blockchain_address || serverBlockchain.getWalletAddress();
        
        let blockchainMinistryId: number | null = null;
        
        // First, try to find existing ministry by wallet address
        try {
          const existingMinistryId = await serverBlockchain.getMinistryIdByAddress(ministryWallet);
          if (existingMinistryId) {
            console.log(`✅ Found existing ministry on blockchain with ID: ${existingMinistryId}`);
            // Verify the ministry is active
            const ministryData = await serverBlockchain.getMinistry(existingMinistryId);
            if (ministryData && ministryData.isActive) {
              blockchainMinistryId = existingMinistryId;
              console.log(`✅ Ministry ${blockchainMinistryId} is active`);
            } else {
              console.warn(`⚠️ Ministry ${existingMinistryId} exists but is not active. Will try to register new one.`);
            }
          }
        } catch (error: any) {
          console.log('⚠️ Could not check for existing ministry:', error.message);
        }
        
        // If not found or not active, register the ministry
        if (!blockchainMinistryId) {
          try {
            console.log(`Registering new ministry: ${ministry.name} (${ministry.code})`);
            const registerResult = await serverBlockchain.registerMinistry(
              ministry.name,
              ministry.code,
              ministryWallet
            );
            blockchainMinistryId = registerResult.ministryId;
            console.log(`✅ Ministry registered on blockchain with ID: ${blockchainMinistryId}`);
          } catch (registerError: any) {
            // If registration fails (e.g., address already registered), try to find it again
            console.warn('⚠️ Ministry registration failed, trying to find by address again:', registerError.message);
            try {
              const foundId = await serverBlockchain.getMinistryIdByAddress(ministryWallet);
              if (foundId) {
                blockchainMinistryId = foundId;
                console.log(`✅ Found ministry ID after failed registration: ${blockchainMinistryId}`);
              } else {
                throw new Error('Could not find or register ministry on blockchain');
              }
            } catch (findError: any) {
              throw new Error(`Failed to register or find ministry: ${registerError.message}`);
            }
          }
        }
        
        if (!blockchainMinistryId) {
          throw new Error('Could not determine blockchain ministry ID');
        }

        // Get category for mapping
        const { data: category } = await supabaseAdmin
          .from('budget_categories')
          .select('code')
          .eq('id', categoryId)
          .single();
        
        // Map category to a simple sequential ID (1-10)
        // Categories aren't stored on blockchain, so we use a simple mapping
        const categoryMap: Record<string, number> = {
          'CAPEX': 1,
          'OPEX': 2,
          'GRANTS': 3,
          'PERSONNEL': 4,
          'MAINTENANCE': 5
        };
        const blockchainCategoryId = category 
          ? (categoryMap[category.code] || 1)
          : 1;

        // Get fiscal year number
        const { data: fiscalYear } = await supabaseAdmin
          .from('fiscal_years')
          .select('year')
          .eq('id', finalFiscalYearId)
          .single();
        
        const fiscalYearNumber = fiscalYear?.year || new Date().getFullYear();

        const blockchainResult = await serverBlockchain.createBudgetAllocation(
          fiscalYearNumber,
          blockchainMinistryId,
          blockchainCategoryId,
          projectName,
          projectCode || `PROJ-${Date.now()}`,
          allocatedAmount,
          priorityLevel || 1,
          startTimestamp,
          endTimestamp
        );

        blockchainTxHash = blockchainResult.txHash;
        blockchainAllocationId = blockchainResult.allocationId;

        // Approve the allocation on blockchain if not already approved
        try {
          const blockchainAllocation = await serverBlockchain.getAllocation(blockchainAllocationId);
          if (blockchainAllocation && blockchainAllocation.status === 0) { // 0 = PENDING
            const walletAddress = serverBlockchain.getWalletAddress();
            const hasSuperAdmin = await serverBlockchain.hasRole(serverBlockchain.SUPER_ADMIN_ROLE, walletAddress);
            if (hasSuperAdmin) {
              console.log('✅ Auto-approving allocation on blockchain...');
              await serverBlockchain.approveBudgetAllocation(blockchainAllocationId);
              console.log('✅ Allocation approved on blockchain');
            }
          }
        } catch (approveError: any) {
          console.warn('⚠️ Could not auto-approve allocation:', approveError.message);
        }

        // Update allocation with blockchain transaction hash, allocation ID, and status
        await supabaseAdmin
          .from('budget_allocations')
          .update({ 
            blockchain_tx_hash: blockchainTxHash,
            blockchain_allocation_id: blockchainAllocationId.toString(), // Store as string for flexibility
            status: 'approved' // Update status to approved after blockchain approval
          })
          .eq('id', allocation.id);

        console.log(`✅ Budget allocation created on blockchain: ${blockchainTxHash}`);
      }
    } catch (blockchainError: any) {
      console.error('⚠️ Blockchain transaction failed (continuing with database record):', blockchainError);
      // Continue without blockchain - database record is still created
      // In production, you might want to handle this differently
    }

    // Log audit trail (only if user_id is provided)
    if (createdBy) {
      try {
        await supabaseAdmin
          .from('audit_logs')
          .insert([
            {
              table_name: 'budget_allocations',
              record_id: allocation.id,
              action: 'CREATE',
              new_values: allocation,
              user_id: createdBy,
              user_type: 'government_official',
              reason: 'Budget allocation created'
            }
          ]);
      } catch (err: any) {
        console.error('Audit log error:', err); // Don't fail if audit log fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Budget allocation created successfully',
      data: {
        ...allocation,
        blockchain_tx_hash: blockchainTxHash,
        blockchain_allocation_id: blockchainAllocationId
      },
      blockchain: {
        transactionHash: blockchainTxHash,
        allocationId: blockchainAllocationId,
        success: !!blockchainTxHash
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Allocation ID is required' },
        { status: 400 }
      );
    }

    // Get current allocation for audit trail
    const { data: currentAllocation } = await supabaseAdmin
      .from('budget_allocations')
      .select('*')
      .eq('id', id)
      .single();

    // Update allocation
    const { data: updatedAllocation, error: updateError } = await supabaseAdmin
      .from('budget_allocations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update budget allocation', details: updateError.message },
        { status: 500 }
      );
    }

    // Log audit trail (only if user_id is provided)
    if (updateData.updated_by) {
      try {
        await supabaseAdmin
          .from('audit_logs')
          .insert([
            {
              table_name: 'budget_allocations',
              record_id: id,
              action: 'UPDATE',
              old_values: currentAllocation,
              new_values: updatedAllocation,
              user_id: updateData.updated_by,
              user_type: 'government_official',
              reason: 'Budget allocation updated'
            }
          ]);
      } catch (err: any) {
        console.error('Audit log error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Budget allocation updated successfully',
      data: updatedAllocation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Allocation ID is required' },
        { status: 400 }
      );
    }

    // Get current allocation for audit trail
    const { data: currentAllocation } = await supabaseAdmin
      .from('budget_allocations')
      .select('*')
      .eq('id', id)
      .single();

    // Soft delete by updating status
    const { data: deletedAllocation, error: deleteError } = await supabaseAdmin
      .from('budget_allocations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (deleteError) {
      console.error('Database error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete budget allocation', details: deleteError.message },
        { status: 500 }
      );
    }

    // Log audit trail (skip if no user - audit logs require user_id)
    // In production, you'd get user_id from auth context
    // For now, we skip audit logging for system actions

    return NextResponse.json({
      success: true,
      message: 'Budget allocation cancelled successfully',
      data: deletedAllocation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

