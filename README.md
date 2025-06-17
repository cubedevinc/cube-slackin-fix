# Slack Invite Redirect Service

A simple redirect service for Slack invitation links with an admin panel.

## Features

- 🚀 Instant redirect on the main page
- 🛡️ Admin panel for managing links
- ⏰ 30-day TTL for each link
- 💾 Simple JSON file storage
- 🎨 Modern UI with Tailwind CSS

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
│   ├── page.tsx              # Main page with redirect
│   ├── admin/
│   │   └── page.tsx          # Admin panel
│   └── api/
│       └── invite/
│           └── route.ts      # API for working with links
├── data/
│   └── invite.json           # Link data storage
└── README.md
```

## Data Format

```json
{
  "url": "https://join.slack.com/t/workspace/shared_invite/...",
  "createdAt": "2024-06-17T12:00:00.000Z",
  "isActive": true
}
```

## API

### GET /api/invite
Get information about the current link

### POST /api/invite
Add a new link
```json
{
  "url": "https://join.slack.com/t/..."
}
```

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
3. Uncomment Auth0 code in the corresponding files


### Other Platforms
Make sure the `data/` folder is writable or use external storage.

## License

MIT
