'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  LogIn,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

export interface CurrentUserProfile {
  id: string;
  user_id: number;
  email: string;
  username: string | null;
  full_name: string | null;
  department: string | null;
  access_level: string | null;
  is_active: boolean;
}

export interface DemoUserPreset {
  label: string;
  email: string;
  password: string;
}

export interface UserSwitcherProps {
  onUserSwitch?: () => void;
  className?: string;
}

function parseDemoUsers(raw: string | undefined): DemoUserPreset[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is DemoUserPreset => {
      if (!item || typeof item !== 'object') {
        return false;
      }
      const candidate = item as Record<string, unknown>;
      return (
        typeof candidate.label === 'string' &&
        candidate.label.trim().length > 0 &&
        typeof candidate.email === 'string' &&
        candidate.email.trim().length > 0 &&
        typeof candidate.password === 'string' &&
        candidate.password.length > 0
      );
    });
  } catch {
    return [];
  }
}

export function UserSwitcher({ onUserSwitch, className }: UserSwitcherProps) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoUsers = parseDemoUsers(process.env.NEXT_PUBLIC_DEMO_USERS);

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const data = await apiClient<CurrentUserProfile>('/api/auth/me');
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setProfileLoading(true);
      try {
        const data = await apiClient<CurrentUserProfile>('/api/auth/me');
        if (!cancelled) {
          setProfile(data);
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const switchToUser = async (targetEmail: string, targetPassword: string) => {
    const trimmedEmail = targetEmail.trim();
    if (!trimmedEmail || !targetPassword || isSwitching) {
      return;
    }

    setIsSwitching(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: targetPassword,
      });

      if (authError) {
        setError(authError.message || 'Unable to sign in with those credentials.');
        return;
      }

      setPassword('');
      await fetchProfile();
      onUserSwitch?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to switch user account.';
      setError(message);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void switchToUser(email, password);
  };

  const activeProfile = user ? profile : null;
  const activeEmail = activeProfile?.email ?? user?.email ?? null;
  const displayName = activeProfile?.full_name || activeProfile?.username || activeEmail;
  const canSubmitForm =
    !isSwitching && email.trim().length > 0 && password.length > 0;

  return (
    <section
      data-testid="user-switcher"
      aria-label="Active user and account switcher"
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs',
        className
      )}
    >
      {/* Active Identity Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserCheck className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              Active Account
            </p>
            {authLoading ? (
              <p className="text-sm text-muted-foreground">Checking session…</p>
            ) : activeEmail ? (
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span
                  data-testid="active-user-name"
                  className="truncate text-sm font-semibold text-foreground"
                >
                  {displayName}
                </span>
                {displayName !== activeEmail && (
                  <span
                    data-testid="active-user-email"
                    className="truncate text-xs text-muted-foreground"
                  >
                    {activeEmail}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not signed in</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {profileLoading && (
            <Loader2
              className="size-3.5 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          )}
          {activeProfile?.department && (
            <span
              data-testid="active-user-department"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              <Users className="size-3" aria-hidden="true" />
              {activeProfile.department}
            </span>
          )}
          {activeProfile?.access_level && (
            <span
              data-testid="active-user-access-level"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
            >
              <Shield className="size-3" aria-hidden="true" />
              {activeProfile.access_level}
            </span>
          )}
        </div>
      </div>

      {/* Optional Env-Driven Quick-Switch Presets */}
      {demoUsers.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            Quick Switch Test Accounts
          </p>
          <div className="flex flex-wrap gap-2">
            {demoUsers.map((preset) => {
              const isCurrent =
                activeEmail?.toLowerCase() === preset.email.toLowerCase();
              return (
                <Button
                  key={preset.email}
                  type="button"
                  size="sm"
                  variant={isCurrent ? 'secondary' : 'outline'}
                  disabled={isSwitching || isCurrent}
                  data-testid="user-preset-button"
                  onClick={() => void switchToUser(preset.email, preset.password)}
                >
                  {isSwitching ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Users aria-hidden="true" />
                  )}
                  {preset.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Inline Switch-Account Form */}
      <form
        data-testid="user-switcher-form"
        onSubmit={handleFormSubmit}
        className="flex flex-col gap-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-switcher-email">Email</Label>
            <Input
              id="user-switcher-email"
              data-testid="user-switcher-email"
              type="email"
              autoComplete="email"
              placeholder="alice@company.com"
              value={email}
              disabled={isSwitching}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-switcher-password">Password</Label>
            <Input
              id="user-switcher-password"
              data-testid="user-switcher-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={password}
              disabled={isSwitching}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Switching accounts starts a fresh chat session.
          </span>
          <Button
            type="submit"
            size="sm"
            disabled={!canSubmitForm}
            data-testid="user-switcher-submit"
          >
            {isSwitching ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Switching…
              </>
            ) : (
              <>
                <LogIn aria-hidden="true" />
                Switch User
              </>
            )}
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            data-testid="user-switcher-error"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </section>
  );
}
