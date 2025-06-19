import { NextRequest, NextResponse } from 'next/server';
import { SlackNotifications } from '@/lib/slack-notifications';
import {
  InviteData,
  readInviteData,
  writeInviteData,
  isInviteExpired
} from '@/lib/invite-utils';

export async function GET() {
  try {
    const data = await readInviteData();
    const isExpired = isInviteExpired(data.createdAt);

    return NextResponse.json({
      ...data,
      isActive: data.isActive && !isExpired
    });
  } catch {
    return NextResponse.json({ error: 'Error reading data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const oldData = await readInviteData();

    const newData: InviteData = {
      url,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    await writeInviteData(newData);

    if (oldData.url && oldData.url !== url) {
      await SlackNotifications.linkUpdated(oldData.url, url);
    }

    return NextResponse.json(newData);
  } catch (error) {
    console.error('Error in POST /api/invite:', error);
    return NextResponse.json({
      error: 'Error saving data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
