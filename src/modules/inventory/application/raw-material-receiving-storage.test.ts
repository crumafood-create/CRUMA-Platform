import { describe, expect, it } from 'vitest';

import { resolveRawMaterialReceivingStorage } from './raw-material-receiving-storage';

const policy = {
  requiredStorageCondition: 'refrigerated',
  defaultStorageUse: 'raw_material',
  defaultInventoryLocationId: 'location-1',
};

const location = {
  id: 'location-1',
  name: 'Refrigeración de materias primas',
  slug: 'REF-MP-01',
  locationUse: 'raw_material',
  storageCondition: 'refrigerated',
  isActive: true,
  deletedAt: null,
};

describe('resolveRawMaterialReceivingStorage', () => {
  it('returns the configured compatible destination', () => {
    expect(resolveRawMaterialReceivingStorage(policy, location)).toEqual({
      location,
      error: null,
    });
  });

  it.each([
    [null, location],
    [{ ...policy, defaultInventoryLocationId: null }, null],
    [policy, { ...location, locationUse: 'prepared_ingredient' }],
    [policy, { ...location, storageCondition: 'dry' }],
    [policy, { ...location, isActive: false }],
  ])('blocks missing or incompatible storage setup', (configuredPolicy, configuredLocation) => {
    expect(
      resolveRawMaterialReceivingStorage(
        configuredPolicy as typeof policy | null,
        configuredLocation as typeof location | null,
      ).location,
    ).toBeNull();
  });
});
