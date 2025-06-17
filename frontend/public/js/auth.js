const Auth = {
    /**
     * Set authentication token
     */
    setToken(token, type = 'attendee') {
        try {
            localStorage.setItem(`${type}Token`, token);
        } catch (error) {
            console.error('Failed to store token:', error);
        }
    },

    /**
     * Get authentication token
     */
    getToken(type = 'attendee') {
        try {
            return localStorage.getItem(`${type}Token`);
        } catch (error) {
            console.error('Failed to retrieve token:', error);
            return null;
        }
    },

    /**
     * Clear specific token
     */
    clearToken(type = 'attendee') {
        try {
            localStorage.removeItem(`${type}Token`);
        } catch (error) {
            console.error('Failed to clear token:', error);
        }
    },

    /**
     * Clear all authentication tokens
     */
    clearAllTokens() {
        this.clearToken('attendee');
        this.clearToken('admin');
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated(type = 'attendee') {
        const token = this.getToken(type);
        return token !== null && token !== '';
    },

    /**
     * Attendee login
     */
    async attendeeLogin(ref, password) {
        const response = await API.post('/login', { ref, password });
        this.setToken(response.token, 'attendee');
        return response;
    },

    /**
     * Admin login
     */
    async adminLogin(user, pass) {
        const response = await API.post('/admin/login', { user, pass });
        this.setToken(response.token, 'admin');
        return response;
    },

    /**
     * Logout current user
     */
    logout() {
        this.clearAllTokens();
        // Redirect to login
        if (window.App) {
            window.App.showLoginView();
        }
    }
};
