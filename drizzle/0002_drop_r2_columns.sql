-- Migration: Remove R2 storage columns (R2 bucket no longer used)
-- Drops r2_key from attachments, evidence_r2_key from ledger_entries,
-- and output_r2_key from reports.

-- SQLite does not support DROP COLUMN on NOT NULL columns before 3.35.
-- D1 uses SQLite 3.37+, so ALTER TABLE ... DROP COLUMN is supported.

ALTER TABLE `attachments` DROP COLUMN `r2_key`;
ALTER TABLE `ledger_entries` DROP COLUMN `evidence_r2_key`;
ALTER TABLE `reports` DROP COLUMN `output_r2_key`;
