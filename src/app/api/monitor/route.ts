import { NextRequest, NextResponse } from 'next/server';
import { getWhopSdk } from '@/lib/whop';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import MonitoringManager from '@/services/MonitoringManager';

export async function POST(request: NextRequest) {
  try {
    const sdk = getWhopSdk();
    const verification = await sdk.verifyUserToken(request.headers);
    
    if (!verification.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ 
      userId: verification.userId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    });

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action } = await request.json();
    const manager = MonitoringManager.getInstance();

    if (action === 'force-restart') {
      // Force restart monitoring (bypass cooldown and limits)
      await manager.forceRestart();
      const status = manager.getStatus();

      return NextResponse.json({ 
        success: true, 
        message: 'Message monitoring force restarted',
        status
      });

    } else if (action === 'reset-restart-attempts') {
      // Reset restart attempts counter
      manager.resetRestartAttempts();
      const status = manager.getStatus();

      return NextResponse.json({ 
        success: true, 
        message: 'Restart attempts reset',
        status
      });

    } else if (action === 'clear') {
      await manager.clearMessageTracking();
      return NextResponse.json({ 
        success: true, 
        message: 'Message tracking cleared - will start fresh on next poll' 
      });
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "force-restart", "reset-restart-attempts", or "clear"' }, { status: 400 });
    }

  } catch (error) {
    console.error('Monitor control error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sdk = getWhopSdk();
    const verification = await sdk.verifyUserToken(request.headers);
    
    if (!verification.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ 
      userId: verification.userId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    });

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Return current monitoring status
    const manager = MonitoringManager.getInstance();
    const status = manager.getStatus();

    return NextResponse.json({ 
      success: true, 
      status 
    });

  } catch (error) {
    console.error('Get monitor status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
