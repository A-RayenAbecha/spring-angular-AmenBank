export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  enabled?: boolean;
  accountNonLocked?: boolean;
  accountNonExpired?: boolean;
  credentialsNonExpired?: boolean;
  lastLogin?: Date;
  accounts?: Array<{
    type: string;
    number: string;
    balance: number;
  }>;
  total_balance?: number;
  transaction_limit?: number;
} 