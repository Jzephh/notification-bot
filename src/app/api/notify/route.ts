import { NextRequest, NextResponse } from 'next/server';
import { getWhopSdk } from '@/lib/whop';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import Role from '@/models/Role';
import Notification from '@/models/Notification';

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

    const { roleName, message } = await request.json();

    if (!roleName || !message) {
      return NextResponse.json({ error: 'Role name and message are required' }, { status: 400 });
    }

    // Find the role
    const role = await Role.findOne({ 
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      name: roleName.toLowerCase().trim()
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Get all users who have this role assigned
    const users = await User.find({ 
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      roles: roleName.toLowerCase().trim()
    });

    // Create notification record
    const notification = new Notification({
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!,
      roleName: roleName.toLowerCase().trim(),
      message,
      sentBy: verification.userId,
      sentTo: users.map(u => u.userId)
    });

    await notification.save();

    return NextResponse.json({ 
      success: true,
      notification: {
        id: notification._id,
        roleName: notification.roleName,
        message: notification.message,
        sentTo: notification.sentTo,
        subscriberCount: users.length,
        createdAt: notification.createdAt
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
