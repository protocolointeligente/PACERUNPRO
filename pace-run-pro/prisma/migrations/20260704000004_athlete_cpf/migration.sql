-- Add CPF field to athletes for PIX billing
ALTER TABLE "athletes" ADD COLUMN IF NOT EXISTS "cpf" TEXT;
