# Quick Start Guide

## ⚠️ Important Note

**All npm commands must be run from within the respective folders:**
- Frontend commands: Run from `Smart_Scan_Frontend/` directory
- Backend commands: Run from `Smart_Scan_Backend/` directory

## Option 1: Manual Setup (Recommended for first time)

### Step 1: Setup Backend

```bash
# Navigate to backend folder
cd Smart_Scan_Backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your configuration:
# - DATABASE_URL (MySQL connection string)
# - JWT_SECRET (generate a strong random string)
# - FRONTEND_URL (http://localhost:3000)
# - GEMINI_API_KEY
# - OCR_SPACE_API_KEY

# Generate Prisma Client
npx prisma generate

# Start backend server
npm run dev
```

Backend will run on `http://localhost:5000`

### Step 2: Setup Frontend (in a new terminal)

```bash
# Navigate to frontend folder
cd Smart_Scan_Frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Start frontend server
npm run dev
```

Frontend will run on `http://localhost:3000`

## Option 2: Using the Startup Script

```bash
# From the root directory
./start-dev.sh
```

This script will:
- Check dependencies and install if needed
- Start backend server in background
- Start frontend server
- Create .env.local if missing

## Common Issues

### Error: "Could not read package.json"
**Solution:** Make sure you're running the command from the correct directory:
- Frontend: `cd Smart_Scan_Frontend` then `npm run dev`
- Backend: `cd Smart_Scan_Backend` then `npm run dev`

### Error: "Module not found"
**Solution:** Run `npm install` in the respective folder

### Error: "Port already in use"
**Solution:** 
- Backend (5000): Stop any process using port 5000 or change PORT in backend .env
- Frontend (3000): Stop any process using port 3000 or use `npm run dev -p 3001`

## Project Structure

```
visiting-card-website/
├── Smart_Scan_Frontend/    # Frontend code - run npm commands here
│   └── package.json         # Frontend dependencies
│
├── Smart_Scan_Backend/      # Backend code - run npm commands here
│   └── package.json         # Backend dependencies
│
└── README.md                # Project overview
```

## Next Steps

1. Open `http://localhost:3000` in your browser
2. Register a new account or login
3. Start uploading visiting cards!

