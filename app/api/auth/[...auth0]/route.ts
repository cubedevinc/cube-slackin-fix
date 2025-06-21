import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/admin',
    authorizationParams: {
      scope: 'openid profile email',
      prompt: 'login',
    },
  }),
  logout: handleLogout({
    returnTo: '/admin',
  }),
});

export const POST = GET;
