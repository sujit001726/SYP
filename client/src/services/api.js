import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL
});

export const getImageUrl = (img) => {
    if (!img) return null;
    if (typeof img !== 'string') return null;
    if (img.startsWith('http') || img.startsWith('/src/') || img.startsWith('data:')) return img;

    // Derive base URL (e.g., http://localhost:5000) from API_URL
    const baseUrl = API_URL.replace('/api', '').replace(/\/$/, '');
    const cleanImg = img.startsWith('/') ? img : `/${img}`;

    return `${baseUrl}${cleanImg}`;
};

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const authService = {
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },
    googleLogin: async (credential) => {
        const response = await api.post('/auth/google-login', { credential });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
};

export const vehicleService = {
    getAll: async (params) => {
        const response = await api.get('/vehicles', { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/vehicles/${id}`);
        return response.data;
    },
    create: async (vehicleData) => {
        const response = await api.post('/vehicles', vehicleData);
        return response.data;
    },
    update: async (id, vehicleData) => {
        const response = await api.put(`/vehicles/${id}`, vehicleData);
        return response.data;
    },
    updateImages: async (id, images) => {
        const response = await api.patch(`/vehicles/${id}/images`, { images });
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/vehicles/${id}`);
        return response.data;
    },
    uploadImages: async (formData) => {
        const response = await api.post('/media/upload', formData, {
            headers: { 'Content-Type': undefined }
        });
        return response.data;
    }
};


export const bookingService = {
    create: async (bookingData) => {
        const response = await api.post('/bookings', bookingData);
        return response.data;
    },
    getMyBookings: async () => {
        const response = await api.get('/bookings/my-bookings');
        return response.data;
    },
    getOwnerBookings: async () => {
        const response = await api.get('/bookings/owner-bookings');
        return response.data;
    },
    updateStatus: async (id, status) => {
        const response = await api.put(`/bookings/${id}/status`, { status });
        return response.data;
    },
    getVehicleBookings: async (vehicleId) => {
        const response = await api.get(`/bookings/vehicle/${vehicleId}`);
        return response.data;
    }
};

export const notificationService = {
    getAll: async () => {
        const response = await api.get('/notifications');
        return response.data;
    },
    markAsRead: async (id) => {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    },
    markAllAsRead: async () => {
        const response = await api.put('/notifications/read-all');
        return response.data;
    }
};

export const userService = {
    getProfile: async () => {
        const response = await api.get('/users/profile');
        return response.data;
    },
    updateProfile: async (profileData) => {
        const response = await api.put('/users/profile', profileData);
        return response.data;
    },
    submitKyc: async (formData) => {
        const response = await api.post('/users/kyc', formData, {
            headers: { 'Content-Type': undefined }
        });
        return response.data;
    },
    getUserById: async (id) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    }
};


export const paymentService = {
    initiateEsewa: async (bookingId) => {
        const response = await api.post('/payments/initiate-esewa', { bookingId });
        return response.data;
    },
    verifyEsewa: async (data) => {
        const response = await api.get(`/payments/verify-esewa?data=${data}`);
        return response.data;
    },
    payWithWallet: async (bookingId) => {
        const response = await api.post('/payments/pay-wallet', { bookingId });
        return response.data;
    },
    verifyManualPayment: async (bookingId, token) => {
        const response = await api.post('/payments/verify-manual', { bookingId, token });
        return response.data;
    }
};

export const walletService = {
    getHistory: async () => {
        const response = await api.get('/wallet/history');
        return response.data;
    },
    topup: async (topupData) => {
        const response = await api.post('/wallet/topup', topupData);
        return response.data;
    }
};

export const reviewService = {
    getForVehicle: async (vehicleId) => {
        const response = await api.get(`/reviews/vehicle/${vehicleId}`);
        return response.data;
    },
    addReview: async (reviewData) => {
        const response = await api.post(`/reviews`, reviewData);
        return response.data;
    }
};

export const adminService = {
    getStats: async () => {
        const response = await api.get('/users/admin/stats');
        return response.data;
    },
    getPendingKyc: async () => {
        const response = await api.get('/users/admin/kyc-pending');
        return response.data;
    },
    updateKycStatus: async (userId, statusData) => {
        const response = await api.put(`/users/admin/kyc/${userId}`, statusData);
        return response.data;
    },
    // New Control Panel Methods
    getAllUsers: async () => {
        const response = await api.get('/admin-v2/users');
        return response.data;
    },
    getAllVehicles: async () => {
        const response = await api.get('/admin-v2/vehicles');
        return response.data;
    },
    getAllBookings: async () => {
        const response = await api.get('/admin-v2/bookings');
        return response.data;
    },
    updateBookingStatus: async (id, data) => {
        const response = await api.put(`/admin-v2/bookings/${id}/status`, data);
        return response.data;
    },
    addMember: async (memberData) => {
        const response = await api.post('/admin-v2/members', memberData);
        return response.data;
    },
    getMembers: async () => {
        const response = await api.get('/admin-v2/members');
        return response.data;
    },
    uploadImages: async (formData) => {
        const response = await api.post('/media/upload', formData, {
            headers: { 'Content-Type': undefined }
        });
        return response.data;
    },
    createVehicle: async (vehicleData) => {
        const response = await api.post('/vehicles', vehicleData);
        return response.data;
    }
};

export const messageService = {
    getChatList: async () => {
        const response = await api.get('/messages/list');
        return response.data;
    },
    getMessages: async (userId) => {
        const response = await api.get(`/messages/${userId}`);
        return response.data;
    },
    sendMessage: async (messageData) => {
        const response = await api.post('/messages/send', messageData);
        return response.data;
    },
    markAsRead: async (senderId) => {
        const response = await api.put(`/messages/mark-read/${senderId}`);
        return response.data;
    },
    sendFile: async (formData) => {
        const response = await api.post('/messages/upload', formData, {
            headers: { 'Content-Type': undefined }
        });
        return response.data;
    },
    getUnreadCount: async () => {
        const response = await api.get('/messages/unread-count');
        return response.data;
    }
};


export default api;

