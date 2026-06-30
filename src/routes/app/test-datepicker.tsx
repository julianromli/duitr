import { createFileRoute, redirect } from '@tanstack/react-router';
import { APP_HOME } from '@/config/route-paths';
import { TestDatePicker } from '@/components/ui/test-date-picker';

export const Route = createFileRoute('/app/test-datepicker')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: APP_HOME });
    }
  },
  component: TestDatePicker,
});
