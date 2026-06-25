import { createFileRoute } from '@tanstack/react-router';
import Wallets from '@/pages/Wallets';

export const Route = createFileRoute('/_authenticated/wallets')({
  component: Wallets,
});
