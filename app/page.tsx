import { redirect } from 'next/navigation';
import { SlackNotifications } from '@/lib/slack-notifications';
import {
  InviteData,
  readInviteData,
  writeInviteData,
  isInviteExpired,
  validateSlackInviteLink,
} from '@/lib/invite-utils';

export const dynamic = 'force-dynamic';

async function getActiveInvite(): Promise<InviteData | null> {
  const invite = await readInviteData();

  if (invite.isActive && !isInviteExpired(invite.createdAt) && invite.url) {
    return invite;
  }
  return null;
}

async function checkAndUpdateInviteStatus(
  invite: InviteData
): Promise<boolean> {
  try {
    const isValid = await validateSlackInviteLink(invite.url);

    if (!isValid) {
      const updatedInvite = { ...invite, isActive: false };
      await writeInviteData(updatedInvite);
      await SlackNotifications.linkInvalid(invite.url);
      return false;
    }

    return true;
  } catch {
    try {
      const updatedInvite = { ...invite, isActive: false };
      await writeInviteData(updatedInvite);
      await SlackNotifications.linkInvalid(invite.url);
    } catch {}
    return false;
  }
}

export default async function Home() {
  const invite = await getActiveInvite();

  if (invite) {
    const isValid = await checkAndUpdateInviteStatus(invite);
    if (isValid) {
      redirect(invite.url);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="rounded-lg bg-white p-8 text-center shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-gray-800">
          Invitation Unavailable
        </h1>
        <p className="mb-6 text-gray-600">
          No active invitation is currently available or it has expired.
        </p>
        <p className="text-sm text-gray-500">
          Please contact the administrator for a new invitation.
        </p>
      </div>
    </div>
  );
}
