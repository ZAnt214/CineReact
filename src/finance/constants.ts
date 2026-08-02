/** Assinatura Exclusiva — R$ 9,90/mês */
export const EXCLUSIVE_SUBSCRIPTION_PRICE = 9.9;
export const EXCLUSIVE_CREATOR_SHARE = 8.9;
export const EXCLUSIVE_PLATFORM_SHARE = 1.0;

/** Assinatura Global — R$ 19,90/mês */
export const GLOBAL_SUBSCRIPTION_PRICE = 19.9;
/** Percentual da assinatura global destinado ao pool de criadores (resto = CineReact). */
export const GLOBAL_CREATOR_POOL_PERCENT = 75;
export const GLOBAL_PLATFORM_SHARE =
  GLOBAL_SUBSCRIPTION_PRICE * (1 - GLOBAL_CREATOR_POOL_PERCENT / 100);
export const GLOBAL_CREATOR_POOL_SHARE =
  GLOBAL_SUBSCRIPTION_PRICE * (GLOBAL_CREATOR_POOL_PERCENT / 100);

/** Ranking CineReact */
export const RANKING_POINTS_LIKE = 1;
export const RANKING_POINTS_COMMENT = 3;

/** Anti-fraude */
export const MAX_LIKES_PER_USER_CLIP_PER_DAY = 1;
export const MAX_COMMENTS_PER_USER_CLIP_PER_DAY = 3;
