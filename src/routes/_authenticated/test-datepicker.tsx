import { createFileRoute } from '@tanstack/react-router';
import { TestDatePicker } from '@/components/ui/test-date-picker';

export const Route = createFileRoute('/_authenticated/test-datepicker')({
  component: TestDatePicker,
});
