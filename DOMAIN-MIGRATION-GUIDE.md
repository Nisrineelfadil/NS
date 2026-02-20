# Domain Migration & SEO Setup Guide

## ✅ Already Completed
- Enhanced SEO meta tags in `index.html`
- Added structured data (JSON-LD) for Google
- Created `robots.txt` to guide search engines
- Created `sitemap.xml` for Google indexing
- Created domain update script

---

## Step 1: Purchase Domain

### Recommended Domain Names
- `nisrineschool.com` (first choice)
- `nisrine-school.com`
- `ecole-nisrine.com`
- `nisrineschool.de` (if targeting German audience)

### Where to Buy
**Option 1: Namecheap** (Recommended - $10-12/year)
1. Go to https://www.namecheap.com
2. Search for your desired domain
3. Add to cart and purchase
4. Keep your login credentials safe

**Option 2: Google Domains** ($12/year)
1. Go to https://domains.google
2. Search and purchase

---

## Step 2: Connect Domain to Vercel

1. **Login to Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Select your `nisrine-school` project

2. **Add Custom Domain**
   - Go to Settings → Domains
   - Click "Add Domain"
   - Enter your purchased domain (e.g., `nisrineschool.com`)
   - Also add `www.nisrineschool.com` as an alias

3. **Vercel will show DNS records**
   ```
   Type: A     Name: @    Value: 76.76.21.21
   Type: CNAME Name: www  Value: cname.vercel-dns.com
   ```

4. **Configure DNS at Your Domain Registrar**
   - Login to Namecheap/Google Domains
   - Go to DNS Management
   - Add the A record and CNAME record provided by Vercel
   - Save changes (propagation takes 1-48 hours)

5. **Verify in Vercel**
   - Vercel will auto-verify once DNS propagates
   - Your site will be live on the new domain

---

## Step 3: Update Domain in All Applications

**AFTER Vercel confirms your domain is active:**

Run this command (replace with your actual domain):
```bash
node scripts/update-domain.js nisrineschool.com
```

This will update:
- Main website (`index.html`)
- Sitemap and robots.txt
- Mobile PWA
- Desktop app configuration

Then commit and push:
```bash
git add -A
git commit -m "chore: migrate to custom domain nisrineschool.com"
git push origin master
git push client master
```

---

## Step 4: Make It Show on Google

### A. Submit to Google Search Console

1. **Go to Google Search Console**
   - Visit https://search.google.com/search-console
   - Click "Start Now" and sign in with Google account

2. **Add Your Property**
   - Choose "URL prefix" method
   - Enter your domain: `https://nisrineschool.com`

3. **Verify Ownership**
   - Method 1: HTML file upload (easiest with Vercel)
   - Method 2: Add meta tag to `<head>` (Google will provide it)
   - Vercel usually auto-verifies if you're logged in

4. **Submit Sitemap**
   - Once verified, go to Sitemaps (left menu)
   - Add new sitemap: `https://nisrineschool.com/sitemap.xml`
   - Click Submit

### B. Submit to Google My Business

1. Go to https://business.google.com
2. Click "Manage now"
3. Enter business name: "Nisrine School"
4. Choose category: "Language School"
5. Add location: Fez, Morocco
6. Add phone number and website
7. Verify (Google will mail a postcard with verification code)

### C. Build Backlinks (Improve Ranking)

- Add link to Instagram bio: https://instagram.com/nisrinegermanschool
- List on:
  - Morocco education directories
  - German language school listings
  - Fez business directories
- Ask students to write Google reviews

---

## Step 5: Rebuild Desktop App

After domain update, rebuild the desktop app:

```bash
cd desktop-app
npm run build
```

New executable will be in `desktop-app/dist/`

Upload to GitHub releases and update admin panel download link.

---

## Step 6: Update Mobile PWA

The PWA will auto-update for users after you push changes. Tell users to:
1. Clear browser cache
2. Reinstall PWA from new domain

---

## Expected Timeline

| Step | Time |
|------|------|
| Domain purchase | 5 minutes |
| DNS propagation | 1-48 hours |
| Google indexing | 1-7 days |
| Google ranking | 2-4 weeks |

---

## SEO Best Practices Going Forward

1. **Regular Content Updates** - Update student photos weekly
2. **Blog Posts** - Add success stories (if possible)
3. **Social Media** - Post regularly on Instagram and link to website
4. **Google Reviews** - Ask satisfied students/parents for reviews
5. **Local SEO** - Include "Fez", "Morocco" in content

---

## Testing Checklist

After domain migration, test:
- [ ] Homepage loads on new domain
- [ ] Admin panel login works
- [ ] Student PWA connects to API
- [ ] Desktop app connects to server
- [ ] All images load from Mega.nz
- [ ] Google Search Console shows no errors

---

## Troubleshooting

**Problem: Domain not connecting after 48 hours**
- Verify DNS records exactly match Vercel's requirements
- Check for typos in DNS settings
- Try removing and re-adding domain in Vercel

**Problem: Google not showing website**
- Wait 7-14 days for first indexing
- Check Google Search Console for errors
- Ensure robots.txt is accessible: `yourdomain.com/robots.txt`

**Problem: PWA or Desktop app not working**
- Clear browser cache completely
- Rebuild desktop app after domain update
- Check browser console for CORS errors

---

## Support

For issues, check:
- Vercel Documentation: https://vercel.com/docs/custom-domains
- Google Search Console Help: https://support.google.com/webmasters
