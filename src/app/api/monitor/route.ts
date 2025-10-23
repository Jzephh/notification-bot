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

    if (action === 'start') {
      const status = manager.getStatus();
      
      if (status.isRunning) {
        return NextResponse.json({ 
          success: true, 
          message: 'Message monitoring is already running',
          status
        });
      }

      await manager.startMonitoring(process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!);
      const newStatus = manager.getStatus();

      return NextResponse.json({ 
        success: true, 
        message: 'Message monitoring started successfully',
        status: newStatus
      });

    } else if (action === 'stop') {
      const status = manager.getStatus();
      
      if (!status.isRunning) {
        return NextResponse.json({ 
          success: true, 
          message: 'Message monitoring is not running',
          status
        });
      }

      manager.stopMonitoring();
      const newStatus = manager.getStatus();

      return NextResponse.json({ 
        success: true, 
        message: 'Message monitoring stopped successfully',
        status: newStatus
      });

    } else if (action === 'clear') {
      await manager.clearMessageTracking();
      return NextResponse.json({ 
        success: true, 
        message: 'Message tracking cleared - will start fresh on next poll' 
      });
    } else if (action === 'toggle-auto-start') {
      const { enabled } = await request.json();
      manager.setAutoStartEnabled(enabled);
      const status = manager.getStatus();
      
      return NextResponse.json({ 
        success: true, 
        message: `Auto-start ${enabled ? 'enabled' : 'disabled'}`,
        status
      });
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "start", "stop", "clear", or "toggle-auto-start"' }, { status: 400 });
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
