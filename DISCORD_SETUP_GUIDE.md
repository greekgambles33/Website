# Discord OAuth & Kick Verification Setup

## 1. Create a Discord application

1. Go to https://discord.com/developers/applications and create a new application.
2. Under **OAuth2 → General**, copy the **Client ID** and generate/copy the **Client Secret**.
3. Under **OAuth2 → General → Redirects**, add:
   - `http://localhost:3001/api/auth/discord/callback` (local dev)
   - your production backend URL + `/api/auth/discord/callback` (once deployed)
   The redirect URI must match `DISCORD_REDIRECT_URI` in `backend/.env` exactly, including protocol.
4. Scopes used: `identify email guilds` (`guilds` is only needed if you enable server-membership gating below).

## 2. Configure `backend/.env`

Copy `backend/.env.example` to `backend/.env` and fill in:

```
DISCORD_CLIENT_ID=<from step 1>
DISCORD_CLIENT_SECRET=<from step 1>
DISCORD_REDIRECT_URI=http://localhost:3001/api/auth/discord/callback
```

`ADMIN_DISCORD_IDS` — comma-separated Discord user IDs that should be treated as admins (right-click your user with Developer Mode on → Copy User ID).

### Optional: require Discord server membership to log in

Set `DISCORD_REQUIRE_SERVER_MEMBERSHIP=true`, `DISCORD_GUILD_ID=<your server ID>`, and `DISCORD_INVITE_URL=<invite link>`.

## 3. Kick chat verification

Users prove ownership of a Kick account by posting `!verify <CODE>` in your live Kick chat — no Kick OAuth app is required.

1. `KICK_CHANNEL_NAME` — your channel slug (`kick.com/<slug>`).
2. `KICK_CHATROOM_ID` — the numeric chatroom ID. Find it by visiting `https://kick.com/api/v2/channels/<KICK_CHANNEL_NAME>` and reading the `chatroom.id` field.
3. `KICK_BOT_TOKEN` — optional. Without it, verification still works, but the bot won't post a confirmation message back into chat.

The backend connects to Kick's websocket chat feed on boot and listens for the verify command; see `backend/src/services/KickChatService.ts`. This is unofficial (Kick has no public chat API) — if Kick changes their websocket infrastructure, the `PUSHER_APP_KEY`/URL in that file may need updating.

## 4. Local database & Redis

```bash
cd backend
docker-compose up -d
npm install
npx prisma migrate dev
npm run dev
```

## 5. Frontend

```bash
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev
```

Visit http://localhost:3000, click **Login with Discord**, and after granting access you should land back on the site logged in. Then go to `/profile` to link your Kick account.

## Troubleshooting

- **Invalid OAuth2 redirect_uri** — the redirect URI in the Discord app settings doesn't exactly match `DISCORD_REDIRECT_URI`.
- **Invalid client_id/secret** — double check you copied them from the same Discord application.
- **Kick verification never confirms** — check `KICK_CHATROOM_ID` is correct and the backend logs show `[kick-chat] subscribed to chatroom ...` on startup.
