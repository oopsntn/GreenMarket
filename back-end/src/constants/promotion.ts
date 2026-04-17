export const BOOST_POST_SLOT_PREFIX = "BOOST_POST";
export const BOOST_POST_SLOT_CODE = BOOST_POST_SLOT_PREFIX;
export const SHOP_VIP_SLOT_CODE = "SHOP_VIP";
export const SHOP_REGISTRATION_SLOT_CODE = "SHOP_REGISTRATION";
export const PERSONAL_PLAN_SLOT_CODE = "PERSONAL_PLAN";

export const isBoostPostSlotCode = (value: string | null | undefined) => {
  const normalized = value?.trim().toUpperCase();
  return Boolean(
    normalized && normalized.startsWith(BOOST_POST_SLOT_PREFIX),
  );
};
