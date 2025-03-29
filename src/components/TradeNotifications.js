import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function TradeNotifications() {
    const [notifications, setNotifications] = useState([]);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) return;

        const tradesQuery = query(
            collection(firestore, 'trades'),
            where('receiverId', '==', currentUser.uid),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(tradesQuery, (snapshot) => {
            const newNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));
            setNotifications(newNotifications);
        });

        return () => unsubscribe();
    }, [currentUser]);

    return (
        <div className="trade-notifications">
            {notifications.length > 0 && (
                <div className="notification-badge">
                    <span>{notifications.length} New Trade{notifications.length > 1 ? 's' : ''}</span>
                    <button onClick={() => navigate('/trades')}>
                        View Trades
                    </button>
                </div>
            )}
        </div>
    );
}

export default TradeNotifications;
