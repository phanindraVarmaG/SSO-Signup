# OAuth Configuration Guide

## Issues Fixed

✅ **Access Blocked Error** - Added domain validation to restrict OAuth to authorized accounts  
✅ **Internal Server Error (500)** - Added comprehensive error handling in OAuth callbacks  
✅ **Missing Configuration** - Added environment variable validation  
✅ **Hardcoded URLs** - All URLs now use configuration

---

## Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** and **Google Drive API**
4. Go to **APIs & Services** > **Credentials**
5. Click **Create Credentials** > **OAuth 2.0 Client ID**
6. Configure the OAuth consent screen:
   - User Type: External (or Internal for Google Workspace)
   - Add authorized domains
   - Add scopes: `email`, `profile`, `https://www.googleapis.com/auth/drive.readonly`
7. Create OAuth Client ID:
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `http://localhost:4000/auth/google/callback`
     - `http://localhost:4000/auth/google-drive/callback`
8. Copy your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Edit your `.env` file in the `backend/` directory:

```bash
# Required: Add your Google OAuth credentials
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback

# Optional: Restrict to specific email domains (comma-separated)
# Leave empty to allow all domains
ALLOWED_EMAIL_DOMAINS=yourcompany.com,anotherdomain.com

# Required: JWT Secret (change in production)
JWT_SECRET=your-secure-random-secret-key

# Other configurations (already set with defaults)
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### 3. Domain Restriction (Optional)

To restrict OAuth login to specific email domains:

```bash
# Allow only company emails
ALLOWED_EMAIL_DOMAINS=yourcompany.com

# Allow multiple domains
ALLOWED_EMAIL_DOMAINS=company1.com,company2.com

# Allow all domains (default)
# ALLOWED_EMAIL_DOMAINS=
```

### 4. Start the Application

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

---

## Error Handling

The application now handles these OAuth scenarios:

### ✅ Access Blocked for Unauthorized Domains

- **Scenario**: User tries to login with an email not in `ALLOWED_EMAIL_DOMAINS`
- **Response**: Redirects to `/login?error=access_denied&message=Access denied. Only emails from example.com are allowed.`
- **User sees**: "Access Denied: Only emails from example.com are allowed."

### ✅ OAuth Authentication Failed

- **Scenario**: OAuth flow fails or user cancels
- **Response**: Redirects to `/login?error=oauth_failed&message=Authentication failed`
- **User sees**: "OAuth Failed: Authentication failed"

### ✅ Internal Server Error

- **Scenario**: Backend error during token generation or database operations
- **Response**: Redirects to `/login?error=server_error&message=<error details>`
- **User sees**: "Server Error: <error details>"

---

## Testing

### Test 1: Authorized Domain Access

1. Set `ALLOWED_EMAIL_DOMAINS=gmail.com` in `.env`
2. Restart backend: `npm run start:dev`
3. Click "Sign in with Google (OIDC)"
4. Login with a Gmail account
5. **Expected**: Successfully redirected to dashboard

### Test 2: Blocked Domain Access

1. Keep `ALLOWED_EMAIL_DOMAINS=gmail.com`
2. Try to login with a non-Gmail account (e.g., Yahoo, Outlook)
3. **Expected**: Error message "Access denied. Only emails from gmail.com are allowed."

### Test 3: No Domain Restriction

1. Remove or comment out `ALLOWED_EMAIL_DOMAINS` in `.env`
2. Restart backend
3. Login with any Google account
4. **Expected**: Successfully redirected to dashboard

### Test 4: Google Drive OAuth

1. Click "Access Google Drive (OAuth)"
2. Grant Drive permissions
3. **Expected**: Redirected to OAuth demo page with access token

---

## Troubleshooting

### Issue: "redirect_uri_mismatch" Error

**Solution**: Verify that the redirect URI in Google Cloud Console exactly matches:

- `http://localhost:4000/auth/google/callback`
- `http://localhost:4000/auth/google-drive/callback`

### Issue: Still Getting 500 Error

**Checks**:

1. Verify `.env` file exists in `backend/` directory
2. Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
3. Restart the backend server after changing `.env`
4. Check backend console for detailed error logs

### Issue: Access Blocked for Authorized Accounts

**Checks**:

1. Verify the email domain is in `ALLOWED_EMAIL_DOMAINS`
2. Check for typos in domain names
3. Remove spaces around commas in the list
4. Make sure `.env` changes are loaded (restart server)

### Issue: Frontend Shows No Error

**Solution**:

- Clear browser cache and cookies
- Check browser console for JavaScript errors
- Verify frontend is running on `http://localhost:3000`

---

## Production Deployment

Before deploying to production:

1. **Update Redirect URIs** in Google Cloud Console:

   ```
   https://yourdomain.com/auth/google/callback
   https://yourdomain.com/auth/google-drive/callback
   ```

2. **Update Environment Variables**:

   ```bash
   GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
   FRONTEND_URL=https://yourdomain.com
   JWT_SECRET=<generate-secure-random-key>
   ALLOWED_EMAIL_DOMAINS=yourcompany.com
   ```

3. **Generate Secure JWT Secret**:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Enable HTTPS** for all OAuth redirects

---

## Architecture

```
User clicks "Sign in with Google"
    ↓
Frontend redirects to: /auth/google
    ↓
Backend (GoogleStrategy) redirects to Google
    ↓
User authorizes on Google
    ↓
Google redirects to: /auth/google/callback
    ↓
Backend (AuthController.googleAuthRedirect):
  - Validates email domain (if restricted)
  - Creates/updates user in database
  - Generates JWT token
  - Error handling for all scenarios
    ↓
Redirects to frontend:
  - Success: /auth/callback?token=<jwt>
  - Error: /login?error=<type>&message=<details>
    ↓
Frontend displays result or error message
```

---

## Need Help?

Check the backend logs for detailed error messages:

```bash
cd backend
npm run start:dev
# Watch the console output when testing OAuth
```
