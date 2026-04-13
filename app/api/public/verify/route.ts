import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { blockchainService } from '@/lib/blockchain/blockchain-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionHash, projectCode } = body;

    if (!transactionHash && !projectCode) {
      return NextResponse.json(
        { error: 'Either transactionHash or projectCode is required' },
        { status: 400 }
      );
    }

    let verificationData = null;

    if (transactionHash) {
      // Verify by blockchain transaction hash
      try {
        // Get disbursement by blockchain transaction hash
        const { data: disbursement, error: disbursementError } = await supabaseAdmin
          .from('disbursements')
          .select(`
            *,
            budget_allocations!inner(
              *,
              ministries(*),
              contractors(*)
            )
          `)
          .eq('blockchain_tx_hash', transactionHash)
          .single();

        if (disbursementError || !disbursement) {
          return NextResponse.json({
            success: false,
            status: 'not_found',
            message: 'Transaction not found in database'
          });
        }

        // Verify on blockchain
        const blockchainVerification = await blockchainService.getDisbursement(
          disbursement.blockchain_tx_hash
        );

        if (!blockchainVerification) {
          return NextResponse.json({
            success: false,
            status: 'blockchain_error',
            message: 'Could not verify transaction on blockchain'
          });
        }

        verificationData = {
          projectName: disbursement.budget_allocations.project_name,
          ministry: disbursement.budget_allocations.ministries.name,
          allocatedAmount: disbursement.budget_allocations.allocated_amount,
          disbursedAmount: disbursement.disbursed_amount,
          contractor: disbursement.budget_allocations.contractors.company_name,
          disbursementDate: disbursement.disbursement_date,
          transactionHash: disbursement.blockchain_tx_hash,
          blockchainNetwork: 'Polygon',
          expenditureDetails: disbursement.description
        };
      } catch (error) {
        console.error('Blockchain verification error:', error);
        return NextResponse.json({
          success: false,
          status: 'verification_error',
          message: 'Error verifying transaction on blockchain'
        });
      }
    } else if (projectCode) {
      // Verify by project code
      try {
        const { data: allocation, error: allocationError } = await supabaseAdmin
          .from('budget_allocations')
          .select(`
            *,
            ministries(*),
            disbursements(*)
          `)
          .eq('project_code', projectCode)
          .single();

        if (allocationError || !allocation) {
          return NextResponse.json({
            success: false,
            status: 'not_found',
            message: 'Project not found'
          });
        }

        const disbursements = allocation.disbursements || [];
        if (disbursements.length === 0) {
          return NextResponse.json({
            success: false,
            status: 'not_disbursed',
            message: 'Project has not been disbursed yet'
          });
        }

        // Get all contractors for disbursements
        const contractorIds = disbursements.map((d: any) => d.contractor_id).filter(Boolean);
        const { data: contractorsData } = await supabaseAdmin
          .from('contractors')
          .select('id, name')
          .in('id', contractorIds);

        const contractorsMap = new Map(contractorsData?.map((c: any) => [c.id, c.name]) || []);

        // Format all disbursements
        const formattedDisbursements = disbursements.map((d: any) => ({
          id: d.id,
          amount: d.amount,
          contractor: contractorsMap.get(d.contractor_id) || 'Unknown',
          disbursementDate: d.disbursement_date,
          transactionHash: d.blockchain_tx_hash || null,
          status: d.status,
          reason: d.disbursement_reason
        }));

        const totalDisbursed = disbursements.reduce((sum: number, d: any) => sum + parseFloat(d.amount.toString()), 0);

        verificationData = {
          projectName: allocation.project_name,
          projectCode: allocation.project_code,
          ministry: allocation.ministries?.name || 'Unknown',
          allocatedAmount: allocation.allocated_amount,
          totalDisbursed: totalDisbursed,
          disbursements: formattedDisbursements,
          disbursementCount: disbursements.length,
          blockchainNetwork: 'Polygon',
          blockchainTxHash: allocation.blockchain_tx_hash || null
        };
      } catch (error) {
        console.error('Project verification error:', error);
        return NextResponse.json({
          success: false,
          status: 'verification_error',
          message: 'Error verifying project'
        });
      }
    }

    if (!verificationData) {
      return NextResponse.json({
        success: false,
        status: 'invalid',
        message: 'Invalid verification request'
      });
    }

    return NextResponse.json({
      success: true,
      status: 'verified',
      data: verificationData,
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionHash = searchParams.get('transactionHash');
    const projectCode = searchParams.get('projectCode');

    if (!transactionHash && !projectCode) {
      return NextResponse.json(
        { error: 'Either transactionHash or projectCode parameter is required' },
        { status: 400 }
      );
    }

    // Use the same logic as POST but return different response format
    const postResponse = await POST(request);
    const postData = await postResponse.json();

    if (!postData.success) {
      return NextResponse.json(postData, { status: postResponse.status });
    }

    return NextResponse.json({
      verified: true,
      transaction: postData.data,
      verifiedAt: postData.timestamp
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}