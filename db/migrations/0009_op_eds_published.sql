-- Existing rows remain visible; new rows default to draft unless explicitly published.
ALTER TABLE "op_eds" ADD COLUMN IF NOT EXISTS "published" boolean DEFAULT true NOT NULL;
ALTER TABLE "op_eds" ALTER COLUMN "published" SET DEFAULT false;
