# AURA LIVING — Production-Ready Architectural E-Commerce Platform

A production-ready e-commerce platform and administrative console engineered with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Supabase (PostgreSQL, Supabase Auth, and Supabase Storage)**. Built for deployment to **Cloudflare Pages** and version control on **GitHub**.

---

## 1. Project Overview

AURA Living is an architectural lifestyle and homeware brand. The platform features:
- **Customer Storefront**: Responsive home showcase, all products catalog, category filters, real-time search, interactive shopping cart drawer, dedicated bag page, and server-validated checkout with Cash on Delivery (COD).
- **Security & Integrity**: Server/database-enforced price verification (`create_order_securely` PostgreSQL RPC function), atomic inventory decrement, and Row Level Security (RLS) on all tables.
- **Private Admin Console (`/admin`)**: Hidden from public menus, protected by Supabase Auth and database role checks in `admin_users`. Enables real-time product CRUD, stock updates, image uploads to Supabase Storage (`product-images`), and order status transitions (Pending, Confirmed, Processing, Shipped, Delivered, Cancelled).
- **Cloudflare Pages Compatibility**: Full SPA client routing support with `public/_redirects`, canonical OpenGraph tags, semantic SEO markup, `robots.txt`, and `sitemap.xml`.

---

## 2. Technology Stack

- **Frontend Framework**: React 19 + TypeScript
- **Bundler & Dev Server**: Vite 8
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss";`) with Google Fonts (*Plus Jakarta Sans* and *Playfair Display*)
- **Routing**: React Router DOM v7
- **Icons**: Lucide React
- **Database & Auth**: Supabase PostgreSQL 15+ & Supabase Auth
- **Media Storage**: Supabase Storage (`product-images` bucket)
- **Deployment**: Cloudflare Pages + GitHub Actions / Git integration

---

## 3. Folder Structure

```
├── public/
│   ├── _redirects               # Cloudflare Pages SPA rewrite rule (/* /index.html 200)
│   ├── robots.txt               # SEO indexing directives (disallows /admin)
│   └── sitemap.xml              # Search engine sitemap
├── src/
│   ├── assets/
│   │   └── images/              # High-fidelity architectural imagery
│   ├── components/
│   │   ├── admin/               # AdminLayout, Navigation, Status Indicators
│   │   ├── cart/                # CartDrawer, Item Steppers, Delivery Breakdown
│   │   ├── common/              # Navbar, Footer, PromoBanner
│   │   ├── layout/              # CustomerLayout wrapper
│   │   └── products/            # ProductCard, ProductGrid, ProductFilters
│   ├── context/
│   │   ├── AuthContext.tsx      # Supabase Auth state & admin role verification
│   │   └── CartContext.tsx      # Persistent shopping cart & delivery calculation
│   ├── lib/
│   │   ├── formatters.ts        # Currency, date, and status formatters
│   │   ├── supabase.ts          # Supabase client initialization & connection check
│   │   └── validations.ts       # Form & image upload validators
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── AdminLoginPage.tsx
│   │   │   ├── AdminOrderDetailsPage.tsx
│   │   │   ├── AdminOrdersPage.tsx
│   │   │   └── AdminProductFormPage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── CartPage.tsx
│   │   ├── CategoriesPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── ContactPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── OrderConfirmationPage.tsx
│   │   ├── PrivacyPolicyPage.tsx
│   │   ├── ProductDetailsPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── ReturnsPage.tsx
│   │   └── TermsPage.tsx
│   ├── services/
│   │   ├── admin.ts             # Admin metrics & authorization checks
│   │   ├── categories.ts        # Category queries & mutations
│   │   ├── mockData.ts          # Seed data & fallback assets
│   │   ├── orders.ts            # Order submission RPC & order status
│   │   ├── products.ts          # Product search, filter, and CRUD
│   │   └── storage.ts           # Supabase Storage image uploads
│   ├── types/
│   │   └── index.ts             # Shared TypeScript interfaces
│   ├── App.tsx                  # Root routes configuration
│   ├── index.css                # Tailwind CSS v4 root styling
│   └── main.tsx                 # React DOM mount point
├── supabase/
│   ├── migrations/
│   │   └── 20261024000000_init_ecommerce.sql   # Complete PostgreSQL schema & RLS
│   └── seed.sql                               # Initial categories, products, admin guide
├── .env.example                 # Environment variables specification
├── index.html                   # HTML entry point with meta & fonts
├── metadata.json                # AI Studio application metadata
├── package.json                 # Project dependencies & scripts
└── tsconfig.json                # TypeScript compiler configuration
```

---

## 4. Setup & Installation Instructions

### 4.1 Prerequisites
- Node.js (v18.0.0 or later)
- npm or pnpm
- A free account on [Supabase](https://supabase.com)
- A free account on [Cloudflare](https://cloudflare.com) (for deployment)

### 4.2 Clone and Install
```bash
# Clone the repository
git clone https://github.com/your-username/aura-living-store.git
cd aura-living-store

# Install all dependencies
npm install
```

### 4.3 Configure Environment Variables
Create a `.env` file in the project root based on `.env.example`:
```env
# Supabase Configuration
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```
> **Security Note**: Never commit your real `.env` file or secret `service_role` keys. The frontend only uses the public `anon` key; all security is enforced by database RLS policies.

---

## 5. Phase 2: Supabase PostgreSQL Setup & Migration Guide

### 5.1 Architecture & Security Rules
- **Row Level Security (RLS)**: Enforced on all tables (`categories`, `products`, `admin_users`, `orders`, `order_items`). Never disable RLS in production.
- **Access Control**:
  - **Public Visitors**: Can ONLY read published products (`is_published = true AND availability_status != 'discontinued'`) and active categories (`is_active = true`). Public visitors CANNOT modify any catalog data or browse administrative rosters.
  - **Authorized Administrators**: Authenticated accounts with matching IDs in `admin_users` can create, update, and delete products, categories, and manage orders.
  - **Orders**: Guest orders can only be placed through the atomic `create_order_securely` database function or viewed using the unguessable `order_number` token.
- **Financial Precision**: Money amounts (`regular_price`, `discount_price`, `subtotal`, `delivery_charge`, `total_amount`, `unit_price`, `line_total`) are stored as `NUMERIC(10, 2)` to eliminate floating-point calculation drift.
- **Client Key Security**: Frontend code uses only `VITE_SUPABASE_ANON_KEY`. Secret `service_role` keys are strictly prohibited in the browser.

### 5.2 Versioned SQL Migrations
The migrations are structured under `supabase/migrations/`:
1. `20261024000001_core_schema.sql`: Core tables, `NUMERIC(10, 2)` currency fields, foreign keys, unique constraints, and check constraints (`regular_price >= 0`, `discount_price < regular_price`, `stock_quantity >= 0`).
2. `20261024000002_rls_and_security.sql`: RLS enablement, `public.is_admin()` security function, strict SELECT/INSERT/UPDATE/DELETE policies, and `product-images` storage bucket policies.
3. `20261024000003_secure_orders_rpc.sql`: Transactional `create_order_securely()` stored procedure that locks product rows with `FOR UPDATE`, validates actual database prices, checks stock, decrements inventory, and creates orders.
*(Or execute `20261024000000_init_ecommerce.sql` for an all-in-one consolidated run).*

### 5.3 Step-by-Step Instructions: What to Run in Supabase
1. **Create Project**: Create a new project in your [Supabase Dashboard](https://supabase.com/dashboard).
2. **Execute Migrations**:
   - Open the **SQL Editor** in the Supabase Dashboard.
   - Run the contents of `supabase/migrations/20261024000001_core_schema.sql` (or `20261024000000_init_ecommerce.sql`).
   - Run `supabase/migrations/20261024000002_rls_and_security.sql`.
   - Run `supabase/migrations/20261024000003_secure_orders_rpc.sql`.
3. **Seed Initial Catalog**:
   - In the SQL Editor, copy and run `supabase/seed.sql` to populate initial studio categories and products.
4. **Safe Initial Admin Provisioning Procedure**:
   - **Why Public Self-Registration Is Prohibited**: The public storefront deliberately provides no user sign-up page for administrator accounts. Row Level Security explicitly disallows `INSERT` operations on `public.admin_users` by non-admins, preventing privilege escalation.
   - **Step 1 (Create Identity in Supabase Auth)**:
     - Navigate to **Authentication** -> **Users** in your Supabase Dashboard.
     - Click **Add user** -> **Create user**.
     - Enter the authorized administrator's email (e.g. `admin@yourdomain.com`) and assign a high-entropy password. Toggle "Auto Confirm User" to true.
   - **Step 2 (Assign Administrative Role in Database)**:
     - Open the **SQL Editor** in Supabase and execute the following query to securely associate the user ID with administrative privileges:
     ```sql
     INSERT INTO public.admin_users (id, email, full_name, role)
     SELECT id, email, 'Studio Administrator', 'admin'
     FROM auth.users
     WHERE email = 'admin@yourdomain.com'
     ON CONFLICT (id) DO NOTHING;
     ```
   - **Step 3 (Login & Verification)**:
     - Access `/admin/login` directly via URL (not linked anywhere in public menus).
     - Enter the registered email and password. The system verifies credentials against Supabase Auth, checks the `admin_users` table, and grants console access. Non-admin users are rejected and signed out automatically.
5. **Connect Application**:
   - In Supabase Dashboard, go to **Project Settings** -> **API**.
   - Copy **Project URL** and **Project API Key (anon / public)**.
   - Add them to `.env`:
     ```env
     VITE_SUPABASE_URL="https://your-project-id.supabase.co"
     VITE_SUPABASE_ANON_KEY="your-anon-public-key"
     ```
   - Restart the local server (`npm run dev`). The admin console (`/admin`) and public storefront will immediately connect to your live database.

### 5.4 Phase 3: Supabase Storage Setup & Policies (product-images Bucket)
To store and deliver product photography securely:
1. **Bucket Configuration**:
   - Bucket ID: `product-images`
   - Public: `true` (enables direct high-speed HTTP retrieval without expiring tokens)
   - File Size Limit: `5242880` (5MB maximum per image)
   - Allowed MIME Types: `image/jpeg`, `image/png`, `image/webp`, `image/avif`
2. **Execute Storage Migration**:
   - In your Supabase SQL Editor, run `supabase/migrations/20261024000004_storage_policies.sql`.
   - This registers the bucket and configures 4 strict RLS policies on `storage.objects`:
     - **SELECT**: Viewable by everyone (`bucket_id = 'product-images'`).
     - **INSERT**: Uploadable strictly by authenticated admins (`bucket_id = 'product-images' AND public.is_admin()`).
     - **UPDATE**: Modifiable strictly by authenticated admins (`bucket_id = 'product-images' AND public.is_admin()`).
     - **DELETE**: Deletable strictly by authenticated admins (`bucket_id = 'product-images' AND public.is_admin()`).
### 5.5 Phase 5: Authoritative Order Processing, Cash on Delivery & Order Management

#### 1. Server-Side Price & Stock Integrity
- **The Core Problem**: Browsers and client HTTP requests cannot be trusted with item prices, line totals, discounts, or stock status. Any client-sent price can be intercepted or manipulated.
- **The Solution (`create_order_securely` RPC)**:
  - When the checkout form is submitted, the frontend sends **only** the customer information and an array of `{ product_id, quantity }`.
  - The PostgreSQL stored procedure `public.create_order_securely` executes with `SECURITY DEFINER` privileges.
  - It row-locks the corresponding product records using `SELECT ... FOR UPDATE`, ensuring concurrent checkouts cannot oversell limited inventory.
  - It fetches the authoritative price directly from `public.products`:
    ```sql
    v_item_price := COALESCE(v_prod.discount_price, v_prod.regular_price);
    ```
  - It checks `v_prod.stock_quantity >= quantity` and rejects the entire transaction if inventory is depleted.
  - It enforces the authoritative delivery fee rule: complimentary white-glove courier shipping for orders $\ge \$150.00$, otherwise a flat $\$15.00$ freight fee.
  - It records the order and itemized line items with exact `NUMERIC(10, 2)` precision.
  - It automatically decrements inventory and updates `availability_status` (`in_stock`, `low_stock` $\le 3$, or `out_of_stock`).

#### 2. Cash on Delivery (COD) Payment Flow
- COD is selected and verified as the default payment method.
- No dummy credit card forms or unconfigured gateways are simulated.
- Clear instructions are provided to the customer at checkout and on the confirmed invoice regarding payment to the white-glove courier upon parcel inspection.

#### 3. Privacy & Order Scraping Prevention
- Standard e-commerce apps risk exposing customer names, phone numbers, and physical addresses if public visitors can run `SELECT * FROM orders`.
- AURA Living enforces strict privacy:
  - Direct `SELECT`, `UPDATE`, and `DELETE` on `public.orders` and `public.order_items` are restricted by RLS exclusively to authenticated administrators (`public.is_admin()`).
  - Guest customers can only retrieve the details of their own confirmed order via the `public.get_order_by_number(p_order_number)` RPC, which requires the high-entropy, collision-safe token `AUR-YYYYMMDD-XXXXXX`. Table scanning or enumerating customer records is strictly blocked.

#### 4. Admin Order Management Console (`/admin/orders`)
- **Fulfillment Registry**: Authorized administrators can view all incoming orders sorted by timestamp (`created_at DESC`).
- **Real-Time Filters & Search**: Instant filtering by fulfillment status (`pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`) or text search across order reference, customer name, phone number, and destination city.
- **Order Details Inspection (`/admin/orders/:id`)**:
  - Full customer profile with click-to-call phone and direct email.
  - Delivery destination with courier instructions/gate codes.
  - Complete invoice table with SKU, quantity, unit price, and line total.
  - Live order status transition dropdown with immediate database sync.

---

## 6. Local Development Commands

```bash
# Start local development server (runs on port 3000)
npm run dev

# Run TypeScript type check
npm run lint

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 7. Phase 6: Cloudflare Pages & GitHub Deployment Guide

### 7.1 Build Configuration & Package Settings
From `package.json` and `vite.config.ts`, the verified production build parameters are:

| Parameter | Value | Details |
| :--- | :--- | :--- |
| **Framework Preset** | `Vite` | Standard Vite + React SPA |
| **Build Command** | `npm run build` | Executes `vite build` |
| **Output Directory** | `dist` | Generated static bundle containing `index.html`, assets, and copied public files |
| **Node.js Version** | `20` | Specified in `.node-version` and `.nvmrc` (Node 20 LTS) |
| **Environment Mode** | Production | Strips dev logs and optimizes Tailwind CSS bundle |

### 7.2 GitHub Repository Setup
1. Initialize git and commit your local changes:
   ```bash
   git init
   git add .
   git commit -m "feat: complete production e-commerce platform ready for Cloudflare"
   git branch -M main
   ```
2. Create a new repository on [GitHub](https://github.com/new).
3. Connect and push your code:
   ```bash
   git remote add origin https://github.com/<your-organization-or-username>/aura-living-store.git
   git push -u origin main
   ```

### 7.3 Cloudflare Pages Setup & GitHub Integration
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2. In the sidebar, navigate to **Compute (Workers) -> Workers & Pages**.
3. Click **Create Application**, switch to the **Pages** tab, and select **Connect to Git**.
4. Authorize Cloudflare to access your GitHub account and select your repository (`aura-living-store`).
5. In the **Set up builds and deployments** screen, configure the following:
   - **Project Name**: `aura-living-store` (or your preferred subdomain)
   - **Production Branch**: `main`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
   - **Root Directory**: Leave blank (workspace root)

### 7.4 Cloudflare Environment Variables Setup
Under **Environment Variables (advanced)** during initial setup (or later under **Settings -> Environment variables** in your Cloudflare Pages project):

1. Add your production environment variables for both **Production** and **Preview** environments:

| Variable Name | Environment | Value Example | Sensitive? |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Production & Preview | `https://your-project-id.supabase.co` | No |
| `VITE_SUPABASE_ANON_KEY` | Production & Preview | `eyJhbGciOiJIUzI1NiIsInR5...` (Anon key) | No |
| `NODE_VERSION` | Production & Preview | `20` | No |

> ⚠️ **CRITICAL SECURITY RULE**: Never add `SUPABASE_SERVICE_ROLE_KEY` to Cloudflare Pages environment variables. The client application only uses `VITE_SUPABASE_ANON_KEY`. All database privileges are safely governed by PostgreSQL Row Level Security (RLS).

2. Click **Save and Deploy**. Cloudflare Pages will clone the repository, install dependencies, run `npm run build`, and publish your application to a global edge URL (e.g., `https://aura-living-store.pages.dev`).

### 7.5 SPA Routing, Deep Links & Edge Headers
Because AURA Living is a Single Page Application (SPA) with client-side routing, deep linking requires web server rewrites to prevent 404 errors when visitors reload or directly navigate to:
- `/admin/login` (Admin login gateway)
- `/products/klint-solid-oak-boucle-armchair` (Product detail pages)
- `/categories` (Category filters)
- `/checkout` (Checkout view)
- `/order-confirmation/AUR-20261024-XXXXXX` (Order invoice token)

#### Handled Automatically via `public/_redirects`:
The repository contains `public/_redirects` which Vite copies directly to `dist/_redirects`:
```text
/*    /index.html   200
```
This instructs Cloudflare Pages edge servers to route all inbound HTTP requests to `/index.html` with a `200 OK` status, allowing `react-router-dom` to parse the path and render the matching page component instantly.

#### Edge Security & Caching via `public/_headers`:
The repository contains `public/_headers` which Vite copies directly to `dist/_headers`:
```text
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: no-cache, no-store, must-revalidate
```
- Content Security: Blocks MIME-type sniffing, clickjacking, and unauthorized browser API access.
- Asset Caching: Hashed JavaScript, CSS, and font chunks in `/assets/` are cached on Cloudflare's edge for 1 year (`immutable`).
- HTML Cache Invalidation: `/index.html` is never cached, ensuring visitors immediately receive new releases after a deploy.

### 7.6 Custom Domain & Automatic HTTPS Setup
To connect your branded domain (e.g. `store.yourdomain.com` or apex `yourdomain.com`):
1. In Cloudflare Pages, navigate to your project and select **Custom domains**.
2. Click **Set up a custom domain**.
3. Enter your domain name (e.g., `store.yourbrand.com`).
4. **If your domain's DNS is managed on Cloudflare**: Cloudflare will automatically create a CNAME record with CNAME flattening and provision an SSL/TLS certificate.
5. **If your domain's DNS is managed on an external registrar** (e.g. Namecheap, GoDaddy, Google Domains):
   - Add a CNAME DNS record in your DNS provider:
     - **Host / Name**: `store` (or `@` if supported by DNS provider)
     - **Target**: `aura-living-store.pages.dev`
     - **TTL**: Auto or 300 seconds
6. **HTTPS & Universal SSL**:
   - Cloudflare provisions a free, managed Universal SSL certificate automatically within 5–15 minutes.
   - In Cloudflare SSL/TLS settings, set encryption mode to **Full (strict)**.
   - Enable **Always Use HTTPS** and **Automatic HTTPS Rewrites**.

### 7.7 Supabase Auth URL Configuration
After your Cloudflare Pages domain is active:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard) -> **Authentication** -> **URL Configuration**.
2. Set **Site URL** to your custom domain or Cloudflare URL:
   ```
   https://aura-living-store.pages.dev
   ```
   *(or `https://store.yourdomain.com`)*
3. In **Redirect URLs**, add:
   ```
   https://aura-living-store.pages.dev/**
   https://store.yourdomain.com/**
   http://localhost:3000/**
   ```
   This ensures authentication callbacks, password resets, and session refreshes operate properly without CORS or redirect rejection.

---

## 8. Security Checklist

- [x] **No Secret Keys in Frontend**: Only the public `anon` key is exposed in client code.
- [x] **Row Level Security**: Enabled on `categories`, `products`, `orders`, `order_items`, and `admin_users`.
- [x] **Authoritative Order Creation**: Orders are calculated and stock decremented inside the PostgreSQL function `create_order_securely`, preventing price tampering.
- [x] **Private Admin Routes**: `/admin` is not visible in customer menus and is protected by both client auth guards and database RLS.
- [x] **File Upload Validation**: Images are validated for MIME type (`jpeg`, `png`, `webp`, `avif`) and maximum size (&le; 5MB) before storage.
- [x] **No Robots on Admin**: `public/robots.txt` disallows `/admin/` crawling.
- [x] **Cloudflare Security Headers**: `_headers` enforces `nosniff`, `SAMEORIGIN`, and strict referrer policies.
- [x] **Git Cleanliness**: `.gitignore` blocks `.env*` from entering source control.

---

## 9. Troubleshooting & Common Scenarios

### 1. Page Refresh Returns 404 Not Found on Cloudflare Pages
- **Symptom**: Navigating to `/admin/login` or `/products/example` directly via URL or hitting F5 returns a Cloudflare 404 page.
- **Root Cause**: Cloudflare Pages treats requests as looking for physical files (e.g., `/admin/login.html`) rather than delegating to the client-side router.
- **Solution**: Confirm that `public/_redirects` exists with `/* /index.html 200`. During build, Vite automatically places this into `dist/_redirects`.

### 2. Blank Page or "Failed to Load Resource" after Deployment
- **Symptom**: The site loads a blank page with console error: `Cannot read properties of undefined (reading 'VITE_SUPABASE_URL')`.
- **Root Cause**: Vite embeds environment variables starting with `VITE_` at compile time. If variables were added to Cloudflare Pages after the build ran, they are not present in the bundled JavaScript.
- **Solution**: In Cloudflare Pages, trigger a **Retry deployment** after adding `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your environment variables.

### 3. Build Fails with "Node version incompatibility"
- **Symptom**: Cloudflare build log displays warnings or failures related to syntax or Vite version.
- **Root Cause**: Cloudflare Pages defaults to older Node versions if unconfigured.
- **Solution**: Add environment variable `NODE_VERSION=20` in Cloudflare Pages build settings, or ensure `.node-version` (containing `20`) is pushed to the repository root.

### 4. Admin Login Redirects or Supabase Auth Throws "Invalid redirect URI"
- **Symptom**: Admin login fails or triggers OAuth redirect errors.
- **Root Cause**: Supabase Auth only permits redirects to URLs listed under **Authentication -> URL Configuration**.
- **Solution**: Add `https://your-project.pages.dev/**` and your custom domain to **Redirect URLs** in the Supabase Dashboard.

### 5. Local Development Fallback Mode
- **Symptom**: Admin dashboard or catalog shows mock pieces.
- **Root Cause**: If `.env` is absent or `VITE_SUPABASE_URL` contains placeholder text, the application runs in self-contained fallback mode with realistic local simulation.
- **Solution**: Provide valid Supabase project credentials in `.env` and restart Vite (`npm run dev`).

---
