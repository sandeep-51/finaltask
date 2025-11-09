# Complete Render Deployment Guide

## 🚀 Quick Deploy to Render.com

### Step 1: Prepare Your Repository

1. Make sure your code is pushed to GitHub
2. Ensure you have these files in your repository:
   - `package.json` ✅
   - `render.yaml` ✅ (already created)

### Step 2: Create Web Service on Render

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Render will auto-detect the `render.yaml` configuration

### Step 3: Configure Build Settings (if not using render.yaml)

If Render doesn't use the yaml file, manually set:

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm run start
```

**Important:** Add this environment variable in the Render dashboard:
```
NPM_CONFIG_PRODUCTION=false
```

This ensures Render installs devDependencies needed for the build process.

### Step 4: Add All Environment Variables

In Render Dashboard → Your Web Service → **Environment** tab, add:

#### MongoDB Configuration
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=YourApp
DATABASE_NAME=event_registration
```

#### Email Configuration (SendGrid)
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key-here
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Event Registration
```

#### Security & App Configuration
```
ADMIN_PASS=your-secure-admin-password
SESSION_SECRET=your-random-secret-key-here
NODE_ENV=production
SITE_URL=https://your-app.onrender.com
```

#### Build Configuration (CRITICAL)
```
NPM_CONFIG_PRODUCTION=false
```

### Step 5: Get SendGrid Email Working

1. **Sign up for SendGrid (FREE)**
   - Go to: https://signup.sendgrid.com/
   - Verify your email

2. **Create API Key**
   - Visit: https://app.sendgrid.com/settings/api_keys
   - Click "Create API Key"
   - Name: "Render Production"
   - Permission: "Full Access"
   - Copy the API key (save it!)

3. **Verify Sender Email**
   - Go to: https://app.sendgrid.com/settings/sender_auth
   - Click "Verify a Single Sender"
   - Enter your email details
   - Check your inbox and verify

4. **Use Verified Email**
   - Set `EMAIL_FROM` to your verified email
   - Example: `noreply@yourdomain.com`

### Step 6: Deploy

1. Click **"Create Web Service"** or **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Check logs for successful startup:
   ```
   ✅ Connected to MongoDB successfully!
   📧 Email Service Configuration:
   - Service: SMTP (Nodemailer)
   - Host: smtp.sendgrid.net
   - Auth: ✅ SET (apikey)
   ```

### Step 7: Update SITE_URL

After deployment:
1. Copy your Render URL (e.g., `https://your-app.onrender.com`)
2. Go back to Environment variables
3. Update `SITE_URL` with your actual Render URL
4. Render will auto-redeploy

---

## 📋 Complete Environment Variables Checklist

Copy this to Render → Environment tab:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=App
DATABASE_NAME=event_registration

# SendGrid Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Event Registration

# Security
ADMIN_PASS=your-secure-password-here
SESSION_SECRET=your-random-64-char-string-here
NODE_ENV=production

# App Configuration
SITE_URL=https://your-app.onrender.com

# Build Configuration (CRITICAL!)
NPM_CONFIG_PRODUCTION=false
```

---

## 🔧 Troubleshooting

### Build Fails: "vite: not found"

**Solution:** Add this environment variable:
```
NPM_CONFIG_PRODUCTION=false
```

This tells npm to install devDependencies which contain the build tools.

### Build Fails: "Cannot find module"

**Solution:** Clear build cache in Render:
1. Go to your service → Settings
2. Scroll to "Build & Deploy"
3. Click "Clear build cache"
4. Trigger a new deploy

### Emails Not Sending

**Check these:**
1. `SMTP_PASS` is your SendGrid API key (starts with `SG.`)
2. `SMTP_USER` is literally the word `apikey`
3. `EMAIL_FROM` is verified in SendGrid sender authentication
4. Check Render logs for email errors

### MongoDB Connection Issues

**Solution:**
1. Check your MongoDB Atlas IP whitelist (allow `0.0.0.0/0` for Render)
2. Verify connection string is correct
3. Ensure database user has read/write permissions

### App Works But QR Codes Have Wrong URL

**Solution:** Update `SITE_URL` to match your Render URL:
```
SITE_URL=https://your-actual-app.onrender.com
```

---

## 💡 Production Tips

### Free Tier Limitations
- Render free tier spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Upgrade to paid plan ($7/month) for always-on service

### Performance
- Enable "Auto-Deploy" for automatic updates when you push to GitHub
- Use "Manual Deploy" for better control in production

### Monitoring
- Check Render logs regularly: Dashboard → Your Service → Logs
- Set up uptime monitoring (UptimeRobot, Better Uptime)

---

## 🎯 Success Checklist

Before going live, verify:

- [ ] App loads at your Render URL
- [ ] Admin login works
- [ ] Can create event forms
- [ ] Public registration form is accessible
- [ ] Test registration sends QR code email
- [ ] QR code contains correct URL
- [ ] Scanner page works
- [ ] All environment variables are set
- [ ] MongoDB is connected
- [ ] SendGrid is verified and working

---

## 📞 Support

If you encounter issues:
1. Check Render logs first
2. Verify all environment variables
3. Test SendGrid independently
4. Check MongoDB Atlas IP whitelist
5. Review this guide again

Your app is now production-ready! 🎉
