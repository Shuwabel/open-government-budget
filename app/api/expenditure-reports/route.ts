import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const disbursementId = searchParams.get('disbursementId');
    const contractorId = searchParams.get('contractorId');
    const isVerified = searchParams.get('isVerified');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabaseAdmin
      .from('expenditure_reports')
      .select(`
        *,
        disbursements(amount, disbursement_reason),
        contractors(name, registration_number)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (disbursementId) {
      query = query.eq('disbursement_id', disbursementId);
    }
    if (contractorId) {
      query = query.eq('contractor_id', contractorId);
    }
    if (isVerified !== null) {
      query = query.eq('is_verified', isVerified === 'true');
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: reports, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch expenditure reports', details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('expenditure_reports')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: reports,
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
      disbursementId,
      contractorId,
      totalAmount,
      reportHash,
      expenditureItems,
      submittedBy
    } = body;

    // Validate required fields
    if (!disbursementId || !contractorId || !totalAmount || !reportHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify disbursement exists and is approved
    const { data: disbursement, error: disbursementError } = await supabaseAdmin
      .from('disbursements')
      .select('amount, status')
      .eq('id', disbursementId)
      .single();

    if (disbursementError || !disbursement) {
      return NextResponse.json(
        { error: 'Disbursement not found' },
        { status: 404 }
      );
    }

    if (disbursement.status !== 'disbursed') {
      return NextResponse.json(
        { error: 'Disbursement is not completed' },
        { status: 400 }
      );
    }

    // Create expenditure report
    const { data: report, error: dbError } = await supabaseAdmin
      .from('expenditure_reports')
      .insert([
        {
          disbursement_id: disbursementId,
          contractor_id: contractorId,
          total_amount: totalAmount,
          report_hash: reportHash,
          is_verified: false,
          submitted_by: submittedBy
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create expenditure report', details: dbError.message },
        { status: 500 }
      );
    }

    // Create expenditure items if provided
    if (expenditureItems && expenditureItems.length > 0) {
      const items = expenditureItems.map((item: any) => ({
        report_id: report.id,
        description: item.description,
        amount: item.amount,
        category: item.category,
        receipt_url: item.receipt_url
      }));

      const { error: itemsError } = await supabaseAdmin
        .from('expenditure_items')
        .insert(items);

      if (itemsError) {
        console.error('Failed to create expenditure items:', itemsError);
        // Don't fail the entire request, just log the error
      }
    }

    // Log audit trail
    await supabaseAdmin
      .from('audit_logs')
      .insert([
        {
          table_name: 'expenditure_reports',
          record_id: report.id,
          action: 'CREATE',
          new_values: report,
          user_id: submittedBy,
          user_type: 'contractor',
          reason: 'Expenditure report submitted'
        }
      ]);

    return NextResponse.json({
      success: true,
      message: 'Expenditure report submitted successfully',
      data: report,
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
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Get current report for audit trail
    const { data: currentReport } = await supabaseAdmin
      .from('expenditure_reports')
      .select('*')
      .eq('id', id)
      .single();

    // Update report
    const { data: updatedReport, error: updateError } = await supabaseAdmin
      .from('expenditure_reports')
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
        { error: 'Failed to update expenditure report', details: updateError.message },
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
              table_name: 'expenditure_reports',
              record_id: id,
              action: 'UPDATE',
              old_values: currentReport,
              new_values: updatedReport,
              user_id: updateData.updated_by,
              user_type: 'contractor',
              reason: 'Expenditure report updated'
            }
          ]);
      } catch (err: any) {
        console.error('Audit log error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Expenditure report updated successfully',
      data: updatedReport,
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

