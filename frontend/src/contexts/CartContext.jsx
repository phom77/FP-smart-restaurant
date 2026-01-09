import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        // Load cart from localStorage on init
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item, quantity = 1, modifiers = []) => {
        setCart(prevCart => {
            // Check if item with same modifiers already exists
            const existingIndex = prevCart.findIndex(cartItem =>
                cartItem.id === item.id &&
                JSON.stringify(cartItem.modifiers) === JSON.stringify(modifiers)
            );

            if (existingIndex > -1) {
                // Update quantity
                const newCart = [...prevCart];
                newCart[existingIndex].quantity += quantity;
                return newCart;
            } else {
                // Add new item
                return [...prevCart, {
                    ...item,
                    quantity,
                    modifiers,
                    cartId: Date.now() // Unique ID for cart item
                }];
            }
        });
    };

    const removeFromCart = (cartId) => {
        setCart(prevCart => prevCart.filter(item => item.cartId !== cartId));
    };

    const updateQuantity = (cartId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(cartId);
            return;
        }
        setCart(prevCart =>
            prevCart.map(item =>
                item.cartId === cartId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => {
            const modifiersTotal = item.modifiers?.reduce((sum, mod) => sum + (mod.price_adjustment || 0), 0) || 0;
            return total + ((item.price + modifiersTotal) * item.quantity);
        }, 0);
    };

    const getCartCount = () => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    };

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getCartCount
        }}>
            {children}
        </CartContext.Provider>
    );
};
