# ⚠️ CRITICAL: Setup Required NOW

## The 500 Error is Because:

Your `.env` file was missing the **JWT_SECRET** (required for token generation) and has placeholder values for Google OAuth credentials.

## Fix Steps (Do This Now):

### Step 1: Get Google OAuth Credentials

1. Go to: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (or use existing)
3. Add redirect URI: `http://localhost:4000/auth/google/callback`
4. Copy your **Client ID** and **Client Secret**

### Step 2: Update .env File

Open `backend/.env` and replace these lines:

```bash
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
```

With your actual credentials:

```bash
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-actual-secret-here
```

### Step 3: Restart Backend

```bash
cd backend
npm run start:dev
```

---

## Current .env Status:

✅ **JWT_SECRET** - Now set (dev-secret-key...)
✅ **PORT** - Set to 4000
✅ **FRONTEND_URL** - Set to http://localhost:3000
❌ **GOOGLE_CLIENT_ID** - Need your actual value
❌ **GOOGLE_CLIENT_SECRET** - Need your actual value

---

## Quick Test Without Google OAuth:

If you want to test the app immediately without Google OAuth:

1. Go to http://localhost:3000/register
2. Create an account with email/password
3. Login with that account

This will work immediately since JWT_SECRET is now configured!

---

## Why This Happened:

Your `.env.example` had empty values:
```bash
JWT_SECRET=          # ← This was empty!
GOOGLE_CLIENT_ID=    # ← This was empty!
```

The backend **requires** JWT_SECRET to sign tokens. Without it, any login attempt fails with 500 error.

---

## Next Steps:

1. ✅ JWT_SECRET is now set - backend will work for email/password login
2. ⏳ Add Google credentials to `.env` file
3. ⏳ Restart backend: `npm run start:dev`
4. ✅ Test login!
