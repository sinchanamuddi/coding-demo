# Publish Guide

## 1) Local full-stack check

### One-click scripts
- Windows: double-click `scripts/start-dev.bat`
- Mac: double-click `scripts/start-dev.command`
- Linux: run `./scripts/start-dev.sh`

### Manual terminals
Terminal A:
```bash
npm run dev:api
```

Terminal B:
```bash
npm run dev
```

## 2) Deploy frontend

### Vercel / Netlify
- Build command: `npm run build`
- Output directory: `dist`

## 3) Deploy backend API

Deploy `server/server.js` to a Node host (Railway, Render, Fly.io, EC2, etc.).

Required runtime:
- Node.js 20+
- Persistent disk/volume for `server/data.json`

Set frontend API URL by changing `API_URL` logic in `app.js` for production if needed.

## 4) Mobile publishing (Android/iOS)

Use Capacitor to wrap the built web app:

```bash
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init YatraAI com.yatraai.app --web-dir=dist
npm run build
npx cap add android
npx cap add ios
npx cap copy
```

Then open Android Studio/Xcode and publish.

## 5) Production checklist
- Move from file DB to Postgres/MySQL.
- Replace plain SHA auth with proper salted password hashing (`bcrypt`).
- Add JWT expiration/refresh and secure cookie/session strategy.
- Integrate real booking APIs (flight/hotel/train).
- Add payment, legal policies, analytics, and monitoring.
