# AlgoMakers.Ai – Feature Planning & Task Breakdown

## Tech Stack

- **Frontend:** Next.js (App Router), Redux Toolkit, react-hook-form, Zod, Tailwind CSS (recommended)
- **Backend:** Next.js API routes or separate Node.js Express API, Prisma ORM, PostgreSQL
- **Payments:** NOWPayments API (USDT)
- **Auth:** NextAuth.js (social + email), JWT/session
- **Other:** Refersion (affiliate), Chart.js/Recharts, Nodemailer (emails)

---

## Features & Tasks

### 1. Authentication & User Management

- [x] Social login (Google, Facebook, Discord) via NextAuth.js
- [x] Email/password signup & login
- [x] TradingView username field (with validation)
- [x] Email verification & password reset
- [x] Role-based access (user, admin, support, manager)
- [x] Profile page (edit email, password, TradingView username)

---

### 2. Subscription Table Page (`/subscriptions`)

- [x] Fetch/display all pairs with metrics (ROI, R/R, trades, etc.)
- [x] Sort/filter/search pairs
- [x] Subscribe button per row
- [x] Access control: limited stats for free users, full for paid
- [x] Responsive/mobile layout

---

### 3. Pair Detail Page (`/pair/[id]`)

- [ ] Show full backtest: equity curve, ROI, drawdown, stats
- [ ] Subscribe button (with plan options)
- [ ] Disclaimers (backtest, not guaranteed)
- [ ] Analytics: track clicks/views

---

### 4. Subscription & Payment Flow

- [ ] Subscription modal: select plan, enter TradingView username (with validation)
- [ ] Call NOWPayments API to create invoice
- [ ] Payment page: show USDT amount, address, QR, timer, copy buttons
- [ ] Poll payment status/webhook handler
- [ ] On success: create subscription, send emails, notify admin
- [ ] Handle underpaid/expired invoices

---

### 5. User Dashboard (`/dashboard`)

- [ ] Quick stats (active, expiring, pending)
- [ ] List of subscriptions (pair, period, status, expiry, actions)
- [ ] Renew/Upgrade modals (expiry calculator, payment flow)
- [ ] Billing/invoice history
- [ ] Profile & notifications
- [ ] Support/FAQ links

---

### 6. Admin Console (`/admin`)

- [ ] User search (email, TV username, payment ID)
- [ ] Subscriptions table (CRUD: extend, revoke, resend invite)
- [ ] Payments table (NOWPayments status, manual override)
- [ ] Audit log (all admin actions)
- [ ] Role-based access
- [ ] CSV export for tables

---

### 7. Backtest Data Management (`/admin/backtests`)

- [ ] Upload backtest Excel/CSV files with validation
- [ ] Parse and validate backtest data (trades, equity curve, metrics)
- [ ] Create/edit trading pairs with backtest data
- [ ] Preview backtest charts before publishing
- [ ] Bulk upload multiple backtests
- [ ] Data validation rules (required columns, date formats, etc.)
- [ ] Error handling for invalid data
- [ ] Audit trail for backtest uploads/modifications

---

### 8. Reporting & Analytics (`/admin/reports`)

- [ ] KPI cards (MRR, churn, ARPU, active subs)
- [ ] Charts: subscriptions by pair, new vs renewal, revenue trend
- [ ] Failed/underpaid payments table
- [ ] CSV export (subscriptions, payments, revenue)

---

### 9. Support & Contact (`/support`)

- [ ] Hero section, quick actions
- [ ] Dynamic contact form (conditional fields)
- [ ] Help articles (CMS-driven)
- [ ] Submission confirmation, ticket number
- [ ] Attachments, consent, CAPTCHA

---

### 10. Legal Hub (`/legal`)

- [ ] Terms of Use, Privacy, Cookies, Refund Policy (tabs/expanders)
- [ ] Last updated dates
- [ ] Mobile-friendly

---

### 11. FAQ Page (`/faq`)

- [ ] Accordion by category (emoji icons)
- [ ] Search/filter bar
- [ ] CMS-driven content
- [ ] Permalink support (/faq#payments)
- [ ] Responsive, dark mode

---

### 12. Daily Database Backups

- [ ] Scheduled backup script (cron)
- [ ] Store in encrypted S3/GCP bucket (geo-redundant)
- [ ] Retention policy (30 days)
- [ ] Email/Slack alerts on success/failure
- [ ] Restore/test process

---

### 13. Mobile Optimization & PWA

- [ ] Responsive layouts for all pages
- [ ] Touch-friendly controls
- [ ] PWA manifest & offline page (optional)
- [ ] QA on iOS/Android

---

## Backend Entity Diagram (Mermaid)

```mermaid
erDiagram
    USER {
      id UUID PK
      email VARCHAR UNIQUE
      password_hash VARCHAR
      name VARCHAR
      tradingview_username VARCHAR
      role ENUM
      created_at TIMESTAMP
    }
    PAIR {
      id UUID PK
      symbol VARCHAR
      name VARCHAR
      metrics JSONB
      created_at TIMESTAMP
    }
    SUBSCRIPTION {
      id UUID PK
      user_id UUID FK
      pair_id UUID FK
      period ENUM
      start_date DATE
      expiry_date DATE
      status ENUM
      payment_id UUID FK
      invite_status ENUM
    }
    PAYMENT {
      id UUID PK
      user_id UUID FK
      pair_id UUID FK
      amount DECIMAL
      network ENUM
      status ENUM
      tx_hash VARCHAR
      invoice_id VARCHAR
      created_at TIMESTAMP
    }
    AFFILIATE {
      id UUID PK
      user_id UUID FK
      referral_code VARCHAR UNIQUE
      wallet_address VARCHAR
      commission_rate DECIMAL
    }
    COMMISSION {
      id UUID PK
      affiliate_id UUID FK
      subscription_id UUID FK
      amount DECIMAL
      status ENUM
      payout_id UUID FK
      created_at TIMESTAMP
    }
    EVENT {
      id UUID PK
      user_id UUID FK
      event_type VARCHAR
      timestamp TIMESTAMP
      metadata JSONB
    }
    AUDIT_LOG {
      id UUID PK
      admin_id UUID FK
      action VARCHAR
      target_id UUID
      target_type VARCHAR
      timestamp TIMESTAMP
      details JSONB
    }

    USER ||--o{ SUBSCRIPTION : has
    USER ||--o{ PAYMENT : makes
    USER ||--o{ AFFILIATE : is
    PAIR ||--o{ SUBSCRIPTION : has
    PAIR ||--o{ PAYMENT : has
    SUBSCRIPTION ||--o{ COMMISSION : triggers
    AFFILIATE ||--o{ COMMISSION : earns
    PAYMENT ||--o{ SUBSCRIPTION : funds
    USER ||--o{ EVENT : triggers
    USER ||--o{ AUDIT_LOG : acts
```

---

## General Development Plan

1. **Setup & Boilerplate**

   - [ ] Next.js project, Tailwind, Redux Toolkit, react-hook-form, Zod
   - [ ] Prisma schema, PostgreSQL DB, seed scripts
   - [ ] Auth (NextAuth.js), roles, protected routes

2. **Core Features (MVP)**

   - [ ] Subscription Table & Pair Detail
   - [ ] Payment integration (NOWPayments)
   - [ ] Subscription logic (expiry, renewal, upgrade)
   - [ ] User dashboard
   - [ ] Admin console (basic)

3. **Notifications & Emails**

   - [ ] Email templates (Nodemailer)
   - [ ] In-app banners

4. **Affiliate Program**

   - [ ] Refersion integration
   - [ ] Affiliate dashboard

5. **Reporting & Analytics**

   - [ ] Event tracking, funnel, KPIs

6. **Support, Legal, FAQ**

   - [ ] Support/contact, legal hub, FAQ (CMS)

7. **Reliability & Security**

   - [ ] Daily DB backups, restore test, error monitoring

8. **Mobile & PWA**
   - [ ] Responsive QA, PWA manifest

---
