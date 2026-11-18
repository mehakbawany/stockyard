import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Login, Register, Unauthorized, NotFound } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Warehouses from './pages/Warehouses';
import Inventory from './pages/Inventory';
import { Transactions, LowStock } from './pages/Reports';
import Orders from './pages/Orders';
import CreateOrder from './pages/CreateOrder';
import OrderDetails from './pages/OrderDetails';
import SupplyRequests from './pages/SupplyRequests';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

const A = 'admin', M = 'warehouseManager', S = 'supplier', R = 'salesRepresentative';
const G = (roles, el) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={G([A], <Users />)} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetails />} />
        <Route path="warehouses" element={G([A, M], <Warehouses />)} />
        <Route path="inventory" element={G([A, M], <Inventory />)} />
        <Route path="transactions" element={G([A, M], <Transactions />)} />
        <Route path="low-stock" element={G([A, M], <LowStock />)} />
        <Route path="orders" element={G([A, M, R], <Orders />)} />
        <Route path="orders/new" element={G([A, R], <CreateOrder />)} />
        <Route path="orders/:id" element={G([A, M, R], <OrderDetails />)} />
        <Route path="supply-requests" element={G([A, M, S], <SupplyRequests />)} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
