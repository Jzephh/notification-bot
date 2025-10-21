import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Role from '@/models/Role';
import { headers } from 'next/headers';
import { getUserIdFromRequest } from '@/lib/whop';

export const runtime = 'nodejs';

function requireCompanyId() {
  const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
  if (!companyId) throw new Error('Company ID not configured');
  return companyId;
}

export async function GET() {
  try {
    const companyId = requireCompanyId();
    const hdrs = await headers();
    const userId = await getUserIdFromRequest(hdrs);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ companyId, userId });
    return NextResponse.json({ roles: user?.roles ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const companyId = requireCompanyId();
    const hdrs = await headers();
    const userId = await getUserIdFromRequest(hdrs);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { roleName } = await request.json();
    if (!roleName || typeof roleName !== 'string') {
      return NextResponse.json({ error: 'roleName is required' }, { status: 400 });
    }

    await connectDB();
    const role = await Role.findOne({ companyId, name: roleName });
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

    const user = await User.findOneAndUpdate(
      { companyId, userId },
      {
        $setOnInsert: { username: '', name: '', avatarUrl: '' },
        $addToSet: { roles: roleName },
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ roles: user.roles });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const companyId = requireCompanyId();
    const hdrs = await headers();
    const userId = await getUserIdFromRequest(hdrs);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const roleName = searchParams.get('roleName');
    if (!roleName) return NextResponse.json({ error: 'roleName is required' }, { status: 400 });

    await connectDB();
    const user = await User.findOneAndUpdate(
      { companyId, userId },
      { $pull: { roles: roleName } },
      { new: true }
    );

    return NextResponse.json({ roles: user?.roles ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


