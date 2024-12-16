import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

// Add cards to the props
const DeckLibrary = ({ user, getImageUrl }) => {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cardData, setCardData] = useState([]);
    const navigate = useNavigate();

    // Update the fetch call
    useEffect(() => {
        fetch(`${API_URL}/api/cards`)
            .then(response => response.json())
            .then(data => {
                //console.log('Card data loaded:', data.length, 'cards');
                setCardData(data);
            })
            .catch(error => {
                //console.log('Error fetching card data:', error);
            });
    }, []);


    useEffect(() => {
        const fetchUserDecks = async () => {
            if (!user || !cardData.length) return;
            //console.log('Fetching decks for user:', user.uid);
            
            const decksQuery = query(
                collection(firestore, 'decks'),
                where('userId', '==', user.uid)
            );
            const querySnapshot = await getDocs(decksQuery);
            //console.log('Found decks:', querySnapshot.size);
            
            const userDecks = querySnapshot.docs.map(doc => {
                const deckData = doc.data();
                //console.log('Processing deck:', deckData.name);
                const leaderCard = cardData.find(card => card.productId === deckData.leaderId);
                //console.log('Leader card found:', leaderCard?.name);
                
                return {
                    id: doc.id,
                    ...deckData,
                    leaderImageUrl: leaderCard?.imageUrl
                };
            });
            setDecks(userDecks);
            setLoading(false);
        };
        fetchUserDecks();
    }, [user, cardData]);

    if (!user) {
        return (
            <div className="deck-library">
                <div className="login-prompt">
                    <h2>Login Required</h2>
                    <p>Create an account or login to access this feature!</p>
                    <button 
                        className="login-button"
                        onClick={() => navigate('/login')}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

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
                            {deck.leaderImageUrl && (
                                <img 
                                    src={getImageUrl(deck.leaderImageUrl)}
                                    alt="Deck Leader"
                                    className="deck-preview-image"
                                  />
                            )}
                            <h2>{deck.name}</h2>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeckLibrary;
