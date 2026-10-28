import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import { PurchaseOrderItemForm } from './purchase-order-item-form';

const ORDER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_ORDER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const USER_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const OTHER_USER_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const MATERIAL_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const NEW_MATERIAL_ID = 'fffffff0-ffff-4fff-8fff-ffffffffffff';

beforeEach(() => {
  sessionStorage.clear();
});

it('purchaseOrderItems_restoresPendingCaptureAfterCancelledMaterialCreation', async () => {
  const action = vi.fn().mockResolvedValue(undefined);
  const props = {
    action,
    purchaseOrderId: ORDER_ID,
    userId: USER_ID,
    materials: [{ id: MATERIAL_ID, name: 'Harina de prueba', internal_code: null }],
  };
  const firstRender = render(<PurchaseOrderItemForm {...props} />);

  fireEvent.change(firstRender.container.querySelector('select[name="raw_material_id"]')!, {
    target: { value: MATERIAL_ID },
  });
  fireEvent.change(firstRender.container.querySelector('input[name="quantity"]')!, {
    target: { value: '3.' },
  });
  fireEvent.change(firstRender.container.querySelector('input[name="unit_cost"]')!, {
    target: { value: '42.' },
  });
  firstRender.unmount();

  const otherUserForm = render(
    <PurchaseOrderItemForm {...props} userId={OTHER_USER_ID} />,
  );
  expect(otherUserForm.container.querySelector('input[name="quantity"]')).toHaveValue('');
  otherUserForm.unmount();

  const otherOrderForm = render(
    <PurchaseOrderItemForm {...props} purchaseOrderId={OTHER_ORDER_ID} />,
  );
  expect(otherOrderForm.container.querySelector('input[name="unit_cost"]')).toHaveValue('');
  otherOrderForm.unmount();

  const returnedForm = render(<PurchaseOrderItemForm {...props} />);

  await waitFor(() => {
    expect(returnedForm.container.querySelector('select[name="raw_material_id"]')).toHaveValue(
      MATERIAL_ID,
    );
    expect(returnedForm.container.querySelector('input[name="quantity"]')).toHaveValue('3.');
    expect(returnedForm.container.querySelector('input[name="unit_cost"]')).toHaveValue('42.');
  });
  expect(screen.getByRole('button', { name: 'Agregar' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Descartar captura' }));
  expect(returnedForm.container.querySelector('select[name="raw_material_id"]')).toHaveValue('');
  expect(returnedForm.container.querySelector('input[name="quantity"]')).toHaveValue('');
  expect(returnedForm.container.querySelector('input[name="unit_cost"]')).toHaveValue('');

  returnedForm.unmount();
  const discardedForm = render(<PurchaseOrderItemForm {...props} />);
  expect(discardedForm.container.querySelector('input[name="quantity"]')).toHaveValue('');
  expect(action).not.toHaveBeenCalled();
});

it('purchaseOrderItems_preselectsNewMaterialAndRestoresPendingCaptureWithoutAddingLine', async () => {
  const action = vi.fn().mockResolvedValue(undefined);
  const props = {
    action,
    purchaseOrderId: ORDER_ID,
    userId: USER_ID,
    materials: [
      { id: MATERIAL_ID, name: 'Harina anterior', internal_code: null },
      { id: NEW_MATERIAL_ID, name: 'Harina nueva', internal_code: null },
    ],
  };
  const beforeCreation = render(<PurchaseOrderItemForm {...props} />);

  fireEvent.change(beforeCreation.container.querySelector('select[name="raw_material_id"]')!, {
    target: { value: MATERIAL_ID },
  });
  fireEvent.change(beforeCreation.container.querySelector('input[name="quantity"]')!, {
    target: { value: '8.25' },
  });
  fireEvent.change(beforeCreation.container.querySelector('input[name="unit_cost"]')!, {
    target: { value: '17.40' },
  });
  beforeCreation.unmount();

  const afterCreation = render(
    <PurchaseOrderItemForm {...props} initialMaterialId={NEW_MATERIAL_ID} />,
  );

  await waitFor(() => {
    expect(afterCreation.container.querySelector('select[name="raw_material_id"]')).toHaveValue(
      NEW_MATERIAL_ID,
    );
    expect(afterCreation.container.querySelector('input[name="quantity"]')).toHaveValue('8.25');
    expect(afterCreation.container.querySelector('input[name="unit_cost"]')).toHaveValue('17.40');
  });
  expect(action).not.toHaveBeenCalled();
});

it('purchaseOrderItems_submitsRestoredValuesOnceAndClearsCaptureAfterSuccess', async () => {
  const action = vi.fn().mockResolvedValue(undefined);
  const storageKey = `cruma:purchase-order-item:${USER_ID}:${ORDER_ID}`;
  sessionStorage.setItem(storageKey, JSON.stringify({
    raw_material_id: MATERIAL_ID,
    quantity: '8.25',
    unit_cost: '17.40',
  }));

  const form = render(
    <PurchaseOrderItemForm
      action={action}
      purchaseOrderId={ORDER_ID}
      userId={USER_ID}
      materials={[{ id: MATERIAL_ID, name: 'Harina nueva', internal_code: null }]}
      initialMaterialId={MATERIAL_ID}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));

  await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  const submitted = action.mock.calls[0]?.[0];
  expect(submitted).toBeInstanceOf(FormData);
  if (!(submitted instanceof FormData)) throw new Error('Expected submitted form data.');
  expect(submitted.get('purchase_order_id')).toBe(ORDER_ID);
  expect(submitted.get('raw_material_id')).toBe(MATERIAL_ID);
  expect(submitted.get('quantity')).toBe('8.25');
  expect(submitted.get('unit_cost')).toBe('17.40');
  expect(sessionStorage.getItem(storageKey)).toBeNull();
  expect(form.container.querySelector('input[name="quantity"]')).toHaveValue('');
});

it('purchaseOrderItems_preservesCaptureAndShowsSafeErrorAfterRejectedAdd', async () => {
  const action = vi.fn()
    .mockRejectedValueOnce(new Error('duplicate key purchase_order_items_sensitive_detail'))
    .mockResolvedValueOnce(undefined);
  const storageKey = `cruma:purchase-order-item:${USER_ID}:${ORDER_ID}`;
  const capture = {
    raw_material_id: MATERIAL_ID,
    quantity: '8.25',
    unit_cost: '17.40',
  };
  sessionStorage.setItem(storageKey, JSON.stringify(capture));

  const form = render(
    <PurchaseOrderItemForm
      action={action}
      purchaseOrderId={ORDER_ID}
      userId={USER_ID}
      materials={[{ id: MATERIAL_ID, name: 'Harina nueva', internal_code: null }]}
      initialMaterialId={MATERIAL_ID}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
  const error = await screen.findByRole('alert');
  expect(error).toHaveTextContent('No fue posible agregar el renglón de compra.');
  expect(error).not.toHaveTextContent('duplicate key');
  expect(form.container.querySelector('input[name="quantity"]')).toHaveValue('8.25');
  expect(form.container.querySelector('input[name="unit_cost"]')).toHaveValue('17.40');
  expect(JSON.parse(sessionStorage.getItem(storageKey)!)).toEqual(capture);

  fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
  await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
  expect(sessionStorage.getItem(storageKey)).toBeNull();
});
