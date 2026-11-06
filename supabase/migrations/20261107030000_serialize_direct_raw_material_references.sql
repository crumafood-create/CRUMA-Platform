CREATE TRIGGER lock_raw_material_unit_reference
BEFORE INSERT OR UPDATE OR DELETE ON public.purchase_requisition_items
FOR EACH ROW
EXECUTE FUNCTION public.lock_raw_material_unit_reference('raw_material_id');

CREATE TRIGGER lock_raw_material_unit_reference
BEFORE INSERT OR UPDATE OR DELETE ON public.purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION public.lock_raw_material_unit_reference('raw_material_id');

CREATE TRIGGER lock_raw_material_unit_reference
BEFORE INSERT OR UPDATE OR DELETE ON public.recipe_items
FOR EACH ROW
EXECUTE FUNCTION public.lock_raw_material_unit_reference('raw_material_id');

CREATE TRIGGER lock_raw_material_unit_reference
BEFORE INSERT OR UPDATE OR DELETE ON public.production_order_items
FOR EACH ROW
EXECUTE FUNCTION public.lock_raw_material_unit_reference('raw_material_id');

CREATE TRIGGER lock_raw_material_unit_reference
BEFORE INSERT OR UPDATE OR DELETE ON public.production_lot_consumptions
FOR EACH ROW
EXECUTE FUNCTION public.lock_raw_material_unit_reference('raw_material_id');

CREATE TRIGGER lock_raw_material_unit_reference
BEFORE INSERT OR UPDATE OR DELETE ON public.production_lot_traceability
FOR EACH ROW
EXECUTE FUNCTION public.lock_raw_material_unit_reference('raw_material_id');
