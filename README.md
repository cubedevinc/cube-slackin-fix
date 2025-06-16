# Cube Slack Invite Auto-Redirect

A server-side solution for automatic Slack invite link management with TTL handling.

## Features

- 🔄 Auto-refresh expired links via Slack API
- ⏰ Configurable TTL (30 days default)
- 🚀 Fast 302 redirects
- 🛡️ Graceful API error handling
- 📱 Manual link updates via API

## Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Local development:**
   ```bash
   pnpm dev
   ```

4. **Type checking:**
   ```bash
   pnpm type-check
   ```

5. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

## API Endpoints

- `GET /` - Redirect to current Slack invite link
- `POST /api/update-link` - Manually update invite link

## Environment Variables

- `SLACK_BOT_TOKEN` - Bot Token from Slack App
- `INVITE_LINK_TTL_DAYS` - TTL in days (default: 30)

## Slack App Setup

1. Create App at https://api.slack.com/apps
2. Add scope: `admin.invites:write`
3. Install App to workspace
4. Copy Bot Token to `.env.local`

## Local Development Setup

When cloning this repository for the first time:

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Set up initial link data (for development):**
   ```bash
   cp link.json.example link.json
   ```

   *Note: You can also manually update the link via the API endpoint once the server is running.*

3. **Configure Slack Bot Token (optional for development):**
   - Create a Slack App in your workspace
   - Add the bot token to `.env` file
   - This is only needed if you want to test automatic link generation
