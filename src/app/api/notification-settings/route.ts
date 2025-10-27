import { NextRequest, NextResponse } from 'next/server';
import { getWhopSdk } from '@/lib/whop';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import NotificationSettings from '@/models/NotificationSettings';

// GET: Get current notification settings
export async function GET(request: NextRequest) {
  try {
    const sdk = getWhopSdk();
    const verification = await sdk.verifyUserToken(request.headers);
    
    if (!verification.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Check if user is admin
    const adminUser = await User.findOne({ 
      userId: verification.userId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    });

    if (!adminUser || !adminUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const settings = await NotificationSettings.findOne({ 
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Update notification settings
export async function POST(request: NextRequest) {
  try {
    const sdk = getWhopSdk();
    const verification = await sdk.verifyUserToken(request.headers);
    
    if (!verification.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Check if user is admin
    const adminUser = await User.findOne({ 
      userId: verification.userId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    });

    if (!adminUser || !adminUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { experienceId, experienceName } = await request.json();

    if (!experienceId || !experienceName) {
      return NextResponse.json({ error: 'Experience ID and name are required' }, { status: 400 });
    }

    // Update or create settings
    const settings = await NotificationSettings.findOneAndUpdate(
      { companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID },
      { 
        companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
        experienceId,
        experienceName
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ settings, message: 'Notification settings updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


