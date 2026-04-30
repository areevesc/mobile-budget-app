# Budget App

A fully offline, privacy-first personal budgeting app for Android built with React Native and Expo. Uses a balance-forward approach — every dollar in your accounts is accounted for, with bills and scheduled income projected forward so you always know what's safe to spend.

## Features

- **Dashboard** — current balance across all accounts, next paycheck date/amount, 14-day cash flow timeline, sinking fund progress, and recent transactions
- **Quick Add** — natural language transaction entry ("spent $47 at walmart", "got paid $1200 yesterday", "add $50 to vacation fund")
- **Transactions** — full transaction history with date grouping (Today / Yesterday / date), filters by type, category, and date range (7 days / this month / 3 months / past year / custom)
- **Insights** — spending breakdown by category with progress bars, income vs. expense summary, and net figure — all filterable by the same date ranges
- **Schedule** — recurring bills, paychecks, and savings contributions with automatic next-date advancement when marked paid
- **Sinking Funds** — named savings buckets with target amounts, target dates, and per-paycheck contribution tracking
- **Settings** — manage accounts and categories, configure paycheck schedule, export data as JSON, and a Danger Zone with full data wipe

## Tech Stack

- [Expo](https://expo.dev) SDK 54
- React Native 0.81 / React 19
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) — fully local SQLite database, no backend, no network requests
- [TanStack Query](https://tanstack.com/query) v5 — data fetching and cache invalidation
- [React Navigation](https://reactnavigation.org) v6 — bottom tab navigation
- TypeScript

## Running Locally (Expo Go)

Requires the [Expo Go](https://expo.dev/go) app on your phone (SDK 54).

```bash
npm install
npm run start
```

In the Metro terminal, press `s` to switch the target to **Expo Go**, then scan the QR code.

> Note: the project includes `expo-dev-client`, which causes the installed standalone APK to intercept QR codes. Always press `s` first to explicitly target Expo Go.

## Building a Standalone APK

Requires [EAS CLI](https://docs.expo.dev/build/introduction/) and an Expo account.

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview --non-interactive
```

The build runs on Expo's servers (~10–15 min) and produces a downloadable `.apk`. Install it directly on your Android device — no Play Store required. Updating the app with a new build preserves all local data.

## Project Structure

```
src/
  components/
    modals/         # Add/edit modals for each entity
    ui/             # Shared UI primitives (Button, Card, Input, etc.)
    OnboardingScreen.tsx
    FAB.tsx
  hooks/
    useQueries.ts   # All React Query hooks
  lib/
    db.ts           # SQLite schema, migrations, and all DB functions
    calculations.ts # Balance-forward safe-to-spend calculation
    parser.ts       # Natural language parser for Quick Add
    utils.ts        # Formatting helpers, color constants, date utilities
  navigation/
    index.tsx       # Bottom tab navigator
  screens/          # One file per tab
  types/
    index.ts        # Shared TypeScript types
```

## Data & Privacy

All data lives in the app's private SQLite database on your device. The app makes zero network requests at runtime — no analytics, no telemetry, no cloud sync. The only network usage is during development (Metro bundler) and during EAS builds.

Data can be exported as a JSON file via **Settings → Export Data**.
