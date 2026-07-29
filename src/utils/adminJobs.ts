import { localDb } from '../db/local_db.ts';

export function processScheduledPublications(): void {
  const config = localDb.getAdminConfig();
  const now = Date.now();
  let changed = false;

  for (const item of config.scheduledItems) {
    if (new Date(item.publishAt).getTime() > now) continue;

    if (item.type === 'react') {
      const react = localDb.getReacts().find((r) => r.id === item.targetId);
      if (react) {
        localDb.saveReact({
          ...react,
          scheduledAt: undefined,
          isLaunch: item.isFeatured ?? react.isLaunch,
          isPinnedHome: item.isFeatured ? true : react.isPinnedHome,
          moderationStatus: 'approved',
          publicadoEm: react.publicadoEm || item.publishAt,
        });
      }
    }

    changed = true;
  }

  if (changed) {
    config.scheduledItems = config.scheduledItems.filter(
      (item) => new Date(item.publishAt).getTime() > now,
    );
    localDb.saveAdminConfig(config);
  }
}

export function autoLiftExpiredSuspensions(): void {
  const users = localDb.getUsuarios() || [];
  const now = Date.now();
  for (const user of users) {
    if (!user.isSuspended || !user.suspendedUntil) continue;
    if (new Date(user.suspendedUntil).getTime() <= now) {
      localDb.updateUsuarioSync(user.email, {
        isSuspended: false,
        suspendedUntil: undefined,
      });
    }
  }
}
