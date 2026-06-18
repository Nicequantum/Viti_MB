# Viti MB — Enterprise Mercedes-Benz Warranty Story Assistant

Enterprise-grade PWA for authorized Mercedes-Benz dealership technicians. Built for BenzBot 2.0 audit survival, natural paragraph warranty stories, and multi-dealership scalability.

## Architecture

```
src/
├── features/           # Domain features
│   ├── repair-orders/  # RO scan, list, detail views
│   ├── lines/          # Repair line & story workflow
│   ├── templates/      # Customer Pay + warranty templates
│   ├── benzbot-audit/  # BenzBot 2.0 scoring & coaching
│   └── auth/           # API key & settings
├── components/         # Reusable UI (ui/, layout/)
├── store/              # Zustand state management
├── services/           # Business logic & external APIs
├── prompts/            # BenzBot 2.0 & story generation prompts
├── lib/                # Utilities, logging, audit trail
├── hooks/
├── types/
└── utils/
```

## Core Capabilities

- **Natural paragraph stories** — No visible 3 C's headers; flowing technician narrative
- **BenzBot 2.0 Defense** — Quality scoring, audit risks, Add Technician Details workflow
- **Customer Pay templates** — Exact saved text insert, no AI rewrite
- **Enterprise foundations** — Zustand stores, audit logging, encrypted API keys, strict TypeScript

## Quick Start

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```