-- Migration: Add websiteUrl to Organization
-- Run this in the Supabase SQL editor

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;
