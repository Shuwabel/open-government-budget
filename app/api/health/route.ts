import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'
    };

    // Test Supabase connection
    let connectionTest = {
      success: false,
      error: null as string | null,
      data: null as any
    };

    try {
      const { data, error } = await supabaseAdmin
        .from('ministries')
        .select('count')
        .limit(1);

      if (error) {
        connectionTest.error = error.message;
      } else {
        connectionTest.success = true;
        connectionTest.data = data;
      }
    } catch (err: any) {
      connectionTest.error = err.message || 'Unknown error';
    }

    return NextResponse.json({
      status: connectionTest.success ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      connection: connectionTest,
      recommendations: !connectionTest.success ? [
        '1. Check if your Supabase project is paused (free tier pauses after inactivity)',
        '2. Restart your dev server: Stop it (Ctrl+C) and run `npm run dev` again',
        '3. Verify your Supabase URL and keys in .env.local',
        '4. Check your internet connection',
        '5. Visit your Supabase dashboard to unpause the project if needed'
      ] : []
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

