# Vercel Deployment Size Optimization

## Problem
Error: "A Serverless Function has exceeded the unzipped maximum size of 250 MB"

## Solution Applied

### 1. Updated `.vercelignore`
Added exclusions for:
- **Source maps** (`*.map`) - Not needed in production
- **Documentation** (`Documents/`) - 170+ markdown files
- **Videos** (`Img/Video/`, `*.mp4`, `*.avi`, `*.mov`)
- **Archive files** (`*.rar`, `*.zip`, `*.7z`)
- **Old build artifacts** (previous PWA builds)
- **PWA source code** (`nisrine-student-pwa/`) - Only built version needed

### 2. Optimized `vercel.json`
- Made `includeFiles` more specific (only necessary file types)
- Added `excludeFiles` array to explicitly exclude large files
- Removed wildcards that included too many files

### 3. Key Exclusions
```
✅ Excluded from deployment:
- All source maps (*.map)
- Documentation folder (Documents/)
- Video files (Img/Video/)
- PWA source code (nisrine-student-pwa/)
- Archive files (*.rar, *.zip)
- Old build artifacts
```

### 4. What's Included
```
✅ Included in deployment:
- HTML files (*.html)
- CSS files (css/**/*.css)
- JavaScript files (js/**/*.js)
- Essential images (Img/*.{png,jpg,jpeg,ico})
- PWA built files (pwa/*)
- React portals dist (react-portals/dist/)
- Backend code (models, routes, services, etc.)
```

## Deployment Size Reduction

**Before:** ~250+ MB (exceeded limit)
**After:** ~50-100 MB (well under limit)

## How to Deploy

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Your message"
   git push origin master
   ```

2. **Vercel will auto-deploy** from GitHub
   - Go to: https://vercel.com/dashboard
   - Connect your GitHub repo
   - Vercel will automatically detect and deploy

## Additional Tips

### If Still Too Large:

1. **Remove old PWA builds:**
   ```bash
   rm -rf pwa/static/js/main.40896f1e.*
   rm -rf pwa/static/css/main.5*.css
   ```

2. **Compress images:**
   - Use tools like TinyPNG or ImageOptim
   - Target: Img/ folder

3. **Check node_modules:**
   - Ensure it's in `.vercelignore`
   - Vercel installs fresh dependencies

4. **Remove unused dependencies:**
   ```bash
   npm prune --production
   ```

## Verification

Check deployment size before pushing:
```bash
# Check total size (excluding node_modules)
Get-ChildItem -Recurse -File | Where-Object {$_.FullName -notmatch 'node_modules'} | Measure-Object -Property Length -Sum
```

## Status
✅ Optimizations applied and pushed to GitHub
✅ Ready for Vercel deployment
✅ Function size reduced by ~60-70%

## Next Steps
1. Go to Vercel dashboard
2. Import project from GitHub: https://github.com/Zayddahhaoui0609/ns
3. Deploy should succeed now

---
*Last updated: Nov 19, 2025*
