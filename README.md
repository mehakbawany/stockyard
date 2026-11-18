# StockYard - Inventory & Warehouse Management System
MERN + JWT + bcrypt + ImageKit. Four roles: Admin, Warehouse Manager, Supplier, Sales Representative.

## Setup (5 minutes)
```bash
# 1. backend
cd server && cp .env.example .env     # fill MONGO_URI, JWT_SECRET and the 3 ImageKit keys
npm install
npm run seed                          # demo data + demo users
npm run dev                           # http://localhost:5000

# 2. frontend (new terminal)
cd client && npm install
npm run dev                           # http://localhost:5173  (proxies /api to :5000)
```
For a deployed backend, set `VITE_API_URL=https://your-api/api` in the client environment.

### ImageKit
Create a free account at imagekit.io -> Developer options -> copy **Public key, Private key, URL endpoint** into `server/.env`.
The private key stays on the server. The browser asks `GET /api/upload/auth` for a signed token, uploads straight to ImageKit,
and sends only the returned `fileId` to our API. The backend then calls ImageKit to verify the file (type + size), stores the trusted URL,
and deletes the old file when an image is replaced or the record is removed.

## Test logins (after `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Admin | admin@ims.com | Admin@123 |
| Warehouse manager (Karachi Central) | manager@ims.com | Manager@123 |
| Warehouse manager (Lahore Hub) | manager2@ims.com | Manager@123 |
| Supplier | supplier@ims.com | Supplier@123 |
| Sales representative | sales@ims.com | Sales@123 |

## Instructor scenario - how to demo it
1. Admin: Users -> add users, Warehouses -> create + assign manager.
2. Admin/Manager: Products -> add *Laptop* (Rs. 80,000, limit 5) with an image.
3. Manager: Inventory -> Receive 20 Laptops, Remove 3 -> stock 17, 2 transactions.
4. Sales rep: New order -> 2 Laptops = Rs. 160,000. Manager/Admin clicks **Process** -> stock 15.
5. Try ordering more than available -> rejected (UI blocks it, API rejects it too).
6. Role security: log in as Manager 1 and call another warehouse's stock (403), as Supplier call `/api/users` (403).

## Business rules and where they live
- Stock never negative: atomic `findOneAndUpdate({quantity:{$gte:q}})` in `server/services/stock.js`.
- Stock deducted once: atomic `Pending -> Processing` lock in `routes/orders.js`; completed/cancelled orders are frozen; failed deductions roll back.
- One Stock record per product+warehouse: unique compound index in `models/Stock.js`.
- Every in/out creates a StockTransaction (orders, transfers and approved supply requests included).
- Public register cannot create admins; managers only touch assigned warehouses (`middleware/auth.js`); suppliers/reps only see their own data.

## Extras beyond the brief
Dark/light/system theme + 5 accent colours + settings page, notification centre with live polling + toasts + sound, SweetAlert confirmations,
Ctrl+K command palette, profile editing + password change, product grid/list views, CSV export, dashboards with Chart.js,
stock transfer between warehouses, capacity checks, printable invoices (Print -> Save as PDF), supply-request approval that can also receive stock,
user activate/deactivate switch, order progress stepper.
