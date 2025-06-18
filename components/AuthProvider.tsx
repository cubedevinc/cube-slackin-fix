'use client';

import { UserProvider } from '@auth0/nextjs-auth0/client';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return <UserProvider>{children}</UserProvider>;
}
