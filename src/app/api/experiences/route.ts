import { NextRequest, NextResponse } from 'next/server';
import { getWhopSdk } from '@/lib/whop';

interface ExperienceNode {
  id: string;
  name: string;
  app?: {
    name: string;
  };
  company?: {
    id: string;
  };
}

interface PageInfo {
  hasNextPage?: boolean;
  endCursor?: string | null;
}

interface WhopResponse {
  experiencesV2?: {
    nodes: ExperienceNode[];
    pageInfo: PageInfo;
  };
}

export async function GET(request: NextRequest) {
  try {
    const sdk = getWhopSdk();
    const verification = await sdk.verifyUserToken(request.headers);
    
    if (!verification.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('type') || 'all'; // 'all', 'chat', 'app'

    let allExperiences: ExperienceNode[] = [];
    let hasNextPage = true;
    let endCursor: string | null = null;

    // Fetch all pages with pagination
    while (hasNextPage) {
      const response = await sdk.experiences.list({
        company_id: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || '',
        ...(endCursor && { after: endCursor })
      }) as WhopResponse;

      const nodes = response.experiencesV2?.nodes || [];
      allExperiences = allExperiences.concat(nodes);

      const pageInfo = response.experiencesV2?.pageInfo;
      hasNextPage = pageInfo?.hasNextPage || false;
      endCursor = pageInfo?.endCursor || null;
    }

    // Filter experiences based on type
    let filteredExperiences = allExperiences;
    
    if (filterType === 'chat') {
      // Filter for chat experiences only
      filteredExperiences = allExperiences.filter((exp) => 
        exp.app?.name?.toLowerCase().includes('chat')
      );
    } else if (filterType === 'app') {
      // Filter for app experiences only (non-chat)
      filteredExperiences = allExperiences.filter((exp) => 
        !exp.app?.name?.toLowerCase().includes('chat')
      );
    }

    return NextResponse.json({ 
      experiences: filteredExperiences.map((exp) => ({
        id: exp.id,
        name: exp.name,
        type: exp.app?.name || 'unknown',
        company: exp.company
      })),
      total: filteredExperiences.length,
      totalAll: allExperiences.length
    });
  } catch (error) {
    console.error('Get experiences error:', error);
    return NextResponse.json({ error: 'Failed to fetch experiences' }, { status: 500 });
  }
}


