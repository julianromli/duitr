# Phase 1B: Frontend Implementation Plan

## Overview
Build user-facing components for Predictive Budget Guardian feature.

**Timeline:** 10 days after Phase 1A completion
**Dependencies:** Task 1.2 (Prediction Service Layer) must be complete

---

## Component Architecture

```
Dashboard (existing)
  └── BudgetHealthWidget (new)
        ├── RiskIndicator
        ├── CategoryPredictionCard
        └── ActionButtons
        
Settings (existing)
  └── NotificationSettings (new)
        └── PredictionAlertToggle
```

---

## Task Breakdown

### Task 1.4: Build BudgetHealthWidget Component
**Agent:** `typescript-pro` + `ui-visual-validator`
**Priority:** High
**Estimated:** 3-4 days

**File:** `src/components/dashboard/BudgetHealthWidget.tsx`

**Requirements:**
- Use shadcn/ui Card component
- Display overall budget health status
- Show predictions for each budget category
- Visual risk indicators (🟢 Low, 🟡 Medium, 🔴 High)
- Expandable detail view with daily spending recommendations
- Smooth animations with Framer Motion
- Responsive design (mobile-first)
- Dark mode compatible

**Component Structure:**
```tsx
<Card className="border-[#242425]">
  <CardHeader>
    <CardTitle>🎯 Budget Health</CardTitle>
    <Badge variant={getRiskVariant(overallRisk)}>
      {overallRisk.toUpperCase()}
    </Badge>
  </CardHeader>
  <CardContent>
    {/* Overall Summary */}
    <div className="mb-4">
      <p className="text-sm text-gray-300">{summary}</p>
    </div>
    
    {/* Category Predictions */}
    <div className="space-y-3">
      {predictions.map(prediction => (
        <CategoryPredictionCard key={prediction.categoryId} {...prediction} />
      ))}
    </div>
    
    {/* Refresh Button */}
    <Button onClick={refresh} disabled={isRefreshing}>
      <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
      {t('budget.refreshPredictions')}
    </Button>
  </CardContent>
</Card>
```

**Sub-components:**
1. **CategoryPredictionCard** - Individual category prediction display
2. **RiskBadge** - Colored risk indicator
3. **ProgressBar** - Visual budget usage
4. **RecommendationTooltip** - Daily limit suggestions

**Interactions:**
- Click to expand detailed view
- Refresh button to force new prediction
- Link to category details
- Share prediction (optional)

**Testing:**
- Unit tests with Vitest
- Visual regression tests
- Accessibility (keyboard navigation, screen readers)
- Responsive breakpoints (mobile, tablet, desktop)

---

### Task 1.5: Integrate Widget into Dashboard
**Agent:** `typescript-pro`
**Priority:** High
**Estimated:** 2 days

**File:** `src/pages/Dashboard.tsx`

**Requirements:**
- Add BudgetHealthWidget to Dashboard layout
- Position above or below existing widgets
- Conditional rendering (only show if budgets exist)
- Loading skeleton during initial fetch
- Error boundary for graceful degradation
- Respect user preferences (show/hide widget)

**Integration Points:**
```tsx
import { BudgetHealthWidget } from '@/components/dashboard/BudgetHealthWidget';
import { useBudgetPredictions } from '@/hooks/useBudgetPredictions';

function Dashboard() {
  const { budgets } = useFinance();
  const showPredictions = budgets.length > 0;
  
  return (
    <div className="space-y-6">
      {/* Existing widgets */}
      <BalanceSummary />
      
      {/* NEW: Budget Health Widget */}
      {showPredictions && <BudgetHealthWidget />}
      
      {/* Existing widgets */}
      <SpendingChart />
      <RecentTransactions />
    </div>
  );
}
```

**Performance:**
- Lazy load widget (React.lazy)
- Use React Query cache
- Defer non-critical renders
- Optimize re-renders with React.memo

---

### Task 1.6: Push Notification System (PWA)
**Agent:** `flutter-expert` + `typescript-pro`
**Priority:** Medium
**Estimated:** 4-5 days

**Files:**
- `src/hooks/usePWA.ts` (extend existing)
- `src/services/notificationService.ts` (new)
- `src/components/settings/NotificationSettings.tsx` (new)
- `public/sw.js` (update service worker)

**Requirements:**

#### 1. Notification Permission Flow
```tsx
// Check if notifications are supported
const canNotify = 'Notification' in window && 'serviceWorker' in navigator;

// Request permission
async function requestNotificationPermission() {
  if (!canNotify) return false;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}
```

#### 2. Notification Types
- **Daily Alert:** Morning summary of budget status
- **Risk Alert:** When category goes from low → medium or medium → high
- **Threshold Alert:** When category hits 75%, 90%, 100%, 110%
- **Weekly Digest:** Sunday evening budget recap

#### 3. Service Worker Handler
```javascript
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url,
      type: data.type
    },
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    clients.openWindow(event.notification.data.url);
  }
});
```

#### 4. Notification Scheduler (Backend)
- Supabase Edge Function: `schedule-notifications`
- Triggered by Supabase cron (daily at 8 AM)
- Checks all users' predictions
- Sends push notifications for high-risk budgets

#### 5. Settings UI
```tsx
<Card>
  <CardHeader>
    <CardTitle>{t('settings.notifications')}</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <Switch
        checked={notificationsEnabled}
        onCheckedChange={toggleNotifications}
        label={t('settings.enablePredictionAlerts')}
      />
      
      {notificationsEnabled && (
        <>
          <Select value={alertTime} onValueChange={setAlertTime}>
            <SelectTrigger>
              <SelectValue placeholder="Alert time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="08:00">8:00 AM</SelectItem>
              <SelectItem value="12:00">12:00 PM</SelectItem>
              <SelectItem value="18:00">6:00 PM</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="space-y-2">
            <Label>{t('settings.alertTypes')}</Label>
            <Checkbox checked={alertTypes.risk} onChange={...}>
              {t('settings.riskAlerts')}
            </Checkbox>
            <Checkbox checked={alertTypes.threshold} onChange={...}>
              {t('settings.thresholdAlerts')}
            </Checkbox>
            <Checkbox checked={alertTypes.weekly} onChange={...}>
              {t('settings.weeklyDigest')}
            </Checkbox>
          </div>
        </>
      )}
    </div>
  </CardContent>
</Card>
```

**Storage:**
- User preferences in `user_metadata`
- Notification tokens in new table: `notification_subscriptions`

---

## Translation Keys

Add to `src/locales/en.json` and `src/locales/id.json`:

```json
{
  "budget": {
    "health": "Budget Health",
    "predictions": "Predictions",
    "refreshPredictions": "Refresh Predictions",
    "riskLevels": {
      "low": "On Track",
      "medium": "Watch Carefully",
      "high": "High Risk"
    },
    "projectedSpend": "Projected Spend",
    "recommendedLimit": "Recommended Daily Limit",
    "daysRemaining": "Days Remaining",
    "insight": "Insight"
  },
  "settings": {
    "notifications": "Prediction Alerts",
    "enablePredictionAlerts": "Enable budget prediction alerts",
    "alertTime": "Alert Time",
    "alertTypes": "Alert Types",
    "riskAlerts": "Risk level changes",
    "thresholdAlerts": "Budget thresholds (75%, 90%, 100%)",
    "weeklyDigest": "Weekly budget summary"
  }
}
```

---

## Testing Strategy

### Unit Tests
- Component rendering
- Hook logic
- Service function calls
- Error handling

### Integration Tests
- Dashboard integration
- Notification flow
- Settings persistence
- Cache behavior

### E2E Tests (Playwright)
- User sees predictions on dashboard
- User refreshes predictions
- User enables notifications
- User receives test notification

### Visual Regression Tests
- Desktop layout
- Mobile layout
- Dark/light mode
- Risk indicators
- Loading states
- Error states

---

## Performance Targets

- **Widget Load:** < 200ms (with cache)
- **Prediction Generation:** < 3s (AI call)
- **Notification Delivery:** < 5s from trigger
- **Dashboard FCP:** No impact (lazy load)

---

## Accessibility Requirements

- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader announcements
- ✅ High contrast mode support
- ✅ Focus indicators
- ✅ Semantic HTML structure

---

## Success Criteria

### Task 1.4 (Widget)
- ✅ Component renders with all states (loading, success, error)
- ✅ Displays predictions accurately
- ✅ Animations are smooth (60fps)
- ✅ Responsive on all screen sizes
- ✅ Passes accessibility audit
- ✅ No TypeScript errors

### Task 1.5 (Integration)
- ✅ Widget appears on Dashboard
- ✅ Conditional rendering works
- ✅ Loading skeleton displays correctly
- ✅ Error boundary catches failures
- ✅ No performance degradation

### Task 1.6 (Notifications)
- ✅ Permission request flow works
- ✅ Notifications appear on schedule
- ✅ Click actions navigate correctly
- ✅ Settings persist across sessions
- ✅ Service worker handles push events
- ✅ Works on Android and iOS PWA

---

## Risk Mitigation

**Risk:** AI predictions may be slow (>5s)
**Mitigation:** Show cached predictions first, update in background

**Risk:** User denies notification permission
**Mitigation:** Gracefully degrade, offer in-app alerts instead

**Risk:** Widget increases Dashboard load time
**Mitigation:** Lazy load, optimize bundle size, use code splitting

**Risk:** Predictions inaccurate for new users (<30 days data)
**Mitigation:** Show confidence score, add disclaimer

---

## Next Steps After Phase 1B

1. User feedback collection
2. A/B testing of widget placement
3. Performance monitoring (Core Web Vitals)
4. Iterate based on usage analytics
5. Prepare for Phase 2 (Recurring Pattern Detector)
