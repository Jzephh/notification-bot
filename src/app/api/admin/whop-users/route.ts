import { NextRequest, NextResponse } from 'next/server';
import { getWhopSdk } from '@/lib/whop';

export async function GET(request: NextRequest) {
  try {
    const sdk = getWhopSdk();

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const limit = parseInt(searchParams.get('limit') || '50');

    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || process.env.WHOP_COMPANY_ID;
    if (!companyId) {
      return NextResponse.json({ error: 'Missing company id' }, { status: 400 });
    }

    // List company members via Whop
    const response = await sdk.companies.listMembers({ companyId });

    type WhopProfilePic = { sourceUrl?: string } | undefined;
    type WhopUser = { id: string; username?: string; name?: string; email?: string; profilePicture?: WhopProfilePic };
    type WhopMemberNode = { user?: WhopUser };

    const members: WhopMemberNode[] = Array.isArray(response?.members?.nodes) ? response.members.nodes : [];

    // Optionally fetch detailed user data with getUser when needed
    const filtered = members
      .filter((m) => !!m?.user)
      .filter((m) => {
        if (!search) return true;
        const u = m.user as WhopUser;
        const blob = `${u.username || ''} ${u.name || ''} ${u.email || ''}`.toLowerCase();
        return blob.includes(search);
      })
      .slice(0, limit);

    // Map to minimal data; enrich with users.getUser for fields not present
    const results = await Promise.all(
      filtered.map(async (m) => {
        const u = m.user as WhopUser;
        type DetailedUser = { profilePicture?: WhopProfilePic; avatarUrl?: string };
        let detailed: DetailedUser | undefined;
        try {
          detailed = await sdk.users.getUser({ userId: u.id });
        } catch {
          detailed = undefined;
        }
        return {
          id: u.id,
          username: u.username,
          name: u.name,
          email: u.email,
          avatarUrl: detailed?.profilePicture?.sourceUrl || detailed?.avatarUrl || u?.profilePicture?.sourceUrl,
        };
      })
    );

    return NextResponse.json({ users: results });
  } catch {
    return NextResponse.json({ error: 'Failed to list company members' }, { status: 500 });
  }
}


