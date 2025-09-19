Algomakers.Ai Website Development - MVP

Scope for Subscription-Per-Pair Strategy Website

- Subscription Page (Table View)
  - A dedicated page listing all pairs (symbols) in a table.
  - Table shows performance metrics like ROI, risk/reward ratio, trades, etc.
  - Users can browse and subscribe to any pair directly.
    Reference: https://tradesearcher.ai/app/symbols/market/crypto
- Pair Detail Page (Full Backtest View)
  - Clicking a pair opens a detailed backtest performance page.
  - Shows equity curve, ROI growth, drawdowns, and trade stats.
  - Layout similar to the screenshots (first = overview table, second = full details).
    Reference: https://tradesearcher.ai/app/strategies/report/104946

🔹 Ranking the Importance of Elements

1. Performance Table (High Priority)
   Core entry point for users. Needs to be sortable, filterable, and clear.
2. Full Backtest Page (High Priority)
   Builds trust by showing transparency and depth of performance.
3. Subscription & Payment Flow (Critical)
   Pricing per pair visible. Smooth checkout and instant access required.
4. Access Control (Medium Priority)
   Free users see limited stats. Paid users unlock everything.
5. User Experience (Medium Priority)
   Mobile-friendly, clean design, fast loading.

🔹 Insights & Recommendations

- Trust & Transparency
  Customers only buy if they trust the data. Detail pages must look professional.
  Add disclaimers: results are backtests, not guaranteed.
- Conversion Flow
  Place Subscribe buttons both in the table row and inside the detail page.
- Bundling Option
  Offer discounts for multiple pairs (e.g., 3 pairs or 5 pairs bundles).
- Analytics
  Track which pairs are clicked most. Use this data to promote popular ones.

---

🔹 Flowchart TD

A --> [🏠 Homepage] --> B --> [📊 Subscription Page (Table)]
B -->|Click Pair| C --> [📈 Pair Detail Page]
C -->|Subscribe| D --> [💳 Checkout]
D --> E --> [📢 Admin Notified]
E --> F --> [👨‍💻 Admin Sends TradingView Invite]
F --> G --> [⚙️ Admin Marks Complete in Control Panel]
G --> H --> [📩 User Notified + TradingView Invite Received]
H --> I --> [✅ Full Access Granted]
I --> J --> [🔁 Ongoing Engagement]

🧭 User Journey With Subscription Periods (Full Requirements)

🏠 Homepage

- Intro section with headline + CTA: “Explore strategies & subscribe per pair.”
- Buttons leading to Subscription Page (Table View).

1. 📊 Subscription Page (Table View)

- User sees a table of all available pairs with performance metrics (ROI, Risk/Reward, Trades, etc.).
- Each row has a Subscribe button.
- Example reference: https://tradesearcher.ai/app/symbols/market/crypto

2. 📈 Pair Detail Page (Backtest View)

- When user clicks a pair, they see full backtest details: equity curve, ROI, win rate, drawdown, trade stats.
- Page contains Subscribe button.
- Example reference: https://tradesearcher.ai/app/strategies/report/104946

3. 🛎️ Subscription Prompt

- When user clicks Subscribe:
  - They select Pair(s).
  - They select Period (1 Month, 3 Months, 6 Months, 12 Months).
  - They are prompted to enter their TradingView Username (mandatory field).
    TradingView Username Field Requirements: - Label: “TradingView Username (required)” - Placeholder: “Enter your exact TradingView username” - Helper text: “We need this to send your private invite. Please make sure it matches your TradingView account.” - Field is required (cannot leave blank). - Min 3 characters. - Alphanumeric + underscores only. - Error messages: - “TradingView username is required.” - “Invalid format, please check your username.”

4. 💳 Checkout

- Payment processed for chosen pair + subscription period.
- TradingView username is included in the order record.

5. 📢 Admin Notification

- After payment, the system notifies admin with:
  - User name + email.
  - Pair subscribed.
  - Subscription period (e.g., 3 months).
  - TradingView username.
- Admin sees this in the control panel + email alert.

6. 👨‍💻 TradingView Invitation

- Admin logs in to TradingView and sends invite to the TradingView username provided.
- Admin sets the expiry date in the control panel (based on subscription period).
- Example: 3 months → expiry date auto-suggested, admin confirms.

7. 📩 User Notification – Pending

- Immediately after payment, user gets:
  - Dashboard message: “Your subscription is confirmed. Admin will send your TradingView invite shortly.”
  - Email: “We are preparing your TradingView invitation. You’ll be notified when it’s completed.”

8. ✅ User Notification – Completed

- After admin marks invite as complete:
  - User receives email:
    - Subject: “Your TradingView invite is ready 🎉”
    - Body: “Your subscription to [Pair Name] is active. Invite sent to [TradingView Username]. Valid for [Period] until [Expiry Date].”
  - Dashboard shows status: “Access granted – please check your TradingView account.”

9. ⏰ Renewal Reminder

- 7 days before expiry, system sends reminder:
  - Subject: “Your subscription is expiring soon ⏳”
  - Body: “Your subscription to [Pair Name] ends on [Expiry Date]. Renew now to continue uninterrupted access.”
  - Include Renewal button/link to checkout page.

---

💳 Period Subscription Options

📅 1 Month – $25

Tagline: Start small, test the strategy with zero commitment.
Button Text: “Subscribe for 1 Month”

📅 3 Months – $65 + Save 13%

Tagline: Stay consistent and track results over a full quarter.
Button Text: “Subscribe for 3 Months”

📅 6 Months – $120 ⭐ Most Popular + Save 20%

Tagline: Commit to growth and save while building momentum.
Button Text: “Subscribe for 6 Months”

📅 12 Months – $200 🏆 Best Value + Save 33%

Tagline: Maximize savings and trade with confidence all year long.
Button Text: “Subscribe for 12 Months”

Insights for Layout

- Show “Most Popular” badge on the 6-Month option.
- Show “Best Value” badge on the 12-Month option.
- Place the “Subscribe” button under each plan.
- On mobile, stack the plans vertically for clarity.
- Plan duration at the top (1 Month, 3 Months, etc.).
- Price in bold and large font.
- Discount as a small badge.
- “Subscribe” button in a contrasting color.

---

📩 Notifications

User-facing notifications

A- Workflow Notifications

1. Email – After Payment (Admin Pending)

Subject: Your subscription is being processed 🚀
Hello [First Name],
Thank you for subscribing to the [Pair Name] strategy.Our team at AlgoMakers.Ai has received your request and is preparing your TradingView invitation.
You’ll receive another email once your access is completed.Expected time: within 24 hours.
Best regards,AlgoMakers.Ai Team

2. Dashboard Message – After Payment

Title: Subscription in progress Your subscription to [Pair Name] is confirmed. The AlgoMakers.Ai admin will send you a TradingView invite shortly. You’ll get an email once this step is complete.

3. Email – After Admin Completes TradingView Invite

Subject: Your TradingView invitation is ready 🎉
Hello [First Name],
Your subscription to the [Pair Name] strategy is now active.A TradingView invite has been sent to your account.
👉 Please check your TradingView notifications and accept the invite.
Subscription Period: [e.g., 3 Months]Expiry Date: [Date]
You’ll receive a reminder before your subscription ends.
Thank you for choosing AlgoMakers.Ai,AlgoMakers.Ai Team

4. Dashboard Message – After Admin Completes Invite

Title: Access granted ✅Your TradingView invitation for [Pair Name] has been sent. Please check your TradingView account notifications to accept it and start using the strategy.

B- 📩 Renewal Notifications

Renewal Reminder (7 days before expiry)

Subject: Your subscription to [Pair Name] is expiring soon ⏳
Hello [First Name],
Your subscription to the [Pair Name] strategy will expire on [Expiry Date].
To continue uninterrupted access, renew your subscription here:👉 [Renewal Link]
Thank you,AlgoMakers.Ai Team

Admin Notification

1.  Email – (New Order)

Subject: Action required – New subscription for [Pair Name]
Hi Team,
A new subscription requires a TradingView invite.
User: [First & Last Name]
Email: [User Email]
Tradingview: [Tradingview User]
Pair: [Pair Name]
Subscription Period: [1 month / 3 months / 6 months / 1 year]
Expiry Date: [Calculated Date]

Next steps:

1. Send the TradingView invite.
2. Mark the subscription as completed in the control panel.
3. The system will notify the user with invitation completed and their expiry date.
   Admin Panel: [Link]
   Thanks,AlgoMakers.Ai

📧 Email Templates (AlgoMakers.Ai)

1. 💳 Payment Receipt

Subject: ✅ Payment received for [Pair] subscription
Header: Your payment was successful!
Body:Hello [First Name],We’ve received your payment for [Pair] – [Period].
Details:

- Amount: [XX USDT]
- Network: [TRC20]
- Transaction ID: [TxHash]
- Subscription: [Pair] ([Period])
- Expiry: [Expiry Date]
  Next step: 🎯 Our admin will send your TradingView invite shortly to [TradingView Username].
  CTA Button: Go to Dashboard
  Footer:Thank you for choosing AlgoMakers.Ai 🚀Need help? [Contact Support]

2. 📨 Invite Pending

Subject: ⏳ Your TradingView invite is being processed
Header: We’re preparing your access
Body:Hello [First Name],Your subscription to [Pair] – [Period] is confirmed.Our admin is now processing your TradingView invite for username: [TradingView Username].
You’ll get another email once the invite is completed.
CTA Button: Check Subscription Status
Footer:AlgoMakers.Ai team

3. 🎉 Invite Completed

Subject: 🎉 Your TradingView invite is ready!
Header: Start using your subscription today
Body:Hello [First Name],Great news! We’ve sent a TradingView invite to your account: [TradingView Username].
Subscription details:

- Pair: [Pair]
- Period: [Period]
- Active until: [Expiry Date]
  👉 Please log in to your TradingView account and accept the invite to begin.
  CTA Button: Open TradingView
  Footer:Happy trading with AlgoMakers.Ai 🚀

4. ⏰ Renewal Reminder

Subject: ⏳ Your subscription is expiring soon – renew today
Header: Don’t lose your access
Body:Hello [First Name],Your subscription to [Pair] – [Period] will expire on [Expiry Date].
Renew now to continue uninterrupted access to backtests and live performance updates.
CTA Button: Renew My Subscription
Footer:Thank you for being part of AlgoMakers.Ai 💡

📌 Notes for Dev/Design

- All emails should use AlgoMakers.Ai branding (logo + brand colors).
- Keep layout single column, clean, mobile-friendly.
- Use emojis in subject lines to stand out.
- Add unsubscribe link only for marketing emails, not transactional ones.

---

---

🔐 Register Page Requirements (High Level)

1. 🎨 Branding & Layout
   - Show AlgoMakers.Ai logo at the top.
   - Title: “Log in to your account.”
2. 🔑 Login Options
   - Social logins: Google, Facebook, Discord.
   - Email + password form.
   - “Forgot Password?” link under the form.
3. 🖱️ Controls
   - Main button: “Log In” (bold + highlighted).
   - Footer: “New here? Create account” ➝ link to signup page.
4. ➡️ Flow
   - User logs in via social or email.
   - ✅ Success → go to dashboard or subscription page.
   - ❌ Error → show simple message like “Email or password is incorrect.”
5. 📱 UX Essentials
   - Mobile-friendly, clean, minimal design.
   - Same look & feel as Create Account page.

Reference: https://www.luxalgo.com/api/auth/login?screenHint=signup&returnTo=/

---

💳 Payment Page Requirements (USDT only via NOWPayments)

1. 🎯 Goal

Collect crypto payments in USDT only, then trigger the existing flow, admin notified, TradingView invite, user emails.

2. 💰 Currencies and Networks

- Allowed currency: USDT only
- Allowed networks shown as selectable radio buttons:
  - USDT TRC20 (default, lowest fee)
  - USDT ERC20 (optional, higher fee)
  - USDT BEP20 (optional)
  - USDT SOL (optional)
- If you want one network only, set to TRC20 and hide others.

3. 🧾 Invoice UI

- Header: “Complete your payment”
- Show order summary:
  - Pair name, subscription period, price in USD, price in USDT
  - TradingView username (read only, captured earlier)
- Network selector (if more than one)
- Auto generated payment details from NOWPayments:
  - Amount in USDT (exact)
  - Pay to address
  - QR code for the selected network
  - Countdown timer (for example 20 minutes)
- Copy buttons:
  - “Copy USDT amount”
  - “Copy address”
- Helper text:
  - “Only send USDT on the selected network”
  - “Sending from exchanges can take longer”
  - “Underpayments and overpayments may delay activation”

4. 🧠 Page Flow

1425) User lands on Payment page with order data prefilled (pair, period, TradingView username).
1426) User selects USDT network (or preselected TRC20).
1427) System calls NOWPayments to create a payment and receives the payment details.
1428) Page renders amount, address, QR code, and countdown timer.
1429) User sends USDT.
1430) Page polls payment status or listens for webhook result.
1431) On success, show “Payment received” state and continue to the post payment flow.

5. 🧩 Post Payment Automation

Upon finished status:

1. Create subscription record with start date and calculated expiry.
2. Trigger Admin Notification with user details, pair, period, TradingView username, payment_id.
3. Show “Payment successful” page to user with next steps:
   - “Admin will send your TradingView invite shortly”
   - “You will get an email when access is ready”
4. Email user “Payment received” receipt.
5. When admin marks complete, send the “Invite is ready” email as defined earlier.

6) 🧭 Admin Console Requirements

- Payments tab:
  - Search by user, pair, payment_id, status.
  - View invoice details: amount, network, tx id, timestamps.
  - Button “Mark as completed” after sending TradingView invite.
  - Button “Resend success email”.
- Filters: pending, confirming, finished, expired, underpaid, failed.

Flowchart TD

    %% Define swimlanes
    subgraph U --> [👤 User]
        U1 --> [🧾 Checkout Page<br/>Select Pair + Period + Enter TradingView Username]
        U2 --> [💳 Payment Page<br/>See Invoice (USDT amount, address, QR)]
        U3 --> [⏳ Send USDT<br/>Wait for confirmation]
        U4 --> [✅ Success Screen<br/>"Payment received! Admin will send invite"]
        U5 --> [📩 Email: Payment Receipt<br/>Pending TradingView invite]
        U6 --> [📩 Email: TradingView Invite Ready<br/>Accept invite on TradingView]
    end

    subgraph A --> [👨‍💻 Admin]
        A1 --> [📢 Notification: New Payment Received<br/>User + Pair + Period + TV Username]
        A2 --> [👨‍💻 Send TradingView Invite<br/>to Provided Username]
        A3 --> [⚙️ Mark as Completed<br/>in Control Panel]
        A4 --> [📩 System Sends Invite Confirmation<br/>to User]
    end

    %% Connections
    U1 --> U2 --> U3
    U3 -->|NOWPayments webhook confirms| A1
    A1 --> A2 --> A3 --> A4
    A4 --> U6
    U3 --> U4 --> U5

🔎 How to Read It

- User lane (👤): Browses checkout, pays in USDT, sees success screen, gets receipt email, then invite email.
- Admin lane (👨‍💻): Gets notified once payment confirmed, sends TradingView invite, marks completed, which triggers final email to the user.
- Both lanes show when the process intersects (via NOWPayments webhook + admin completion).

---

🖥️ Admin Control Panel Requirements

1. 🎯 Objective

Give admins full control over managing subscriptions, payments, and TradingView invites — with clear visibility into user details, statuses, and expiry dates.

2. 📊 Dashboard Overview

- Widgets / Counters at the top:
  - Total Active Subscriptions
  - Pending Invites
  - Expiring Soon (next 7 days)
  - Payments Awaiting Confirmation
- Quick filter buttons: All / Pending / Active / Expired.

3. 📋 Subscriptions Table

Columns:

- User name + email
- TradingView username
- Pair subscribed
- Subscription period (1M / 3M / 6M / 12M)
- Start date
- Expiry date
- Payment status (Pending, Confirming, Paid, Expired, Failed)
- Invite status (Pending, Completed, Failed)
- Actions (Mark Complete, Resend Email, Cancel)
  Filters:
- By pair
- By status (active, pending, expired)
- By expiry date (expiring this week, this month)

4. 📢 Subscription Detail View

When admin clicks a row → open detail page with:

- Full user info (name, email, TradingView username).
- Order summary (pair, subscription period, payment ID, NOWPayments invoice ID).
- Payment details (amount, network, tx ID, timestamps).
- Invite status + activity log (who marked complete, when).
  Actions inside detail view:
- Send TradingView Invite (manual step outside system, but admin confirms here).
- Mark as Completed (triggers “Invite Ready” email to user).
- Resend Payment Confirmation Email.
- Cancel Subscription (with reason, triggers email to user).

5. ⏰ Expiry & Renewal Management

- Automatic calculation of expiry date from subscription period.
- “Expiring Soon” tab to view users ending in next 7 days.
- Bulk action: Send renewal reminder emails.

6. 🧾 Payment Management

- Payments tab with all crypto transactions.
- Columns: Payment ID, User, Pair, Amount, Network, Status, Tx hash, Invoice ID.
- Filters: Status (Pending, Confirming, Paid, Expired, Underpaid, Failed).
- Action: Link to NOWPayments dashboard for manual reconciliation if needed.

7. 📨 Notification Management

- Log of all system emails sent to user (Payment Receipt, Invite Ready, Renewal Reminder).
- Button: “Resend Email” (for each).

8. 📜 Audit Log

- Record all admin actions:
  - Mark Complete
  - Cancel Subscription
  - Resend Email
- Show timestamp + admin username for accountability.

9. 🔐 Access Control

- Role-based access:
  - Admin = Full control (payments, subscriptions, invites).
  - Support = View + resend emails, no cancel/expiry edits.
  - Manager = All above + manage admins.

10. ✅ Success Criteria

- Admin can see all pending subscriptions with required details (user, pair, TradingView username, expiry).
- Payment → Invite → Completion flow is fully trackable.
- System automatically keeps expiry and renewal in sync.
- All admin actions are logged for transparency.

  11)Flowchart TB

A[🖥️ Admin Control Panel] --> B[📊 Dashboard Overview]
A --> C[📋 Subscriptions]
A --> D[🧾 Payments]
A --> E[📨 Notifications]
A --> F[📜 Audit Log]
A --> G[🔐 Access Control]

B --> B1[✅ Active Subs Count]
B --> B2[⏳ Pending Invites]
B --> B3[⚠️ Expiring Soon]
B --> B4[💰 Payments Awaiting Confirmation]

C --> C1[User + TV Username]
C --> C2[Pair + Period]
C --> C3[Start + Expiry Date]
C --> C4[Status: Pending/Active/Expired]
C --> C5[Actions: Mark Complete / Resend Email / Cancel]

D --> D1[Payment ID + Invoice ID]
D --> D2[User + Pair + Amount]
D --> D3[Network + Tx Hash]
D --> D4[Status: Pending / Paid / Expired / Underpaid]

E --> E1[📩 Payment Receipt Emails]
E --> E2[📩 Invite Ready Emails]
E --> E3[📩 Renewal Reminders]
E --> E4[Action: Resend Email]

F --> F1[Admin Actions Log]
F --> F2[Mark Complete / Cancel / Resend Email]
F --> F3[Timestamp + Admin User]

G --> G1[Role: Admin]
G --> G2[Role: Support]
G --> G3[Role: Manager]

🔎 How to Read It

- Dashboard = Quick overview metrics (active, pending, expiring, payments).
- Subscriptions = Core table for managing users, pairs, statuses, actions.
- Payments = All crypto invoices from NOWPayments with reconciliation data.
- Notifications = Log + resend of system emails.
- Audit Log = Tracks all admin actions.
- Access Control = Role-based permissions.

  12)Flowchart TD

subgraph U[👤 User]
U1[🧾 Select Pair + Period<br/>Enter TradingView Username]
U2[💳 Pay with USDT<br/>via NOWPayments]
U3[⏳ Waiting Screen<br/>"Payment processing..."]
U4[✅ Success Screen<br/>"Payment received"]
U5[📩 Email: Payment Receipt]
U6[📩 Email: Invite Ready<br/>Accept on TradingView]
U7[⏰ Renewal Reminder<br/>7 days before expiry]
end

subgraph S[⚙️ System]
S1[🔗 Create Invoice<br/>with NOWPayments API]
S2[📢 Webhook<br/>Payment Confirmed]
S3[📂 Store Order:<br/>User + Pair + Period + TV Username]
S4[📩 Send Payment Receipt Email]
S5[📩 Trigger Renewal Reminder Email]
end

subgraph A[👨‍💻 Admin Control Panel]
A1[📢 Notification: New Subscription<br/>User + Pair + Period + TV Username]
A2[👨‍💻 Send TradingView Invite<br/>to Username]
A3[⚙️ Mark as Completed<br/>in Control Panel]
A4[📩 System Sends "Invite Ready" Email]
end

%% Flow connections
U1 --> U2 --> U3
U2 --> S1
S1 --> S2
S2 --> S3 --> A1
S2 --> S4 --> U5
A1 --> A2 --> A3 --> A4 --> U6
U6 --> U7
S5 --> U7

🔎 How to Read It

- User Lane (👤): Chooses pair, pays with USDT, sees pending → success → receives emails → accepts TradingView invite → later receives renewal reminder.
- System Lane (⚙️): Creates invoice, tracks webhook, stores order, sends payment receipt, schedules renewal reminder.
- Admin Lane (👨‍💻): Gets notified in control panel, manually sends TradingView invite, marks subscription complete, system then sends the final invite email.

🧭 User Dashboard Layout

👋 Welcome back, AhmedHere you can manage your subscriptions, track expiry dates, and view your TradingView invites.

📊 Quick Stats

- ✅ Active Subscriptions: 2
- ⏳ Expiring Soon: 1
- 📨 Pending Invites: 1

📋 Subscriptions

Pair
Period
Status
Start Date
Expiry Date
Actions
BTC/USDT
3 Months
✅ Active
Sep 17, 2025
Dec 17, 2025
🔄 Renew
⬆️ Upgrade
📈 View Backtest
ETH/USDT
1 Month
⏳ Invite Pending
Oct 20, 2025
Nov 20, 2025
✏️ Change TV Username
🛠️ Support
SOL/USDT
6 Months
❌ Expired
Feb 5, 2025
Aug 5, 2025
🔄 Renew

💳 Billing & Invoices

Invoice ID
Date
Pair
Period
Amount (USDT)
Network
Status
#12345
Sep 17, 2025
BTC/USDT
3 Months
65
TRC20
✅ Paid
#12346
Aug 5, 2025
SOL/USDT
6 Months
120
ERC20
❌ Expired

---

🙍 Profile & Account

- 📧 Email: ahmed@example.com
- 🎯 Default TradingView Username: alzahrani_trader
- 🔑 Change Password (button/link)

🔔 Notifications

- 📩 Payment for BTC/USDT received. Invite will be sent shortly.
- ✅ TradingView invite sent for ETH/USDT.
- ⏰ Your SOL/USDT subscription expired on Aug 5, 2025. Renew now to regain access.

🧰 Support & FAQ

- 📨 Contact Support (form with prefilled subscription details)
- 📖 How to Accept a TradingView Invite
- 🔄 How Renewals Work
- 💳 Crypto Payment Help

🧑‍🏫 Empty State (if no subscriptions)

“You don’t have any active subscriptions yet. Browse strategies and start your journey.”👉 Button: “Explore Strategies”

---

🔄 Renew Subscription Modal

Trigger: From Dashboard card (button: Renew)

🧱 Modal Structure

- Title: 🔄 Renew [Pair] subscription
- Subtext: Your current expiry is [Expiry Date]. Renew now to continue access.

🧾 Fields

477. Plan period (radio cards)


    - 1 Month
    - 3 Months
    - 6 Months (Most Popular)
    - 12 Months (Best Value)

478. TradingView username (read only if already set for this subscription, editable link if needed)


    - Value: [tv_username]
    - Small link: ✏️ Edit username (opens inline text field with validation)

479. USDT network (radio)


    - TRC20 (recommended)
    - ERC20 (optional)
    - BEP20 (optional)

🧮 Inline Expiry Calculator

- Label: 📅 New expiry preview
- Logic: New expiry = current expiry plus selected period (for early renewal)
- If already expired: New expiry = today plus selected period
- Display:
  - Current expiry: [Expiry Date]
  - Selected period: [X Months]
  - New expiry: [Calculated Date] (updates live on selection)

💳 Payment Summary

- Price (USD): $[amount]
- Crypto equivalent: [XX.XX USDT]
- Network fee note: Small fees may apply on the selected network.

🧠 Validation

- Plan period required.
- If username edited, validate 3 or more characters, alphanumeric and underscores only, no spaces.

🧷 Buttons

- Primary: 💳 Proceed to payment
- Secondary: ✖️ Cancel

✅ Success State

- Title: ✅ Renewal successful
- Body: Your new expiry is [New Expiry Date].
- Button: 🔙 Go to Dashboard

⚠️ Errors

- Plan not selected: Please choose a period.
- Username invalid: Use letters, numbers, or underscores only.

---

⬆️ Upgrade Plan Modal

Trigger: From Dashboard card (button: Upgrade)

🧱 Modal Structure

- Title: ⬆️ Upgrade to a longer plan
- Subtext: Your current plan ends on [Expiry Date].

🧾 Fields

2156. Target plan (radio cards)


    - 3 Months
    - 6 Months (Most Popular)
    - 12 Months (Best Value)

2157. Upgrade model notice


    - Default recommendation: Additive time model (extra time is added on top of current expiry)
    - Copy: Upgrading will add the selected period to your current expiry.

2158. TradingView username (read only, with edit link if needed)
2159. USDT network (radio)


    - TRC20 (recommended)
    - ERC20 (optional)
    - BEP20 (optional)

🧮 Inline Expiry Calculator

- Label: 📅 New expiry preview
- Additive model: New expiry = current expiry plus target plan period
- Display:
  - Current expiry: [Expiry Date]
  - Added time: [Target Period]
  - New expiry: [Calculated Date]

💳 Payment Summary

- Price (USD): $[target_price]
- Crypto equivalent: [XX.XX USDT]
- Note: Upgrades are not prorated, crypto payments are final.

🧠 Validation

- Target plan required.
- If username edited, apply same username rules as above.

🧷 Buttons

- Primary: 💳 Upgrade now
- Secondary: ✖️ Cancel

✅ Success State

- Title: ✅ Upgrade successful
- Body: Your new expiry is [New Expiry Date].
- Button: 🔙 Go to Dashboard

⚠️ Errors

- Plan not selected: Please choose a target plan.
- Username invalid: Use letters, numbers, or underscores only.

✏️ Edit TradingView Username Inline

Opens when user clicks “Edit username” inside either modal.

- Field: TradingView username
- Placeholder: Enter your exact TradingView username
- Helper: We send the private invite to this username, make sure it matches your TradingView account.
- Validation: 3 or more characters, alphanumeric and underscores only, no spaces.
- Buttons: Save, Cancel
- Success toast: ✅ Username updated

🧩 Payment Handshake (USDT via NOWPayments)

- On Proceed to payment or Upgrade now:
  - Create invoice with NOWPayments for USDT on selected network.
  - Show invoice page with amount, address, QR, and countdown.
  - After finished status, redirect to success state for the modal flow, then to Dashboard.

🪄 Microcopy, ready to use

- Renew subtext: Your current expiry is [Expiry Date]. Renew now to continue access without interruption.
- Upgrade subtext: Upgrading adds [Target Period] to your current expiry.
- Expiry calculator label: 📅 New expiry preview
- Network hint: Use TRC20 for lower fees.
- Success toast: ✅ All set. New expiry is [New Expiry Date].
- Fine print: Crypto payments are final. Upgrades are not prorated.

🧪 Edge Cases and States

- Already expired then Renew: Calculator uses today as the start.
- Already expired then Upgrade: Treat as renewal to target period, new expiry = today plus target period.
- Underpaid invoice: Show banner on payment page, request top up, do not change expiry until payment is finished.
- Invoice expired: Allow user to regenerate a new invoice with the same chosen plan.

🧭 Analytics

- renew_modal_opened, renew_plan_selected, renew_payment_started, renew_success
- upgrade_modal_opened, upgrade_plan_selected, upgrade_payment_started, upgrade_success
- tv_username_edit_clicked, tv_username_saved
- payment_invoice_created, payment_status_finished

✅ Acceptance Criteria

- Renew modal calculates and displays new expiry live when the user changes period.
- Upgrade modal calculates and displays new expiry live based on additive model.
- Username edit works inline with validation and persists in the order.
- Payment creates a USDT invoice and returns success to the correct subscription.
- Dashboard card updates expiry within one minute after success.

---

🛠️ Support & Contact Us Page Layout

🖼️ Hero Section

- Title: 🛠️ Need Help?
- Subtitle: We usually reply within 24 hours
- CTA Button (top right): 📩 Submit a Request

⚡ Quick Actions (cards or icons row)

- 💳 Payment Issue
- 📩 TradingView Invite Issue
- ✏️ Change TradingView Username
- ❓ General Question
  (Clicking a card scrolls to the Contact Form with the issue pre-selected)

📝 Contact Form (dynamic)

Always visible fields

- 👤 Full Name (prefilled if logged in)
- 📧 Email (prefilled, read only if logged in)
- 🏷️ Issue Type (dropdown or preselected if from quick actions)
- 🗒️ Description (textarea)
- 📎 Attachments (upload up to 3 files)
- ✅ Consent checkbox (I agree to the Privacy Policy)
- 🔒 CAPTCHA

Conditional fields

- If Payment Issue
  - Payment Status (Underpaid, Expired, Failed, Other)
  - Amount Sent (optional)
  - Network (TRC20, ERC20, BEP20)
  - Tx Hash (optional)
- If Invite Issue
  - TradingView username (prefilled)
  - Invite status (Not received, Cannot accept, Accepted but no access)
- If Username Change
  - New TradingView username (text input)

📚 Help Articles (side panel or section below form)

- 💡 How to Pay with USDT
- 💡 How to Accept a TradingView Invite
- 💡 What to Do if Payment is Underpaid or Expired
- 💡 Renewal and Upgrade Basics
  (Each opens in modal or new tab with short guides + screenshots)

✅ Submission Confirmation (after form sent)

- Success banner: 🎉 Your ticket has been created
- Ticket number: #[ID]
- Message: We’ll reply to [email] within 24 hours
- Button: 🔙 Back to Dashboard

📄 Footer

- Contact email (support@algomakers.ai)
- Links: Privacy Policy | Terms of Use
- Copyright © AlgoMakers.Ai

📊 Suggested Layout Structure

```
[Hero Section]

[Quick Actions row of 4 cards]

[Contact Form - dynamic]

[Help Articles grid/list]

[Confirmation state (after submission)]

[Footer]
```

---

📜 Legal & Policies

Last Updated: 17 September 2025
Welcome to AlgoMakers.Ai’s Legal Hub. Here you’ll find all our key policies in one place. Use the tabs or expand the sections below to read the details.

📖 Terms of Use

Last Updated: 17 September 2025

1. Introduction

AlgoMakers.Ai provides trading strategy subscriptions and access to backtest performance. By using our site, you agree to these Terms of Use.

2. Eligibility

- Must be 18+ years old.
- Must comply with your local laws.

3. Accounts

- Provide accurate info.
- Keep login credentials secure.

4. Subscriptions & Access

- Subscriptions sold per trading pair.
- Access via TradingView invite.
- Periods: 1, 3, 6, or 12 months.

5. Payments

- USDT only via NOWPayments.
- Networks: TRC20 (recommended), ERC20, BEP20.
- On-chain payments are final.

6. Refunds

- Non-refundable except duplicate/mistaken payments.
- See Refund Policy.

7. No Financial Advice

- Backtests are simulations.
- AlgoMakers.Ai is not responsible for trading outcomes.

8. Acceptable Use

- No sharing, reselling, or scraping.
- Violations may result in termination.

9. Intellectual Property

- All content belongs to AlgoMakers.Ai.
- For personal, non-commercial use only.

10. Third-Party Services

- TradingView access depends on their platform.

11. Termination

We may suspend or terminate accounts for violations.

12. Disclaimers & Liability

- Service provided “as is.”
- Liability capped at fees paid in last 6 months.

13. Changes

We may update these terms with notice.

14. Governing Law

[Insert jurisdiction].

15. Contact

📩 legal@algomakers.ai

🔒 Privacy Policy

Last Updated: 17 September 2025

1. Data We Collect

- Name, email, TradingView username.
- Subscription & payment metadata.
- Usage analytics.

2. How We Use Data

- Manage subscriptions.
- Process payments.
- Send invites & notifications.
- Improve service.

3. Legal Basis

- Contract (subscriptions).
- Legitimate interest (fraud prevention, analytics).
- Consent (marketing emails if opted in).

4. Sharing Data

- NOWPayments (payments).
- Email provider (transactional emails).
- Analytics tools.
- TradingView (invites).

5. Retention

- Account: active + X years.
- Payments: X years (compliance).
- Support tickets: X months.

6. Security

- HTTPS & encryption.
- Access limited to authorized staff.

7. Your Rights

- Access, correct, delete.
- Contact 📩 privacy@algomakers.ai.

8. Children

Not for users under 18.

9. Updates

We may revise this policy. Check the date above.

🍪 Cookies Policy

Last Updated: 17 September 2025

1. What Are Cookies

Small files stored in your browser.

2. Types We Use

- Essential (login sessions).
- Analytics (improving features).
- No ad tracking cookies.

3. Controls

- Manage cookies in browser.
- Some features may not work without essentials.

💸 Refund Policy

Last Updated: 17 September 2025

1. General Rule

- Crypto payments are final.

2. Exceptions

Refunds may be considered if:

- Duplicate payment.
- Clear overpayment.

3. Method

- Refund in USDT.
- Same network used.
- Network fees deducted.

4. Request Process

Email 📩 support@algomakers.ai with:

- Payment ID
- Tx hash
- Proof of issue

📩 Footer

- 📖 Terms of Use
- 🔒 Privacy Policy
- 🍪 Cookies Policy
- 💸 Refund Policy
  AlgoMakers.Ai © 2025

---

FAQ Page Layout – AlgoMakers.Ai

🖼️ Hero Section

- Title: ❓ Frequently Asked Questions
- Subtitle: Quick answers about payments, access, and subscriptions

🧭 Categories (accordion or tabbed)

493. 💳 Payments
494. 📈 TradingView Access
495. ⏳ Subscriptions & Expiry
496. 💸 Refunds

💳 Payments

Q: What payment methods are accepted?A: We only accept USDT (Tether) via NOWPayments. Networks: TRC20 (recommended), ERC20, BEP20.
Q: Are crypto payments final?A: Yes, crypto transactions are final once confirmed on-chain.
Q: What if I underpay or send the wrong amount?A: If the amount is short, the system will keep the invoice pending until you top up. Contact support if unsure.

📈 TradingView Access

Q: How do I get access after subscribing?A: Once payment is confirmed, our admin will send a TradingView invite to your registered username.
Q: How long does it take to receive the invite?A: Usually within 24 hours, you’ll also get an email confirmation.
Q: Can I change my TradingView username?A: Yes. Go to your dashboard → Edit username → Save → Admin will resend the invite.

⏳ Subscriptions & Expiry

Q: What subscription options are available?A: 1, 3, 6, or 12 months per trading pair.
Q: What happens when my subscription expires?A: Access is automatically revoked, and you’ll receive a renewal reminder.
Q: Can I renew early?A: Yes. Renewals extend your current expiry date without losing remaining days.
Q: Can I upgrade my subscription?A: Yes. Upgrades add extra time on top of your current expiry.

💸 Refunds

Q: Do you offer refunds?A: By default, no. Crypto payments are final.
Q: Are there exceptions?A: Only in rare cases, such as duplicate payments or clear overpayments.
Q: How do I request a refund?A: Contact 📩 support@algomakers.ai with your transaction ID and details.

🛠️ Developer Requirements for FAQ Page

🎨 Design

- Clean single-column layout.
- Accordion style (expand/collapse) for each category.
- Emoji icons for categories (💳 📈 ⏳ 💸).
- Responsive: works on mobile and desktop.

⚙️ Functionality

- FAQ list stored in CMS (so admins can add/update questions without code).
- Support search/filter bar at top to quickly find answers.
- Expand/collapse per question (default collapsed).
- Permalink support: /faq#payments → auto-open Payments category.

📱 UX Requirements

- Users should see categories first, then expand to see answers.
- When expanded, scroll should auto-focus to that question.
- Each answer can include text, links, or small inline images (e.g., payment screenshots).

🔒 Compliance & Content

- Payments answers must clearly state “Crypto transactions are final.”
- Refund section must link to the Refund Policy page.
- Expiry/renewal answers must be consistent with subscription rules.

🧪 QA Checklist

- Test all expand/collapse animations on mobile + desktop.
- Test deep links (/faq#refunds) open correct category.
- Verify content updates via CMS without breaking layout.
- Check dark mode readability (if site supports dark mode).

✅ Acceptance Criteria

- FAQ loads in <2s, mobile-friendly.
- Users can expand/collapse questions smoothly.
- Search works across all FAQ text.
- Links to Refund Policy, Support, and Dashboard are clickable inside answers.
- Admin can update FAQs from CMS without dev help.

---

📊 Analytics & Tracking Page Layout

🖼️ Hero Section

- Title: 📊 Analytics Dashboard
- Subtitle: Track user actions, payments, and conversions

📂 Sections

1. 🧭 Key Metrics (top summary cards)

- Visitors today / this week
- Subscriptions started
- Payments completed
- Renewal rate (%)
- Conversion rate (%)
  (Cards with numbers + trend arrows)

2. 🔄 Funnel Overview

- Funnel visualization:
  - Page View → Checkout Started → Payment Success → TradingView Invite Sent → Active Subscription
- Each stage shows:
  - Number of users
  - Drop-off %

3. 📑 Event Logs (table view)

Event
User
Pair
Timestamp
Metadata
Checkout Started
user123
BTC/USDT
2025-09-17 10:32
period=3mo
Payment Success
user123
BTC/USDT
2025-09-17 10:35
tx=abc123
Renewal Click
user456
ETH/USDT
2025-09-16 19:05
period=6mo

4. 🔔 Alerts (optional)

- High checkout abandonment today
- Spike in failed payments
- Renewal reminders clicked

🛠️ Developer Requirements

🎨 Frontend

- Responsive dashboard page under /admin/analytics.
- Use chart library (e.g., Chart.js or Recharts) for funnel and metrics.
- Data tables with filters (by date, user, pair, event).
- Export CSV option for logs.

⚙️ Backend / Tracking

- Event schema:
  - event_id
  - user_id (nullable for anonymous)
  - event_type (checkout_started, checkout_abandoned, payment_success, renewal_click, invite_sent)
  - timestamp
  - metadata (JSON, e.g., pair, period, tx hash)
- Store in DB table: analytics_events.
- API endpoints:
  - POST /events (capture events)
  - GET /analytics/summary (aggregate metrics)
  - GET /analytics/funnel (funnel counts)
  - GET /analytics/logs (event list)

📱 UX Requirements

- Admins only (require login + role=admin).
- Show data in local timezone (e.g., KSA).
- Drill-down: click on a funnel stage → see list of users/events.

🔎 Tracking Events (must capture)

2367. checkout_started → user clicks Subscribe.
2368. checkout_abandoned → started checkout but no payment after 30 min.
2369. payment_success → USDT payment finished.
2370. renewal_click → user clicks Renew in dashboard/email.
2371. invite_sent → TradingView invite sent by admin.
2372. invite_accepted (optional, if user confirms).

🧪 QA Checklist

- Test all events fire on correct action.
- Verify event schema stored in DB.
- Funnel numbers match logs.
- Edge cases: anonymous user starts checkout but never signs up.
- Export works for large datasets.

✅ Acceptance Criteria

- Admin can view summary metrics, funnel chart, and logs.
- Events fire correctly from user actions and payment webhooks.
- Checkout abandonment tracked automatically.
- CSV export available.
- Page loads within 2s for up to 100k events.

---

🧭 User Onboarding Page Layout & Dev Requirements

🖼️ Flow Overview

1. Signup Page → Collect email + TradingView username + password
2. Welcome Email → Confirmation & TradingView invite guide
3. First Login Dashboard Tour → Tooltips highlighting key features

🔲 Page Layouts

1. ✍️ Signup Page (/signup)

- Hero text: “Create your AlgoMakers.Ai account”
- Form fields:
  - Email (📧 required)
  - Password (🔑 required, with strength indicator)
  - Confirm Password (🔑 required)
  - TradingView Username (📊 required, with helper text: “This is where we’ll send your invite”)
- Checkbox: ☑️ I agree to the Terms of Use & Privacy Policy (links)
- CTA button: 🚀 Create Account
- Error states: inline red text under field
- Success state: redirect to Dashboard with welcome modal

2. 📧 Welcome Email

- Subject: 🎉 Welcome to AlgoMakers.Ai – Let’s get started
- Header: “You’re in!”
- Body copy:
  - Thank user for signing up
  - Confirm TradingView username on file
  - Step-by-step guide to accept TradingView invite
  - Link to Dashboard
- CTA button: 🔗 Go to Dashboard

3. 🖥️ First-Time Dashboard Tour

- Modal on first login:
  - Welcome text: “Here’s a quick tour of your dashboard”
  - Button: Start Tour
- Tooltip sequence (guided flow):
  1.  📊 Active Subscriptions card → shows expiry & pair
  2.  🔄 Renew button → extend subscription
  3.  ⬆️ Upgrade button → move to longer plan
  4.  💳 Payment history tab → see invoices & transactions
  5.  🛠️ Support link → contact if issues
- Finish step: 🎉 “All set! You’re ready to explore” + CTA: Browse Pairs
- Option: Skip Tour → resume later via “Help → Dashboard Tour”

---

🤝 Affiliate Program – Layout & Requirements

🖼️ Affiliate Dashboard Page Layout (/affiliate)

1. Hero Section

- Title: 🤝 Join the AlgoMakers.Ai Affiliate Program
- Subtitle: Earn USDT commissions by promoting subscriptions.
- CTA: 🚀 Apply Now

2. How It Works (3 Steps)

1. Get your referral link
1. Share it with your audience
1. Earn commission on each paid subscription

1. Commission Structure

- Default: 20% recurring on all subscriptions (1, 3, 6, 12 months).
- Payout: Monthly in USDT (TRC20).
- Minimum payout threshold: $50 USDT.

4. Affiliate Dashboard (after login)

- Summary cards:
  - Total Clicks
  - Active Referrals
  - Total Earnings (USDT)
  - Pending Payouts
- Referral Link box:
  - Unique URL: https://algomakers.ai/?ref=abc123
  - Copy to clipboard button
- Performance Table:
  DateReferralPlanStatusCommission17-Sep-2025user1233MPaid$13 USDT16-Sep-2025user4561MPending$5 USDT
- Payout History:
  DateAmountWalletStatus01-Sep-2025$120TRC20-xxxxSent

5. Resources Section

- Banners & logos (downloadable).
- Copy-paste headlines and text.
- FAQ for affiliates.

🛠️ Developer Requirements

🎨 Frontend

- New tab in user dashboard: Affiliate.
- Public landing page (/affiliate) for info + sign-up.
- Logged-in view = affiliate dashboard with stats.
- Copy referral link button with confirmation toast.
- Charts for clicks vs conversions (optional).

⚙️ Backend

- Affiliate model:
  - id, user_id, referral_code, wallet_address, commission_rate.
- Tracking system:
  - Cookie-based (ref=code stored 30 days).
  - Tracks first paid subscription within window.
  - Prevents self-referrals.
- Commission engine:
  - On payment success, assign commission.
  - Status: Pending until payout cycle.
- Payout process:
  - Admin marks commissions as paid.
  - Record in payout history with wallet + tx hash.

📱 UX Requirements

- Affiliate dashboard must show real-time clicks and earnings.
- Payout history clear and exportable.
- Error states: invalid wallet address, no referrals yet.
- Affiliate FAQ included in dashboard.

🔒 Security Requirements

- Prevent self-referrals (user_id vs referrer_id check).
- Prevent duplicate commissions for same order.
- Protect referral links from manipulation.
- Validate USDT wallet addresses before payout.

🧪 QA Checklist

- Test referral tracking with incognito browser.
- Verify cookie persists for 30 days.
- Confirm commission is recorded only after payment success.
- Check payout history displays correct amounts.
- Test invalid referral code handling.

✅ Acceptance Criteria

- Users can sign up and get a unique referral code.
- Referral links track clicks + conversions correctly.
- Commissions appear in dashboard, pending until payout.
- Admin can mark payouts complete and attach tx hash.
- Affiliate resources (logos, banners, FAQ) available.

✅ Overview requirements :

- Create a full Affiliate Program page based on the reference.
- Add headline & sub-headline to introduce the program.
- Show commission structure (percentages, earnings model).
- Highlight benefits of joining (trust, income, partnership).
- Add “How it works” section with simple steps.
- Provide step-by-step guide for affiliates to sign up and start promoting.
- Include a registration/login form or button.
- Use clean layout with icons, visuals, and easy navigation.
- Match the design style and flow of the reference website.
- Referral/Tracking System: Integrate the referral program using Refersion (https://www.refersion.com). This will handle affiliate tracking, payouts, and reporting.
- Developer must ensure the affiliate page and Refersion integration work seamlessly together.
- Another reference of affiliate https://www.luxalgo.com/affiliates/

---

🖥️ Admin Console (Back-office)

🔲 Page Layout

URL: /admin (restricted to admin role)

1. 🔍 User Search (top bar)

- Input: email, TradingView username, or payment ID
- CTA: Search
- Results: card view with user profile summary (status, subscriptions, payments)

2. 📦 Subscription Management Panel

- Table view of all subscriptions
  UserPairPeriodStartExpiryStatusActionsuser123BTC/USDT3M01-Aug-2501-Nov-25ActiveExtend • Revoke • Resend Invite
- Actions per row:
  - Extend expiry (+1, +3, +6 months)
  - Revoke subscription (confirmation modal)
  - Resend TradingView invite (logs action in audit trail)

3. 💳 Payments Panel

- Table of invoices & payments
  Payment IDUserAmountStatusTx HashDateActionspay001user123$25Underpaidabc12316-SepCheck NOWPayments
- Actions:
  - Refresh NOWPayments status
  - Mark as Resolved (manual override, logs to audit)

4. 📜 Audit Logs

- Timeline view of admin actions
  - Example:
    - [17-Sep 10:15] Admin Saeed extended user123 BTC/USDT by 3 months
    - [17-Sep 09:45] Admin Yasser resent invite for user456 ETH/USDT

🛠️ Developer Requirements

🎨 Frontend

- Role-based access: /admin visible only if user.role = admin.
- Tabs: Users | Subscriptions | Payments | Audit Logs.
- Tables with pagination, filters, and search.
- Modals for confirmation (revoke, extend, resend).
- Export CSV option for each table.

⚙️ Backend

- User search endpoint: query by email, username, or payment_id.
- Subscriptions table: CRUD endpoints (extend, revoke, resend_invite).
- Payments table: integrate NOWPayments API to fetch status.
- Audit logs table: automatically store every admin action.

🔒 Security

- Enforce admin role via middleware.
- Log every admin action (who, when, what).
- Prevent direct API tampering (signed requests).

🧪 QA Checklist

- Extend updates expiry correctly.
- Revoke disables access immediately.
- Resend invite sends notification and logs action.
- Underpaid invoice check works with NOWPayments API.
- Audit log captures every admin action.

---

📊 Reporting & Analytics

🔲 Page Layout

URL: /admin/reports

1. 📈 KPI Cards (top row)

- Monthly Recurring Revenue (MRR)
- Churn rate %
- Average Revenue Per User (ARPU)
- Active Subscriptions

2. 🔄 Subscription Breakdown

- Bar chart: Active subscriptions by pair (BTC/USDT, ETH/USDT, etc.).
- Pie chart: New vs Renewal split for current month.

3. 💳 Payment Insights

- Line chart: revenue trend (last 6 months).
- Table: failed/underpaid transactions with amounts.

4. 📤 Data Export

- Button: Export CSV → subscription list, payments, revenue breakdown.
- Downloaded file includes timestamp + report period.

🛠️ Developer Requirements

🎨 Frontend

- Dashboard layout with cards + charts (Recharts/Chart.js).
- Filters: date range, pair, plan (1M/3M/6M/12M).
- Export button to trigger CSV download.

⚙️ Backend

- Aggregation endpoints:
  - /analytics/mrr → returns MRR value.
  - /analytics/churn → monthly churn rate.
  - /analytics/arpu → average revenue per active user.
  - /analytics/subscriptions-by-pair → count grouped by pair.
  - /analytics/revenue-trend → monthly totals.
  - /analytics/failed-payments → list of failed/underpaid.
- CSV export endpoint (with query filters).

🔒 Security

- Access restricted to admin role.
- CSV export signed and expiring URLs.

🧪 QA Checklist

- Charts match DB totals.
- Exported CSV matches table data.
- Failed/underpaid payments flagged correctly.
- Filters persist across refresh.
- Test large datasets (100k rows).

✅ Acceptance Criteria (both modules)

- Admin console: manage subscriptions, payments, and audit logs seamlessly.
- Reporting: KPIs, charts, and exports available.
- Both restricted to admin users.
- All actions logged.
- Data accurate and up to date (<5 min delay).

---

📱 Mobile Optimization Requirements

🎯 Objective

Ensure the website works seamlessly on mobile devices and optionally behaves like an installable app.

🛠️ Requirements

- Responsive Design
  - All pages adapt to iOS & Android screen sizes.
  - Navigation and tables collapse into mobile-friendly layouts.
  - Buttons and inputs sized for touch (≥ 44px).
- Performance
  - Load in under 3 seconds on 4G.
  - Images auto-scale and lazy load.
- Testing
  - Verify on Safari (iOS) and Chrome (Android).
  - Check both portrait and landscape orientations.

---

🗄️ Database Backup Requirements (Daily Snapshot)

🎯 Objective

Ensure reliable, automated daily backups of the production database with secure storage, easy recovery, and compliance readiness.

🛠️ Functional Requirements

- Frequency:
  - Full database snapshot once per 24 hours.
  - Retention policy: 30 days minimum.
- Storage:
  - Store backups in encrypted cloud storage (AWS S3, GCP Bucket, or equivalent).
  - Must use geo-redundant storage (at least two regions).
- Format:
  - Compressed dump or snapshot format supported by DB engine.
  - Include schema + data + indexes.
- Automation:
  - Scheduled via cron/job scheduler.
  - No manual intervention required.
- Monitoring:
  - Email/Slack alert on success/failure.
  - Backup size logged daily.

🔒 Security Requirements

- Backups encrypted in transit (TLS) and at rest (AES-256).
- Access restricted to DevOps/admin roles.
- Use IAM policies with least-privilege principle.

🔄 Restore Requirements

- Must allow point-in-time restore from any snapshot.
- Restore process must be tested quarterly.
- Target RTO (Recovery Time Objective): under 2 hours.
- Target RPO (Recovery Point Objective): under 24 hours.

🧪 QA Checklist

- Verify daily backups are created and stored.
- Confirm retention policy deletes backups older than 30 days.
- Test restore from random snapshot once per quarter.
- Validate alert triggers on failed job.
- Verify backup file integrity (checksum).

✅ Acceptance Criteria

- Daily backups run automatically and complete successfully.
- Admins receive alerts on job status.
- Snapshots can be restored quickly and accurately.
- Backups meet encryption and retention standards.

---

🗂️ Developer Milestones + Founder Deliverables

Milestone
Developer Deliverables
Founder Deliverables (Before Start)
Delivery Date
M1 – Core Setup
[] Project repo, CI/CD pipeline• Database schema• Auth (signup/login, email verification, reset)• Admin role setup
[x] Confirm required signup fields
[x] Decide admin roles
[x] Provide brand assets (logo, colors, fonts)

M2 – Subscription Flow
[] Subscription table page• Pair detail page• Checkout w/ NOWPayments• Webhook handler• Subscription expiry logic
[] List of pairs + backtest performance data
[] Pricing for each subscription plan
[x] NOWPayments API key + USDT wallet

M3 – Notifications & Emails
[] Email service integration• Templates wired to events• In-app banners
[x] Draft email templates
[x] Support contact email

M4 – User Dashboard
[] Dashboard (subs list)• Renew/Upgrade flows• Billing history table• Profile management
[x] Define renewal timing
[x] Confirm upgrade rules
[x] Provide sample charts/screenshots

M5 – Admin Console
[] Manage subscriptions• Payment panel• Audit log• User search
[x] Define TradingView invite workflow
[] Provide list of admin users

M6 – Reporting & Analytics
[] KPIs (MRR, churn, ARPU)• Charts• CSV export
[x] Confirm metric definitions
[x] Decide reporting defaults

M7 – Reliability & Security
[] Daily DB backups• Restore test• Error monitoring• Rate limiting
[x] Confirm backup retention policy
[x] Decide restore testing frequency
[x] Choose monitoring tool

M8 – Affiliate Program
[] Referral tracking• Affiliate dashboard• Admin payout panel• Export report
[x] Commission %
[x] Payout schedule
[x] Payout wallet type
[x] Affiliate resources

M9 – Mobile & PWA
[] Responsive design• PWA manifest• Offline page• QA testing
[x] Confirm if PWA needed at launch
[x] Target devices for QA

M10 – Final Polishing & Launch Prep
[] Legal hub (Terms, Privacy, Cookies, Refunds)• Support page• SEO basics• Production deployment
[x] Provide draft legal docs
[x] Support categories
[] Final homepage + pricing copy
