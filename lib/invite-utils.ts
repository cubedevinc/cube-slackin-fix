import { promises as fs } from 'fs';
import path from 'path';

export const DATA_FILE = path.join(process.cwd(), 'data', 'invite.json');
const INVITE_KEY = 'slack_invite';

export interface InviteData {
  url: string;
  createdAt: string;
  isActive: boolean;
}

const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL === '1';

export async function readInviteData(): Promise<InviteData> {
  if (isProduction && process.env.EDGE_CONFIG) {
    try {
      const { get } = await import('@vercel/edge-config');
      const data = await get<InviteData>(INVITE_KEY);
      if (data) {
        return data;
      }
    } catch (error) {
      console.error('Edge Config read error:', error);
    }
  }

  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {
      url: '',
      createdAt: new Date().toISOString(),
      isActive: false
    };
  }
}

export async function writeInviteData(data: InviteData): Promise<void> {
  if (isProduction && process.env.EDGE_CONFIG && process.env.VERCEL_API_TOKEN) {
    try {
      const edgeConfigId = extractEdgeConfigId(process.env.EDGE_CONFIG);
      const response = await fetch(`https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            operation: 'upsert',
            key: INVITE_KEY,
            value: data
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Edge Config update failed: ${response.status}`);
      }

      console.log('Data saved to Edge Config successfully');
      return;
    } catch (error) {
      console.error('Edge Config write error:', error);
      throw new Error('Failed to save data to Edge Config');
    }
  }

  const dir = path.dirname(DATA_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
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

    if (!trimmedUrl.includes('join.slack.com') && !trimmedUrl.includes('slack.com/signup')) {
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(trimmedUrl, {
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
  } catch {
    return false;
  }
}
