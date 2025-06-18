import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'invite.json');

interface InviteData {
  url: string;
  createdAt: string;
  isActive: boolean;
}

async function readInviteData(): Promise<InviteData> {
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

async function writeInviteData(data: InviteData): Promise<void> {
  const dir = path.dirname(DATA_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }

  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

async function validateSlackInviteLink(url: string): Promise<boolean> {
  try {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      return false;
    }

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

      if (!response || typeof response.status === 'undefined') {
        return false;
      }

      return response.status >= 200 && response.status < 400;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error validating Slack invite link:', error);
    return false;
  }
}

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
