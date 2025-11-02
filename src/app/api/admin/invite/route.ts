import { NextRequest, NextResponse } from 'next/server';
import { getWhopSdk } from '@/lib/whop';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { ensureAndAssignAllRole } from '@/lib/autoAssignAllRole';

export async function POST(request: NextRequest) {
  try {
    const sdk = getWhopSdk();
    const body = await request.json();
    const userId = (body?.userId || '').trim();
    const role = (body?.role || '').trim();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || process.env.WHOP_COMPANY_ID;
    if (!companyId) {
      return NextResponse.json({ error: 'Missing company id' }, { status: 400 });
    }

    // 1) Fetch Whop user by userId
    type WhopProfilePic = { sourceUrl?: string } | undefined;
    type WhopUser = { username?: string; name?: string; profilePicture?: WhopProfilePic };
    let whopUser: WhopUser;
    try {
      whopUser = await sdk.users.getUser({ userId });
    } catch {
      return NextResponse.json({ error: 'Whop user not found' }, { status: 404 });
    }

    // 2) Do not allow inviting users that already exist locally
    await connectDB();
    const existing = await User.findOne({ companyId, userId });
    if (existing) {
      return NextResponse.json({ error: 'User already exists in database' }, { status: 409 });
    }

    // Create a brand new local user record with required fields only
    const saved = new User({
      companyId,
      userId,
      username: whopUser?.username || `user_${userId.slice(-6)}`,
      name: whopUser?.name || `User ${userId.slice(-6)}`,
      avatarUrl: whopUser?.profilePicture?.sourceUrl,
      roles: [],
      isAdmin: false,
    });
    await saved.save();

    // Automatically assign "@all" role to the invited user
    try {
      await ensureAndAssignAllRole(userId, companyId);
      // Refresh user data to get updated roles
      const updatedUser = await User.findOne({ companyId, userId });
      if (updatedUser) {
        saved.roles = updatedUser.roles;
      }
    } catch {
      // Ignore errors - role assignment is best-effort
    }

    // 2) Optionally call Whop to send invite (best-effort; not required for DB save)
    // Try multiple potential SDK invitation methods for compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let inviteResponse: any = null;
    const tryFns = [
      () => sdk.companies?.inviteMember?.({ companyId, userId, role }),
      () => sdk.companyInvitations?.createCompanyInvitation?.({ companyId, userId, role }),
      () => sdk.invitations?.create?.({ companyId, userId, role }),
    ];

    for (const fn of tryFns) {
      try {
        if (typeof fn === 'function') {
          const res = await fn();
          if (res) {
            inviteResponse = res;
            break;
          }
        }
      } catch {
        // Ignore errors - try next method
      }
    }

    // Always return success for local-save use case; include invite info if available
    return NextResponse.json({
      success: true,
      user: {
        id: saved.userId,
        username: saved.username,
        name: saved.name,
        avatarUrl: saved.avatarUrl,
      },
      invitation: inviteResponse || null,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to invite user' }, { status: 500 });
  }
}


