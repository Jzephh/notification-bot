import { NextRequest, NextResponse } from 'next/server';
import { getWhopSdk } from '@/lib/whop';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

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

    // Get all users
    const users = await User.find({ 
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    }).sort({ createdAt: -1 });

    return NextResponse.json({ 
      users: users.map(user => ({
        id: user.userId,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        roles: user.roles,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
