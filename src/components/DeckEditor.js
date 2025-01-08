import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import DeckBuilder from './DeckBuilder';

const DeckEditor = ({ cards, user, getImageUrl, userQuantities }) => {
    const { deckId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [deck, setDeck] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeck = async () => {
            if (!cards || !Array.isArray(cards)) {
                return;
            }

            try {
                const deckDoc = await getDoc(doc(firestore, 'decks', deckId));
                
                if (deckDoc.exists()) {
                    const deckData = deckDoc.data();
                    const leaderCard = cards.find(card => card.productId === deckData.leaderId);
                    
                    const cardsWithData = deckData.cardIds.map(cardId => {
                        const card = cards.find(c => c.productId === cardId.productId);
                        return {
                            ...card,
                            quantity: cardId.quantity
                        };
                    });

                    setDeck({
                        id: deckDoc.id,
                        name: deckData.name,
                        leader: leaderCard,
                        cards: cardsWithData,
                        timestamp: deckData.timestamp,
                        userId: deckData.userId
                    });
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching deck:', error);
                setLoading(false);
            }
        };

        fetchDeck();
    }, [deckId, cards]);

    const handleUpdateDeck = async (deckData) => {
        try {
            await updateDoc(doc(firestore, 'decks', deckId), {
                name: deckData.name,
                leaderId: deckData.leader.productId,
                cardIds: deckData.cards.map(card => ({
                    productId: card.productId,
                    quantity: card.quantity
                })),
                timestamp: new Date().toISOString()
            });
            navigate(`/deck/${deckId}`);
        } catch (error) {
            console.error('Error updating deck:', error);
        }
    };

    if (loading || !cards || !Array.isArray(cards)) {
        return <div>Loading...</div>;
    }

    if (!deck) {
        return <div>Deck not found</div>;
    }

    return (
        <DeckBuilder 
            cards={cards}
            user={user}
            initialDeck={deck}
            onSave={handleUpdateDeck}
            isEditing={true}
            getImageUrl={getImageUrl}
            userQuantities={location.state?.userQuantities || userQuantities}
        />
    );
};

export default DeckEditor;
