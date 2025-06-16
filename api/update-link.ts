import type { VercelRequest, VercelResponse } from '@vercel/node';
import { writeFile } from 'fs/promises';
import { join } from 'path';

interface LinkData {
  inviteLink: string;
  createdAt: string;
}

const LINK_FILE_PATH = join(process.cwd(), 'link.json');

const isValidSlackInvite = (url: string): boolean =>
  /^https:\/\/.+\.slack\.com\/.*invite/.test(url);

const saveLinkData = async (inviteLink: string, createdAt?: string): Promise<LinkData> => {
  const linkData: LinkData = {
    inviteLink,
    createdAt: createdAt || new Date().toISOString(),
  };

  await writeFile(LINK_FILE_PATH, JSON.stringify(linkData, null, 2));
  return linkData;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { inviteLink, createdAt } = req.body;

    if (!inviteLink || typeof inviteLink !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'inviteLink is required and must be a string'
      });
    }

    if (!isValidSlackInvite(inviteLink)) {
      return res.status(400).json({
        error: 'Invalid invite link',
        message: 'Link must be a valid Slack invite URL'
      });
    }

    const linkData = await saveLinkData(inviteLink, createdAt);

    return res.status(200).json({
      success: true,
      message: 'Invite link updated successfully',
      data: linkData
    });

  } catch {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update invite link'
    });
  }
}
