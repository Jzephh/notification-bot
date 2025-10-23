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
    
    // Check if user is admin
    const adminUser = await User.findOne({ 
      userId: verification.userId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    });

    if (!adminUser || !adminUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { targetUserId, roleName, action } = await request.json();

    if (!targetUserId || !roleName || !action) {
      return NextResponse.json({ error: 'targetUserId, roleName, and action are required' }, { status: 400 });
    }

    if (!['assign', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "assign" or "remove"' }, { status: 400 });
    }

    // Check if role exists
    const role = await Role.findOne({ 
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      name: roleName.toLowerCase().trim()
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Get or create target user
    let targetUser = await User.findOne({ 
      userId: targetUserId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    });

    if (!targetUser) {
      try {
        const whopUser = await sdk.users.getUser({ userId: targetUserId });
        targetUser = new User({
          companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!,
          userId: targetUserId,
          username: whopUser.username || 'unknown',
          name: whopUser.name || 'Unknown User',
          avatarUrl: whopUser.profilePicture?.sourceUrl,
          roles: [],
          isAdmin: false
        });
      } catch {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
      }
    }

    const roleNameLower = roleName.toLowerCase().trim();
    
    if (action === 'assign') {
      // Add role if not already assigned
      if (!targetUser.roles.includes(roleNameLower)) {
        targetUser.roles.push(roleNameLower);
      }
    } else if (action === 'remove') {
      // Remove role
      targetUser.roles = targetUser.roles.filter((r: string) => r !== roleNameLower);
    }

    await targetUser.save();

    return NextResponse.json({ 
      success: true,
      user: {
        id: targetUser.userId,
        username: targetUser.username,
        name: targetUser.name,
        roles: targetUser.roles
      },
      action,
      roleName: roleNameLower
    });
  } catch (error) {
    console.error('Assign role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
