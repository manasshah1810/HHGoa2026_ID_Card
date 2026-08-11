# 🌴 Hacker House Goa 2026 — Builder Identity Forge

> **Create, customize, and share high-resolution Hacker House Goa 2026 Builder ID Cards & PFPs.** Built with real-time 2D Canvas rendering, smart face auto-framing, team crew rosters, dynamic QR codes, and native social sharing.

![HH Goa 2026 Badge](https://img.shields.io/badge/Hacker%20House-Goa%202026-yellow?style=for-the-badge)
![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)
![TanStack Start](https://img.shields.io/badge/TanStack-Start-FF4154?style=for-the-badge&logo=tanstack)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-CSS_v4-38BDF8?style=for-the-badge&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Application Flow & Architecture](#-application-flow--architecture)
- [Tech Stack](#-tech-stack)
- [Database Schema & Security Model](#-database-schema--security-model)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup & Migrations](#database-setup--migrations)
  - [Running Locally](#running-locally)
- [Available Scripts](#-available-scripts)
- [API & Server Functions](#-api--server-functions)
- [Design System & Animation Physics](#-design-system--animation-physics)
- [Deployment](#-deployment)
- [License & Acknowledgments](#-license--acknowledgments)

---

## 🌟 Overview

**HH Goa 2026 Builder Identity Forge** is an event platform designed for attendees and builders at **Hacker House Goa 2026** (in collaboration with **2:47 PM Studio**). It allows users to:

1. Upload a portrait photograph and automatically detect their face for perfect card composition.
2. Select from 7 custom Goa-inspired visual themes (*Sunset Shack*, *Beach Builders*, *On The Road*, *Hack. Eat. Repeat.*, *Hacker House Hangout*, *Code & Chill*, *We Shipped!*).
3. Toggle between full physical **ID Cards** (complete with an animated fabric lanyard & metallic clasp) and circular **PFPs** (Profile Pictures).
4. Create or join builder **Teams** (max 3 members per team) using secure 8-character invite codes and unique team names.
5. Export high-definition PNGs (up to 3x resolution render output).
6. Share directly to social media (X/Twitter, LinkedIn, Instagram) or generate public shareable links (`/b/$slug` for builders and `/t/$slug` for team rosters).

---

## ✨ Key Features

### 🎨 1. Real-Time 2D Canvas Engine & 7 Unique Themes
- **Pixel-Perfect Canvas Renderer**: Custom HTML5 2D Canvas rendering engine (`src/lib/render.ts`) capable of exporting crystal-clear 1080p+ PFPs and 3000px+ HD ID Cards.
- **7 Curated Goa Visual Styles**:
  - `classic` (**Sunset Shack**): Golden hour retro vibe.
  - `beach-builders` (**Beach Builders**): Ocean-front crew energy.
  - `goa-ride` (**On The Road**): Scooter & palm roadtrip design.
  - `hack-eat-repeat` (**Hack. Eat. Repeat.**): Midnight hacking aesthetic.
  - `hangout` (**Hacker House Hangout**): House community memories.
  - `code-chill` (**Code & Chill**): Relaxed Goa coding style.
  - `we-shipped` (**We Shipped!**): Celebration of product launches.

### 🎯 2. Smart Face Detection & Auto-Framing
- **Native Browser Detection**: Leverages Chromium's experimental native `FaceDetector` API when available for sub-millisecond face bounding-box detection.
- **Color-Space Fallback Heuristic**: Features a custom algorithm using skin-tone thresholding in YCbCr color space combined with Gaussian center-weighted spatial evaluation to center faces automatically on downscaled images.
- **Manual Precision Controls**: Live Zoom, Horizontal Offset, Vertical Offset, and Face Auto-Crop toggles.

### 👔 3. Interactive Physical Lanyard Simulation
- **SVG & CSS Physics**: Custom SVG lanyard component (`Lanyard.tsx`) featuring woven fabric micro-textures, specular metal clasp highlights, and realistic sway/kick physics (`hh-hang`, `hh-kick`, `hh-lany-sway`).
- **Reduced Motion Support**: Fully accessible with `prefers-reduced-motion` fallbacks.

### 👥 4. Team Roster, Name Uniqueness & 3-Member Cap
- **Crew Collaboration**: Builders can create a crew or join existing teammates via 8-character uppercase invite codes (`/?team=CODE`).
- **Strict Capacity & Unique Names**: Enforces unique team names (case-insensitive) and caps teams at a maximum of 3 members at both the app and PostgreSQL database trigger levels.
- **Rate-Limited Server Protection**: Server-side IP hashing (`SHA-256`) and attempt logging in `invite_attempts` table to prevent code brute-forcing.

### 📱 5. Dynamic QR Code System
- **Builder Profile QR**: Encodes individual profile URL (`/b/$slug?team=CODE`). Scanning opens the builder's profile and prompts the scanner to join their team.
- **Team Page Navigation**: Scanned builder profiles feature a prominent Team link leading to the public team roster (`/t/$slug`).

### 🎲 6. Builder Title Generator
- **Interactive Wheel Spin**: One-click title generator with smooth 360° SVG spin keyframe animation (`hh-spin-once`).
- **Curated Queue**: Randomizes through tech-forward, fun, and Goa-themed builder titles ("AI Engineer", "Solana Dev", "Shack Hacker", etc.).

### 🚀 7. Social Sharing & SEO Engine
- **Native Web Share API**: Direct file sharing with attached PNG and pre-filled hashtag caption (`#FrameInGoa #HackerHouseGoa`).
- **Platform Integrations**: Dedicated export buttons for X (Twitter), LinkedIn, and Instagram with automatic clipboard caption copying.
- **SEO & Schema.org**: Server-rendered dynamic OpenGraph meta tags, canonical links, and `Person`/`CollectionPage` JSON-LD structured data for indexation.
- **Dynamic Sitemap**: Dynamic XML sitemap generator route (`/sitemap.xml`) listing all public builder profiles and teams.

---

## 🏗 Application Flow & Architecture

```mermaid
flowchart TD
    A[User Visit / URL with ?team=CODE] --> B[Step 1: Builder Identity Form]
    B --> C[Upload Photo]
    C --> D[Face Detection: Native API / Skin YCbCr Fallback]
    B --> E[Enter Name, Handle, Social Links]
    B --> F[Title Roll / Custom Input]
    B --> G[Team Selection: Solo / Create Team / Join Code]
    G -->|Server Function: createTeam| H[Insert public.teams + Check Unique Name]
    G -->|Server Function: joinTeamByCode| I[Lookup public.teams by invite_code + Check Max 3 Cap]
    H & I & G --> J[Server Function: createProfile]
    J --> K[Insert public.profiles + Assign slug & team_id]
    K --> L[Step 2: Interactive Card & PFP Stage]
    L --> M[2D Canvas Multi-Theme Batch Renderer]
    M --> N[Physical Lanyard Physics Stage]
    N --> O1[Download HD Image 1080p/3000px]
    N --> O2[Native Web Share / Social Sharing]
    N --> O3[View Public Profile /b/$slug]
    N --> O4[View Team Roster /t/$slug]
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [TanStack Start](https://tanstack.com/router/latest/docs/framework/react/start/overview) | SSR framework built on TanStack Router & Nitro |
| **Frontend Library** | [React 19](https://react.dev/) | UI component state management & rendering |
| **Routing** | [TanStack React Router](https://tanstack.com/router) | Type-safe SSR file-based router |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first CSS engine with OKLCH color design system |
| **Database & Auth** | [Supabase PostgreSQL](https://supabase.com/) | Database backend with Row Level Security (RLS) & column-level grants |
| **Build & Dev Server**| [Vite 8](https://vitejs.dev/) + [Nitro](https://nitro.unjs.io/) | Fast HMR development server & Cloudflare Pages production bundler |
| **Icons & QR** | [Lucide React](https://lucide.dev/) + `qrcode` | Crisp vector icons & canvas QR code generation |
| **Runtime & Lock** | Node.js / Bun (`bun.lock`) | Package management & environment execution |

---

## 🔒 Database Schema & Security Model

The database is built on Supabase PostgreSQL with strict **Row Level Security (RLS)** policies, unique constraints, and trigger validation.

```
┌─────────────────────────────────┐      ┌─────────────────────────────────┐
│          public.teams           │      │         public.profiles         │
├─────────────────────────────────┤      ├─────────────────────────────────┤
│ id (UUID, PK)                   │ 1  * │ id (UUID, PK)                   │
│ name (TEXT UNIQUE CI)           │──────│ slug (TEXT UNIQUE)              │
│ slug (TEXT UNIQUE)              │      │ name (TEXT)                     │
│ invite_code (TEXT UNIQUE)       │      │ x_handle (TEXT)                 │
│ creator_token (TEXT)            │      │ github (TEXT)                   │
│ created_at (TIMESTAMPTZ)        │      │ linkedin (TEXT)                 │
└─────────────────────────────────┘      │ portfolio (TEXT)                │
                                         │ stack (TEXT)                    │
┌─────────────────────────────────┐      │ builder_title (TEXT)            │
│     public.invite_attempts      │      │ team_id (UUID FK -> teams.id)   │
├─────────────────────────────────┤      │ created_at (TIMESTAMPTZ)        │
│ id (UUID, PK)                   │      └─────────────────────────────────┘
│ ip_hash (TEXT)                  │
│ kind (TEXT: join/create/regen)  │
│ ok (BOOLEAN)                    │
│ created_at (TIMESTAMPTZ)        │
└─────────────────────────────────┘
```

### Security & Constraint Highlights
1. **Case-Insensitive Unique Team Names**: PostgreSQL unique index on `lower(name)` prevents duplicate team names regardless of casing.
2. **Database Member Cap Trigger**: `BEFORE INSERT` trigger on `profiles` checks member count and rejects inserts if a team already has 3 members.
3. **Column-Level Grant Isolation**: Anonymous & authenticated clients are explicitly granted access to public team metadata only. `invite_code` and `creator_token` are **never** exposed over public REST API queries.
4. **Server-Only Mutations**: `INSERT`, `UPDATE`, and `DELETE` on `profiles` and `teams` occur strictly via TanStack Start Server Functions using the `service_role` client (`client.server.ts`).
5. **Internal Rate Limiting**: `invite_attempts` records anonymized IP hashes (`SHA-256`) to cap code verification attempts (Max 8 failures / 30 attempts per 10-minute window).

---

## 📁 Project Directory Structure

```
.
├── .env                              # Local environment credentials (ignored by git)
├── .gitignore                        # Git ignore patterns
├── package.json                      # Project dependencies & scripts
├── vite.config.ts                    # Vite + TanStack Start + Nitro Cloudflare Pages setup
├── tsconfig.json                     # TypeScript compiler setup
├── eslint.config.js                  # ESLint configuration
├── bunfig.toml / bun.lock            # Bun lockfile
│
├── public/                           # Static public assets
│   └── favicon.ico
│
├── supabase/                         # Supabase database config & SQL migrations
│   ├── config.toml
│   └── migrations/
│       ├── 20260811130931_...sql     # Initial schema (teams & profiles tables + RLS)
│       ├── 20260811141218_...sql     # Add team invite_code column
│       ├── 20260811142423_...sql     # Create invite_attempts rate-limiting table
│       ├── 20260811183628_...sql     # Restrict client table access & enforce server-only writes
│       ├── 20260811184028_...sql     # Add creator_token to teams
│       └── 20260811195000_...sql     # Case-insensitive unique team names & 3-member limit trigger
│
└── src/                              # Application source code
    ├── assets/                       # High-resolution theme PNGs & logo SVGs
    ├── components/                   # React UI components
    │   ├── Lanyard.tsx               # SVG Fabric Lanyard with physics & texture
    │   └── ui/                       # Reusable Radix UI primitives
    ├── integrations/                 # External service integrations
    │   └── supabase/
    │       ├── client.ts             # Public Supabase client
    │       ├── client.server.ts      # Server-side Service Role client
    │       ├── auth-middleware.ts    # Auth token attacher
    │       └── types.ts              # Generated TypeScript database types
    ├── lib/                          # Utility modules & server logic
    │   ├── card-designs.ts           # Theme design metadata
    │   ├── face.ts                   # Native & skin YCbCr face detection algorithms
    │   ├── profiles.functions.ts     # Profile creation server function
    │   ├── render.ts                 # 2D Canvas rendering engine (Card & PFP)
    │   ├── teams.functions.ts        # Team management server functions
    │   ├── teams.server.ts           # Crypto helper (IP hashing & codes)
    │   ├── themes.ts                 # 7 Theme geometry definitions & slot maps
    │   ├── titles.ts                 # Random builder title pool & generator
    │   └── validation.ts             # Input sanitization & field validation
    └── routes/                       # File-based TanStack React Router routes
        ├── __root.tsx                # Root layout component, HTML head & fonts
        ├── index.tsx                 # Main identity generator page
        ├── b.$slug.tsx               # Public builder ID card profile route (/b/$slug)
        ├── t.$slug.tsx               # Public team crew roster route (/t/$slug)
        └── sitemap[.]xml.ts          # Dynamic sitemap generator endpoint
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (or [Bun](https://bun.sh/) v1.0+)
- **npm** / **yarn** / **pnpm** / **bun**
- **Supabase Account**

### Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/manasshah1810/HHGoa2026_ID_Card.git
   cd HHGoa2026_ID_Card
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Environment Variables
Create a `.env` file in the root directory:

```env
# Public Supabase API Credentials
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"

# Server-Side Supabase Credentials
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

### Database Setup & Migrations
Push all migrations to your Supabase project:
```bash
npx supabase link --project-ref your-project-id
npx supabase db push
```

### Running Locally
Start the development server:
```bash
npm run dev
```
Open your browser at `http://localhost:8080` (or `http://localhost:8081`).

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches the Vite + TanStack Start development server |
| `npm run build` | Builds the Cloudflare Pages production bundle using Nitro |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs ESLint code quality checks |
| `npm run format` | Formats codebase using Prettier |

---

## ⚡ API & Server Functions

TanStack Start server functions (`createServerFn`) execute safely on the server side:

1. **`createProfile`** (`src/lib/profiles.functions.ts`): Validates inputs, assigns team ID, generates builder slug, and writes profile via `supabaseAdmin`.
2. **`createTeam`** (`src/lib/teams.functions.ts`): Enforces unique team name, generates 8-character invite code & 24-byte `creator_token`, and inserts team.
3. **`joinTeamByCode`** (`src/lib/teams.functions.ts`): Validates code, checks team capacity (< 3 members), and returns team details.
4. **`regenerateInviteCode`** (`src/lib/teams.functions.ts`): Verifies `creatorToken` ownership and rotates `invite_code`.

---

## 🌐 Deployment

This project is configured for **Cloudflare Pages**:

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Update README and build configuration"
   git push origin main
   ```
2. Connect your repo on **Cloudflare Dashboard** -> **Workers & Pages** -> **Pages**.
3. Set **Build command**: `npm run build`
4. Set **Build output directory**: `dist`
5. Add all 5 Environment Variables under Project Settings.
6. Click **Save and Deploy**.

---

## 📄 License & Acknowledgments

- **Built for**: [Hacker House Goa 2026](https://hackerhousegoa.com)
- **Collaborator**: 2:47 PM Studio
- **License**: MIT License. Feel free to remix and adapt for your own hacker house or conference events!

---

<p align="center">
Made with 💛 for the global hacker community in Goa 🌴
</p>