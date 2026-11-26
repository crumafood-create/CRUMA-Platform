export type RawMaterialReceivingStoragePolicy = {
  requiredStorageCondition: string | null;
  defaultStorageUse: string | null;
  defaultInventoryLocationId: string | null;
};

export type RawMaterialReceivingLocation = {
  id: string;
  name: string;
  slug: string;
  locationUse: string | null;
  storageCondition: string | null;
  isActive: boolean;
  deletedAt: string | null;
};

export type RawMaterialReceivingStorageResolution =
  | { location: RawMaterialReceivingLocation; error: null }
  | { location: null; error: string };

export function resolveRawMaterialReceivingStorage(
  policy: RawMaterialReceivingStoragePolicy | null,
  location: RawMaterialReceivingLocation | null,
): RawMaterialReceivingStorageResolution {
  if (!policy?.requiredStorageCondition || !policy.defaultStorageUse) {
    return {
      location: null,
      error: 'Configura condición y uso de almacenamiento en Materias Primas.',
    };
  }

  if (policy.defaultStorageUse !== 'raw_material') {
    return {
      location: null,
      error: 'El destino habitual debe estar clasificado para materias primas.',
    };
  }

  if (!policy.defaultInventoryLocationId || !location) {
    return {
      location: null,
      error: 'Asigna un destino habitual compatible en Materias Primas.',
    };
  }

  if (
    !location.isActive ||
    location.deletedAt !== null ||
    location.id !== policy.defaultInventoryLocationId ||
    location.locationUse !== policy.defaultStorageUse ||
    location.storageCondition !== policy.requiredStorageCondition
  ) {
    return {
      location: null,
      error: 'El destino habitual dejó de ser compatible; resuélvelo en Materias Primas y Ubicaciones.',
    };
  }

  return { location, error: null };
}
