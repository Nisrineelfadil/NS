# Deploy PWA to Vercel

## Quick Deploy (2 Steps)

### Step 1: Build the PWA
```bash
cd nisrine-student-pwa
npm install
npm run build
```

### Step 2: Deploy to Vercel
```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Deploy
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → `nisrine-student-pwa` (or your choice)
- **Directory?** → `./` (current directory)
- **Build settings?** → Yes
- **Build command?** → `npm run build`
- **Output directory?** → `build`
- **Development command?** → `npm start`

## After Deployment

Vercel will give you a URL like:
```
https://nisrine-student-pwa.vercel.app
```

### Update the Redirect Page

1. Copy your PWA URL from Vercel
2. Edit `app-redirect.html` line 95:
```javascript
const PWA_URL = 'https://nisrine-student-pwa.vercel.app'; // Your actual URL
```

3. Commit and push changes
4. Your main site will redeploy automatically

## Test the Link

Visit: **https://nisrinesschool.vercel.app/login-app**

It should redirect to your PWA!

## Custom Domain (Optional)

In Vercel dashboard:
1. Go to your PWA project
2. Settings → Domains
3. Add: `app.nisrineschool.com` (or similar)
4. Update DNS records as instructed

Then update `app-redirect.html` to use the custom domain.

## Production Checklist

- ✅ PWA deployed to Vercel
- ✅ Update PWA_URL in app-redirect.html
- ✅ Test redirect: https://nisrinesschool.vercel.app/login-app
- ✅ Test PWA login and features
- ✅ Share link with students

## Maintenance

To update the PWA:
```bash
# Make changes
# Build
npm run build

# Deploy
vercel --prod
```

## Environment Variables (Optional)

If you want different URLs for dev/prod:

In Vercel dashboard → Settings → Environment Variables:
- Add: `REACT_APP_API_URL`
- Value: `https://nisrinesschool.vercel.app`
- Environment: Production

Then in `src/config.js`:
```javascript
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
```
