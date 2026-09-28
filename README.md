# Extrimshot - E-Commerce Platform & Order Management

A high-converting direct-to-consumer (D2C) e-commerce web application and order management system built for **Extrimshot** ([extrimshot.shop](https://www.shop.extrimshot.shop/)).

---

## 🚀 Overview

Extrimshot is an end-to-end e-commerce solution tailored for speed, high conversion rates, and seamless fulfillment. It includes a localized, mobile-first storefront, server-side attribution tracking, automated courier integration, and a comprehensive admin management suite.

---

## ✨ Features

### 🛒 Customer Storefront
- **High-Converting Landing & Product Pages**: Optimized Bengali sales copy, interactive reviews, FAQ, video embed, and customer testimonials.
- **Streamlined Checkout**: Frictionless 1-click cash-on-delivery (COD) checkout with delivery zone selection and real-time validation.
- **Incomplete Order Capture**: Auto-captures phone and address information in real-time to recover abandoned checkout attempts.
- **Responsive & Accessible**: Mobile-first design using Tailwind CSS and Radix UI primitives.

### 🛡️ Fraud Prevention & Security
- **Device Fingerprinting**: Integrated with `@fingerprintjs/fingerprintjs` to detect duplicate and abusive submissions.
- **Fraud & Blocklist Management**: Dedicated admin views to manage blocked numbers and inspect flagged attempts.
- **Rate Limiting**: Bot protection on order placement and sensitive endpoints.

### 📊 Marketing & Event Attribution
- **Dual Meta Tracking (Browser Pixel + CAPI)**: Client-side Meta Pixel combined with Supabase Edge Function Meta Conversions API (CAPI) with shared `event_id` deduplication and advanced matching (SHA-256 hashed customer identifiers).
- **TikTok Tracking**: Client-side TikTok Pixel and server-side TikTok CAPI support.
- **Behavior Analytics**: Integrated with Microsoft Clarity and Vercel Analytics.

### 📦 Logistics & Operations
- **Pathao Courier Integration**: Edge function integration for shipping and automated order dispatching.
- **Admin Dashboard**:
  - Live order status workflow (Pending, Confirmed, Shipped, Delivered, Cancelled).
  - Advanced filtering, search, and bulk operations.
  - Analytics and revenue reports powered by Recharts.
  - One-click Excel export (`xlsx`).
  - System and notification settings.

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State & Data Fetching**: [TanStack React Query](https://tanstack.com/query)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Edge Functions)
- **Deployment & Hosting**: [Vercel](https://vercel.com/) (SPA rewrites and asset caching)

---

## 📁 Project Structure

```text
extrimshot/
├── public/                  # Static assets (images, sounds, icons)
├── src/
│   ├── assets/              # Bundled image and media assets
│   ├── components/          # Reusable UI components & feature blocks
│   │   ├── admin/           # Admin panel tables, modals, and charts
│   │   ├── checkout/        # Checkout form and cart logic
│   │   └── ui/              # Radix/shadcn UI primitives
│   ├── data/                # Static product details & content
│   ├── hooks/               # Custom React hooks (analytics, audio, etc.)
│   ├── integrations/        # Supabase client & generated types
│   ├── lib/                 # Utility functions, Meta Pixel, tracking helpers
│   ├── pages/               # Application routes & admin views
│   ├── App.tsx              # Root component & routing
│   └── main.tsx             # Application entry point
├── supabase/
│   ├── functions/           # Deno Edge Functions (fb-capi, pathao-courier, tiktok-capi)
│   ├── migrations/          # Supabase SQL migrations
│   └── full_schema.sql      # Full database schema definition
├── vercel.json              # Vercel routing rewrites & cache headers
└── vite.config.ts           # Vite build configuration & chunk splitting
```

---

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (optional, for edge functions)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hypedev1/extrimshot.git
   cd extrimshot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in the required environment variables:
   ```env
   VITE_SUPABASE_URL="your-supabase-url"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
   VITE_META_PIXEL_ID="your-meta-pixel-id"
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:8080`.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite local development server on port 8080 |
| `npm run build` | Builds production bundle with chunk optimizations |
| `npm run build:dev` | Builds bundle in development mode |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs ESLint to check for code issues |

---

## ⚡ Edge Functions Deployment

Edge functions run on Supabase:

```bash
# Deploy Meta Conversions API (CAPI)
npx supabase functions deploy fb-capi

# Deploy TikTok CAPI
npx supabase functions deploy tiktok-capi

# Deploy Pathao Courier Integration
npx supabase functions deploy pathao-courier
```

Make sure to set the required server-side secrets in Supabase:
```bash
npx supabase secrets set META_ACCESS_TOKEN="your_access_token"
npx supabase secrets set META_PIXEL_ID="your_pixel_id"
```

---

## 🌐 Production Deployment

The project is preconfigured for deployment on **Vercel**:
- Single-page application rewrites are configured in `vercel.json`.
- Aggressive caching headers for static assets and audio files are preset.
- Environment variables must be added in the Vercel project dashboard.
