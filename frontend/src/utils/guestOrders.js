import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Save guest order ID to localStorage
export const saveGuestOrder = (orderId) => {
    try {
        const guestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]');
        if (!guestOrders.includes(orderId)) {
            guestOrders.push(orderId);
            localStorage.setItem('guestOrders', JSON.stringify(guestOrders));
        }
    } catch (error) {
        console.error('Error saving guest order:', error);
    }
};

// Claim all guest orders after login
export const claimGuestOrders = async (token) => {
    try {
        const guestOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]');

        if (guestOrders.length === 0) {
            return { success: true, claimed: 0 };
        }

        const response = await axios.post(
            `${API_URL}/api/users/claim-orders`,
            { guestOrderIds: guestOrders },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
            // Clear guest orders after successful claim
            localStorage.removeItem('guestOrders');
            return { success: true, claimed: response.data.claimed_orders };
        }

        return { success: false, claimed: 0 };
    } catch (error) {
        console.error('Error claiming guest orders:', error);
        return { success: false, claimed: 0, error };
    }
};
