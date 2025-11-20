# Vercel Repository Connection Fix

## Problem Identified ✅

Your Vercel project is **NOT connected** to the GitHub repository `Zayddahhaoui0609/ns` on the `master` branch.

This is why:
- ✅ Commits appear in GitHub
- ❌ Vercel doesn't auto-deploy
- ❌ Changes don't reach production

## Solution: Reconnect Vercel to GitHub

### Option 1: Reconnect in Vercel Dashboard (RECOMMENDED)

#### Step 1: Go to Vercel Project Settings
1. Visit: https://vercel.com/dashboard
2. Find and click on your project: `nisrine-school`
3. Click **Settings** (gear icon)

#### Step 2: Check Git Connection
1. In Settings, click **Git** in the left sidebar
2. Look at "Connected Git Repository"
3. You'll see one of these scenarios:

**Scenario A: No Repository Connected**
- Click **Connect Git Repository**
- Select **GitHub**
- Authorize Vercel to access your GitHub
- Select repository: `Zayddahhaoui0609/ns`
- Select branch: `master`
- Click **Connect**

**Scenario B: Wrong Repository Connected**
- Click **Disconnect** next to the current repository
- Then follow Scenario A steps

**Scenario C: Correct Repository but Wrong Branch**
- Under "Production Branch", change to: `master`
- Click **Save**

#### Step 3: Verify Connection
After connecting, you should see:
- ✅ Repository: `Zayddahhaoui0609/ns`
- ✅ Production Branch: `master`
- ✅ Auto-deploy: Enabled

#### Step 4: Trigger First Deployment
1. Go to **Deployments** tab
2. Click **Create Deployment**
3. Select branch: `master`
4. Click **Deploy**

---

### Option 2: Import Project Fresh (If Option 1 Fails)

If the Git connection is broken or you can't reconnect:

#### Step 1: Note Your Current Settings
Before doing anything, save these from your current Vercel project:
- Domain name (e.g., nisrine-school.vercel.app)
- All Environment Variables (Settings → Environment Variables)
- Any custom domains

#### Step 2: Import New Project
1. Go to: https://vercel.com/new
2. Click **Import Git Repository**
3. If you don't see your repo, click **Adjust GitHub App Permissions**
4. Select repository: `Zayddahhaoui0609/ns`
5. Click **Import**

#### Step 3: Configure Project
1. **Project Name:** `nisrine-school` (or your preferred name)
2. **Framework Preset:** Other
3. **Root Directory:** `./` (leave as is)
4. **Build Command:** Leave empty
5. **Output Directory:** Leave empty
6. Click **Deploy**

#### Step 4: Add Environment Variables
1. Go to **Settings** → **Environment Variables**
2. Add all your environment variables:
   ```
   MONGODB_URI = mongodb+srv://nisrine_admin:<password>@nisrineschool.c0pgjgg.mongodb.net/?retryWrites=true&w=majority&appName=nisrineschool
   JWT_SECRET = your-super-secret-jwt-key-change-this-in-production
   NODE_ENV = production
   VAPID_PUBLIC_KEY = <your-key>
   VAPID_PRIVATE_KEY = <your-key>
   VAPID_CONTACT_EMAIL = admin@nisrineschool.com
   ```
3. Set for: **Production**, **Preview**, and **Development**
4. Click **Save**

#### Step 5: Redeploy
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment

#### Step 6: Update Domain (if needed)
If you had a custom domain on the old project:
1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed

---

### Option 3: Use Vercel CLI

If you prefer command line:

#### Step 1: Install Vercel CLI (if not installed)
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Link Project
```bash
cd c:\Users\Zayd\Desktop\Dev\Nis
vercel link
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **Y** (if you want to keep the same project)
- What's the name of your existing project? **nisrine-school**

#### Step 4: Deploy
```bash
vercel --prod
```

This will deploy directly from your local files.

---

## After Reconnecting

### 1. Verify Auto-Deploy Works
Make a small change to test:

```bash
cd c:\Users\Zayd\Desktop\Dev\Nis
echo "# Test" >> test.txt
git add test.txt
git commit -m "Test auto-deploy"
git push origin master
```

Then check Vercel dashboard - you should see a new deployment start automatically.

### 2. Add Environment Variables (CRITICAL)

Even after reconnecting, you MUST add environment variables:

1. Go to: https://vercel.com/dashboard
2. Select your project
3. **Settings** → **Environment Variables**
4. Add:
   ```
   MONGODB_URI = <your-mongodb-uri>
   JWT_SECRET = <your-jwt-secret>
   NODE_ENV = production
   ```
5. Click **Save**
6. **Redeploy** from Deployments tab

### 3. Test Deployment

After deployment completes:

**Test 1: Health Check**
```
https://nisrine-school.vercel.app/api/health
```
Should return: `{"status":"ok",...}`

**Test 2: Homepage**
```
https://nisrine-school.vercel.app/
```
Should load without 500 error

**Test 3: Check Logs**
- Vercel Dashboard → Deployment → Functions → api/index.js
- Look for: "✅ Express app loaded successfully"

---

## Troubleshooting

### "Repository not found" in Vercel
- Go to: https://github.com/settings/installations
- Find "Vercel"
- Click **Configure**
- Under "Repository access", select "All repositories" or add `ns` specifically
- Click **Save**

### "Permission denied" when connecting
- Make sure you're the owner of the GitHub repository
- Or ask the owner to add you as a collaborator with admin access

### Vercel still not deploying after connection
1. Check **Settings** → **Git** → Production Branch is `master`
2. Check **Settings** → **Git** → Auto-deploy is enabled
3. Make a new commit to trigger deployment
4. Or manually click **Redeploy** in Deployments tab

---

## Quick Checklist

- [ ] Vercel project connected to `Zayddahhaoui0609/ns`
- [ ] Production branch set to `master`
- [ ] Auto-deploy enabled
- [ ] Environment variables added (MONGODB_URI, JWT_SECRET, NODE_ENV)
- [ ] Test deployment successful
- [ ] Health endpoint returns 200 OK
- [ ] Homepage loads without 500 error

---

## Current Status

✅ **Code fixes:** Complete and pushed to GitHub
✅ **GitHub repository:** https://github.com/Zayddahhaoui0609/ns
✅ **Latest commit:** aa14086 (Trigger Vercel deployment)
⚠️ **Vercel connection:** Needs to be configured
⚠️ **Environment variables:** Need to be added in Vercel

**Next Action:** Follow Option 1 above to reconnect Vercel to your GitHub repository.

---

**Last Updated:** November 20, 2025 at 3:20 AM
