import type { VercelRequest, VercelResponse } from '@vercel/node';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

interface LinkData {
  inviteLink: string;
  createdAt: string;
}

interface SlackInviteResponse {
  ok: boolean;
  invite_link?: string;
  error?: string;
}

const TTL_DAYS = parseInt(process.env.INVITE_LINK_TTL_DAYS || '30');
const LINK_FILE_PATH = join(process.cwd(), 'link.json');

const isLinkExpired = (createdAt: string, ttlDays: number = 30): boolean => {
  const createdDate = new Date(createdAt);
  const expirationDate = new Date(createdDate.getTime() + (ttlDays * 24 * 60 * 60 * 1000));
  return new Date() > expirationDate;
};

const saveLinkData = async (inviteLink: string): Promise<LinkData> => {
  const linkData: LinkData = {
    inviteLink,
    createdAt: new Date().toISOString(),
  };

  await writeFile(LINK_FILE_PATH, JSON.stringify(linkData, null, 2));
  return linkData;
};

const readLinkData = async (): Promise<LinkData | null> => {
  try {
    const data = await readFile(LINK_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

const generateNewSlackInvite = async (): Promise<string> => {
  const token = process.env.SLACK_BOT_TOKEN;

  if (!token) throw new Error('SLACK_BOT_TOKEN not configured');

  const response = await fetch('https://slack.com/api/admin.invites.generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel_ids: [],
      expires_in: TTL_DAYS * 24 * 60 * 60,
    }),
  });

  const data = await response.json() as SlackInviteResponse;

  if (!data.ok || !data.invite_link) {
    throw new Error(`Slack API error: ${data.error}`);
  }

  return data.invite_link;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    let linkData = await readLinkData();

    if (!linkData || isLinkExpired(linkData.createdAt, TTL_DAYS)) {
      try {
        const newInviteLink = await generateNewSlackInvite();
        linkData = await saveLinkData(newInviteLink);
      } catch {
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'Unable to generate new invite link. Please try again later.',
        });
      }
    }

    res.redirect(302, linkData.inviteLink);
  } catch {
    res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong. Please try again later.',
    });
  }
}
