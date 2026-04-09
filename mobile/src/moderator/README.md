# 🛡️ Moderator Mobile App - GreenMarket

Dedicated interface for **Moderators** designed and implemented with a modern aesthetic, focusing on efficiency and processing speed.

## 🛠️ Technologies Used
- **Framework**: React Native (Expo)
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **Icons**: Lucide React Native (Crisp, modern)
- **Styling**: Vanilla StyleSheet (Flat Design)
- **Interactions**: Encapsulated state handling logic (Approve, Reject, Resolve).

## 📱 Interface Structure

### 1. Dashboard (Overview)
- Displays key metrics immediately: Pending posts count, new reports, new shop requests.
- **Quick Actions** provide one-tap access to critical tasks.

### 2. Post Moderation Flow
- **List View**: Displays item image, title, price, and timestamp. Includes "Quick Approve" and "Reject" buttons right in the list.
- **Detail View**: Full content review with an image slider. The **Moderation Bar** at the bottom allows for convenient thumb-driven interaction.
- **Reason Modal**: Every rejection/deletion action requires a reason, aligning with API requirements.

### 3. Shop Moderation Flow
- Manage pending shop registration requests.
- View business licenses and certificates.
- "Verify & Activate" shops with a single tap.

### 4. Report Moderation Flow
- Classifies reports by priority (Red: Urgent, Orange: High, Blue: Low).
- Allows Moderators to quickly review reported content before taking action (Resolve/Dismiss).

## 📁 File Structure

| Path | Role |
|---|---|
| `src/moderator/navigation/ModeratorNavigator.tsx` | Main navigation controller (Tabs & Stacks) |
| `src/moderator/screens/DashboardScreen.tsx` | Dashboard with stats cards |
| `src/moderator/screens/PostModerationList.tsx` | List of posts awaiting moderation |
| `src/moderator/screens/PostModerationDetail.tsx` | Detailed post content review |
| `src/moderator/screens/ShopModerationList.tsx` | List of shop registration requests |
| `src/moderator/screens/ReportModerationList.tsx` | List of user reports/flags |
| `src/moderator/components/ReasonModal.tsx` | Shared component for processing reasons |

## 🚀 Integration Guide

To use this interface, update your `App.js` or `MainStack.tsx` to navigate users with the 'moderator' role to the `ModeratorNavigator`.

```tsx
// Example in src/MainStack.tsx
import ModeratorNavigator from './moderator/navigation/ModeratorNavigator';

// ...
{userRole === 'moderator' ? (
  <Stack.Screen name="ModeratorRoot" component={ModeratorNavigator} />
) : (
  <Stack.Screen name="UserRoot" component={UserNavigator} />
)}
```

---
*Note: Current data consists of mock objects for UI demonstration. The `handleApprove`, `handleReject`, and `handleResolve` functions are ready for API integration.*
