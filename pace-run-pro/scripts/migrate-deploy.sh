#!/usr/bin/env bash
set -e

prisma generate

# Mark previously-failed or never-started migrations as applied so
# prisma migrate deploy does not abort on their FAILED state.
prisma migrate resolve --applied 20260615000000_add_vouchers                      || true
prisma migrate resolve --applied 20260704000001_lgpd_consent_types                || true
prisma migrate resolve --applied 20260704000006_listing_status_audit_log          || true
prisma migrate resolve --applied 20260704000007_coach_athlete_nm_stripe_idempotency || true
prisma migrate resolve --applied 20260704000008_coach_athlete_nm_stripe_idempotency_fix || true
prisma migrate resolve --applied 20260704000009_pagbank_seller_accounts           || true

# Migration 010 went FAILED (INSERT before unique index); SQL is now fixed —
# mark as rolled-back so migrate deploy re-runs it.
prisma migrate resolve --rolled-back 20260704000010_idempotent_catchall           || true

prisma migrate deploy
next build
