import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Test Supabase connection by fetching ministries
    const { data: ministries, error } = await supabase
      .from('ministries')
      .select('*')
      .limit(5)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to connect to database', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      data: ministries,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Create a new ministry (for testing)
    const { data, error } = await supabase
      .from('ministries')
      .insert([
        {
          name: body.name || 'Test Ministry',
          code: body.code || 'TEST',
          description: body.description || 'Test ministry for development',
          status: 'active'
        }
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create ministry', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Ministry created successfully',
      data: data[0],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

