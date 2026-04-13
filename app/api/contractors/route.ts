import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ethers } from 'ethers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('verification_status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabaseAdmin
      .from('contractors')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('verification_status', status);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: contractors, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contractors', details: error.message },
        { status: 500 }
      );
    }

    // Get total count
    const { count } = await supabaseAdmin
      .from('contractors')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: contractors,
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
      name,
      registration_number,
      email,
      phone,
      address,
      contractor_type,
      specializations,
      contact_person_name,
      contact_person_email,
      contact_person_phone,
      verification_status = 'pending',
      blockchain_address,
      notes
    } = body;

    // Validate required fields
    if (!name || !registration_number || !email) {
      return NextResponse.json(
        { error: 'Name, registration number, and email are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabaseAdmin
      .from('contractors')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Contractor with this email already exists' },
        { status: 400 }
      );
    }

    // Generate wallet address if not provided
    let finalBlockchainAddress = blockchain_address;
    if (!finalBlockchainAddress) {
      // Generate a new random wallet for the contractor
      const randomWallet = ethers.Wallet.createRandom();
      finalBlockchainAddress = randomWallet.address;
      console.log(`✅ Generated wallet address for contractor: ${finalBlockchainAddress}`);
    }

    // Create contractor
    const { data: contractor, error: dbError } = await supabaseAdmin
      .from('contractors')
      .insert([
        {
          name,
          registration_number,
          email,
          phone,
          address,
          contractor_type,
          specializations,
          contact_person_name,
          contact_person_email,
          contact_person_phone,
          verification_status,
          blockchain_address: finalBlockchainAddress,
          notes
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create contractor', details: dbError.message },
        { status: 500 }
      );
    }

    // Note: Contractors don't need a specific role on the blockchain
    // They interact with the contract using their wallet address
    // The smart contract verifies they are the contractor for a disbursement
    // by checking: disbursement.contractorAddress == msg.sender

    // Log audit trail (skip if no user - audit logs require user_id)
    // In production, you'd get user_id from auth context
    // For now, we skip audit logging for system actions

    return NextResponse.json({
      success: true,
      message: 'Contractor created successfully',
      data: contractor,
      blockchain: {
        address: finalBlockchainAddress,
        note: 'Wallet address automatically generated. Contractor can use this address to interact with blockchain.'
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
        { error: 'Contractor ID is required' },
        { status: 400 }
      );
    }

    // If updating and no blockchain_address provided, generate one
    if (!updateData.blockchain_address) {
      const { data: existingContractor } = await supabaseAdmin
        .from('contractors')
        .select('blockchain_address')
        .eq('id', id)
        .single();

      if (!existingContractor?.blockchain_address) {
        const randomWallet = ethers.Wallet.createRandom();
        updateData.blockchain_address = randomWallet.address;
        console.log(`✅ Generated wallet address for contractor: ${updateData.blockchain_address}`);
      }
    }

    // Update contractor
    const { data: updatedContractor, error: updateError } = await supabaseAdmin
      .from('contractors')
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
        { error: 'Failed to update contractor', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contractor updated successfully',
      data: updatedContractor,
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
