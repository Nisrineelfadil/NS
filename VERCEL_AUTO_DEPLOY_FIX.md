# Vercel Automatic Deployment Fix Guide

## Problem
Deployments are queued in Vercel but not automatically building/deploying after GitHub pushes.

## Solution Steps

### 1. Reconnect GitHub Integration

1. Go to your Vercel dashboard: https://vercel.com/zayddahhaoui0609/nisrine-school
2. Click on **Settings** tab
3. Go to **Git** section
4. Check if GitHub repository is properly connected
5. If disconnected, click **Connect Git Repository**
6. Select: `Zayddahhaoui0609/ns`
7. Click **Connect**

### 2. Configure Build & Development Settings

Go to **Settings** → **General**:

**Framework Preset:** Other
**Root Directory:** `./` (leave empty or use `./`)
**Build Command:** `npm install`
**Output Directory:** Leave empty (we're using serverless functions)
**Install Command:** `npm install`

### 3. Configure Environment Variables

Go to **Settings** → **Environment Variables** and add:

```
NODE_ENV=production
VERCEL=1
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
VAPID_PUBLIC_KEY=<your-vapid-public-key>
VAPID_PRIVATE_KEY=<your-vapid-private-key>
VAPID_CONTACT_EMAIL=<your-email>
MEGA_EMAIL=<your-mega-email>
MEGA_PASSWORD=<your-mega-password>
```

**Important:** Make sure all environment variables are set for **Production**, **Preview**, and **Development** environments.

### 4. Configure Deployment Settings

Go to **Settings** → **Git**:

- ✅ **Production Branch:** `master` or `main`
- ✅ **Automatically Deploy:** Enabled
- ✅ **Deploy Hooks:** Can be used for manual triggers

### 5. Fix Ignored Build Step

Sometimes Vercel ignores builds. Go to **Settings** → **Git** → **Ignored Build Step**:

Make sure it's set to: **Not set** or use this command:

```bash
git diff HEAD^ HEAD --quiet .
```

This ensures every push triggers a build.

### 6. Check Build Logs

If deployments are still queued:

1. Go to **Deployments** tab
2. Click on the queued deployment
3. Check the build logs for errors
4. Common issues:
   - Missing environment variables
   - Build timeout (increase in Settings → Functions → Max Duration)
   - Memory limit exceeded
   - Dependencies not installing

### 7. Trigger Manual Deployment

To test if everything works:

1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Select **Use existing Build Cache** (unchecked)
4. Click **Redeploy**

### 8. Verify Webhook

Go to your GitHub repository:
1. Settings → Webhooks
2. You should see a Vercel webhook: `https://api.vercel.com/v1/integrations/deploy/...`
3. Click on it and check **Recent Deliveries**
4. If failing, click **Redeliver** to test

### 9. Update vercel.json (Already Done)

Your `vercel.json` is already configured correctly:

```json
{
  "version": 2,
  "installCommand": "npm install",
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node",
      "config": {
        "maxDuration": 60,
        "includeFiles": [...]
      }
    }
  ],
  "routes": [...]
}
```

### 10. Common Issues & Fixes

#### Issue: "Deployment Queued" Forever
**Fix:** 
- Check if you have exceeded Vercel's free tier limits
- Verify payment method if on paid plan
- Contact Vercel support

#### Issue: Build Fails with "Command not found"
**Fix:**
- Ensure `package.json` has correct scripts
- Check Node.js version compatibility

#### Issue: Environment Variables Not Working
**Fix:**
- Redeploy after adding environment variables
- Make sure variables are set for all environments

#### Issue: Files Not Found (404)
**Fix:**
- Check `includeFiles` in `vercel.json`
- Verify `.vercelignore` is not excluding necessary files

### 11. Force Rebuild Command

If you need to force a deployment from CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy to production
vercel --prod
```

### 12. Check Vercel Status

Visit: https://www.vercel-status.com/
- Check if Vercel is experiencing outages
- Check if GitHub integration is down

## Quick Fix Checklist

- [ ] GitHub repository is connected in Vercel
- [ ] All environment variables are set
- [ ] Build command is `npm install`
- [ ] Production branch is set to `master`
- [ ] Automatic deployments are enabled
- [ ] No ignored build step is configured
- [ ] Webhook exists in GitHub repository
- [ ] No Vercel service outages
- [ ] Not exceeding free tier limits
- [ ] Latest push is visible in Vercel deployments

## Testing Automatic Deployment

1. Make a small change to any file (e.g., add a comment)
2. Commit: `git commit -am "Test auto-deploy"`
3. Push: `git push origin master`
4. Go to Vercel dashboard → Deployments
5. You should see a new deployment building (not queued)
6. Wait for it to complete
7. Visit your site to verify changes

## Contact Support

If none of the above works:
- Vercel Support: https://vercel.com/support
- Discord: https://vercel.com/discord
- GitHub Issues: https://github.com/vercel/vercel/issues

## Notes

- Deployments typically take 1-3 minutes
- First deployment after reconnecting may take longer
- Check email for Vercel deployment notifications
- Enable Slack/Discord notifications for deployment status
