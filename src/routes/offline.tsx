import { createFileRoute } from '@tanstack/react-router';
import Offline from '@/pages/Offline';

export const Route = createFileRoute('/offline')({
  component: Offline,
});
