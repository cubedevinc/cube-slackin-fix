interface SlackMessage {
  text: string;
  blocks?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    fields?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

export async function sendSlackNotification(
  message: string,
  details?: Record<string, string>
): Promise<boolean> {
  console.log('[SLACK] sendSlackNotification - Starting notification send');
  console.log('[SLACK] sendSlackNotification - Message:', message);
  console.log('[SLACK] sendSlackNotification - Details:', details);

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log(
      '[SLACK] sendSlackNotification - SLACK_WEBHOOK_URL not configured, skipping notification'
    );
    return false;
  }

  console.log(
    '[SLACK] sendSlackNotification - Webhook URL configured, proceeding with notification'
  );

  try {
    const payload: SlackMessage = {
      text: message,
    };

    if (details) {
      console.log('[SLACK] sendSlackNotification - Adding details to payload');
      payload.blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message,
          },
        },
        {
          type: 'section',
          fields: Object.entries(details).map(([key, value]) => ({
            type: 'mrkdwn',
            text: `*${key}:* ${value}`,
          })),
        },
      ];
    }

    console.log(
      '[SLACK] sendSlackNotification - Sending HTTP request to Slack webhook...'
    );
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        '[SLACK] sendSlackNotification - Failed to send notification:',
        {
          status: response.status,
          statusText: response.statusText,
        }
      );
      return false;
    }

    console.log(
      '[SLACK] sendSlackNotification - Notification sent successfully'
    );
    return true;
  } catch (error) {
    console.error(
      '[SLACK] sendSlackNotification - Error sending notification:',
      error
    );
    return false;
  }
}

export const SlackNotifications = {
  linkExpired: (url: string, daysLeft: number) => {
    console.log(
      '[SLACK] SlackNotifications.linkExpired - Sending expiring link notification'
    );
    return sendSlackNotification(`🚨 *Slack Invite Link Expiring Soon*`, {
      Link: url,
      'Days Left': daysLeft.toString(),
      Action: 'Please update the invite link in the Admin Panel',
    });
  },

  linkInvalid: (url: string) => {
    console.log(
      '[SLACK] SlackNotifications.linkInvalid - Sending invalid link notification'
    );
    return sendSlackNotification(`❌ *Slack Invite Link is Invalid*`, {
      Link: url,
      Status: 'Link is no longer accessible',
      Action: 'Please update the invite link immediately in the Admin Panel',
    });
  },

  linkUpdated: (oldUrl: string, newUrl: string) => {
    console.log(
      '[SLACK] SlackNotifications.linkUpdated - Sending link updated notification'
    );
    return sendSlackNotification(`✅ *Slack Invite Link Updated*`, {
      'Old Link': oldUrl.substring(0, 50) + '...',
      'New Link': newUrl.substring(0, 50) + '...',
      'Updated By': 'Admin Panel',
    });
  },
};
