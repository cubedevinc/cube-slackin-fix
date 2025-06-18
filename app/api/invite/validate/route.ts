import { NextResponse } from 'next/server';
import {
  InviteData,
  readInviteData,
  writeInviteData,
  validateSlackInviteLink
} from '@/lib/invite-utils';

export async function POST() {
  try {
    const data = await readInviteData();

    if (!data.url || !data.url.trim()) {
      return NextResponse.json({
        error: 'No invite link to validate'
      }, { status: 400 });
    }

    const isValid = await validateSlackInviteLink(data.url);

    const updatedData = {
      ...data,
      isActive: isValid
    };

    await writeInviteData(updatedData);

    return NextResponse.json({
      url: data.url,
      isValid,
      message: isValid
        ? 'Link is valid and active'
        : 'Link is invalid or broken — marked as inactive'
    });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({
      error: 'Error validating link'
    }, { status: 500 });
  }
}
