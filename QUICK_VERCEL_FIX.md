# Quick Vercel Auto-Deploy Fix

## Problem
✅ Code pushed to GitHub successfully
❌ Vercel shows "Deployment Queued" but doesn't build automatically

## Quick Fix Steps (5 minutes)

### Step 1: Check GitHub Connection
1. Go to: https://vercel.com/zayddahhaoui0609/nisrine-school/settings/git
2. Verify repository is connected: `Zayddahhaoui0609/ns`
3. If disconnected, click **"Connect Git Repository"** and reconnect

### Step 2: Enable Auto-Deploy
1. Go to: https://vercel.com/zayddahhaoui0609/nisrine-school/settings/git
2. Find **"Production Branch"** → Set to: `master`
3. Enable **"Automatically Deploy"** checkbox
4. Save changes

### Step 3: Remove Ignored Build Step
1. Go to: https://vercel.com/zayddahhaoui0609/nisrine-school/settings/git
2. Scroll to **"Ignored Build Step"**
3. Make sure it's empty or set to: `exit 0`
4. Save changes

### Step 4: Verify Environment Variables
1. Go to: https://vercel.com/zayddahhaoui0609/nisrine-school/settings/environment-variables
2. Make sure these are set for **Production**:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV` = `production`
   - `VERCEL` = `1`
   - All other required variables

### Step 5: Trigger Manual Deploy
1. Go to: https://vercel.com/zayddahhaoui0609/nisrine-school/deployments
2. Click on the latest queued deployment
3. Click **"Redeploy"**
4. Uncheck **"Use existing Build Cache"**
5. Click **"Redeploy"**

### Step 6: Test Auto-Deploy
```bash
# Make a test change
git commit --allow-empty -m "Test auto-deploy"
git push origin master
```

Watch Vercel dashboard - should see new deployment building (not queued)

## Common Issues

### Issue: Still Queued After Manual Deploy
**Solution:** Contact Vercel support - might be account/billing issue

### Issue: Build Fails
**Solution:** Check build logs for errors:
1. Click on failed deployment
2. Check **"Build Logs"** tab
3. Fix errors in code
4. Push again

### Issue: Environment Variables Not Working
**Solution:** 
1. Add variables for all environments (Production, Preview, Development)
2. Redeploy after adding variables

## Verify It's Working

✅ **Signs of successful auto-deploy:**
- New deployment appears immediately after push
- Status changes from "Queued" to "Building" within seconds
- Build completes in 1-3 minutes
- Deployment URL is updated

❌ **Signs it's not working:**
- Deployment stays "Queued" for more than 1 minute
- No new deployment appears after push
- Need to manually click "Redeploy" every time

## Alternative: Deploy from CLI

If dashboard doesn't work, use CLI:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Link project (if not linked)
vercel link

# Deploy to production
vercel --prod
```

## Need Help?

1. **Check Vercel Status:** https://www.vercel-status.com/
2. **Vercel Support:** https://vercel.com/support
3. **Full Guide:** See `VERCEL_AUTO_DEPLOY_FIX.md`

---

**Quick Checklist:**
- [ ] GitHub repository connected
- [ ] Production branch set to `master`
- [ ] Auto-deploy enabled
- [ ] No ignored build step
- [ ] Environment variables set
- [ ] Manual deploy works
- [ ] Test push triggers auto-deploy

**Time Required:** 5 minutes
**Difficulty:** Easy
