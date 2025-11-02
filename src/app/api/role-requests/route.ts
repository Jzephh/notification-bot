import { NextRequest, NextResponse } from 'next/server';
import { getWhopSdk } from '@/lib/whop';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import RoleRequest from '@/models/RoleRequest';

// GET: Get role requests
export async function GET(request: NextRequest) {
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'all', 'my', 'pending', 'approved', 'rejected'

    const query: { companyId?: string; userId?: string; status?: string } = { 
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || undefined 
    };
    
    if (filter === 'my') {
      // User can see their own requests
      query.userId = verification.userId;
    } else if (filter === 'pending') {
      query.status = 'pending';
    } else if (filter === 'approved') {
      query.status = 'approved';
    } else if (filter === 'rejected') {
      query.status = 'rejected';
    }
    // 'all' or no filter shows all requests

    const requests = await RoleRequest.find(query).sort({ createdAt: -1 }).limit(100);

    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new role request
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

    const user = await User.findOne({ 
      userId: verification.userId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has this role
    if (user.roles.includes(roleName)) {
      return NextResponse.json({ error: 'You already have this role' }, { status: 400 });
    }

    // Immediately assign the role to the user (no approval needed)
    const roleNameLower = roleName.toLowerCase().trim();
    
    if (!user.roles.includes(roleNameLower)) {
      user.roles.push(roleNameLower);
      await user.save();
    }

    // Create a record of the request for history (status: 'approved' for backward compatibility)
    const roleRequest = await RoleRequest.create({
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      userId: verification.userId,
      username: user.username,
      roleName: roleNameLower,
      status: 'approved', // Auto-approved, no admin action needed
      requestedBy: verification.userId
    });

    return NextResponse.json({ 
      request: roleRequest, 
      message: 'Role assigned successfully',
      user: {
        id: user.userId,
        username: user.username,
        roles: user.roles
      }
    });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

