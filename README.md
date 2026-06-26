# SafePool — Student Financial Engine

A frictionless, local-first money tracker for students. Tap, save, sweep, and grow your pool.

Track your spend, save for goals, sync across devices.

## Features

- **Instant Numpad** — Tap amounts with zero friction, keyboard shortcuts included
- **Expense & Income Tracking** — Categorize transactions with custom categories and emojis
- **Vault & Goal System** — Sweep excess balance into a savings vault and track progress toward goals
- **Recurring Payments** — Schedule automatic weekly, biweekly, or monthly deductions
- **Cloud Sync** — Link Google Drive, Dropbox, or WebDAV to sync across devices
- **Security PIN Lock** — Optional 4-digit passcode with lockout protection
- **3D Crystal Scene** — Immersive WebGL hero visualization (with eco mode fallback)
- **Local-First Architecture** — All data persisted in browser storage, no server required

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) + [React 19](https://react.dev)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com) + custom glassmorphism design system
- **State**: [Zustand](https://github.com/pmndrs/zustand) with localStorage persistence
- **3D**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [Three.js](https://threejs.org)
- **Animations**: [Motion](https://motion.dev) (Framer Motion)
- **Charts**: [Recharts](https://recharts.org)
- **Build**: [Vite 8](https://vite.dev)

## Getting Started

### Prerequisites

- Node.js 18+ (or Bun)

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:8080` (or next available port).

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint & Format

```bash
npm run lint
npm run format
```

## Deployment

### Local Tunnel (quick share)

```bash
npm install -g localtunnel
npm run dev
# In another terminal:
lt --port 8080
```

### Production

The app builds to `dist/` and can be deployed to any static hosting provider (Vercel, Netlify, Cloudflare Pages, etc.).

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/           # shadcn/ui primitives
│   ├── HeroScene.tsx # 3D crystal WebGL scene
│   └── TutorialTour  # Onboarding guided tour
├── lib/
│   ├── store.ts      # Zustand state management
│   └── feedback.ts   # Haptic/audio feedback utilities
├── routes/
│   ├── __root.tsx    # Root layout, nav, meta tags
│   ├── index.tsx     # Dashboard (numpad, vault, cloud sync)
│   ├── activity.tsx  # Insights & transaction history
│   └── goal.tsx      # Savings goal tracker
└── styles.css        # Global design tokens & animations
```

## License

MIT
