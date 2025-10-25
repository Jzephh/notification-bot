import { NextResponse } from 'next/server';
import MonitoringManager from '@/services/MonitoringManager';

/**
 * Auto-start endpoint - called when server starts
 * This ensures monitoring starts automatically
 */
export async function POST() {
  try {
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
    
    if (!companyId) {
      console.error('❌ NEXT_PUBLIC_WHOP_COMPANY_ID not configured');
      return NextResponse.json({ error: 'Company ID not configured' }, { status: 500 });
    }

    const manager = MonitoringManager.getInstance();
    await manager.initialize(companyId);

    const status = manager.getStatus();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Auto-start initialization completed',
      status 
    });
  } catch (error) {
    console.error('Auto-start initialization error:', error);
    return NextResponse.json({ error: 'Auto-start failed' }, { status: 500 });
  }
}

/**
 * Get auto-start status
 */
export async function GET() {
  try {
    const manager = MonitoringManager.getInstance();
    const status = manager.getStatus();
    
    return NextResponse.json({ 
      success: true, 
      status 
    });
  } catch (error) {
    console.error('Get auto-start status error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
