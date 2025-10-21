import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Role from '@/models/Role';

export const runtime = 'nodejs';

// This endpoint expects a POST body: { companyId, message, channelId, authorId }
// It parses @role mentions and returns the list of userIds to notify.
// Hook this up to your Whop app's outbound event when messages are created.

export async function POST(request: Request) {
  try {
    const { companyId, message } = await request.json();
    if (!companyId || typeof message !== 'string') {
      return NextResponse.json({ error: 'companyId and message required' }, { status: 400 });
    }

    await connectDB();
    const roles = await Role.find({ companyId });
    if (roles.length === 0) return NextResponse.json({ recipients: [] });

    const roleNames = roles.map(r => r.name).sort((a, b) => b.length - a.length);
    const mentioned = new Set<string>();

    for (const name of roleNames) {
      const pattern = new RegExp(`@${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\w-])`, 'i');
      if (pattern.test(message)) {
        mentioned.add(name);
      }
    }

    if (mentioned.size === 0) return NextResponse.json({ recipients: [] });

    const users = await User.find({ companyId, roles: { $in: Array.from(mentioned) } });
    const recipients = users.map(u => u.userId);

    // Normally, here you would call Whop API to DM/notify these users.
    // For this demo, we just return the recipients list.
    return NextResponse.json({ recipients });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


