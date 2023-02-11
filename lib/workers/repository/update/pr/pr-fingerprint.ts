// fingerprint config is based on the old skip pr update logic
// https://github.com/renovatebot/renovate/blob/3d85b6048d6a8c57887b64ed4929e2e02ea41aa0/lib/workers/repository/update/pr/index.ts#L294-L306

import type { UpdateType, ValidationMessage } from '../../../../config/types';
import { pkg } from '../../../../expose.cjs';
import { logger } from '../../../../logger';
import type { PrCache } from '../../../../util/cache/repository/types';
import { getElapsedHours } from '../../../../util/date';
import type { BranchConfig } from '../../../types';

// BranchUpgradeConfig - filtered
interface FilteredBranchUpgradeConfig {
  depName?: string;
  gitRef?: boolean;
  hasReleaseNotes?: boolean;
  prBodyDefinitions?: Record<string, string>;
  prBodyNotes?: string[];
  repoName?: string;
}

export interface PrFingerprintConfig {
  // Renovate Version
  pkgVersion: string;

  // BranchConfig - filtered
  automerge?: boolean;
  automergeSchedule?: string[];
  hasReleaseNotes?: boolean;
  isPin?: boolean;
  prBodyTemplate?: string;
  prFooter?: string;
  prHeader?: string;
  prTitle?: string;
  rebaseWhen?: string;
  recreateClosed?: boolean;
  schedule?: string[];
  stopUpdating?: boolean;
  timezone?: string;
  updateType?: UpdateType;
  warnings?: ValidationMessage[];
  pendingVersions?: string[];

  filteredUpgrades?: FilteredBranchUpgradeConfig[];
}

export function generatePrFingerprintConfig(
  config: BranchConfig
): PrFingerprintConfig {
  const filteredUpgrades = config.upgrades.map((upgrade) => {
    return {
      depName: upgrade.depName,
      gitRef: upgrade.gitRef,
      hasReleaseNotes: upgrade.hasReleaseNotes,
      prBodyDefinitions: upgrade.prBodyDefinitions,
      prBodyNotes: upgrade.prBodyNotes,
      repoName: upgrade.repoName,
    };
  });

  return {
    automerge: config.automerge,
    automergeSchedule: config.automergeSchedule,
    filteredUpgrades,
    hasReleaseNotes: config.hasReleaseNotes,
    isPin: config.isPin,
    pkgVersion: pkg.version,
    prBodyTemplate: config.prBodyTemplate,
    prFooter: config.prFooter,
    prHeader: config.prHeader,
    prTitle: config.prTitle,
    rebaseWhen: config.rebaseWhen,
    recreateClosed: config.recreateClosed,
    schedule: config.schedule,
    stopUpdating: config.stopUpdating,
    timezone: config.timezone,
    updateType: config.updateType,
    warnings: config.warnings,
    pendingVersions: config.pendingVersions,
  };
}

export function validatePrCache(
  prCache: PrCache,
  prFingerprint: string
): boolean {
  if (prCache.fingerprint !== prFingerprint) {
    logger.debug('prCache: fingerprint changed, checking PR');
    return false;
  }

  const elapsedHours = getElapsedHours(prCache.lastEdited);
  if (elapsedHours >= 24) {
    logger.debug(
      `prCache: fingerprint match, skipping PR body validation step`
    );
    return true;
  }

  logger.debug(`prCache: fingerprint match, elapsedHours=${elapsedHours}`);
  return false;
}
