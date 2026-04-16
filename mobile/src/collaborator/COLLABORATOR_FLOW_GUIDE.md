# Collaborator Flow Guide

## Scope

This document describes the current collaborator module in `mobile/src/collaborator`, the backend APIs it depends on, and the expected WF-3 user flow.

## Backend Base Path

All collaborator APIs are mounted under:

- `/api/collaborator`

The backend requires:

- valid user token
- active business role `COLLABORATOR`

Reference sources used for this guide:

- `API_DOCUMENTATION.md`
- `back-end/src/routes/user/collaborator.route.ts`
- `back-end/src/controllers/user/collaborator.controller.ts`

## Current Mobile Structure

- `navigation/CollaboratorNavigator.tsx`
- `screens/DashboardScreen.tsx`
- `screens/AvailableJobsScreen.tsx`
- `screens/JobDetailScreen.tsx`
- `screens/MyJobsScreen.tsx`
- `screens/SubmitWorkScreen.tsx`
- `screens/EarningsScreen.tsx`
- `screens/PayoutRequestScreen.tsx`
- `services/collaboratorService.ts`

## API Mapping

### Profile and availability

- `GET /collaborator/profile`
  - Used by `DashboardScreen`
  - Returns `profile` and `stats`
- `PATCH /collaborator/profile`
  - Used by dashboard availability toggle
  - Accepts `availabilityStatus` and optional `availabilityNote`

### Job discovery and decision

- `GET /collaborator/jobs`
  - Used by `AvailableJobsScreen`
  - Supports `keyword`, `category`, `location`, `page`, `limit`
- `GET /collaborator/jobs/:id`
  - Used by `JobDetailScreen`
- `POST /collaborator/jobs/:id/decision`
  - Used by `JobDetailScreen`
  - Accepts `decision: accept | decline` and optional `reason`
- `POST /collaborator/jobs/:id/contact`
  - Exposed in service, but no complete mobile UI currently uses it

### Assigned jobs and deliverables

- `GET /collaborator/my-jobs`
  - Used by `MyJobsScreen`
  - Supports `status`, `page`, `limit`
- `POST /collaborator/jobs/:id/deliverables`
  - Used by `SubmitWorkScreen`
  - Requires `fileUrls: string[]`
  - Optional `note`

### Earnings and payouts

- `GET /collaborator/earnings`
  - Used by `EarningsScreen`
  - Supports `from`, `to`
- `GET /collaborator/payout-requests`
  - Used by `EarningsScreen`
- `POST /collaborator/payout-requests`
  - Used by `PayoutRequestScreen`
  - Requires `amount`, `method`
  - Backend enforces minimum amount `500000`

## WF-3 Expected Flow

Based on the reports and API docs, WF-3 for collaborator currently covers:

1. View available service jobs.
2. Filter available jobs by keyword or category.
3. Open job detail.
4. Accept or decline an open job.
5. View assigned jobs grouped by status.
6. Submit deliverables for an accepted job.
7. View earnings and payout history.
8. Request payout.

## Current Navigation Flow

### Main tabs

- `Dashboard`
- `Explore`
- `MyWork`
- `Wallet`

### Detail screens

- `JobDetail`
- `SubmitWork`
- `PayoutRequest`

### Intended user path

1. Open `Explore` to browse open jobs.
2. Open `JobDetail`.
3. Accept or decline.
4. Go to `MyWork` to track accepted jobs.
5. Open `SubmitWork` for an accepted job.
6. Go to `Wallet` to view earnings and request payout.

## Known Gaps To Watch

### API shape mismatch

The earnings history object used by mobile does not match the current backend response shape. If not fixed, earnings rows may render with `undefined` values.

### Deliverables upload is incomplete

`SubmitWorkScreen` currently sends local image URIs directly as `fileUrls`. The backend endpoint expects uploaded file URLs, not raw local device paths.

### Contact customer flow is incomplete

The service exposes `POST /jobs/:id/contact`, but the mobile flow does not provide a complete action path for this endpoint.

### Dashboard shortcuts are partial

Some dashboard actions look interactive but do not navigate anywhere yet.

### Status filtering needs backend alignment

`MyJobsScreen` currently uses `accepted`, `completed`, and `cancelled`. Keep this aligned with the backend-allowed values for `GET /collaborator/my-jobs`.

### Error and empty states need improvement

Several screens log errors to console without showing a clear recovery message to the user.

## Validation Expectations

### Mobile should validate before calling API

- availability status must be one of `available`, `busy`, `offline`
- payout amount must be numeric and at least `500000`
- payout method must not be empty
- deliverables must contain at least one uploaded URL
- decline flow should capture a reason when business rules require explanation

### Backend already validates

- collaborator role access
- availability enum
- payout minimum and available balance
- decision enum
- deliverables presence
- contact message presence and length

## Practical Review Checklist

Before marking collaborator as complete, verify:

- all screens navigate to the intended target
- `Wallet` renders real earnings history fields from backend
- `SubmitWork` uploads files first, then submits returned URLs
- `MyWork` status filters match backend contract
- dashboard shortcuts are wired or intentionally removed
- user-facing text is readable and consistent
- error states are visible to the user, not only logged

## Recommendation

Treat the current collaborator module as functionally close to WF-3, but not fully production-ready until:

- earnings response mapping is corrected
- deliverables upload flow is real
- dashboard shortcuts are wired
- contact flow is either implemented or removed from UI
- status filter contract is confirmed
