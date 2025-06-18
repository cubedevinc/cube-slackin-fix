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

# Copy environment variables template
cp .env.example .env.local

# Configure your variables in .env.local
# (See Environment Variables section below)

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
│   ├── invite-utils.ts              # Centralized utilities for invite data operations
│   └── slack-notifications.ts      # Slack notification utilities
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
- **Centralized Utilities**: All invite data operations consolidated in `lib/invite-utils.ts`

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

## Testing

The project includes comprehensive test coverage using **Vitest** and **Testing Library**.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

### Test Structure

```
tests/
├── setup.ts                      # Test environment configuration
└── api/
    ├── invite-api.test.ts         # API endpoint tests (4 tests)
    ├── validate-api.test.ts       # Validation endpoint tests (2 tests)
    └── slack-notifications.test.ts # Slack notification logic tests (8 tests)
```

### Test Coverage

- **✅ API Endpoints**: All CRUD operations and validation endpoints
- **✅ Slack Notifications**: Complete logic testing without real HTTP requests
- **✅ Error Handling**: Edge cases and error scenarios
- **✅ Data Validation**: Input validation and response formatting

**Total: 14 tests** covering all critical functionality.

### Test Philosophy

- **Unit tests** for isolated logic (Slack notifications)
- **Integration tests** for API endpoints
- **Mocked external dependencies** (no real Slack webhooks in tests)
- **Clean test output** (console warnings suppressed during testing)

## Code Architecture

The project follows modern software engineering principles with a focus on maintainability and code reuse:

### Centralized Utilities (`lib/invite-utils.ts`)

All invite data operations are consolidated in a single module:
- **InviteData interface** - Single source of truth for data types
- **File operations** - `readInviteData()`, `writeInviteData()`
- **Validation logic** - `validateSlackInviteLink()`, `isInviteExpired()`
- **Date calculations** - `getDaysLeft()`

### Benefits

- **DRY Principle**: No code duplication across API endpoints
- **Type Safety**: Consistent TypeScript interfaces throughout
- **Maintainability**: Changes to data logic require updates in one place only
- **Testability**: Centralized functions are easier to unit test

### Before vs After Optimization

**Before**: 5+ files with duplicate InviteData interfaces, 4 files with duplicate read/write functions
**After**: 1 centralized utility module, clean separation of concerns

## Environment Variables

### For Local Development (`.env.local`)

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Or create a `.env.local` file manually:

```env
# Auth0 Configuration
AUTH0_SECRET='your-random-secret-key'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'

# Slack Configuration
SLACK_WEBHOOK_URL='https://hooks.slack.com/services/...'

# Cron Job Security
CRON_SECRET='your-random-secret-key'
```

### For Vercel Deployment

In your Vercel project settings, add these environment variables:

```env
# Auth0 Configuration (AUTH0_BASE_URL is auto-detected)
AUTH0_SECRET='your-random-secret-key'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'

# Slack Configuration
SLACK_WEBHOOK_URL='https://hooks.slack.com/services/...'

# Cron Job Security
CRON_SECRET='your-random-secret-key'
```

> **Note:** `AUTH0_BASE_URL` is automatically determined in Vercel using `VERCEL_URL` environment variable and works for both custom domains and preview deployments.

## Auth0 Setup

To add authorization to the admin panel:

1. Create an application in Auth0
2. Configure Allowed Callback URLs:
   - `http://localhost:3000/api/auth/callback` (development)
   - `https://your-domain.com/api/auth/callback` (production)
   - `https://*.vercel.app/api/auth/callback` (preview deployments)
3. Configure Allowed Logout URLs:
   - `http://localhost:3000` (development)
   - `https://your-domain.com` (production)
   - `https://*.vercel.app` (preview deployments)

## Slack Notifications Setup

To enable Slack notifications for link monitoring:

1. Create a Slack App and add an Incoming Webhook
2. Add the webhook URL to your environment variables

The service will automatically notify about:
- 🚨 Links expiring soon (≤ 5 days)
- ❌ Invalid/broken links
- ✅ Link updates

## License

MIT
