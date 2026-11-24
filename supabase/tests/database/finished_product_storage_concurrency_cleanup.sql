DELETE FROM public.product_lot_freezing_decisions
WHERE product_lot_id = 'fe800000-0000-4000-8000-000000000001';
DELETE FROM public.product_lot_freezing_operations
WHERE product_lot_id = 'fe800000-0000-4000-8000-000000000001';
DELETE FROM public.product_lot_storage_balances
WHERE product_lot_id = 'fe800000-0000-4000-8000-000000000001';
DELETE FROM public.inventory_movements
WHERE item_id = 'fe400000-0000-4000-8000-000000000001'
  AND reference_type IN ('production_lot', 'product_lot_freezing_start', 'product_lot_freezing_decision');
DELETE FROM public.inventory_reservations
WHERE reference_id = 'fea00000-0000-4000-8000-000000000001';
DELETE FROM public.picking_order_items
WHERE picking_order_id IN (
  SELECT id FROM public.picking_orders
  WHERE sales_order_id = 'fea00000-0000-4000-8000-000000000001'
);
DELETE FROM public.picking_orders
WHERE sales_order_id = 'fea00000-0000-4000-8000-000000000001';
DELETE FROM public.sales_order_items
WHERE sales_order_id = 'fea00000-0000-4000-8000-000000000001';
DELETE FROM public.sales_orders WHERE id = 'fea00000-0000-4000-8000-000000000001';
DELETE FROM public.customers WHERE id = 'fe900000-0000-4000-8000-000000000001';
DELETE FROM public.product_lots WHERE id = 'fe800000-0000-4000-8000-000000000001';
DELETE FROM public.production_outputs WHERE id = 'fe700000-0000-4000-8000-000000000001';
DELETE FROM public.production_orders WHERE id = 'fe600000-0000-4000-8000-000000000001';
DELETE FROM public.recipes WHERE id = 'fe500000-0000-4000-8000-000000000001';
DELETE FROM public.products WHERE id = 'fe400000-0000-4000-8000-000000000001';
DELETE FROM public.preparation_types WHERE id = 'fe300000-0000-4000-8000-000000000001';
DELETE FROM public.inventory_locations WHERE id = 'fe200000-0000-4000-8000-000000000001';
DELETE FROM public.inventory_locations WHERE id = 'fe200000-0000-4000-8000-000000000002';
DELETE FROM public.warehouses WHERE id = 'fe100000-0000-4000-8000-000000000001';
DELETE FROM public.user_roles WHERE user_id IN (
  'fe000000-0000-4000-8000-000000000001', 'fe000000-0000-4000-8000-000000000002'
);
DELETE FROM public.profiles WHERE id IN (
  'fe000000-0000-4000-8000-000000000001', 'fe000000-0000-4000-8000-000000000002'
);
DELETE FROM auth.users WHERE id IN (
  'fe000000-0000-4000-8000-000000000001', 'fe000000-0000-4000-8000-000000000002'
);
