import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import CardList from './CardList';
import TradeOfferModal from './TradeOfferModal';

function PublicCollection({ getImageUrl }) {
    const { userId } = useParams();
    const [userCards, setUserCards] = useState([]);
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);

    useEffect(() => {
        const fetchUserCards = async () => {
            const userDoc = await getDoc(doc(firestore, 'users', userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUserCards(Object.entries(userData.cardQuantities || {}).map(([id, quantity]) => ({
                    id,
                    quantity
                })));
            }
        };
        fetchUserCards();
    }, [userId]);

    const handleTradeRequest = (card) => {
        setSelectedCard(card);
        setShowTradeModal(true);
    };

    return (
        <div className="public-collection">
            <h2>User's Collection</h2>
            <CardList 
                cards={userCards}
                getImageUrl={getImageUrl}
                onSecondaryButtonClick={handleTradeRequest}
                secondaryButtonLabel="Request Trade"
            />
            {showTradeModal && (
                <TradeOfferModal 
                    card={selectedCard}
                    onClose={() => setShowTradeModal(false)}
                    targetUserId={userId}
                />
            )}
        </div>
    );
}

export default PublicCollection;
