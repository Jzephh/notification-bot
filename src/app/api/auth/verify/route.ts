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
    
    // Try to find existing user
    let user = await User.findOne({ 
      userId: verification.userId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    });

    // If user doesn't exist, create them
    if (!user) {
      try {
        // Get user info from Whop
        const whopUser = await sdk.users.getUser({ userId: verification.userId });
        
        user = new User({
          companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!,
          userId: verification.userId,
          username: whopUser.username || 'unknown',
          name: whopUser.name || 'Unknown User',
          avatarUrl: whopUser.profilePicture?.sourceUrl,
          roles: [],
          isAdmin: false
        });
        
        await user.save();
      } catch {
        // Create user with minimal data if Whop API fails
        user = new User({
          companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!,
          userId: verification.userId,
          username: 'user_' + verification.userId.slice(-6),
          name: 'User ' + verification.userId.slice(-6),
          roles: [],
          isAdmin: false
        });
        
        await user.save();
      }
    }

    return NextResponse.json({ 
      user: {
        id: user.userId,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
        roles: user.roles,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
