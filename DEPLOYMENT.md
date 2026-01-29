# Deployment Guide

## Quick Deploy to Vercel

### Step 1: Prepare Your Repository

1. Create a new GitHub repository
2. Push this code to your repository:
```bash
git init
git add .
git commit -m "Initial commit: Pastebin Lite application"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

5. Click "Deploy"

### Step 3: Add Vercel KV Storage

1. After deployment, go to your project dashboard
2. Click on the "Storage" tab
3. Click "Create Database"
4. Select "KV" (Redis)
5. Give it a name (e.g., "pastebin-kv")
6. Click "Create"
7. Click "Connect" to link it to your project
8. Vercel will automatically add the required environment variables

### Step 4: Redeploy

1. Go to the "Deployments" tab
2. Click on the three dots next to your latest deployment
3. Click "Redeploy"
4. This ensures the app runs with the KV credentials

### Step 5: Test Your Deployment

1. Visit your deployment URL (e.g., `https://your-app.vercel.app`)
2. Test the health check: `https://your-app.vercel.app/api/healthz`
3. Create a paste through the UI
4. Verify the paste can be viewed

## Alternative: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Follow prompts to create new project

# Add KV storage through dashboard (as described above)

# Deploy to production
vercel --prod
```

## Environment Variables

The following environment variables are automatically set by Vercel when you connect KV storage:

- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

Optional:
- `TEST_MODE=1` (for automated testing with deterministic time)

## Troubleshooting

### "Cannot connect to KV" error
- Ensure you've created and connected a Vercel KV database
- Check that environment variables are set in Vercel dashboard
- Redeploy after adding KV storage

### Build fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify TypeScript has no errors: `npm run build` locally

### 404 on all pastes
- Check KV connection in `/api/healthz`
- Verify paste creation returns valid URLs
- Check Vercel function logs for errors

## Verifying Deployment

```bash
# Check health
curl https://your-app.vercel.app/api/healthz

# Create a paste
curl -X POST https://your-app.vercel.app/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello World"}'

# Get the paste (use ID from previous response)
curl https://your-app.vercel.app/api/pastes/<paste-id>
```

## Important Notes for Submission

1. **Make sure KV is connected** before submitting the URL
2. **Test all endpoints** manually before submitting
3. **Include the deployment URL** in your submission
4. **Include the GitHub repository URL** (make sure it's public)
5. **Mention your Candidate ID**: Naukri0126

## Support

If you encounter issues:
- Check Vercel deployment logs
- Verify KV connection in dashboard
- Test locally first with `npm run dev`
- Ensure `.env.local` has correct KV credentials for local testing
