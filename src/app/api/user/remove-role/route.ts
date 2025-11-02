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

    // Get the current user
    const user = await User.findOne({
      userId: verification.userId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify role exists
    const role = await Role.findOne({
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      name: roleName.toLowerCase().trim(),
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const roleNameLower = roleName.toLowerCase().trim();

    // Prevent removal of "@all" role
    if (roleNameLower === 'all') {
      return NextResponse.json({ error: 'The "@all" role cannot be removed' }, { status: 400 });
    }

    // Check if user has this role
    if (!user.roles.includes(roleNameLower)) {
      return NextResponse.json({ error: 'You do not have this role' }, { status: 400 });
    }

    // Remove the role
    user.roles = user.roles.filter((r: string) => r !== roleNameLower);
    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user.userId,
        username: user.username,
        name: user.name,
        roles: user.roles,
      },
      roleName: roleNameLower,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
