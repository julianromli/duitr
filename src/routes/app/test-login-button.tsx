import { createFileRoute, redirect } from '@tanstack/react-router';
import { APP_HOME } from '@/config/route-paths';
import LoginButtonTest from '@/components/test/LoginButtonTest';

export const Route = createFileRoute('/app/test-login-button')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: APP_HOME });
    }
  },
  component: LoginButtonTest,
});
