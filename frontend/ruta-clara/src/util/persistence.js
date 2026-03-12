const USER_KEY = 'user-data';

export const persistence = {
  
    saveSession: (userData) => {
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
    },

    getUser: () => {
        const user = localStorage.getItem(USER_KEY)
        return user ? JSON.parse(user) : null
    },

    clearSession: () => {
        localStorage.removeItem(USER_KEY)
    },

  
    isAuthentication: () => {
        return !!localStorage.getItem(USER_KEY)
    }
};