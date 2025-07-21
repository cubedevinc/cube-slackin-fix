import { NextRequest, NextResponse } from 'next/server';
import { SlackNotifications } from '@/lib/slack-notifications';
import {
  InviteData,
  readInviteData,
  writeInviteData,
  isInviteExpired,
} from '@/lib/invite-utils';

export async function GET() {
  console.log('[API] GET /api/invite - Reading invite data');
  try {
    const data = await readInviteData();
    console.log('[API] GET /api/invite - Data retrieved:', {
      url: data?.url ? `${data.url.substring(0, 50)}...` : 'none',
      isActive: data?.isActive,
      createdAt: data?.createdAt,
    });

    const isExpired = isInviteExpired(data.createdAt);
    console.log('[API] GET /api/invite - Expiration check:', { isExpired });

    const response = {
      ...data,
      isActive: data.isActive && !isExpired,
    };

    console.log('[API] GET /api/invite - Success response prepared');
    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] GET /api/invite - Error:', error);
    return NextResponse.json(
      { error: 'Failed to read invite data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log('[API] POST /api/invite - Starting invite creation/update');

  try {
    const { url } = await req.json();
    console.log(
      '[API] POST /api/invite - Received URL:',
      url ? `${url.substring(0, 50)}...` : 'none'
    );

    if (!url || typeof url !== 'string') {
      console.log('[API] POST /api/invite - Error: URL is required');
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
      new URL(url);
      console.log('[API] POST /api/invite - URL format validation passed');
    } catch {
      console.log('[API] POST /api/invite - Error: Invalid URL format');
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log('[API] POST /api/invite - Reading existing data...');
    const oldData = await readInviteData();
    console.log('[API] POST /api/invite - Old data:', {
      hasOldUrl: !!oldData?.url,
      oldUrl: oldData?.url ? `${oldData.url.substring(0, 50)}...` : 'none',
    });

    const newData: InviteData = {
      url,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    console.log('[API] POST /api/invite - Writing new data to Edge Config...');
    await writeInviteData(newData);
    console.log(
      '[API] POST /api/invite - Data successfully written to Edge Config'
    );

    // Send notification if URL changed
    if (oldData.url && oldData.url !== url) {
      console.log(
        '[API] POST /api/invite - URL changed, sending Slack notification...'
      );
      try {
        const notificationSent = await SlackNotifications.linkUpdated(
          oldData.url,
          url
        );
        console.log('[API] POST /api/invite - Slack notification result:', {
          notificationSent,
        });
      } catch (notificationError) {
        console.error(
          '[API] POST /api/invite - Slack notification failed:',
          notificationError
        );
      }
    } else {
      console.log(
        '[API] POST /api/invite - No URL change detected, skipping notification'
      );
    }

    console.log('[API] POST /api/invite - Success, returning new data');
    return NextResponse.json(newData);
  } catch (error) {
    console.error('[API] POST /api/invite - Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save invite data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
