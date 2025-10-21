import { NextRequest, NextResponse } from 'next/server';
import { getWhopSdk } from '@/lib/whop';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import Role from '@/models/Role';

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

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const roles = await Role.find({ 
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    }).sort({ createdAt: -1 });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Get roles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const { name, description, color } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const role = new Role({
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      name: name.toLowerCase().trim(),
      description: description || '',
      color: color || '#1976d2',
      subscribers: []
    });

    await role.save();

    return NextResponse.json({ role });
  } catch (error: unknown) {
    console.error('Create role error:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
