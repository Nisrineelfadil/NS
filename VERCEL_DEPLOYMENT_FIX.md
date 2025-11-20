# 🔧 Vercel Deployment Fix - 500 Internal Server Error

## 🔍 The Problem

Your site is showing:
```
500 INTERNAL_SERVER_ERROR
Code: FUNCTION_INVOCATION_FAILED
```

This means the serverless function is crashing on startup.

---

## ✅ Solution: Add All Environment Variables to Vercel

### **Step 1: Go to Vercel Dashboard**

1. Go to: https://vercel.com/dashboard
2. Click on your project: **nisrine-school**
3. Go to: **Settings** → **Environment Variables**

### **Step 2: Add ALL These Environment Variables**

Copy these from your local `.env` file and add them to Vercel:

#### **Required Variables:**

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000
NODE_ENV=production
```

#### **Push Notification Variables:**

```
VAPID_PUBLIC_KEY=BCbeMTAJK70vt9_Mnz5VbECAUBiHHjEp06Wz0rNrL4YMEPdmUb0LCNrzFW1NhZo42On3lalcs1GA2LRgVTryhPs
VAPID_PRIVATE_KEY=h80nq3B0D2uGgeucVaZrAjqtDXxMd-k_2sc60GJ5LIM
VAPID_CONTACT_EMAIL=admin@nisrineschool.com
```

#### **Optional Variables (if you have them):**

```
ADMIN_EMAIL=your_admin_email
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

### **Step 3: Apply to All Environments**

For each variable, make sure to select:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

### **Step 4: Redeploy**

After adding all variables:
1. Go to: **Deployments** tab
2. Click on the latest deployment
3. Click: **⋯** (three dots) → **Redeploy**
4. Wait for deployment to complete

---

## 🔍 Check Your Local .env File

To see what variables you need, check your local `.env` file:

```bash
# On Windows PowerShell:
Get-Content .env
```

Look for all variables that start with uppercase letters (like `MONGODB_URI`, `JWT_SECRET`, etc.)

---

## ⚠️ Critical Variables

The most important ones that MUST be set:

### **1. MONGODB_URI**
Without this, the app cannot connect to the database and will crash immediately.

Example:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
```

### **2. JWT_SECRET**
Without this, authentication will fail.

Example:
```
JWT_SECRET=your-super-secret-key-here-make-it-long-and-random
```

### **3. VAPID Keys**
Without these, push notifications won't work (but the site should still load).

---

## 🎯 Quick Checklist

Before redeploying, verify:

- [ ] `MONGODB_URI` is set in Vercel
- [ ] `JWT_SECRET` is set in Vercel
- [ ] `NODE_ENV=production` is set
- [ ] `VAPID_PUBLIC_KEY` is set
- [ ] `VAPID_PRIVATE_KEY` is set
- [ ] `VAPID_CONTACT_EMAIL` is set
- [ ] All variables are applied to **Production**
- [ ] Clicked **Redeploy**

---

## 📊 After Redeployment

Once redeployed, check:

1. **Deployment Logs**:
   - Go to Deployments → Click latest → View Function Logs
   - Look for: `✅ MongoDB Connected Successfully!`
   - Look for: `✅ Push notification service initialized`

2. **Test the Site**:
   - Main page should load
   - Images and videos should appear
   - PWA should work

3. **Test Push Notifications**:
   - Open PWA on iPhone
   - Go to Settings
   - Enable notifications
   - Send test message

---

## 🔧 Alternative: Check Vercel Logs

To see the exact error:

1. Go to Vercel Dashboard
2. Click on your project
3. Go to: **Deployments**
4. Click on the failed deployment
5. Click: **View Function Logs**
6. Look for error messages (usually MongoDB connection errors)

---

## 💡 Common Errors

### **Error: "MongooseError: The `uri` parameter to `openUri()` must be a string"**
**Fix**: Add `MONGODB_URI` to Vercel environment variables

### **Error: "JWT_SECRET is not defined"**
**Fix**: Add `JWT_SECRET` to Vercel environment variables

### **Error: "VAPID keys not found"**
**Fix**: Add `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_CONTACT_EMAIL`

---

## ✅ Expected Result

After adding all environment variables and redeploying, you should see:

```
✅ MongoDB Connected Successfully!
✅ Push notification service initialized
✅ Server running
```

And your site should load without errors! 🎉

---

## 📱 Next Steps After Fix

1. ✅ Main website loads
2. ✅ Images and videos appear
3. ✅ PWA works on mobile
4. ✅ Push notifications can be enabled
5. ✅ Test all features

---

**Start by adding the environment variables to Vercel, then redeploy!** 🚀
