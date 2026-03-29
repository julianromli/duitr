# Code Deletion Log

## [2026-03-29] Refactor Session

### Unused Dependencies Removed
- `@radix-ui/react-accordion`
- `@radix-ui/react-aspect-ratio`
- `@radix-ui/react-collapsible`
- `@radix-ui/react-context-menu`
- `@radix-ui/react-hover-card`
- `@radix-ui/react-menubar`
- `@radix-ui/react-navigation-menu`
- `@radix-ui/react-scroll-area`
- `@radix-ui/react-slider`
- `@radix-ui/react-switch`
- `@radix-ui/react-toggle-group`
- `@types/dompurify`
- `caniuse-lite`
- `dompurify`
- `embla-carousel-react`
- `input-otp`
- `react-resizable-panels`
- `react-virtualized-auto-sizer`
- `react-window`
- `recharts`
- `vaul`

### Unused Dev Dependencies Removed
- `@swc/core`
- `@tailwindcss/typography`
- `@types/exceljs`
- `shadcn`
- `webpack-bundle-analyzer`

### Unused Files Deleted
- `src/components/settings/LanguageSwitcher.tsx` - Unused duplicate of shared language switcher.
- `src/components/test/DateFormatTest.tsx` - One-off manual test component with no callers.
- `src/components/ui/demo.tsx` - Unused demo entry for an unreferenced UI experiment.
- `src/components/ui/spotlight-button.tsx` - Unused experimental navbar component.
- `src/components/ui/typewriter-text.tsx` - Unused UI helper with no references.
- `src/utils/iconUtils.tsx` - Unused legacy icon helper replaced by `src/components/shared/IconSelector.tsx` exports.
- `src/components/currency/CurrencySelection.tsx` - Unused legacy currency selector.
- `src/components/dashboard/BalanceSummary.tsx` - Unused dashboard widget.
- `src/components/dashboard/DashboardCard.tsx` - Only used by other deleted dashboard-only components.
- `src/components/dashboard/RecentTransactions.tsx` - Unused dashboard widget.
- `src/components/dashboard/SpendingChart.tsx` - Unused dashboard widget.
- `src/components/layout/CustomCursor.tsx` - Unused layout effect.
- `src/components/layout/GestureHandler.tsx` - Unused gesture wrapper.
- `src/components/layout/Header.tsx` - Unused header component.
- `src/components/settings/NotificationSettings.tsx` - Unused notification settings UI.
- `src/components/ui/accordion.tsx` - Unused shadcn component.
- `src/components/ui/aspect-ratio.tsx` - Unused shadcn component.
- `src/components/ui/border-beam.tsx` - Unused custom UI effect.
- `src/components/ui/breadcrumb.tsx` - Unused shadcn component.
- `src/components/ui/carousel.tsx` - Unused shadcn component.
- `src/components/ui/chart.tsx` - Unused chart wrapper.
- `src/components/ui/collapsible.tsx` - Unused shadcn component.
- `src/components/ui/context-menu.tsx` - Unused shadcn component.
- `src/components/ui/drawer.tsx` - Unused shadcn component.
- `src/components/ui/form.tsx` - Unused form wrapper.
- `src/components/ui/hover-card.tsx` - Unused shadcn component.
- `src/components/ui/input-otp.tsx` - Unused shadcn component.
- `src/components/ui/menubar.tsx` - Unused shadcn component.
- `src/components/ui/navigation-menu.tsx` - Unused shadcn component.
- `src/components/ui/pagination.tsx` - Unused shadcn component.
- `src/components/ui/resizable.tsx` - Unused resizable panel wrapper.
- `src/components/ui/scroll-area.tsx` - Unused shadcn component.
- `src/components/ui/sidebar.tsx` - Unused sidebar system.
- `src/components/ui/slider.tsx` - Unused shadcn component.
- `src/components/ui/switch.tsx` - Unused shadcn component.
- `src/components/ui/toggle-group.tsx` - Unused shadcn component.
- `src/components/ui/use-toast.ts` - Unused compatibility wrapper.
- `src/context/BudgetContext.tsx` - Unused legacy context.
- `src/context/PinjamanContext.tsx` - Unused legacy context.
- `src/context/TransactionContext.tsx` - Unused legacy context.
- `src/context/UIStateContext.tsx` - Unused legacy context.
- `src/context/WalletContext.tsx` - Unused legacy context.
- `src/context/WantToBuyContext.tsx` - Unused legacy context.
- `src/hooks/use-mobile.tsx` - Only used by deleted sidebar component.
- `src/hooks/useAvatarLoader.ts` - Unused hook.
- `src/pages/Index.tsx` - Unused page entry.
- `src/App.css` - Unused stylesheet.
- `src/features/ai-evaluator/EvaluatePage.tsx` - Unused standalone AI evaluator page replaced by integrated evaluator content.
- `src/services/budgetService.ts` - Only used by deleted legacy context.
- `src/services/calculationService.ts` - Only used by deleted legacy context/services.
- `src/services/notificationService.ts` - Only used by deleted notification settings screen.
- `src/services/transactionService.ts` - Only used by deleted legacy context.
- `src/services/walletService.ts` - Only used by deleted legacy context.
- `src/types/notification.ts` - Only used by deleted notification service/UI.

### Duplicate Code Consolidated
- Kept shared icon logic in `src/components/shared/IconSelector.tsx` and removed legacy duplicate helper in `src/utils/iconUtils.tsx`.

### Unused Exports Removed
- `src/components/shared/ErrorBoundary.tsx` - Removed `useErrorHandler` and `TranslationErrorBoundary`.
- `src/components/shared/IconSelector.tsx` - Removed unused `reverseIconNameMap` export and internalized `availableIcons`.
- `src/components/ui/card.tsx` - Removed unused `CardFooter` component/export.
- `src/components/ui/table.tsx` - Removed unused `TableFooter` and `TableCaption` components/exports.
- `src/components/shared/AppSettings.tsx` - Removed unused named export.
- `src/components/shared/ThemeToggle.tsx` - Removed unused named export.
- `src/components/shared/LanguageSwitcher.tsx` - Removed unused named export.
- `src/components/currency/CurrencyDisplay.tsx` - Removed unused named export and stale type import.
- `src/components/currency/CurrencyInput.tsx` - Removed unused default export.
- `src/hooks/useCurrency.ts` - Removed unused default export.
- `src/components/shared/Logo.tsx` - Removed unused named export.
- `src/components/ui/logo.tsx` - Removed unused named export.
- `src/services/categoryService.ts` - Removed unused named singleton export.
- `src/services/exportService.ts` - Removed unused default export.
- `src/components/ui/alert.tsx` - Removed unused `AlertTitle` export/component.
- `src/components/ui/alert-dialog.tsx` - Removed unused portal/overlay exports.
- `src/components/ui/command.tsx` - Removed unused dialog/shortcut exports.
- `src/components/ui/dropdown-menu.tsx` - Removed unused checkbox/radio/submenu/group exports.
- `src/components/ui/select.tsx` - Removed unused group/label/separator/scroll exports.
- `src/components/ui/sheet.tsx` - Removed unused close/portal/header/footer/description/trigger exports.

### Impact
- Files deleted: 48
- Approximate lines removed: 8800+
- Build impact: production build still succeeds

### Testing
- `bun run build` ✅
- `bun test --run` ⚠️ currently fails in pre-existing auth/transaction test mocks (`Provider` / mocked `getSession` issues), but no longer fails from missing cleanup dependencies
- Full `bun run lint` already had many pre-existing unrelated errors in the repo before this cleanup
- Targeted lint on changed source files: no errors, 2 pre-existing-style fast-refresh warnings in `IconSelector.tsx`
- `npx knip` reduced unused-file findings from 73 to 19
