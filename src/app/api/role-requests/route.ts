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
  } catch (error) {
    console.error('Get role requests error:', error);
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

    // Check if there's already a pending request for this role
    const existingRequest = await RoleRequest.findOne({
      userId: verification.userId,
      roleName,
      status: 'pending'
    });

    if (existingRequest) {
      return NextResponse.json({ error: 'You already have a pending request for this role' }, { status: 400 });
    }

    // Create the request
    const roleRequest = await RoleRequest.create({
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      userId: verification.userId,
      username: user.username,
      roleName,
      status: 'pending',
      requestedBy: verification.userId
    });

    return NextResponse.json({ request: roleRequest, message: 'Role request submitted successfully' });
    } catch (error) {
      console.error('Create role request error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// PATCH: Approve or reject a role request (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const sdk = getWhopSdk();
    const verification = await sdk.verifyUserToken(request.headers);
    
    if (!verification.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const admin = await User.findOne({ 
      userId: verification.userId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    });

    if (!admin || !admin.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { requestId, action } = await request.json(); // action: 'approve' or 'reject'

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 });
    }

    const roleRequest = await RoleRequest.findOne({
      _id: requestId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
    });

    if (!roleRequest) {
      return NextResponse.json({ error: 'Role request not found' }, { status: 404 });
    }

    if (roleRequest.status !== 'pending') {
      return NextResponse.json({ error: 'This request has already been handled' }, { status: 400 });
    }

    if (action === 'approve') {
      // Update request status
      roleRequest.status = 'approved';
      roleRequest.handledBy = verification.userId;
      roleRequest.handledAt = new Date();
      await roleRequest.save();

      // Assign the role to the user
      const targetUser = await User.findOne({
        userId: roleRequest.userId,
        companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
      });

      if (targetUser && !targetUser.roles.includes(roleRequest.roleName)) {
        targetUser.roles.push(roleRequest.roleName);
        await targetUser.save();
      }

      return NextResponse.json({ message: 'Role request approved and role assigned', request: roleRequest });
    } else if (action === 'reject') {
      // Update request status
      roleRequest.status = 'rejected';
      roleRequest.handledBy = verification.userId;
      roleRequest.handledAt = new Date();
      await roleRequest.save();

      return NextResponse.json({ message: 'Role request rejected', request: roleRequest });
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject"' }, { status: 400 });
    }
    } catch (error) {
      console.error('Handle role request error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
