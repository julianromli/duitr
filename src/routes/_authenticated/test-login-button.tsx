import { createFileRoute } from '@tanstack/react-router';
import LoginButtonTest from '@/components/test/LoginButtonTest';

export const Route = createFileRoute('/_authenticated/test-login-button')({
  component: LoginButtonTest,
});
