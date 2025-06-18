# Slack Invite Redirect Service

A simple redirect service for Slack invitation links with an admin panel.

## Features

- 🚀 **Instant redirect** on the main page
- 🛡️ **Secure admin panel** with Auth0 authentication
- ⏰ **30-day TTL** tracking for each link
- 🔍 **Link validation** - manual and automated checking
- 📱 **Slack notifications** for expiring/broken links
- ⚡ **Automated monitoring** via Vercel Cron Functions
- 💾 **Simple JSON storage** - no database required
- 🎨 **Modern UI** with Tailwind CSS

## Quick Start

```bash
# Install dependencies
pnpm install

# Start in development mode
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Main Page
- Automatically redirects to the active invitation link
- Shows a message if the link is missing or expired

### Admin Panel `/admin`
- View current link and its status
- Add new links
- Display link lifetime (30 days)

## Project Structure

```
├── app/
│   ├── page.tsx                     # Main redirect page
│   ├── admin/page.tsx               # Admin panel with Auth0
│   └── api/
│       ├── invite/
│       │   ├── route.ts             # CRUD operations for invite links
│       │   └── validate/route.ts    # Manual link validation
│       ├── auth/[...auth0]/route.ts # Auth0 authentication
│       └── cron/check-invite/route.ts # Automated link checking
├── components/
│   └── AuthProvider.tsx            # Auth0 context provider
├── lib/
│   └── slack.ts                     # Slack notification utilities
├── data/
│   └── invite.example.json          # Example data structure (actual data/ ignored by git)
├── middleware.ts                    # Auth0 redirect middleware
└── vercel.json                      # Cron job configuration
```

### Key Components

- **Redirect Service**: Main page automatically redirects users to active Slack invite
- **Admin Panel**: Secure interface for managing invite links with Auth0 authentication
- **Link Validation**: Manual and automated checking of link accessibility
- **Slack Notifications**: Automated alerts for expiring/broken links
- **Cron Jobs**: Daily automated checks via Vercel Cron Functions

## Data Storage

The service uses simple JSON file storage in the `/data` directory. The actual data files are ignored by git for security.

- `data/invite.example.json` - Example structure (included in repo)
- `data/invite.json` - Actual data file (created automatically, ignored by git)

### Data Format

```json
{
  "url": "https://join.slack.com/t/workspace/shared_invite/...",
  "createdAt": "2025-06-17T12:00:00.000Z",
  "isActive": true
}
```

## API

### GET /api/invite
Get information about the current invite link

### POST /api/invite
Add a new invite link
```json
{
  "url": "https://join.slack.com/t/..."
}
```

### POST /api/invite/validate
Manually validate the current invite link

### GET /api/cron/check-invite
Automated cron endpoint for link monitoring (requires Bearer token)

## Auth0 Setup

To add authorization to the admin panel:

1. Create an application in Auth0
2. Add variables to `.env.local`:
```env
AUTH0_SECRET='your-secret'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
```

## Slack Notifications Setup

To enable Slack notifications for link monitoring:

1. Create a Slack App and add an Incoming Webhook
2. Add webhook URL to `.env.local`:
```env
SLACK_WEBHOOK_URL='https://hooks.slack.com/services/...'
CRON_SECRET='your-random-secret-key'
```

The service will automatically notify about:
- 🚨 Links expiring soon (≤ 5 days)
- ❌ Invalid/broken links
- ✅ Link updates

## License

MIT
