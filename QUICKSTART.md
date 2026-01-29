# Quick Start Guide

Get your Pastebin Lite application up and running in minutes!

## 🚀 Fast Track Deployment (5 minutes)

### Step 1: Push to GitHub (1 min)
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/pastebin-lite.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel (2 min)
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your `pastebin-lite` repository
4. Click "Deploy" (accept all defaults)

### Step 3: Add KV Storage (2 min)
1. Once deployed, click "Continue to Dashboard"
2. Go to "Storage" tab
3. Click "Create Database" → Select "KV"
4. Name it "pastebin-kv"
5. Click "Create"
6. Click "Connect to Project"
7. Select your project
8. Click "Connect"

### Step 4: Redeploy
1. Go to "Deployments" tab
2. Click "..." menu on latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

✅ **Done! Your app is live!**

---

## 🧪 Quick Test

```bash
# Replace with your actual URL
export APP_URL="https://your-app.vercel.app"

# Test health
curl $APP_URL/api/healthz

# Create a paste
curl -X POST $APP_URL/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello from Pastebin Lite!"}'

# Copy the URL from response and open in browser
```

---

## 📋 Pre-Submission Checklist

Before submitting to Aganitha:

- [ ] App is deployed and accessible at your Vercel URL
- [ ] Health check works: `/api/healthz` returns `{"ok":true}`
- [ ] Can create paste via UI
- [ ] Can view paste via link
- [ ] GitHub repository is PUBLIC
- [ ] README.md is complete
- [ ] No hardcoded secrets in code
- [ ] Candidate ID (Naukri0126) ready for submission

---

## 📝 What to Submit

Through the Google Form:

1. **Deployed URL**: `https://your-app.vercel.app`
2. **GitHub URL**: `https://github.com/YOUR_USERNAME/pastebin-lite`
3. **Candidate ID**: `Naukri0126`
4. **Notes**: See SUBMISSION.md for template

---

## 🆘 Troubleshooting

### "Cannot read properties of undefined" error
- Redeploy after connecting KV storage
- Check environment variables are set

### "Paste not found" for all pastes
- Verify KV storage is connected
- Check `/api/healthz` returns `{"ok":true}`
- Check Vercel function logs

### UI not working
- Clear browser cache
- Check browser console for errors
- Verify deployment completed successfully

### Build failed
- Check Vercel build logs
- Ensure all dependencies are in package.json
- Try building locally: `npm run build`

---

## 📚 Additional Resources

- **Full Documentation**: See README.md
- **Deployment Guide**: See DEPLOYMENT.md
- **Testing Guide**: See TESTING.md
- **Submission Template**: See SUBMISSION.md

---

## ⏰ Timeline

This should take approximately 2-4 hours:
- Setup & Deployment: 30 minutes
- Testing: 30 minutes
- Documentation review: 30 minutes
- Final checks: 30 minutes

---

## 🎯 Success Criteria

Your app should:
- ✅ Return 200 on `/api/healthz`
- ✅ Create pastes via POST `/api/pastes`
- ✅ Retrieve pastes via GET `/api/pastes/:id`
- ✅ Display pastes in browser at `/p/:id`
- ✅ Enforce view limits correctly
- ✅ Enforce TTL expiration correctly
- ✅ Handle errors with appropriate status codes
- ✅ Work in UI for creating and viewing pastes

---

## 💡 Pro Tips

1. **Test Early**: Test on Vercel immediately after deployment
2. **Check Logs**: Use Vercel dashboard to see function logs
3. **Use Browser DevTools**: Check Network tab for API responses
4. **Keep It Simple**: Don't over-engineer; the requirements are clear
5. **Document Well**: A good README shows professionalism

---

## 📞 Need Help?

1. Check the TESTING.md guide for common issues
2. Review Vercel deployment logs
3. Verify KV connection in dashboard
4. Test locally first with `npm run dev`

---

**Remember**: Deadline is 2 days from email receipt!

Good luck! 🚀
