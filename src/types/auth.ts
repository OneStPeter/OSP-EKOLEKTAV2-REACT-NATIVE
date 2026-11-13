export interface LoginCredentials {
  email: string;
  password: string;
  remember: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  /** tblSalesForce.SalesForceCode; the BPIS pull and sync events are keyed by it. */
  salesForceCode?: string | null;
  /** tblSalesForce.OrgUnitCode, the agent's branch. */
  branch?: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

export type SocialProvider = 'google' | 'facebook' | 'x';
