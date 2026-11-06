CREATE TRIGGER lock_raw_material_unit_reference
BEFORE INSERT OR UPDATE OR DELETE ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION public.lock_raw_material_unit_reference(
  'item_id', 'item_type', 'raw_material'
);

CREATE TRIGGER lock_raw_material_unit_reference
BEFORE INSERT OR UPDATE OR DELETE ON public.inventory_lots
FOR EACH ROW
EXECUTE FUNCTION public.lock_raw_material_unit_reference(
  'item_id', 'item_type', 'raw_material'
);

CREATE TRIGGER lock_raw_material_unit_reference
BEFORE INSERT OR UPDATE OR DELETE ON public.inventory_reservations
FOR EACH ROW
EXECUTE FUNCTION public.lock_raw_material_unit_reference(
  'item_id', 'item_type', 'raw_material'
);
