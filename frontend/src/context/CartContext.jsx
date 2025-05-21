import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const storedCart = localStorage.getItem('cart');
        return storedCart ? JSON.parse(storedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (dish) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === dish.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === dish.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
                );
            } else {
                return [...prevCart, { ...dish, quantity: 1 }];
            }
        });
    };

    const removeFromCart = (dishId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== dishId));
    };

    const updateQuantity = (dishId, quantity) => {
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === dishId ? { ...item, quantity: parseInt(quantity, 10) } : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};