import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';
import User from '@/models/User';
import { headers } from 'next/headers';
import { getUserIdFromRequest } from '@/lib/whop';

export const runtime = 'nodejs';

function requireCompanyId() {
  const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
  if (!companyId) throw new Error('Company ID not configured');
  return companyId;
}

async function requireAdmin(userId: string, companyId: string) {
  await connectDB();
  const user = await User.findOne({ companyId, userId });
  return Boolean(user && user.roles.includes('Admin'));
}

export async function GET() {
  try {
    const companyId = requireCompanyId();
    const hdrs = await headers();
    const userId = await getUserIdFromRequest(hdrs);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await requireAdmin(userId, companyId);
    if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    await connectDB();
    let roles = await Role.find({ companyId }).sort({ name: 1 });
    if (roles.length === 0) {
      const adminRole = new Role({ companyId, name: 'Admin', description: 'administrator role with full access' });
      await adminRole.save();
      roles = [adminRole];
    }
    return NextResponse.json(roles);
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const companyId = requireCompanyId();
    const hdrs = await headers();
    const userId = await getUserIdFromRequest(hdrs);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await requireAdmin(userId, companyId);
    if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { name, description } = await request.json();
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await connectDB();
    const existing = await Role.findOne({ companyId, name });
    if (existing) return NextResponse.json({ error: 'Role name already exists' }, { status: 400 });

    const role = new Role({ companyId, name, description: description ?? '' });
    await role.save();
    return NextResponse.json(role);
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const companyId = requireCompanyId();
    const hdrs = await headers();
    const userId = await getUserIdFromRequest(hdrs);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await requireAdmin(userId, companyId);
    if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { roleId, name, description } = await request.json();
    if (!roleId) return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });

    await connectDB();
    const role = await Role.findOne({ _id: roleId, companyId });
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

    if (name && name !== role.name) {
      const existing = await Role.findOne({ companyId, name });
      if (existing) return NextResponse.json({ error: 'Role name already exists' }, { status: 400 });
      role.name = name;
    }
    if (typeof description === 'string') role.description = description;

    await role.save();
    return NextResponse.json(role);
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const companyId = requireCompanyId();
    const hdrs = await headers();
    const userId = await getUserIdFromRequest(hdrs);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await requireAdmin(userId, companyId);
    if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');
    if (!roleId) return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });

    await connectDB();
    const role = await Role.findOne({ _id: roleId, companyId });
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

    await Role.deleteOne({ _id: roleId, companyId });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


