import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { SlackNotifications } from '@/lib/slack-notifications';

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

function isInviteExpired(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffInDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
  return diffInDays > 30;
}

export async function GET() {
  try {
    const data = await readInviteData();
    const isExpired = isInviteExpired(data.createdAt);

    return NextResponse.json({
      ...data,
      isActive: data.isActive && !isExpired
    });
  } catch {
    return NextResponse.json({ error: 'Error reading data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const oldData = await readInviteData();

    const newData: InviteData = {
      url,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    await writeInviteData(newData);

    if (oldData.url && oldData.url !== url) {
      await SlackNotifications.linkUpdated(oldData.url, url);
    }

    return NextResponse.json(newData);
  } catch {
    return NextResponse.json({ error: 'Error saving data' }, { status: 500 });
  }
}
