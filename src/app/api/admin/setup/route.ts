import { NextRequest, NextResponse } from 'next/server';
import { getWhopSdk } from '@/lib/whop';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const sdk = getWhopSdk();
    const verification = await sdk.verifyUserToken(request.headers);
    
    if (!verification.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { adminKey } = await request.json();

    // Simple admin key check - in production, use a more secure method
    if (adminKey !== 'admin-setup-key-2024') {
      return NextResponse.json({ error: 'Invalid admin key' }, { status: 403 });
    }

    // Get user info from Whop
    const whopUser = await sdk.users.getUser({ userId: verification.userId });
    
    // Create or update user as admin
    let user = await User.findOne({ 
      userId: verification.userId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    });

    if (user) {
      user.isAdmin = true;
      await user.save();
    } else {
      user = new User({
        companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!,
        userId: verification.userId,
        username: whopUser.username || 'unknown',
        name: whopUser.name || 'Unknown User',
        avatarUrl: whopUser.profilePicture?.sourceUrl,
        subscribedRoles: [],
        isAdmin: true
      });
      await user.save();
    }

    return NextResponse.json({ 
      success: true,
      message: 'Admin privileges granted',
      user: {
        id: user.userId,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
