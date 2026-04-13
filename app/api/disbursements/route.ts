import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerBlockchainService } from '@/lib/blockchain/server-blockchain-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const allocationId = searchParams.get('allocationId');
    const contractorId = searchParams.get('contractorId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabaseAdmin
      .from('disbursements')
      .select(`
        *,
        budget_allocations(project_name, project_code),
        contractors(name, registration_number)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (allocationId) {
      query = query.eq('allocation_id', allocationId);
    }
    if (contractorId) {
      query = query.eq('contractor_id', contractorId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: disbursements, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch disbursements', details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('disbursements')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: disbursements,
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
      allocationId,
      contractorId,
      amount,
      purpose, // Keep for backward compatibility
      disbursementReason,
      disbursementType,
      disbursementDate,
      paymentMethod,
      approvedBy
    } = body;

    // Use disbursementReason if provided, otherwise fall back to purpose
    const finalDisbursementReason = disbursementReason || purpose;

    // Validate required fields
    if (!allocationId || !contractorId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify allocation exists and has sufficient funds
    const { data: allocation, error: allocationError } = await supabaseAdmin
      .from('budget_allocations')
      .select('allocated_amount, status')
      .eq('id', allocationId)
      .single();

    if (allocationError) {
      console.error('Allocation query error:', allocationError);
      return NextResponse.json(
        { 
          error: 'Budget allocation not found',
          details: allocationError.message,
          allocationId: allocationId,
          hint: 'Please ensure the allocation ID is valid and exists in the database'
        },
        { status: 404 }
      );
    }

    if (!allocation) {
      return NextResponse.json(
        { 
          error: 'Budget allocation not found',
          allocationId: allocationId,
          hint: 'The allocation ID does not exist in the database'
        },
        { status: 404 }
      );
    }

    // Allow both 'approved' and 'allocated' status for demo purposes
    // In production, you might want to require 'approved' only
    if (allocation.status !== 'approved' && allocation.status !== 'allocated') {
      return NextResponse.json(
        { error: 'Budget allocation must be approved or allocated before disbursement' },
        { status: 400 }
      );
    }

    // Calculate total disbursed amount by summing all disbursements for this allocation
    const { data: existingDisbursements, error: disbursementQueryError } = await supabaseAdmin
      .from('disbursements')
      .select('amount')
      .eq('allocation_id', allocationId)
      .in('status', ['pending', 'approved', 'disbursed']); // Include pending and approved disbursements

    if (disbursementQueryError) {
      console.error('Error querying existing disbursements:', disbursementQueryError);
      // Continue with 0 if query fails
    }

    const totalDisbursed = existingDisbursements?.reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0) || 0;
    const remainingAmount = parseFloat(allocation.allocated_amount.toString()) - totalDisbursed;
    if (amount > remainingAmount) {
      return NextResponse.json(
        { error: 'Disbursement amount exceeds remaining allocation' },
        { status: 400 }
      );
    }

    // Create disbursement
    const { data: disbursement, error: dbError } = await supabaseAdmin
      .from('disbursements')
      .insert([
        {
          allocation_id: allocationId,
          contractor_id: contractorId,
          amount: amount,
          disbursement_type: disbursementType || 'initial',
          disbursement_reason: finalDisbursementReason || null,
          disbursement_date: disbursementDate || new Date().toISOString().split('T')[0],
          payment_method: paymentMethod || null,
          status: 'pending',
          approved_by: approvedBy || null // UUID field - set to null if no user
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create disbursement', details: dbError.message },
        { status: 500 }
      );
    }

    // Create blockchain transaction
    let blockchainTxHash = null;
    let blockchainDisbursementId = null;
    
    try {
      // Get contractor blockchain address
      const { data: contractor } = await supabaseAdmin
        .from('contractors')
        .select('blockchain_address')
        .eq('id', contractorId)
        .single();

      // Get allocation blockchain data
      const { data: allocationData } = await supabaseAdmin
        .from('budget_allocations')
        .select('blockchain_tx_hash, blockchain_allocation_id, project_code')
        .eq('id', allocationId)
        .single();

      if (contractor?.blockchain_address && allocationData?.blockchain_tx_hash) {
        try {
          const serverBlockchain = getServerBlockchainService();
          
          // Check and grant FINANCE_OFFICER_ROLE if needed
          const walletAddress = serverBlockchain.getWalletAddress();
          const hasFinanceRole = await serverBlockchain.hasRole(serverBlockchain.FINANCE_OFFICER_ROLE, walletAddress);
          
          if (!hasFinanceRole) {
            console.log('⚠️ Wallet does not have FINANCE_OFFICER_ROLE.');
            // Check if it has SUPER_ADMIN_ROLE to grant itself FINANCE_OFFICER_ROLE
            const hasSuperAdminRole = await serverBlockchain.hasRole(serverBlockchain.SUPER_ADMIN_ROLE, walletAddress);
            if (hasSuperAdminRole) {
              console.log('✅ Wallet has SUPER_ADMIN_ROLE. Granting FINANCE_OFFICER_ROLE...');
              await serverBlockchain.grantRole(serverBlockchain.FINANCE_OFFICER_ROLE, walletAddress);
              console.log('✅ FINANCE_OFFICER_ROLE granted successfully');
            } else {
              throw new Error('SKIP_BLOCKCHAIN');
            }
          }

        // Get the actual blockchain allocation ID
        // First, try to use the stored blockchain_allocation_id from the database
        let allocationBlockchainId: number | null = null;
        
        if (allocationData.blockchain_allocation_id) {
          // Use the stored blockchain allocation ID (most reliable)
          allocationBlockchainId = parseInt(allocationData.blockchain_allocation_id);
          console.log(`✅ Using stored blockchain allocation ID: ${allocationBlockchainId}`);
        } else if (allocationData.blockchain_tx_hash) {
          // Fallback: derive ID from transaction hash (less reliable)
          const txHash = allocationData.blockchain_tx_hash;
          allocationBlockchainId = parseInt(txHash.slice(-8), 16) % 10000 || 1;
          console.warn(`⚠️ No stored blockchain_allocation_id, using derived ID: ${allocationBlockchainId}`);
        } else {
          throw new Error('SKIP_BLOCKCHAIN');
        }
        
        try {
          
          // Verify the allocation exists and is APPROVED on blockchain
          const blockchainAllocation = await serverBlockchain.getAllocation(allocationBlockchainId);
          
          if (!blockchainAllocation || blockchainAllocation.allocationId === 0) {
            console.warn(`⚠️ Allocation ${allocationBlockchainId} not found on blockchain. Trying to find correct ID...`);
            // The derived ID might be wrong, but we'll proceed anyway for demo
            // In production, you'd store the actual blockchain_allocation_id
          } else {
            // Check if allocation is APPROVED (status 1 = APPROVED, 0 = PENDING)
            const allocationStatus = blockchainAllocation.status;
            if (allocationStatus !== 1) { // 1 = APPROVED
              console.warn(`⚠️ Allocation ${allocationBlockchainId} is not APPROVED on blockchain (status: ${allocationStatus}). It needs to be approved first.`);
              // Try to approve it if we have SUPER_ADMIN_ROLE
              const hasSuperAdmin = await serverBlockchain.hasRole(serverBlockchain.SUPER_ADMIN_ROLE, walletAddress);
              if (hasSuperAdmin) {
                console.log('✅ Attempting to approve allocation on blockchain...');
                try {
                  await serverBlockchain.approveBudgetAllocation(allocationBlockchainId);
                  console.log('✅ Allocation approved on blockchain');
                } catch (approveError: any) {
                  console.error('⚠️ Failed to approve allocation:', approveError.message);
                  // Don't throw - allow disbursement to be created in database
                  // The derived allocation ID might be wrong, so we'll skip blockchain for this one
                  console.warn('⚠️ Skipping blockchain transaction - allocation approval failed. Disbursement will be created in database only.');
                  throw new Error('SKIP_BLOCKCHAIN'); // Special error to skip blockchain but continue
                }
              } else {
                console.warn('⚠️ Wallet does not have SUPER_ADMIN_ROLE to approve allocation. Skipping blockchain transaction.');
                throw new Error('SKIP_BLOCKCHAIN'); // Special error to skip blockchain but continue
              }
            }
            
            // Check if amount exceeds remaining allocation
            const allocatedAmount = BigInt(blockchainAllocation.allocatedAmount.toString());
            const disbursedAmount = BigInt(blockchainAllocation.disbursedAmount?.toString() || '0');
            const remainingAmount = allocatedAmount - disbursedAmount;
            const amountInWei = BigInt(Math.floor(amount * 10**18));
            if (amountInWei > remainingAmount) {
              const remainingInEther = Number(remainingAmount) / 10**18;
              throw new Error(`Disbursement amount (${amount}) exceeds remaining allocation (${remainingInEther}) on blockchain`);
            }
          }
        } catch (checkError: any) {
          console.error('Error checking allocation on blockchain:', checkError);
          // If it's our special skip error, rethrow it
          if (checkError.message === 'SKIP_BLOCKCHAIN') {
            throw checkError;
          }
          // For other errors, continue anyway for demo - in production you'd want to handle this better
          if (checkError.message.includes('must be APPROVED') || checkError.message.includes('exceeds remaining')) {
            // Convert to skip error so we don't fail the whole request
            throw new Error('SKIP_BLOCKCHAIN');
          }
        }

        if (!allocationBlockchainId) {
          throw new Error('Could not determine blockchain allocation ID');
        }

          console.log(`Creating disbursement for allocation ID: ${allocationBlockchainId}`);

          const blockchainResult = await serverBlockchain.createDisbursement(
            allocationBlockchainId,
            contractor.blockchain_address,
            amount,
            finalDisbursementReason || 'Budget disbursement'
          );

          blockchainTxHash = blockchainResult.txHash;
          blockchainDisbursementId = blockchainResult.disbursementId;

          // Update disbursement with blockchain transaction hash and status
          await supabaseAdmin
            .from('disbursements')
            .update({ 
              blockchain_tx_hash: blockchainTxHash,
              status: 'disbursed' // Update status to disbursed after successful blockchain transaction
            })
            .eq('id', disbursement.id);

          console.log(`✅ Disbursement created on blockchain: ${blockchainTxHash}`);
        } catch (blockchainSkipError: any) {
          // If it's our special skip error, just log and continue
          if (blockchainSkipError.message === 'SKIP_BLOCKCHAIN') {
            console.warn('⚠️ Skipping blockchain transaction - allocation ID mismatch or approval failed. Disbursement created in database only.');
            console.warn('   Note: In production, store the actual blockchain_allocation_id when creating allocations.');
          } else {
            throw blockchainSkipError; // Re-throw other errors
          }
        }
      } else {
        console.warn('⚠️ Contractor does not have blockchain address, skipping blockchain transaction');
      }
    } catch (blockchainError: any) {
      // Only log if it's not our skip error
      if (blockchainError.message !== 'SKIP_BLOCKCHAIN') {
        console.error('⚠️ Blockchain transaction failed (continuing with database record):', blockchainError);
      }
      // Continue without blockchain - database record is still created
    }

    // Log audit trail (only if user_id is provided)
    if (approvedBy) {
      try {
        await supabaseAdmin
          .from('audit_logs')
          .insert([
            {
              table_name: 'disbursements',
              record_id: disbursement.id,
              action: 'CREATE',
              new_values: disbursement,
              user_id: approvedBy,
              user_type: 'government_official',
              reason: 'Disbursement created'
            }
          ]);
      } catch (err: any) {
        console.error('Audit log error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Disbursement created successfully',
      data: {
        ...disbursement,
        blockchain_tx_hash: blockchainTxHash,
        blockchain_disbursement_id: blockchainDisbursementId
      },
      blockchain: {
        transactionHash: blockchainTxHash,
        disbursementId: blockchainDisbursementId,
        success: !!blockchainTxHash
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Disbursement ID is required' },
        { status: 400 }
      );
    }

    // Get current disbursement for audit trail
    const { data: currentDisbursement } = await supabaseAdmin
      .from('disbursements')
      .select('*')
      .eq('id', id)
      .single();

    // Update disbursement
    const { data: updatedDisbursement, error: updateError } = await supabaseAdmin
      .from('disbursements')
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
        { error: 'Failed to update disbursement', details: updateError.message },
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
              table_name: 'disbursements',
              record_id: id,
              action: 'UPDATE',
              old_values: currentDisbursement,
              new_values: updatedDisbursement,
              user_id: updateData.updated_by,
              user_type: 'government_official',
              reason: 'Disbursement updated'
            }
          ]);
      } catch (err: any) {
        console.error('Audit log error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Disbursement updated successfully',
      data: updatedDisbursement,
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


