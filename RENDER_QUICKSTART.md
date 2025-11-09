# ⚡ Render.com Quick Start Guide

## Step 1: Configure on Render Dashboard

### Build Command:
```
NPM_CONFIG_PRODUCTION=false npm install && npm run build
```

### Start Command:
```
npm run start
```

## Step 2: Add Environment Variables

In Render Dashboard → Environment tab, add these:

### Email (SendGrid - FREE)
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=get-from-sendgrid.com
EMAIL_FROM=your-verified-email@domain.com
EMAIL_FROM_NAME=Event Registration
```

**Get SendGrid API Key:**
1. Sign up: https://signup.sendgrid.com/
2. Get API key: https://app.sendgrid.com/settings/api_keys
3. Verify sender: https://app.sendgrid.com/settings/sender_auth

### Database & App Config
```
MONGODB_URI=your-mongodb-connection-string
DATABASE_NAME=event_registration
ADMIN_PASS=your-secure-password
SESSION_SECRET=your-random-secret
NODE_ENV=production
SITE_URL=https://your-app.onrender.com
```

## Step 3: Deploy

Click "Create Web Service" → Wait 2-5 minutes → Done! 🎉

---

## Why This Build Command?

The `NPM_CONFIG_PRODUCTION=false` flag tells npm to install devDependencies (which contain build tools like `vite` and `esbuild`). Without it, the build fails with "vite: not found".

## Troubleshooting

**Build still failing?**
- Make sure build command is EXACTLY: `NPM_CONFIG_PRODUCTION=false npm install && npm run build`
- Check you have both `npm run build` and `npm run start` scripts in package.json ✅

**Emails not working?**
- Verify `EMAIL_FROM` in SendGrid sender authentication
- Make sure `SMTP_USER` is literally the word `apikey`
- Check `SMTP_PASS` is your SendGrid API key (starts with `SG.`)
