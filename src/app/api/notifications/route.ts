import { NextRequest, NextResponse } from 'next/server';
import { getWhopSdk } from '@/lib/whop';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import Notification from '@/models/Notification';

export async function GET(request: NextRequest) {
  try {
    const sdk = getWhopSdk();
    const verification = await sdk.verifyUserToken(request.headers);
    
    if (!verification.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Get user and their assigned roles
    const user = await User.findOne({ 
      userId: verification.userId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get notifications where this user was mentioned (sentTo includes their userId)
    const notifications = await Notification.find({ 
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      sentTo: verification.userId
    }).sort({ createdAt: -1 }).limit(50);

    return NextResponse.json({ 
      notifications: notifications.map(notif => ({
        id: notif._id,
        roleName: notif.roleName,
        message: notif.message,
        sentBy: notif.sentBy,
        createdAt: notif.createdAt
      }))
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
