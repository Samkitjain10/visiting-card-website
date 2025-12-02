# Deployment Guide

## GitHub Deployment

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name it (e.g., `smart-scan` or `visiting-card-website`)
5. Choose Public or Private
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

### Step 2: Push to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote repository (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Rename main branch if needed
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 3: Verify

Visit your GitHub repository URL to verify all files are uploaded.

## Environment Variables

**Important:** Never commit `.env` files to GitHub. They contain sensitive information.

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend (.env)
```
DATABASE_URL="mysql://root:@localhost:3306/visiting_card_db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
FRONTEND_URL="http://localhost:3000"
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
OCR_SPACE_API_KEY=your_ocr_space_api_key
```

## Production Deployment

### Frontend (Vercel/Netlify)

1. **Vercel:**
   - Import your GitHub repository
   - Set `NEXT_PUBLIC_API_URL` to your backend URL
   - Deploy

2. **Netlify:**
   - Import your GitHub repository
   - Build command: `cd Smart_Scan_Frontend && npm run build`
   - Publish directory: `Smart_Scan_Frontend/.next`
   - Set `NEXT_PUBLIC_API_URL` environment variable

### Backend (Railway/Render/AWS)

1. **Railway:**
   - Import your GitHub repository
   - Set root directory to `Smart_Scan_Backend`
   - Add all environment variables
   - Run: `npm install && npx prisma generate && npm start`

2. **Render:**
   - Create a new Web Service
   - Connect your GitHub repository
   - Set root directory to `Smart_Scan_Backend`
   - Build command: `npm install && npx prisma generate`
   - Start command: `npm start`
   - Add all environment variables

## Database Migration

Before deploying, run migrations:

```bash
cd Smart_Scan_Backend
npx prisma migrate deploy
npx prisma generate
```

## Security Checklist

- [ ] All `.env` files are in `.gitignore`
- [ ] `JWT_SECRET` is a strong random string
- [ ] `DATABASE_URL` uses secure credentials
- [ ] API keys are stored securely
- [ ] CORS is configured correctly for production
- [ ] Frontend URL is set correctly in backend

