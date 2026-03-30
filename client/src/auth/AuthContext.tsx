import * as jose from 'jose';
import { createContext, useState, useCallback, type ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router';

import requestServer from '../utils/requestServer';

import type { AdminLoginResponse, AdminMeResponse, AdminResetPasswordResponse, OrganizationGetMeResponse, OrganizationResetPasswordResponse, UserLoginResponse, VolunteerCreateResponse, VolunteerMeResponse, VolunteerResetPasswordResponse } from '../../../server/src/api/types';
import type { AdminAccountWithoutPassword, NewVolunteerAccount, OrganizationAccountWithoutPassword, VolunteerAccountWithoutPassword } from '../../../server/src/db/tables';
import type { Role, UserJWT } from '../../../server/src/types';

type AccountWithoutPassword = AdminAccountWithoutPassword | OrganizationAccountWithoutPassword | VolunteerAccountWithoutPassword;

const getCurrentUserAccount = async (currentRole?: Role) => {
  if (!currentRole) {
    const token = sessionStorage.getItem('jwt');
    if (!token) return undefined;

    const decoded = jose.decodeJwt<UserJWT>(token);
    currentRole = decoded.role;
  }

  try {
    if (currentRole === 'admin') {
      const response = await requestServer<AdminMeResponse>('/admin/me', { includeJwt: true });
      return response.admin;
    }
    if (currentRole === 'organization') {
      const response = await requestServer<OrganizationGetMeResponse>('/organization/me', { includeJwt: true });
      return response.organization;
    }
    if (currentRole === 'volunteer') {
      const response = await requestServer<VolunteerMeResponse>('/volunteer/me', { includeJwt: true });
      return response.volunteer;
    }
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return undefined;
  }
};

type AuthContextType = {
  user?: {
    role: Role;
    account?: AccountWithoutPassword;
  };
  loaded: boolean;
  refreshUser: (jwt?: string) => void;
  loginAdmin: (email: string, password: string) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<void>;
  createVolunteer: (volunteer: NewVolunteerAccount) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  restrictRoute: (role: Role, unauthenticatedRedirectPath: string) => AccountWithoutPassword;
};

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  loaded: false,
  refreshUser: () => {},
  loginAdmin: async () => {},
  loginUser: async () => {},
  createVolunteer: async () => {},
  changePassword: async () => {},
  logout: () => {},
  restrictRoute: (() => {
    return undefined as unknown as AccountWithoutPassword;
  }) as AuthContextType['restrictRoute'],
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<AuthContextType['user']>(sessionStorage.getItem('jwt')
    ? {
        role: jose.decodeJwt<UserJWT>(sessionStorage.getItem('jwt') as string).role,
        account: undefined as AccountWithoutPassword | undefined,
      }
    : undefined);
  const [loaded, setLoaded] = useState(false);

  const refreshUser = useCallback(async (jwt?: string) => {
    const token = jwt || sessionStorage.getItem('jwt');
    if (!token) {
      setUser(undefined);
      return;
    }

    try {
      const { role } = jose.decodeJwt<UserJWT>(token);
      const account = await getCurrentUserAccount(role);
      if (!account) {
        sessionStorage.removeItem('jwt');
        setUser(undefined);
        navigate('/login', { replace: true });
        return;
      }

      setUser({ role, account: account });
    } catch {
      sessionStorage.removeItem('jwt');
      setUser(undefined);
      navigate('/login', { replace: true });
    }
  }, [navigate]);
  useEffect(() => {
    refreshUser().then(() => setLoaded(true));
  }, [refreshUser]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'auth-event' || !event.newValue) return;

      if (event.newValue.startsWith('signout-others')) {
        if (sessionStorage.getItem('jwt')) {
          sessionStorage.removeItem('jwt');
          setUser(undefined);
          navigate('/login', { replace: true });
        }
        return;
      }

      if (event.newValue.startsWith('login-')) {
        // event format: login-<role>-<id>-<timestamp>
        const [, eventRole, eventId] = event.newValue.split('-');
        if (!eventRole || !eventId) return;

        if (!sessionStorage.getItem('jwt')) return;

        const currentRole = user?.role;
        const currentId = user?.account?.id?.toString();

        if (currentRole === eventRole && currentId === eventId) return;

        sessionStorage.removeItem('jwt');
        setUser(undefined);
        navigate('/login', { replace: true });
      }
    };

    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, [navigate, user]);

  const loginAdmin = useCallback(async (email: string, password: string) => {
    console.log('Attempting admin login with email:', email);
    const response = await requestServer<AdminLoginResponse>('/admin/login', {
      method: 'POST',
      body: { email, password },
    });

    sessionStorage.setItem('jwt', response.token);
    setUser({ role: 'admin', account: response.admin });
    window.localStorage.setItem('auth-event', `login-admin-${response.admin.id}-${Date.now()}`);
  }, []);

  const loginUser = useCallback(async (email: string, password: string) => {
    const response = await requestServer<UserLoginResponse>('/user/login', {
      method: 'POST',
      body: { email, password },
    });

    sessionStorage.setItem('jwt', response.token);
    const account = response.role === 'organization' ? response.organization! : response.volunteer!;
    setUser({
      role: response.role,
      account,
    });
    window.localStorage.setItem('auth-event', `login-${response.role}-${account.id}-${Date.now()}`);
  }, []);

  const createVolunteer = async (volunteer: NewVolunteerAccount) => {
    const response = await requestServer<VolunteerCreateResponse>('/volunteer/create', {
      method: 'POST',
      body: volunteer,
    });

    sessionStorage.setItem('jwt', response.token);
    setUser({
      role: 'volunteer',
      account: response.volunteer,
    });
    window.localStorage.setItem('auth-event', `login-volunteer-${response.volunteer.id}-${Date.now()}`);
  };

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user) return;

    const { token } = await requestServer<
      AdminResetPasswordResponse
      | VolunteerResetPasswordResponse
      | OrganizationResetPasswordResponse
    >('/' + user!.role + '/reset-password', {
      method: 'POST',
      body: {
        currentPassword,
        newPassword,
      },
      includeJwt: true,
    });

    sessionStorage.setItem('jwt', token);
    window.localStorage.setItem('auth-event', 'signout-others-' + Date.now());
    await refreshUser(token);
  }, [user, navigate, refreshUser]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('jwt');
    window.localStorage.setItem('auth-event', 'signout-others-' + Date.now());
    setUser(undefined);
  }, [user]);

  const restrictRoute = useCallback((allowedRole: Role, unauthenticatedRedirectPath: string) => {
    if (!user) {
      navigate(unauthenticatedRedirectPath, { replace: true });
    } else if (user.role !== allowedRole) {
      navigate('/' + user.role, { replace: true });
    }

    if (allowedRole === 'admin') {
      return user!.account as AdminAccountWithoutPassword;
    } else if (allowedRole === 'organization') {
      return user!.account as OrganizationAccountWithoutPassword;
    } else if (allowedRole === 'volunteer') {
      return user!.account as VolunteerAccountWithoutPassword;
    }
    return undefined as unknown as AccountWithoutPassword;
  }, [user, navigate]);

  return (
    <AuthContext.Provider value={{ user, loaded, refreshUser, loginAdmin, loginUser, createVolunteer, changePassword, logout, restrictRoute }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
