import { NextResponse } from 'next/server';
import {
  readInviteData,
  writeInviteData,
  validateSlackInviteLink,
} from '@/lib/invite-utils';
import { SlackNotifications } from '@/lib/slack-notifications';

export async function POST() {
  console.log('[API] POST /api/invite/validate - Starting invite validation');

  try {
    console.log('[API] POST /api/invite/validate - Reading invite data...');
    const data = await readInviteData();

    if (!data.url || !data.url.trim()) {
      console.log(
        '[API] POST /api/invite/validate - Error: No invite link found'
      );
      return NextResponse.json(
        {
          error: 'No invite link to validate',
        },
        { status: 400 }
      );
    }

    console.log(
      '[API] POST /api/invite/validate - Found invite URL:',
      `${data.url.substring(0, 50)}...`
    );
    console.log('[API] POST /api/invite/validate - Validating link...');

    const isValid = await validateSlackInviteLink(data.url);
    console.log('[API] POST /api/invite/validate - Validation result:', {
      isValid,
    });

    const updatedData = {
      ...data,
      isActive: isValid,
    };

    console.log(
      '[API] POST /api/invite/validate - Updating data with validation result...'
    );
    await writeInviteData(updatedData);
    console.log('[API] POST /api/invite/validate - Data updated successfully');

    // Send notification if link is invalid
    if (!isValid) {
      console.log(
        '[API] POST /api/invite/validate - Link is invalid, sending Slack notification...'
      );
      try {
        const notificationSent = await SlackNotifications.linkInvalid(data.url);
        console.log(
          '[API] POST /api/invite/validate - Slack notification result:',
          { notificationSent }
        );
      } catch (notificationError) {
        console.error(
          '[API] POST /api/invite/validate - Slack notification failed:',
          notificationError
        );
      }
    }

    const responseMessage = isValid
      ? 'Link is valid and active'
      : 'Link is invalid or broken — marked as inactive';

    console.log('[API] POST /api/invite/validate - Success:', responseMessage);

    return NextResponse.json({
      url: data.url,
      isValid,
      message: responseMessage,
    });
  } catch (error) {
    console.error('[API] POST /api/invite/validate - Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to validate invite link',
      },
      { status: 500 }
    );
  }
}
