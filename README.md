# Revora — AI Revenue Recovery Agent

Built for **Razorpay Buildathon 2026 — Track 03: AI Revenue Recovery**

> **Revora** is an AI-assisted revenue recovery system built for e-commerce checkouts on Razorpay. It monitors checkout payment failures and abandoned carts, diagnoses why revenue is at risk using Google Gemini AI, executes policy-guarded recovery actions (such as 1-click recovery payment links or retries), and reconciles recovered payments when completed. Built by me as a solo project for the Razorpay Buildathon 2026.

---

## Overview

When an online checkout payment fails or a buyer leaves during checkout, revenue is lost. In traditional e-commerce setups, gateway errors like bank outages, card declines, or netbanking timeouts leave buyers stuck with generic error messages. Passive analytics tools record the drop-off, but no automated recovery attempt takes place.

Revora treats payment failures and checkout abandonments as active recovery candidates. It captures payment decline telemetry and checkout session activity, uses Google Gemini AI to analyze the failure pattern, suggests a suitable recovery action, and tracks the recovered revenue once payment is completed.

---

## Why Revora

| Feature | Traditional Checkout Setup | Revora Recovery System |
| :--- | :--- | :--- |
| **Failure Handling** | Displays "Payment Failed" status and stops. | Intercepts failure as an active revenue recovery candidate. |
| **Root Cause Analysis** | Shows raw gateway error codes (`BAD_REQUEST`, `AUTHORIZATION_FAILED`). | Gemini AI contextual diagnosis with confidence scoring. |
| **Recovery Strategy** | Relies on manual merchant outreach or customer retry. | Recommends bounded recovery actions (1-click link, retry, alternative method). |
| **Abandonment Tracking** | Passive funnel drop-off stats in analytics tools. | Real-time session tracking + automatic 5-minute inactivity detection. |
| **Payment Truth** | Disjointed gateway logs and order databases. | Razorpay verification & webhooks act as single source of truth for payment status. |
| **Auditability** | Isolated transaction logs. | Complete lifecycle audit trail in Supabase. |

---

## What Revora Does

- **Detects Payment Failures**: Listens to Razorpay Test Mode checkout failures from both modal events and server webhooks.
- **Detects Checkout Abandonments**: Tracks checkout session activity and automatically flags sessions as abandoned after 5 minutes of inactivity.
- **Diagnoses Root Cause via AI**: Evaluates structured payment decline metadata and checkout events using Google Gemini AI to produce root-cause explanations and confidence scores.
- **Executes Bounded Recovery Actions**: Dispatches recovery actions such as generating 1-click Razorpay recovery payment links, suggesting alternative payment methods, or scheduling smart retries.
- **Reconciles Recovered Payments**: Verifies Razorpay payment signatures and webhook events (`payment.captured`) to reconcile recovered payments back to original checkout sessions and recovery cases.
- **Provides Merchant Intelligence**: Displays live recovery metrics, failure cause breakdowns, recovery conversion rates, and case audit trails inside a dedicated merchant portal.

---

## How AI Is Used

Google Gemini AI (`@google/genai`) is used strictly as a diagnostic and recommendation layer.

> **Payment Verification Truth**: Razorpay signature verification and Supabase database records determine whether a payment actually succeeded or failed. Gemini AI does **not** decide whether money was captured.

### How Gemini Works in Revora:
1. **Input Payload**: When a payment fails or a checkout is abandoned, Revora constructs a structured JSON payload containing error codes, decline step, payment method, order amount, and session activity logs.
2. **AI Diagnosis**: Gemini analyzes the payload and generates a structured response with a failure diagnosis, reasoning summary, confidence score, and recommended recovery action.
3. **Action Policy Check**: Revora's application logic validates the AI recommendation against predefined safety rules (e.g. verifying the session is unpaid and checking retry limits) before creating a recovery action.

### Standardized Recovery Action Types:
- `retry_payment`: Guidance for immediate or delayed retry when temporary bank network issues occur.
- `alternative_payment_method`: Suggest switching from Card to UPI or Netbanking when specific payment channels fail.
- `payment_link`: Generates a personalized 1-click Razorpay recovery payment link for the customer.
- `customer_notification`: Prepares recovery details for email or messaging outreach.

---

## Main Features

- **Storefront & Checkout Integration**: Includes a product catalog (`/store`), cart (`/cart`), and checkout modal (`/checkout`) integrated with Razorpay Test Mode.
- **Razorpay Order & Payment APIs**: Server-side order creation (`/api/razorpay/create-order`), client payment verification (`/api/razorpay/verify-payment`), and webhook listener (`/api/webhooks/razorpay`).
- **Checkout Abandonment Detection**: Session tracking via `/api/events/track` and inactivity evaluator `/api/events/abandonment/eval`. Sessions start as `ACTIVE` and transition to `ABANDONED` after 5 minutes of inactivity.
- **AI Diagnostic Engine**: Endpoints (`/api/recovery/analyze` & `/api/recovery/abandonment-analyze`) that call Gemini AI to analyze failures and return structured recovery strategies.
- **Bounded Action Engine**: Generates recovery actions and payment links (`/api/recovery/action` & `/api/recovery/abandonment-action`). Successful payments reconcile session status to `COMPLETED_CAPTURED` and case status to `RESOLVED`.
- **Merchant Executive Portal**: Routes for Dashboard (`/merchant`), Payment Failures (`/merchant/payments`), Abandonments (`/merchant/abandonments`), Analytics (`/merchant/analytics`), and Razorpay Simulator (`/merchant/sandbox`).
- **Supabase Authentication**: Protected merchant routes using Supabase Auth, with instant demo login for reviewers (`demo@revora.app` / `RevoraDemo123!`).

---

## How the System Works

Revora follows a straightforward execution flow:

```
Customer Checkout
       ↓
Payment / Abandonment
       ↓
Recovery Case
       ↓
AI Analysis
       ↓
Recovery Action
       ↓
Payment Captured
       ↓
Analytics Updated
```

---

## Data Flow

1. **Checkout Initiation**: When a customer starts checkout on `/checkout`, a session is created in `checkout_sessions` with status `ACTIVE`.
2. **Failure or Abandonment Event**:
   - If a Razorpay payment fails, a record is added to `payments` with status `failed`, and a `recovery_cases` record is created.
   - If checkout remains inactive for more than 5 minutes, `/api/events/abandonment/eval` updates the session status to `ABANDONED` and creates a recovery case.
3. **AI Diagnosis**: Structured telemetry is sent to Google Gemini AI via `/api/recovery/analyze` or `/api/recovery/abandonment-analyze` to produce a diagnosis and recommended action type.
4. **Recovery Action**: Triggering a recovery action via `/api/recovery/action` or `/api/recovery/abandonment-action` creates a `recovery_actions` record and generates a 1-click Razorpay payment link.
5. **Payment Capture & Reconciliation**: When the customer completes payment through the link or retry, Razorpay verification (`/api/razorpay/verify-payment`) or webhook (`/api/webhooks/razorpay`) updates:
   - `payments` → status `captured`
   - `checkout_sessions` → status `COMPLETED_CAPTURED`
   - `recovery_cases` → status `RESOLVED`
   - `recovery_actions` → status `COMPLETED`
6. **Analytics Refreshed**: Reconciled revenue amounts are added to recovered revenue metrics in `/merchant/analytics` and `/merchant`.

---

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Payment Processing**: Razorpay Node SDK (`razorpay`)
- **AI Diagnostics**: Google Gemini API (`@google/genai`)
- **Database & Auth**: Supabase (`@supabase/supabase-js`)
- **Hero Visuals**: HTML5 Video Engine (`/videos/revora-engine.mp4`)

---

## Database & Data Model

Revora uses Supabase (PostgreSQL) as its database. The core tables and their purposes are:

- **`checkout_sessions`**: Stores customer checkout sessions, cart contents, total cart value, customer email/phone, current status (`ACTIVE`, `ABANDONED`, `COMPLETED_CAPTURED`), and timestamps.
- **`payments`**: Records all Razorpay payment attempts, order IDs, payment IDs, amounts, error codes, error descriptions, and payment statuses (`created`, `failed`, `captured`).
- **`recovery_cases`**: Tracks open and resolved recovery cases created for failed payments or abandoned checkouts, including risk amount, case status (`OPEN`, `RESOLVED`), and failure reason.
- **`recovery_actions`**: Logs specific recovery actions dispatched for a case (e.g. generating a payment link), storing the AI diagnosis, confidence score, action type, status (`PENDING`, `COMPLETED`), and recovery URL.
- **`events`**: Records granular funnel events (such as `checkout_started`, `payment_failed`, `checkout_abandoned`) linked to sessions for activity timelines and abandonment evaluation.

---

## Project Structure

```
revora/
├── app/
│   ├── page.tsx                     # Landing page with blended hero video
│   ├── store/                       # Customer storefront catalog
│   ├── cart/                        # Cart page
│   ├── checkout/                    # Checkout page & Razorpay modal integration
│   ├── product/                     # Product detail pages
│   ├── merchant/                    # Merchant Portal
│   │   ├── page.tsx                 # Executive Dashboard
│   │   ├── payments/                # Payment Failures Recovery
│   │   ├── abandonments/            # Checkout Abandonments Recovery
│   │   ├── analytics/               # Revenue Analytics & Metrics
│   │   ├── sandbox/                 # Razorpay Payment Simulator
│   │   └── login/                   # Merchant Auth & Demo Login
│   └── api/
│       ├── razorpay/
│       │   ├── create-order/        # Server-side Razorpay order creation
│       │   └── verify-payment/      # Payment signature verification
│       ├── webhooks/
│       │   └── razorpay/            # Razorpay webhook listener
│       ├── events/
│       │   ├── track/               # Checkout funnel event tracking
│       │   └── abandonment/eval/    # Inactivity evaluator (5-minute timeout)
│       ├── recovery/
│       │   ├── analyze/             # Gemini AI failure analysis
│       │   ├── abandonment-analyze/ # Gemini AI abandonment analysis
│       │   ├── action/              # Failure recovery action dispatcher
│       │   ├── abandonment-action/  # Abandonment recovery link generator
│       │   ├── metrics/             # Aggregate metrics calculation
│       │   └── analytics/           # Analytics summary data
│       └── test-supabase/           # Supabase connection test endpoint
├── components/                      # Shared UI components & navigation
├── context/                         # Cart and store React context
├── data/                            # Sample store product dataset
├── lib/
│   ├── supabase.ts                  # Supabase client initialization
│   ├── authServer.ts                # Server-side merchant auth verification
│   └── analytics/
│       └── abandonment.ts           # Inactivity detection logic (5-min timeout)
├── public/
│   └── videos/
│       └── revora-engine.mp4        # Hero video asset
├── .env.local                       # Local environment configuration (git-ignored)
├── middleware.ts                    # Merchant route protection middleware
├── package.json                     # Dependencies & scripts
└── tsconfig.json                    # TypeScript configuration
```

---

## Environment Variables

To run Revora locally or in deployment, configure these environment variables in `.env.local`:

```env
# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Razorpay Test Mode Credentials
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Google Gemini AI API Key
GEMINI_API_KEY=your-google-gemini-api-key

# Optional: Inactivity Timeout in Minutes (Defaults to 5)
ABANDONMENT_TIMEOUT_MINUTES=5
```

---

## Running Locally, Testing & Demo Account

### Prerequisites
- Node.js `^18.17.0` or `>=20.0.0`
- npm `^9.0.0`
- Supabase Project
- Razorpay Test Mode Account
- Google Gemini API Key

### Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/NagaTejaSriCore/Revora.git
   cd Revora
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env.local` file in the root folder with your credentials as shown in the [Environment Variables](#environment-variables) section.

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing Commands & Verification

- **TypeScript Compilation Check**:
  ```bash
  npx tsc --noEmit
  ```
- **Razorpay Sandbox Simulator**:
  Visit `/merchant/sandbox` to simulate Razorpay payment declines (e.g. invalid OTP, bank downtime, insufficient funds) and test AI diagnostic outputs and recovery link generation.

### Demo Merchant Credentials

To test the merchant portal without creating a new account:
- **Login Page**: `/merchant/login`
- **Demo Email**: `demo@revora.app`
- **Demo Password**: `RevoraDemo123!`

Alternatively, click **"Instant Demo Merchant Sign In"** on `/merchant/login` to authenticate automatically via Supabase Auth.

---

## Landing Page & Hero Video Integration

The landing page (`/`) presents the Revora AI engine visual using a video asset located at `public/videos/revora-engine.mp4`.

Rather than sitting inside a boxed rectangular player or card container, the video is integrated directly into the dark navy hero background using borderless CSS rendering and radial gradient edge-masking (`mask-image` / `backdrop-filter`). This makes the animated core visual feel like an organic part of the hero section.

---

## Challenges During Development

- **Razorpay Payment Synchronization**: Coordinating client-side Razorpay modal callbacks and asynchronous server webhooks (`payment.failed`, `payment.captured`) to ensure payment status updates in Supabase are idempotent and do not create duplicate records.
- **Checkout Abandonment Detection**: Designing session inactivity evaluation that runs smoothly without polling continuously. Evaluating active checkout sessions after 5 minutes of inactivity required careful timestamp tracking (`lastActivityAt`) to avoid false positives on active checkouts.
- **Recovery Payment Reconciliation**: Linking newly created recovery payment links back to original checkout sessions so that when a customer pays via a recovery link, the payment is correctly credited to the original recovery case and session rather than treated as an unrelated purchase.
- **Gemini API Output Formatting**: Gateway decline descriptions can be inconsistent or noisy. Formatting decline telemetry into structured prompts for `@google/genai` was necessary to reliably extract clean diagnostic explanations and valid recovery action types.
- **Hero Video Integration**: Blending the hero background video smoothly without visible card borders or player outlines required fine-tuning CSS gradient masks to match the dark navy palette across different display sizes.

---

## What I Learned

Building Revora as a solo project was a great hands-on experience in combining payment gateway APIs with LLM diagnostic capabilities:
- **Designing Financial Recovery State Machines**: Mapping transaction lifecycles across `ACTIVE`, `ABANDONED`, `failed`, `captured`, and `RESOLVED` states taught me how to keep database states consistent across asynchronous webhooks.
- **Keeping AI Bounded**: Enforcing clear boundaries where payment state logic remains strictly deterministic (Razorpay verification), while AI is leveraged for pattern recognition and diagnostic reasoning.
- **Full-Stack Next.js 16 Patterns**: Utilizing Next.js App Router API handlers alongside Supabase and Tailwind CSS v4 to construct a responsive e-commerce storefront and merchant analytics dashboard.

---

## Future Improvements

- **WhatsApp & SMS Gateway Integration**: Automated dispatch of 1-click recovery payment links via WhatsApp (Twilio / Gupshup API) for higher open rates.
- **Custom Merchant Policy Rules**: Interface allowing merchants to configure custom max-retry caps and cooldown windows based on cart value or product categories.
- **Multi-Gateway Failover Routing**: Automatic failover to secondary payment gateways (e.g. PayU or Cashfree) when bank-level downtime is detected on Razorpay.

---

## About the Project

Revora was designed and built by me as a solo project for the **Razorpay Buildathon 2026 — Track 03: AI Revenue Recovery**.
