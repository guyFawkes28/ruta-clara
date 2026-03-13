const USER_KEY = 'user-data';
const REPORTS_KEY = 'chat-reports';
const CHAT_HISTORY_KEY = 'chat-history';

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
    },

    saveReport: (reportText) => {
        if (!reportText) return;

        const reports = persistence.getReports();
        const newReport = {
            id: Date.now(),
            text: reportText,
            createdAt: new Date().toISOString()
        };

        reports.unshift(newReport);
        localStorage.setItem(REPORTS_KEY, JSON.stringify(reports.slice(0, 30)));
    },

    getReports: () => {
        const raw = localStorage.getItem(REPORTS_KEY);
        if (!raw) return [];

        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    },

    clearReports: () => {
        localStorage.removeItem(REPORTS_KEY);
    },

    saveChatMessage: (direction, text) => {
        if (!direction || !text) return;

        const history = persistence.getChatHistory();
        history.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            direction,
            text,
            createdAt: new Date().toISOString()
        });

        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history.slice(-120)));
    },

    getChatHistory: () => {
        const raw = localStorage.getItem(CHAT_HISTORY_KEY);
        if (!raw) return [];

        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    },

    clearChatHistory: () => {
        localStorage.removeItem(CHAT_HISTORY_KEY);
    }
};