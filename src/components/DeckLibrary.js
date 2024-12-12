import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useNavigate } from 'react-router-dom';

const DeckLibrary = ({ user }) => {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserDecks = async () => {
            if (!user) return;
            const decksQuery = query(
                collection(firestore, 'decks'),
                where('userId', '==', user.uid)
            );
            const querySnapshot = await getDocs(decksQuery);
            const userDecks = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDecks(userDecks);
            setLoading(false);
        };
        fetchUserDecks();
    }, [user]);

    return (
        <div className="deck-library">
            <h1>My Decks</h1>
            {loading ? (
                <div>Loading your decks...</div>
            ) : (
                <div className="decks-grid">
                    {decks.map(deck => (
                        <div 
                            key={deck.id} 
                            className="deck-preview"
                            onClick={() => navigate(`/deck/${deck.id}`)}
                        >
                            <img 
                                src={deck.leader.imageUrl} 
                                alt={deck.leader.name}
                                className="deck-preview-image"
                            />
                            <h2>{deck.name}</h2>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeckLibrary;