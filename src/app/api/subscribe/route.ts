import { NextRequest, NextResponse } from 'next/server';
import { getWhopSdk } from '@/lib/whop';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import Role from '@/models/Role';

export async function POST(request: NextRequest) {
  try {
    const sdk = getWhopSdk();
    const verification = await sdk.verifyUserToken(request.headers);
    
    if (!verification.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { roleName } = await request.json();

    if (!roleName) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    // Get or create user
    let user = await User.findOne({ 
      userId: verification.userId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    });

    if (!user) {
      const whopUser = await sdk.users.getUser({ userId: verification.userId });
      user = new User({
        companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!,
        userId: verification.userId,
        username: whopUser.username || 'unknown',
        name: whopUser.name || 'Unknown User',
        avatarUrl: whopUser.profilePicture?.sourceUrl,
        subscribedRoles: [],
        isAdmin: false
      });
    }

    // Check if role exists
    const role = await Role.findOne({ 
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      name: roleName.toLowerCase().trim()
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Toggle subscription
    const isSubscribed = user.subscribedRoles.includes(roleName.toLowerCase().trim());
    
    if (isSubscribed) {
      // Unsubscribe
      user.subscribedRoles = user.subscribedRoles.filter((r: string) => r !== roleName.toLowerCase().trim());
      role.subscribers = role.subscribers.filter((id: string) => id !== verification.userId);
    } else {
      // Subscribe
      user.subscribedRoles.push(roleName.toLowerCase().trim());
      role.subscribers.push(verification.userId);
    }

    await user.save();
    await role.save();

    return NextResponse.json({ 
      subscribed: !isSubscribed,
      role: {
        name: role.name,
        description: role.description,
        color: role.color,
        subscriberCount: role.subscribers.length
      }
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
