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

export async function sendSlackNotification(message: string, details?: Record<string, string>): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not configured');
    return false;
  }

  try {
    const payload: SlackMessage = {
      text: message,
    };

    if (details) {
      payload.blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: message
          }
        },
        {
          type: "section",
          fields: Object.entries(details).map(([key, value]) => ({
            type: "mrkdwn",
            text: `*${key}:* ${value}`
          }))
        }
      ];
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Failed to send Slack notification:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return false;
  }
}

export const SlackNotifications = {
  linkExpired: (url: string, daysLeft: number) =>
    sendSlackNotification(
      `🚨 *Slack Invite Link Expiring Soon*`,
      {
        'Link': url,
        'Days Left': daysLeft.toString(),
        'Action': 'Please update the invite link in the <http://slack.cube.dev/admin|Admin Panel>'
      }
    ),

  linkInvalid: (url: string) =>
    sendSlackNotification(
      `❌ *Slack Invite Link is Invalid*`,
      {
        'Link': url,
        'Status': 'Link is no longer accessible',
        'Action': 'Please update the invite link immediately in the <http://slack.cube.dev/admin|Admin Panel>'
      }
    ),

  linkUpdated: (oldUrl: string, newUrl: string) =>
    sendSlackNotification(
      `✅ *Slack Invite Link Updated*`,
      {
        'Old Link': oldUrl.substring(0, 50) + '...',
        'New Link': newUrl.substring(0, 50) + '...',
        'Updated By': 'Admin Panel'
      }
    )
};
