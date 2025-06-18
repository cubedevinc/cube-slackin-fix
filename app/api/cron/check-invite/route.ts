import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { SlackNotifications } from '@/lib/slack-notifications';

const DATA_FILE = path.join(process.cwd(), 'data', 'invite.json');

interface InviteData {
  url: string;
  createdAt: string;
  isActive: boolean;
}

async function readInviteData(): Promise<InviteData | null> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function writeInviteData(data: InviteData): Promise<void> {
  const dir = path.dirname(DATA_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

function getDaysLeft(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return 30 - diffDays;
}

async function validateSlackInviteLink(url: string): Promise<boolean> {
  try {
    if (!url.includes('join.slack.com') && !url.includes('slack.com/signup')) {
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'SlackInviteValidator/1.0'
        }
      });

      clearTimeout(timeoutId);
      return response.status >= 200 && response.status < 400;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error validating Slack invite link:', error);
    return false;
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const invite = await readInviteData();

    if (!invite || !invite.url) {
      return NextResponse.json({
        message: 'No invite link to check',
        checked: false
      });
    }

    const daysLeft = getDaysLeft(invite.createdAt);
    const isValid = await validateSlackInviteLink(invite.url);

    let notificationSent = false;
    let action = 'none';

    if (daysLeft <= 5 && daysLeft > 0 && invite.isActive) {
      await SlackNotifications.linkExpired(invite.url, daysLeft);
      notificationSent = true;
      action = 'expiring_warning';
    }

    if (!isValid && invite.isActive) {
      await SlackNotifications.linkInvalid(invite.url);

      await writeInviteData({
        ...invite,
        isActive: false
      });

      notificationSent = true;
      action = 'deactivated_invalid';
    }

    if (daysLeft <= 0 && invite.isActive) {
      await SlackNotifications.linkExpired(invite.url, 0);

      await writeInviteData({
        ...invite,
        isActive: false
      });

      notificationSent = true;
      action = 'deactivated_expired';
    }

    return NextResponse.json({
      checked: true,
      daysLeft,
      isValid,
      isActive: invite.isActive,
      notificationSent,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({
      error: 'Cron job failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
