import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useAuthCheck = () => {
    const { currentUser } = useAuth();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const checkAuth = (callback) => {
        if (currentUser) {
            callback();
        } else {
            setShowLoginPrompt(true);
        }
    };

    return {
        showLoginPrompt,
        setShowLoginPrompt,
        checkAuth
    };
};
