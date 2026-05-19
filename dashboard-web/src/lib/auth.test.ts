import { describe, expect, it, vi } from 'vitest';
import { getCurrentUser } from './auth';

const getUserMock = vi.fn();
const maybeSingleMock = vi.fn();
const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
const selectMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ select: selectMock }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  })),
}));

describe('getCurrentUser', () => {
  it('returns null when there is no active session', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it('returns normalized user shape with profile display name', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'john@example.com' } },
    });
    maybeSingleMock.mockResolvedValueOnce({ data: { display_name: 'John' } });

    await expect(getCurrentUser()).resolves.toEqual({
      id: 'u1',
      email: 'john@example.com',
      displayName: 'John',
    });
  });

  it('falls back to null displayName when profile row is missing', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'john@example.com' } },
    });
    maybeSingleMock.mockResolvedValueOnce({ data: null });

    await expect(getCurrentUser()).resolves.toEqual({
      id: 'u1',
      email: 'john@example.com',
      displayName: null,
    });
  });
});
