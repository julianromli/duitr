import { createFileRoute, redirect } from '@tanstack/react-router';
import LoginButtonTest from '@/components/test/LoginButtonTest';

export const Route = createFileRoute('/_authenticated/test-login-button')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginButtonTest,
});
