import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createTypedClient: vi.fn(),
  getUser: vi.fn(),
  insert: vi.fn(),
}));

vi.mock('@/infrastructure/integrations/supabase/server', () => ({
  createTypedClient: mocks.createTypedClient,
}));

import { trackAnalyticsPageView } from './analytics-event-action';

describe('telemetría mínima de navegación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.createTypedClient.mockResolvedValue({
      auth: { getUser: mocks.getUser },
      from: () => ({ insert: mocks.insert }),
    });
  });

  it('descarta rutas y sesiones manipuladas antes de consultar Supabase', async () => {
    await trackAnalyticsPageView({ area: 'admin', page: 'https://evil.test', sessionId: 'x' });

    expect(mocks.createTypedClient).not.toHaveBeenCalled();
  });

  it('registra únicamente identidad autenticada, sesión, área y página', async () => {
    await trackAnalyticsPageView({
      area: 'mobile',
      page: '/mobile/picking/order-1',
      sessionId: '3f9d6ba2-62d6-4dd4-8190-f10fd5f40f10',
    });

    expect(mocks.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      session_id: '3f9d6ba2-62d6-4dd4-8190-f10fd5f40f10',
      event_type: 'page_view',
      entity_type: 'mobile',
      page: '/mobile/picking/order-1',
      metadata: { area: 'mobile' },
    });
  });
});
