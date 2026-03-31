import 'dotenv/config';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '../config/db';
import { placementSlots, promotionPackages } from '../models/schema';

const SLOT_CODE = 'BOOST_PRIORITY';

const PACKAGES = [
  { title: 'Goi Ngay', durationDays: 1, price: '19000.00' },
  { title: 'Goi Tuan', durationDays: 7, price: '99000.00' },
  { title: 'Goi Thang', durationDays: 30, price: '299000.00' },
];

const run = async () => {
  console.log('--- Syncing promotion catalog to Day/Week/Month model ---');

  const [existingSlot] = await db
    .select()
    .from(placementSlots)
    .where(eq(placementSlots.placementSlotCode, SLOT_CODE))
    .limit(1);

  let slotId: number;
  if (existingSlot) {
    const [updatedSlot] = await db
      .update(placementSlots)
      .set({
        placementSlotTitle: 'Uu tien hien thi',
        placementSlotCapacity: 100,
        placementSlotPublished: true,
        placementSlotRules: { priority: 1, audience: 'all-seller' },
      })
      .where(eq(placementSlots.placementSlotId, existingSlot.placementSlotId))
      .returning();

    slotId = updatedSlot.placementSlotId;
    console.log(`Updated slot ${SLOT_CODE} (id=${slotId})`);
  } else {
    const [newSlot] = await db
      .insert(placementSlots)
      .values({
        placementSlotCode: SLOT_CODE,
        placementSlotTitle: 'Uu tien hien thi',
        placementSlotCapacity: 100,
        placementSlotPublished: true,
        placementSlotRules: { priority: 1, audience: 'all-seller' },
      })
      .returning();

    slotId = newSlot.placementSlotId;
    console.log(`Created slot ${SLOT_CODE} (id=${slotId})`);
  }

  for (const pkg of PACKAGES) {
    const [existingPackage] = await db
      .select()
      .from(promotionPackages)
      .where(
        and(
          eq(promotionPackages.promotionPackageSlotId, slotId),
          eq(promotionPackages.promotionPackageTitle, pkg.title)
        )
      )
      .limit(1);

    if (existingPackage) {
      await db
        .update(promotionPackages)
        .set({
          promotionPackageDurationDays: pkg.durationDays,
          promotionPackagePrice: pkg.price,
          promotionPackagePublished: true,
        })
        .where(eq(promotionPackages.promotionPackageId, existingPackage.promotionPackageId));

      console.log(`Updated package: ${pkg.title}`);
    } else {
      await db.insert(promotionPackages).values({
        promotionPackageSlotId: slotId,
        promotionPackageTitle: pkg.title,
        promotionPackageDurationDays: pkg.durationDays,
        promotionPackagePrice: pkg.price,
        promotionPackagePublished: true,
      });

      console.log(`Created package: ${pkg.title}`);
    }
  }

  await db
    .update(promotionPackages)
    .set({ promotionPackagePublished: false })
    .where(ne(promotionPackages.promotionPackageSlotId, slotId));

  await db
    .update(placementSlots)
    .set({
      placementSlotPublished: false,
      placementSlotRules: { priority: 1, audience: 'all-seller' },
      placementSlotTitle: 'Uu tien hien thi',
    })
    .where(ne(placementSlots.placementSlotId, slotId));

  console.log('Catalog synced. Only Day/Week/Month packages remain published.');
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed promotion catalog failed:', error);
    process.exit(1);
  });
