import { LayoutDashboard, Users, Package, Warehouse, Boxes, ArrowLeftRight, AlertTriangle, ShoppingCart, Truck, ClipboardList, User, Settings, PlusCircle } from 'lucide-react';
const dash = { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard };
const prod = (label = 'Products') => ({ to: '/products', label, icon: Package });
export const NAV = {
  admin: [dash, { to: '/users', label: 'Users', icon: Users }, prod(), { to: '/warehouses', label: 'Warehouses', icon: Warehouse }, { to: '/inventory', label: 'Inventory', icon: Boxes }, { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight }, { to: '/low-stock', label: 'Low stock', icon: AlertTriangle, alert: true }, { to: '/orders', label: 'All orders', icon: ShoppingCart }, { to: '/supply-requests', label: 'Supply requests', icon: Truck }],
  warehouseManager: [dash, { to: '/warehouses', label: 'My warehouses', icon: Warehouse }, { to: '/inventory', label: 'Inventory', icon: Boxes }, { to: '/transactions', label: 'Stock history', icon: ArrowLeftRight }, { to: '/low-stock', label: 'Low stock', icon: AlertTriangle, alert: true }, prod(), { to: '/orders', label: 'Orders', icon: ShoppingCart }, { to: '/supply-requests', label: 'Supply requests', icon: Truck }],
  supplier: [dash, prod('My products'), { to: '/supply-requests', label: 'Supply requests', icon: Truck }],
  salesRepresentative: [dash, prod('Find products'), { to: '/orders/new', label: 'New order', icon: PlusCircle }, { to: '/orders', label: 'My orders', icon: ClipboardList }]
};
export const COMMON = [{ to: '/profile', label: 'Profile', icon: User }, { to: '/settings', label: 'Settings', icon: Settings }];
