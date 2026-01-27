# 🔴 URGENT: Fix "OAuth client was not found" Error

## The Problem

Your `backend/.env` file has placeholder values:
```bash
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
```

Google is rejecting these because they're not real credentials.

---

## Solution: Get Real Google OAuth Credentials

### Step 1: Go to Google Cloud Console
Open: https://console.cloud.google.com/apis/credentials

### Step 2: Create or Select a Project
- Click the project dropdown at the top
- Either select an existing project or create a new one
- Name it something like "SSO-SignIn-App"

### Step 3: Configure OAuth Consent Screen (First Time Only)
1. Click "OAuth consent screen" in the left sidebar
2. Select "External" user type (unless you have Google Workspace)
3. Click "Create"
4. Fill in required fields:
   - **App name**: SSO SignIn Demo
   - **User support email**: Your email
   - **Developer contact**: Your email
5. Click "Save and Continue"
6. On Scopes page, click "Save and Continue"
7. On Test users page:
   - Click "Add Users"
   - Add your email: `phanindra@divami.com`
   - Click "Save and Continue"

### Step 4: Create OAuth 2.0 Client ID
1. Click "Credentials" in the left sidebar
2. Click "+ CREATE CREDENTIALS" at the top
3. Select "OAuth client ID"
4. Choose "Web application"
5. Give it a name: "SSO App"
6. Under "Authorized redirect URIs", click "ADD URI" and add:
   ```
   http://localhost:4000/auth/google/callback
   ```
7. Click "ADD URI" again and add:
   ```
   http://localhost:4000/auth/google-drive/callback
   ```
8. Click "CREATE"

### Step 5: Copy Your Credentials
A popup will show your credentials:
- **Client ID**: Something like `123456789-abc123xyz.apps.googleusercontent.com`
- **Client secret**: Something like `GOCSPX-abcdefghijklmnop`

**DO NOT CLOSE THIS POPUP YET!**

---

## Step 6: Update Your .env File

### Option A: Manual Edit (Recommended)
1. Open the file: `backend/.env`
2. Find these lines:
   ```bash
   GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
   GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
   ```
3. Replace with your actual values from Google:
   ```bash
   GOOGLE_CLIENT_ID=123456789-abc123xyz.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
   ```
4. Save the file

### Option B: Use Terminal (Copy your values first!)
Run this command after replacing with YOUR actual values:
```bash
cd backend
# Replace these with YOUR actual credentials!
echo "GOOGLE_CLIENT_ID=paste-your-client-id-here" >> .env.temp
echo "GOOGLE_CLIENT_SECRET=paste-your-secret-here" >> .env.temp
```

---

## Step 7: Restart Backend

After updating `.env`:
```bash
# Kill current backend
lsof -ti:4000 | xargs kill -9

# Start backend again
cd backend
npm start
```

---

## Step 8: Test Again

1. Go to: http://localhost:3000/login
2. Click "Sign in with Google (OIDC)"
3. You should now see Google's login page (not the error!)
4. Login with: `phanindra@divami.com` (must be added as test user)

---

## Quick Verification Checklist

Before testing:
- [ ] Created project in Google Cloud Console
- [ ] Configured OAuth consent screen
- [ ] Created OAuth 2.0 Client ID
- [ ] Added redirect URI: `http://localhost:4000/auth/google/callback`
- [ ] Copied Client ID and Client Secret
- [ ] Updated `backend/.env` with real values
- [ ] Restarted backend server
- [ ] Added your email as test user in OAuth consent screen

---

## Common Mistakes to Avoid

❌ **Don't** leave placeholder text:
```bash
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE  # ← This won't work!
```

✅ **Do** use actual credentials:
```bash
GOOGLE_CLIENT_ID=123456789-abc123xyz.apps.googleusercontent.com
```

❌ **Don't** forget the redirect URI in Google Console:
```
http://localhost:4000/auth/google/callback
```

❌ **Don't** forget to add yourself as a test user in OAuth consent screen

✅ **Do** restart the backend after changing `.env`

---

## Still Getting Errors?

### Error: "Access blocked: This app's request is invalid"
**Solution**: Add the redirect URI in Google Cloud Console

### Error: "invalid_client" (still)
**Solutions**:
1. Check for spaces or quotes around credentials in `.env`
2. Make sure you copied the FULL client ID (it's long!)
3. Verify you saved the `.env` file
4. Restart the backend server

### Error: "Access blocked: Authorization Error"
**Solution**: Add your email as a test user in OAuth consent screen

---

## Need Help?

The credentials should look like this in your `.env`:
```bash
# Real example format (not your actual values):
GOOGLE_CLIENT_ID=123456789-abc123def456ghi789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-1234567890abcdefghij
```

**DO THIS NOW**:
1. Open Google Cloud Console
2. Get your credentials
3. Update `backend/.env`
4. Restart backend
5. Test login
