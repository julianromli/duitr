import { createFileRoute, redirect } from '@tanstack/react-router';
import { TestDatePicker } from '@/components/ui/test-date-picker';

export const Route = createFileRoute('/_authenticated/test-datepicker')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  component: TestDatePicker,
});
