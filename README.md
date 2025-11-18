# Smart Scan

A modern visiting card management system with AI-powered OCR extraction.

## Project Structure

```
Smart_Scan/
├── Smart_Scan_Frontend/    # Next.js frontend application
├── Smart_Scan_Backend/      # Express.js backend API server
└── README.md                # This file
```

## Quick Start

**⚠️ Important:** All npm commands must be run from within the respective folders (`Smart_Scan_Frontend/` or `Smart_Scan_Backend/`), not from the root directory.

### Frontend Setup

```bash
# Navigate to frontend directory
cd Smart_Scan_Frontend

# Install dependencies
npm install

# Configure environment variables
# Create or edit .env.local and add:
# NEXT_PUBLIC_API_URL=http://localhost:5000

# Run development server
npm run dev
```

Frontend runs on `http://localhost:3000`

### Backend Setup

```bash
# Navigate to backend directory
cd Smart_Scan_Backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration (see backend README)

# Generate Prisma Client
npx prisma generate

# Run development server
npm run dev
```

Backend runs on `http://localhost:5000`

### Running Both Servers

Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd Smart_Scan_Backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd Smart_Scan_Frontend
npm run dev
```

## Documentation

- **Quick Start Guide**: See `QUICK_START.md` for detailed setup instructions
- Frontend documentation: See `Smart_Scan_Frontend/README.md`
- Backend documentation: See `Smart_Scan_Backend/README.md`
- Separation guide: See `Smart_Scan_Frontend/SEPARATION_GUIDE.md`

## Quick Commands

**⚠️ Remember:** Always run npm commands from within the respective folders!

```bash
# Frontend
cd Smart_Scan_Frontend && npm run dev

# Backend  
cd Smart_Scan_Backend && npm run dev
```

Or use the startup script:
```bash
./start-dev.sh
```

## Features

- AI-powered OCR for visiting card extraction
- Contact management with notes and addresses
- VCF export for contacts
- Duplicate detection
- Modern, responsive UI
- JWT-based authentication

## Technology Stack

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

**Backend:**
- Express.js
- Prisma ORM
- MySQL
- JWT Authentication
- Google Gemini API
- OCR Space API

