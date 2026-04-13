import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabaseAdmin
      .from('ministries')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: ministries, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ministries', details: error.message },
        { status: 500 }
      );
    }

    // Get total count
    const { count } = await supabaseAdmin
      .from('ministries')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: ministries,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('API error:', error);
    
    // Check if it's a Supabase connection error
    if (error.message?.includes('fetch failed') || error.message?.includes('TypeError')) {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: 'Unable to connect to Supabase. Please check your environment variables and network connection.',
          hint: 'Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set correctly in .env.local'
        },
        { status: 500 }
      );
    }
    
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      code,
      description,
      minister_name,
      minister_email,
      budget_code,
      contact_info,
      status = 'active'
    } = body;

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Create ministry
    const { data: ministry, error: dbError } = await supabaseAdmin
      .from('ministries')
      .insert([
        {
          name,
          code,
          description,
          minister_name,
          minister_email,
          budget_code,
          contact_info,
          status
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create ministry', details: dbError.message },
        { status: 500 }
      );
    }

    // Log audit trail (skip if no user - audit logs require user_id)
    // In production, you'd get user_id from auth context
    // For now, we skip audit logging for system actions

    return NextResponse.json({
      success: true,
      message: 'Ministry created successfully',
      data: ministry,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('API error:', error);
    
    // Check if it's a Supabase connection error
    if (error.message?.includes('fetch failed') || error.message?.includes('TypeError')) {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: 'Unable to connect to Supabase. Please check your environment variables and network connection.',
          hint: 'Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set correctly in .env.local'
        },
        { status: 500 }
      );
    }
    
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



