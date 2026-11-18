# What changed

## Bug fixes
- **Low-stock badge / bell showing 1 when nothing is low**
  - Cause: the sidebar badge counted old unread notifications, while the Low stock page checks live stock. Alerts were never removed after restocking.
  - Fix: sidebar badge now comes from a live endpoint (`GET /api/stock/low/count`, same query as the page).
  - Low-stock notifications are now keyed per product+warehouse, replaced instead of duplicated, deleted automatically on restock, and stale/old ones are cleaned whenever notifications or the Low stock page load.
- **Profile page layout**: cover banner no longer covers the photo section; new round avatar with camera button, name and role badge.
- **Assigned warehouses** now show names instead of raw IDs (login + profile now return populated warehouses).

## UI upgrade
- Page transitions and staggered card/table-row entrance animations
- Gradient primary buttons with glow, lift on hover, smoother inputs/focus rings
- Modern stat cards (gradient icons, hover arrow), animated welcome banner
- Gradient chart fills, rounded doughnut with gaps
- Sidebar: gradient, active-item glow, pulsing alert count
- Table rows highlight with an accent edge; gradient progress bars
- Friendlier empty states, custom scrollbars, better login page motion
- Low stock page now has Out of stock / Critical / Running low summary cards

## Files touched
server: models/Notification.js, utils/notify.js, services/stock.js, routes/stock.js, routes/notifications.js, routes/auth.js, seed.js
client: styles.css, components/Layout.jsx, ImageUpload.jsx, ui.jsx, pages/Profile.jsx, Reports.jsx, Dashboard.jsx
