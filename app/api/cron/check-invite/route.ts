import { NextRequest, NextResponse } from 'next/server';
import { SlackNotifications } from '@/lib/slack-notifications';
import {
  InviteData,
  readInviteData,
  writeInviteData,
  getDaysLeft,
  validateSlackInviteLink,
} from '@/lib/invite-utils';

async function readInviteDataOrNull(): Promise<InviteData | null> {
  try {
    return await readInviteData();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  console.log(
    '[CRON] GET /api/cron/check-invite - Starting automated invite check'
  );

  const authHeader = req.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  console.log('[CRON] GET /api/cron/check-invite - Checking authorization...');
  if (authHeader !== expectedAuth) {
    console.log(
      '[CRON] GET /api/cron/check-invite - Error: Unauthorized access attempt'
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[CRON] GET /api/cron/check-invite - Authorization successful');

  try {
    console.log('[CRON] GET /api/cron/check-invite - Reading invite data...');
    const invite = await readInviteDataOrNull();

    if (!invite || !invite.url) {
      console.log(
        '[CRON] GET /api/cron/check-invite - No invite link found to check'
      );
      return NextResponse.json({
        message: 'No invite link to check',
        checked: false,
      });
    }

    console.log('[CRON] GET /api/cron/check-invite - Found invite:', {
      url: `${invite.url.substring(0, 50)}...`,
      isActive: invite.isActive,
      createdAt: invite.createdAt,
    });

    const daysLeft = getDaysLeft(invite.createdAt);
    console.log('[CRON] GET /api/cron/check-invite - Days left calculation:', {
      daysLeft,
    });

    console.log(
      '[CRON] GET /api/cron/check-invite - Validating invite link...'
    );
    const isValid = await validateSlackInviteLink(invite.url);
    console.log('[CRON] GET /api/cron/check-invite - Link validation result:', {
      isValid,
    });

    let notificationSent = false;
    let action = 'none';

    // Check for expiring soon (5 days or less)
    if (daysLeft <= 5 && daysLeft > 0 && invite.isActive) {
      console.log(
        '[CRON] GET /api/cron/check-invite - Link expiring soon, sending notification...'
      );
      try {
        await SlackNotifications.linkExpired(invite.url, daysLeft);
        notificationSent = true;
        action = 'expiring_warning';
        console.log(
          '[CRON] GET /api/cron/check-invite - Expiring notification sent successfully'
        );
      } catch (notificationError) {
        console.error(
          '[CRON] GET /api/cron/check-invite - Failed to send expiring notification:',
          notificationError
        );
      }
    }

    // Check for invalid link
    if (!isValid && invite.isActive) {
      console.log(
        '[CRON] GET /api/cron/check-invite - Link is invalid, deactivating and sending notification...'
      );
      try {
        await SlackNotifications.linkInvalid(invite.url);

        await writeInviteData({
          ...invite,
          isActive: false,
        });

        notificationSent = true;
        action = 'deactivated_invalid';
        console.log(
          '[CRON] GET /api/cron/check-invite - Invalid link notification sent and invite deactivated'
        );
      } catch (error) {
        console.error(
          '[CRON] GET /api/cron/check-invite - Failed to handle invalid link:',
          error
        );
      }
    }

    // Check for expired link
    if (daysLeft <= 0 && invite.isActive) {
      console.log(
        '[CRON] GET /api/cron/check-invite - Link has expired, deactivating and sending notification...'
      );
      try {
        await SlackNotifications.linkExpired(invite.url, 0);

        await writeInviteData({
          ...invite,
          isActive: false,
        });

        notificationSent = true;
        action = 'deactivated_expired';
        console.log(
          '[CRON] GET /api/cron/check-invite - Expired link notification sent and invite deactivated'
        );
      } catch (error) {
        console.error(
          '[CRON] GET /api/cron/check-invite - Failed to handle expired link:',
          error
        );
      }
    }

    const result = {
      checked: true,
      daysLeft,
      isValid,
      isActive: invite.isActive,
      notificationSent,
      action,
      timestamp: new Date().toISOString(),
    };

    console.log(
      '[CRON] GET /api/cron/check-invite - Check completed successfully:',
      result
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error(
      '[CRON] GET /api/cron/check-invite - Unexpected error during cron job:',
      error
    );
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
