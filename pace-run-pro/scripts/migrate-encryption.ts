/**
 * Script: Migrate existing unencrypted tokens to encrypted format
 * 
 * Run this one-time after encryption middleware is deployed:
 * npx tsx scripts/migrate-encryption.ts
 * 
 * It will:
 * 1. Find all unencrypted tokens in ConnectedDevice
 * 2. Find all unencrypted sensitive data in BillingSettings
 * 3. Re-encrypt them using the new middleware
 * 
 * Safe to run multiple times (idempotent)
 */

import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

async function migrateEncryption() {
  console.log("🔐 Starting encryption migration...\n");

  // ===== Step 1: Migrate ConnectedDevice tokens =====
  console.log("📱 Migrating ConnectedDevice tokens...");

  const devices = await prisma.connectedDevice.findMany({
    select: {
      id: true,
      accessToken: true,
      refreshToken: true,
    },
  });

  let devicesEncrypted = 0;

  for (const device of devices) {
    let needsUpdate = false;
    const update: { accessToken?: string; refreshToken?: string } = {};

    // Check if accessToken needs encryption
    if (device.accessToken && !device.accessToken.startsWith("enc:") && !device.accessToken.startsWith("plain:")) {
      update.accessToken = encrypt(device.accessToken);
      needsUpdate = true;
    }

    // Check if refreshToken needs encryption
    if (device.refreshToken && !device.refreshToken.startsWith("enc:") && !device.refreshToken.startsWith("plain:")) {
      update.refreshToken = encrypt(device.refreshToken);
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.connectedDevice.update({
        where: { id: device.id },
        data: update,
      });
      devicesEncrypted++;
    }
  }

  console.log(`  ✅ Encrypted ${devicesEncrypted}/${devices.length} devices\n`);

  // ===== Step 2: Migrate BillingSettings =====
  console.log("💳 Migrating BillingSettings...");

  const billingSettings = await prisma.billingSettings.findMany({
    select: {
      id: true,
      cpfCnpj: true,
      pixKey: true,
      bankAccount: true,
      bankAccountType: true,
    },
  });

  let billingEncrypted = 0;

  for (const bs of billingSettings) {
    let needsUpdate = false;
    const update: {
      cpfCnpj?: string;
      pixKey?: string;
      bankAccount?: string;
      bankAccountType?: string;
    } = {};

    // Check each field
    if (bs.cpfCnpj && !bs.cpfCnpj.startsWith("enc:") && !bs.cpfCnpj.startsWith("plain:")) {
      update.cpfCnpj = encrypt(bs.cpfCnpj);
      needsUpdate = true;
    }

    if (bs.pixKey && !bs.pixKey.startsWith("enc:") && !bs.pixKey.startsWith("plain:")) {
      update.pixKey = encrypt(bs.pixKey);
      needsUpdate = true;
    }

    if (bs.bankAccount && !bs.bankAccount.startsWith("enc:") && !bs.bankAccount.startsWith("plain:")) {
      update.bankAccount = encrypt(bs.bankAccount);
      needsUpdate = true;
    }

    if (bs.bankAccountType && !bs.bankAccountType.startsWith("enc:") && !bs.bankAccountType.startsWith("plain:")) {
      update.bankAccountType = encrypt(bs.bankAccountType);
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.billingSettings.update({
        where: { id: bs.id },
        data: update,
      });
      billingEncrypted++;
    }
  }

  console.log(`  ✅ Encrypted ${billingEncrypted}/${billingSettings.length} billing settings\n`);

  // ===== Verification =====
  console.log("✅ Encryption migration complete!\n");
  console.log("📊 Summary:");
  console.log(`  - ConnectedDevice: ${devicesEncrypted} updated`);
  console.log(`  - BillingSettings: ${billingEncrypted} updated`);
  console.log("\n💡 All sensitive data is now encrypted at rest.");
}

migrateEncryption()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  });
