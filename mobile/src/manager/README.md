# 🛡️ Manager Mobile App - GreenMarket

Dedicated interface for **Managers** designed and implemented with a modern aesthetic, focusing on efficiency and processing speed.

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

### 2. Post Management Flow
- **List View**: Displays item image, title, price, and timestamp. Includes "Quick Approve" and "Reject" buttons right in the list.
- **Detail View**: Full content review with an image slider. The **Management Bar** at the bottom allows for convenient thumb-driven interaction.
- **Reason Modal**: Every rejection/deletion action requires a reason, aligning with API requirements.

### 3. Shop Management Flow
- Manage pending shop registration requests.
- View business licenses and certificates.
- "Verify & Activate" shops with a single tap.

### 4. Report Management Flow
- Classifies reports by priority (Red: Urgent, Orange: High, Blue: Low).
- Allows Managers to quickly review reported content before taking action (Resolve/Dismiss).

## 📁 File Structure

| Path | Role |
|---|---|
| `src/manager/navigation/ManagerNavigator.tsx` | Main navigation controller (Tabs & Stacks) |
| `src/manager/screens/DashboardScreen.tsx` | Dashboard with stats cards |
| `src/manager/screens/PostManagementList.tsx` | List of posts awaiting management |
| `src/manager/screens/PostManagementDetail.tsx` | Detailed post content review |
| `src/manager/screens/ShopManagementList.tsx` | List of shop registration requests |
| `src/manager/screens/ReportManagementList.tsx` | List of user reports/flags |
| `src/manager/components/ReasonModal.tsx` | Shared component for processing reasons |

## 🚀 Integration Guide

To use this interface, update your `App.js` or `MainStack.tsx` to navigate users with the 'MANAGER' role to the `ManagerNavigator`.

```tsx
// Example in src/navigation/AuthStack.tsx
import ManagerNavigator from '../manager/navigation/ManagerNavigator';

// ...
{businessRoleCode === 'MANAGER' ? (
  <ManagerNavigator />
) : (
  <UserNavigator />
)}
```

---
*Note: Current data integration uses `/api/manager` endpoints. The `handleApprove`, `handleReject`, and `handleResolve` functions are connected to ManagerService.*
