import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { grantPurchasedCreditsIdempotent } from "@/lib/credits-grant";

const hasDb = Boolean(process.env.DATABASE_URL?.trim());

/**
 * Ödeme sağlayıcısı aynı olayı iki kez gönderirse (veya ağ tekrarlar),
 * `externalRef` tekil olduğu için ikinci çağrı bakiyeyi artırmaz.
 * Bu testler gerçek bir PostgreSQL bağlantısı gerektirir; yoksa atlanır.
 */
describe.skipIf(!hasDb)("grantPurchasedCreditsIdempotent (DB)", () => {
  let userId: string;
  const testEmail = `idem-test-${Date.now()}@promptlab.test`;

  beforeAll(async () => {
    const u = await prisma.user.create({
      data: { email: testEmail, creditBalance: 0 },
    });
    userId = u.id;
  });

  afterAll(async () => {
    await prisma.creditLedgerEntry.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  /** Aynı dosyada testler paralel koşabileceği için tek blokta sırayla doğrularız. */
  it("idempotency: duplicate webhook bakiyeyi ikilemez; sağlayıcılar ayrı; 0 kredi eklenmez", async () => {
    const ext = `cs_test_${Date.now()}`;
    const r1 = await grantPurchasedCreditsIdempotent(userId, 10, "stripe", ext, "+10 kredi");
    const r2 = await grantPurchasedCreditsIdempotent(userId, 10, "stripe", ext, "+10 kredi");
    expect(r1).toBe("granted");
    expect(r2).toBe("duplicate");
    let u = await prisma.user.findUnique({ where: { id: userId } });
    expect(u?.creditBalance).toBe(10);

    const shared = `txn_shared_${Date.now()}`;
    await grantPurchasedCreditsIdempotent(userId, 3, "stripe", shared);
    await grantPurchasedCreditsIdempotent(userId, 5, "paddle", shared);
    u = await prisma.user.findUnique({ where: { id: userId } });
    expect(u?.creditBalance).toBe(18);

    const before = u?.creditBalance ?? 0;
    const r0 = await grantPurchasedCreditsIdempotent(userId, 0, "stripe", `zero_${Date.now()}`);
    expect(r0).toBe("duplicate");
    u = await prisma.user.findUnique({ where: { id: userId } });
    expect(u?.creditBalance).toBe(before);
  });
});
