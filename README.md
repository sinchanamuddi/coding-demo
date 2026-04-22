# YatraAI — Full-Stack India-Centric AI Travel Planner

This project now includes both:
- a modern mobile-first frontend, and
- a working backend API for auth, saved trips, booking feed, and admin metrics.

## What is now implemented

### Frontend
- AI planner UI (core highlight)
- Itinerary generation with `en-IN` formatting and `₹`
- Language selector (English / हिंदी / ಕನ್ನಡ)
- Emergency quick access section
- Bookings, guides, and profile dashboard
- PWA install support

### Backend (Node API)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/trips` (auth required)
- `POST /api/trips` (auth required)
- `GET /api/bookings`
- `GET /api/admin/metrics` (admin only)
- File-backed JSON persistence in `server/data.json`

## Quick Run (Complete Project)

### 1) Start API
```bash
npm run dev:api
```
Runs at `http://localhost:8787`.

### 2) Start Frontend
Open a second terminal:
```bash
npm run dev
```
Runs at `http://localhost:5173`.

### 3) Demo Login
- Email: `sinchana@example.com`
- Password: `password123`

## Build and Publish

```bash
npm run build
npm run preview
```

Deploy `dist/` to Vercel/Netlify.

## Project Structure

- `index.html`, `styles.css`, `app.js` — frontend mobile experience
- `server/server.js` — backend API
- `server/data.json` — lightweight DB
- `manifest.webmanifest`, `sw.js`, `icons/` — PWA assets
- `PUBLISH.md` — web + mobile publishing workflow
