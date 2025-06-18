import { NextRequest, NextResponse } from 'next/server';
import { SlackNotifications } from '@/lib/slack-notifications';
import {
  InviteData,
  readInviteData,
  writeInviteData,
  getDaysLeft,
  validateSlackInviteLink
} from '@/lib/invite-utils';

async function readInviteDataOrNull(): Promise<InviteData | null> {
  try {
    return await readInviteData();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const invite = await readInviteDataOrNull();

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
