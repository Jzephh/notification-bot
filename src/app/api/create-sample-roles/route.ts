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
    const user = await User.findOne({ 
      userId: verification.userId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    });

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Create sample roles if they don't exist
    const sampleRoles = [
      { name: 'flips', description: 'For flip traders', color: '#4CAF50' },
      { name: 'green', description: 'Green signal alerts', color: '#8BC34A' },
      { name: 'yellow', description: 'Yellow signal alerts', color: '#FFC107' }
    ];

    const createdRoles = [];
    
    for (const roleData of sampleRoles) {
      const existingRole = await Role.findOne({
        companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
        name: roleData.name
      });

      if (!existingRole) {
        const role = new Role({
          companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!,
          name: roleData.name,
          description: roleData.description,
          color: roleData.color
        });
        
        await role.save();
        createdRoles.push(role);
      }
    }

    return NextResponse.json({ 
      message: 'Sample roles created',
      roles: createdRoles
    });
  } catch (error) {
    console.error('Create sample roles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
