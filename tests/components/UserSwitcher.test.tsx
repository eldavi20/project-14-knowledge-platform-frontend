import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  UserSwitcher,
  type CurrentUserProfile,
} from '@/components/auth/UserSwitcher';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiClient: vi.fn(),
}));

vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(),
}));

const aliceProfile: CurrentUserProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  user_id: 1,
  email: 'alice@company.com',
  username: 'alice',
  full_name: 'Alice Engineer',
  department: 'engineering',
  access_level: 'standard',
  is_active: true,
};

const internProfile: CurrentUserProfile = {
  id: '00000000-0000-0000-0000-000000000002',
  user_id: 2,
  email: 'intern@company.com',
  username: 'intern',
  full_name: 'Sam Intern',
  department: 'interns',
  access_level: 'limited',
  is_active: true,
};

describe('UserSwitcher', () => {
  const mockSignInWithPassword = vi.fn();
  const originalDemoUsers = process.env.NEXT_PUBLIC_DEMO_USERS;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_DEMO_USERS;

    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: aliceProfile.id, email: aliceProfile.email },
      loading: false,
    });

    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
    });

    (apiClient as ReturnType<typeof vi.fn>).mockResolvedValue(aliceProfile);
  });

  afterEach(() => {
    if (originalDemoUsers === undefined) {
      delete process.env.NEXT_PUBLIC_DEMO_USERS;
    } else {
      process.env.NEXT_PUBLIC_DEMO_USERS = originalDemoUsers;
    }
  });

  it('renders active user identity and /api/auth/me profile badges', async () => {
    render(<UserSwitcher />);

    expect(screen.getByTestId('user-switcher')).toBeInTheDocument();

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/api/auth/me');
      expect(screen.getByTestId('active-user-name')).toHaveTextContent(
        'Alice Engineer'
      );
    });

    expect(screen.getByTestId('active-user-email')).toHaveTextContent(
      'alice@company.com'
    );
    expect(screen.getByTestId('active-user-department')).toHaveTextContent(
      'engineering'
    );
    expect(screen.getByTestId('active-user-access-level')).toHaveTextContent(
      'standard'
    );
  });

  it('switches user via inline email/password form, refreshes /api/auth/me, and invokes onUserSwitch', async () => {
    const onUserSwitch = vi.fn();
    mockSignInWithPassword.mockResolvedValueOnce({ data: {}, error: null });
    (apiClient as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(aliceProfile)
      .mockResolvedValueOnce(internProfile);

    render(<UserSwitcher onUserSwitch={onUserSwitch} />);

    await waitFor(() => {
      expect(screen.getByTestId('active-user-department')).toHaveTextContent(
        'engineering'
      );
    });

    const emailInput = screen.getByTestId(
      'user-switcher-email'
    ) as HTMLInputElement;
    const passwordInput = screen.getByTestId(
      'user-switcher-password'
    ) as HTMLInputElement;
    const submitButton = screen.getByTestId('user-switcher-submit');

    expect(submitButton).toBeDisabled();

    fireEvent.change(emailInput, { target: { value: 'intern@company.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'intern@company.com',
        password: 'Secret123!',
      });
      expect(onUserSwitch).toHaveBeenCalledTimes(1);
    });

    expect(passwordInput.value).toBe('');
    expect(screen.getByTestId('active-user-department')).toHaveTextContent(
      'interns'
    );
    expect(screen.getByTestId('active-user-access-level')).toHaveTextContent(
      'limited'
    );
  });

  it('renders NEXT_PUBLIC_DEMO_USERS presets, signs in on click, and ignores malformed JSON', async () => {
    process.env.NEXT_PUBLIC_DEMO_USERS = JSON.stringify([
      { label: 'Alice (Eng)', email: 'alice@company.com', password: 'pw1' },
      { label: 'Sam (Intern)', email: 'intern@company.com', password: 'pw2' },
    ]);

    const onUserSwitch = vi.fn();
    mockSignInWithPassword.mockResolvedValueOnce({ data: {}, error: null });
    (apiClient as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(aliceProfile)
      .mockResolvedValueOnce(internProfile);

    const { unmount } = render(<UserSwitcher onUserSwitch={onUserSwitch} />);

    await waitFor(() => {
      expect(screen.getByTestId('active-user-name')).toHaveTextContent(
        'Alice Engineer'
      );
    });

    const presets = screen.getAllByTestId('user-preset-button');
    expect(presets).toHaveLength(2);
    expect(presets[0]).toBeDisabled();
    expect(presets[1]).not.toBeDisabled();

    fireEvent.click(presets[1]);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'intern@company.com',
        password: 'pw2',
      });
      expect(onUserSwitch).toHaveBeenCalledTimes(1);
    });

    unmount();

    // Malformed JSON should fail safely without rendering preset buttons
    process.env.NEXT_PUBLIC_DEMO_USERS = '{not-valid-json';
    render(<UserSwitcher />);
    await waitFor(() => {
      expect(screen.getByTestId('active-user-name')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('user-preset-button')).not.toBeInTheDocument();
  });

  it('displays an inline error alert and disables submit while switching when login fails', async () => {
    const onUserSwitch = vi.fn();
    let resolveAuth: (value: { error: { message: string } }) => void;
    mockSignInWithPassword.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveAuth = resolve;
        })
    );

    render(<UserSwitcher onUserSwitch={onUserSwitch} />);

    fireEvent.change(screen.getByTestId('user-switcher-email'), {
      target: { value: 'wrong@company.com' },
    });
    fireEvent.change(screen.getByTestId('user-switcher-password'), {
      target: { value: 'bad-password' },
    });

    const submitButton = screen.getByTestId('user-switcher-submit');
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Switching…');

    resolveAuth!({ error: { message: 'Invalid login credentials' } });

    await waitFor(() => {
      expect(screen.getByTestId('user-switcher-error')).toHaveTextContent(
        'Invalid login credentials'
      );
    });

    expect(onUserSwitch).not.toHaveBeenCalled();
    expect(submitButton).not.toBeDisabled();
  });
});
