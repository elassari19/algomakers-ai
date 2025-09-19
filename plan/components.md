# AlgoMakers.Ai – Component Architecture Plan

This document lists **small, reusable React components** for the AlgoMakers.Ai platform, grouped by feature/page. Use atomic design: primitives → molecules → organisms → templates → pages.

---

## 🧩 UI Primitives

- `Button`
- `Input`
- `Select`
- `RadioGroup`
- `Checkbox`
- `Textarea`
- `Modal`
- `Drawer`
- `Tooltip`
- `Badge`
- `Avatar`
- `Table`
- `TableRow`
- `TableCell`
- `TableHeader`
- `Tabs`
- `Accordion`
- `Alert`
- `Toast`
- `Card`
- `ProgressBar`
- `CopyButton`
- `QRCode`
- `CountdownTimer`
- `Pagination`
- `SearchBar`
- `SkeletonLoader`
- `EmptyState`

---

## 🏠 Homepage

- `HeroSection`
- `FeatureList`
- `CallToAction`
- `PartnerLogos`

---

## 🔑 Auth & User

- `AuthForm` (login/signup, social + email)
- `SocialLoginButtons`
- `PasswordStrengthMeter`
- `ForgotPasswordForm`
- `ProfileForm`
- `TradingViewUsernameField`
- `UserAvatarMenu`
- `RoleBadge`

---

## 📊 Subscription Table Page

- `PairTable`
- `PairTableRow`
- `PairMetricsCell`
- `PairStatusBadge`
- `SubscribeButton`
- `SortFilterBar`
- `AccessControlWrapper`
- `PairSearchBar`

---

## 📈 Pair Detail Page

- `BacktestChart`
- `StatsGrid`
- `DisclaimerBox`
- `PairDetailHeader`
- `SubscribeButton` (with plan options)
- `AnalyticsTracker`

---

## 💳 Subscription & Payment Flow

- `SubscriptionModal`
- `PlanSelect`
- `TradingViewUsernameField` (reused)
- `NetworkSelect`
- `PaymentSummary`
- `InvoiceDetails`
- `QRCode`
- `CopyButton`
- `CountdownTimer`
- `PaymentStatusBanner`
- `PaymentSuccessScreen`
- `PaymentErrorBanner`
- `RenewUpgradeModal`
- `ExpiryCalculator`
- `InlineValidationMessage`

---

## 🖥️ User Dashboard

- `DashboardStats`
- `SubscriptionCard`
- `SubscriptionList`
- `RenewButton`
- `UpgradeButton`
- `ChangeUsernameButton`
- `BillingHistoryTable`
- `NotificationList`
- `SupportLinks`
- `EmptyState`

---

## 🛠️ Admin Console

- `AdminTabs`
- `UserSearchBar`
- `UserProfileCard`
- `SubscriptionTable`
- `SubscriptionActions` (extend, revoke, resend)
- `PaymentTable`
- `PaymentActions`
- `AuditLogTable`
- `RoleSelect`
- `CSVExportButton`
- `AdminModal`

---

## 📊 Reporting & Analytics

- `KpiCard`
- `FunnelChart`
- `BarChart`
- `PieChart`
- `LineChart`
- `EventLogTable`
- `DateRangePicker`
- `FilterBar`
- `CSVExportButton`

---

## 🤝 Affiliate Program

- `AffiliateInfoCard`
- `ReferralLinkBox`
- `CopyButton` (reused)
- `AffiliateStats`
- `PerformanceTable`
- `PayoutHistoryTable`
- `AffiliateResources`
- `AffiliateFaqAccordion`
- `AffiliateSignupForm`

---

## 🛠️ Support & Contact

- `SupportHero`
- `QuickActionCard`
- `ContactForm`
- `ConditionalFields`
- `AttachmentUploader`
- `ConsentCheckbox`
- `CaptchaField`
- `HelpArticleList`
- `HelpArticleModal`
- `SubmissionConfirmation`

---

## 📜 Legal & FAQ

- `LegalTabs`
- `LegalSection`
- `LastUpdatedBadge`
- `FaqAccordion`
- `FaqCategoryTabs`
- `FaqSearchBar`
- `FaqPermalinkHandler`

---

## 📱 Mobile & PWA

- `MobileNavBar`
- `MobileDrawer`
- `InstallPwaPrompt`
- `TouchActionButton`

---

## 🛡️ System/Utility

- `ProtectedRoute`
- `RoleGuard`
- `ThemeProvider`
- `ErrorBoundary`
- `LoadingOverlay`
- `AnalyticsProvider`

---

**Notes:**

- Compose pages from these small components.
- Keep business logic in hooks/services, not in UI components.
- Use Tailwind CSS for styling and ensure all components are mobile-friendly.
