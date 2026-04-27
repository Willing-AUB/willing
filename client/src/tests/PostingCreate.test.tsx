import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

import { renderPageWithAuth } from './test-utils';
import PostingCreate from '../pages/organization/PostingCreate';

vi.mock('../components/LocationPicker', () => ({
  __esModule: true,
  default: () => <div data-testid="location-picker" />,
}));

vi.mock('../utils/requestServer', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../utils/useUsers', () => ({
  useOrganization: () => ({ id: 1 }),
}));

let requestServerMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 3, 27, 12));

  const mockedModule = await vi.importMock('../utils/requestServer');
  requestServerMock = mockedModule.default as unknown as ReturnType<typeof vi.fn>;
  requestServerMock.mockResolvedValue({ crises: [] });
});

afterEach(() => {
  cleanup();
  requestServerMock?.mockReset();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test('disables past dates in the create posting calendar', () => {
  renderPageWithAuth(<PostingCreate />, {
    initialEntries: ['/organization/posting'],
    authOverrides: { user: { role: 'organization' } },
  });

  fireEvent.click(screen.getByRole('button', { name: /select range/i }));

  expect(screen.getByRole('button', { name: /april 26/i })).toBeDisabled();
  expect(screen.getByRole('button', { name: /april 27/i })).not.toBeDisabled();
});
