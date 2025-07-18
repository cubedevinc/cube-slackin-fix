import { get } from '@vercel/edge-config';

const INVITE_KEY = 'slack_invite';

export interface InviteData {
  url: string;
  createdAt: string;
  isActive: boolean;
}

export async function readInviteData(): Promise<InviteData> {
  if (!process.env.EDGE_CONFIG) {
    throw new Error('EDGE_CONFIG environment variable is not set');
  }

  try {
    // Try REST API first to avoid SDK caching issues
    if (process.env.VERCEL_API_TOKEN) {
      try {
        const edgeConfigId = extractEdgeConfigId(process.env.EDGE_CONFIG);
        const baseUrl = `https://api.vercel.com/v1/edge-config/${edgeConfigId}/item/${INVITE_KEY}`;
        const url = process.env.VERCEL_TEAM_ID
          ? `${baseUrl}?teamId=${process.env.VERCEL_TEAM_ID}`
          : baseUrl;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.value) {
            return data.value; // Extract value from Edge Config response
          }
        }
      } catch (restError) {
        console.log('REST API read failed, trying SDK:', restError);
      }
    }

    // Fallback to SDK
    try {
      const data = await get<InviteData>(INVITE_KEY);
      if (data) {
        return data;
      }
    } catch (sdkError) {
      console.log('SDK read failed:', sdkError);
    }

    return {
      url: '',
      createdAt: new Date().toISOString(),
      isActive: false,
    };
  } catch (error) {
    console.error('Edge Config read error:', error);
    throw new Error(`Failed to read data from Edge Config: ${error}`);
  }
}

export async function writeInviteData(data: InviteData): Promise<void> {
  if (!process.env.EDGE_CONFIG) {
    throw new Error('EDGE_CONFIG environment variable is not set');
  }

  if (!process.env.VERCEL_API_TOKEN) {
    throw new Error('VERCEL_API_TOKEN environment variable is not set');
  }

  try {
    const edgeConfigId = extractEdgeConfigId(process.env.EDGE_CONFIG);
    const baseUrl = `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`;
    const url = process.env.VERCEL_TEAM_ID
      ? `${baseUrl}?teamId=${process.env.VERCEL_TEAM_ID}`
      : baseUrl;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key: INVITE_KEY,
            value: data,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge Config API response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Edge Config update failed: ${response.status} ${response.statusText}. ${errorText}`
      );
    }
  } catch (error) {
    console.error('Edge Config write error:', error);
    throw new Error(`Failed to save data to Edge Config: ${error}`);
  }
}

function extractEdgeConfigId(connectionString: string): string {
  const match = connectionString.match(/edge-config\.vercel\.com\/([^?]+)/);
  if (!match) {
    throw new Error('Invalid Edge Config connection string');
  }
  return match[1];
}

export function isInviteExpired(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffInDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
  return diffInDays > 30;
}

export function getDaysLeft(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return 30 - diffDays;
}

export async function validateSlackInviteLink(url: string): Promise<boolean> {
  try {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) return false;

    if (
      !trimmedUrl.includes('join.slack.com') &&
      !trimmedUrl.includes('slack.com/signup')
    ) {
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(trimmedUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'SlackInviteValidator/1.0',
        },
      });

      clearTimeout(timeoutId);
      return response.status >= 200 && response.status < 400;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch {
    return false;
  }
}
