import React, { useState, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { MenuUpdateProvider } from './context/MenuUpdateContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/ProfilePage';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';
import MyArchiveOrders from "./pages/MyArchiveOrders";
import AdminOrdersPage from './pages/Admin/AdminOrdersPage';
import ArchiveOrdersPage from './pages/Admin/ArchiveOrdersPage';
import AdminMenuPage from "./pages/Admin/AdminMenuPage";
import TablesPage from './pages/TablesPage';
import MyTablesPage from './pages/MyTablesPage';
import AdminTablesPage from './pages/Admin/AdminTablesPage';
import Footer from './components/Footer';
import PrivacyPolicy from './pages/Legal/PrivacyPolicy';
import TermsOfService from './pages/Legal/TermsOfService';


function App() {

    return (
        <MenuUpdateProvider>
            <AuthProvider>
                <CartProvider>
                    <AppContent /> {/* Просто рендеримо AppContent */}
                </CartProvider>
            </AuthProvider>
        </MenuUpdateProvider>
    );
}

function AppContent() {
    const { loading } = useContext(AuthContext);
    const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
    const [isEditDishModalOpen, setIsEditDishModalOpen] = useState(false);
    const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);

    const isAnyModalOpen = isAddDishModalOpen || isEditDishModalOpen || isReviewsModalOpen;

    return (
        <>
            <Header />
            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '50px' }}>Завантаження даних користувача...</div>
            ) : (
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/menu" element={<Menu
                        setIsEditModalOpen={setIsEditDishModalOpen}
                        setIsReviewsModalOpen={setIsReviewsModalOpen}
                    />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/my-orders" element={<MyOrders />} />
                    <Route path="/my-orders/archive" element={<MyArchiveOrders />} />
                    <Route path="/tables" element={<TablesPage />} />

                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />


                    <Route element={<ProtectedRoute />}>
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/my-tables" element={<MyTablesPage />} />
                    </Route>


                    <Route path="/admin/menu" element={<AdminMenuPage
                        setIsAddDishModalOpen={setIsAddDishModalOpen}
                        setIsEditModalOpen={setIsEditDishModalOpen}
                        setIsReviewsModalOpen={setIsReviewsModalOpen}
                    />} />
                    <Route path="/admin/orders" element={<AdminOrdersPage />} />
                    <Route path="/admin/archive" element={<ArchiveOrdersPage />} />
                    <Route path="/admin/tables" element={<AdminTablesPage />} />

                </Routes>
            )}
            <Footer isModalOpen={isAnyModalOpen} />
        </>
    );
}

export default App;