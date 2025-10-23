import { NextRequest, NextResponse } from 'next/server';
import { getWhopSdk } from '@/lib/whop';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

// Global message monitor instance
let messageMonitor: { 
  start: () => Promise<void>; 
  stop: () => void; 
  getStatus: () => { isRunning: boolean; chatExperiences: Array<{ id: string; name: string; appName: string }>; experienceCount: number };
  clearMessageTracking: () => Promise<void>;
} | null = null;

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

    if (action === 'start') {
      if (messageMonitor && messageMonitor.getStatus().isRunning) {
        return NextResponse.json({ 
          success: true, 
          message: 'Message monitoring is already running',
          status: messageMonitor.getStatus()
        });
      }

      // Import MessageMonitorService dynamically to avoid circular dependencies
      const { MessageMonitorService } = await import('@/services/MessageMonitorService');
      
      messageMonitor = new MessageMonitorService(process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!);
      await messageMonitor.start();

      return NextResponse.json({ 
        success: true, 
        message: 'Message monitoring started successfully',
        status: messageMonitor.getStatus()
      });

    } else if (action === 'stop') {
      if (!messageMonitor || !messageMonitor.getStatus().isRunning) {
        return NextResponse.json({ 
          success: true, 
          message: 'Message monitoring is not running',
          status: { isRunning: false, chatExperiences: [], experienceCount: 0 }
        });
      }

      messageMonitor.stop();
      messageMonitor = null;

      return NextResponse.json({ 
        success: true, 
        message: 'Message monitoring stopped successfully',
        status: { isRunning: false, chatExperiences: [], experienceCount: 0 }
      });

    } else if (action === 'clear') {
      if (messageMonitor) {
        await messageMonitor.clearMessageTracking();
      }
      return NextResponse.json({ 
        success: true, 
        message: 'Message tracking cleared - will start fresh on next poll' 
      });
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "start", "stop", or "clear"' }, { status: 400 });
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
    const status = messageMonitor ? messageMonitor.getStatus() : { 
      isRunning: false, 
      chatExperiences: [], 
      experienceCount: 0 
    };

    return NextResponse.json({ 
      success: true, 
      status 
    });

  } catch (error) {
    console.error('Get monitor status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
