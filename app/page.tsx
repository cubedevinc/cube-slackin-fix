import { promises as fs } from 'fs';
import path from 'path';
import { redirect } from 'next/navigation';
import { SlackNotifications } from '@/lib/slack-notifications';

interface InviteData {
  url: string;
  createdAt: string;
  isActive: boolean;
}

async function getInviteData(): Promise<InviteData | null> {
  try {
    const dataFile = path.join(process.cwd(), 'data', 'invite.json');
    const data = await fs.readFile(dataFile, 'utf8');
    const invite = JSON.parse(data);

    const created = new Date(invite.createdAt);
    const now = new Date();
    const diffInDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
    const isExpired = diffInDays > 30;

    if (invite.isActive && !isExpired && invite.url) {
      return invite;
    }
    return null;
  } catch {
    return null;
  }
}

async function checkAndUpdateInviteStatus(invite: InviteData): Promise<boolean> {
  try {
    // Check if the invite URL is still valid
    const response = await fetch(invite.url, {
      method: 'HEAD',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)'
      }
    });

    const isValid = response.status === 200 || (response.status >= 300 && response.status < 400);

    // If the link is invalid, mark it as inactive
    if (!isValid) {
      const dataFile = path.join(process.cwd(), 'data', 'invite.json');
      const updatedInvite = { ...invite, isActive: false };
      await fs.writeFile(dataFile, JSON.stringify(updatedInvite, null, 2));

      // Send Slack notification
      await SlackNotifications.linkInvalid(invite.url);

      return false;
    }

    return true;
  } catch {
    // If we can't check the link, mark it as inactive to be safe
    try {
      const dataFile = path.join(process.cwd(), 'data', 'invite.json');
      const updatedInvite = { ...invite, isActive: false };
      await fs.writeFile(dataFile, JSON.stringify(updatedInvite, null, 2));

      // Send Slack notification
      await SlackNotifications.linkInvalid(invite.url);
    } catch {
      // Ignore write errors
    }
    return false;
  }
}

export default async function Home() {
  const invite = await getInviteData();

  if (invite) {
    // Check if the invite is still valid before redirecting
    const isValid = await checkAndUpdateInviteStatus(invite);
    if (isValid) {
      redirect(invite.url);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Invitation Unavailable
        </h1>
        <p className="text-gray-600 mb-6">
          No active invitation is currently available or it has expired.
        </p>
        <p className="text-sm text-gray-500">
          Please contact the administrator for a new invitation.
        </p>
      </div>
    </div>
  );
}
