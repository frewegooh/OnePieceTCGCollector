import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import DeckBuilder from './DeckBuilder';


const DeckEditor = ({ cards, user }) => {
    // Get the deck ID from URL parameters
    const { deckId } = useParams();
    const [initialDeck, setInitialDeck] = useState(null);


    // Fetch the existing deck data when component mounts
    useEffect(() => {
        const fetchDeck = async () => {
            const deckDoc = await getDoc(doc(firestore, 'decks', deckId));
            if (deckDoc.exists()) {
                setInitialDeck({ id: deckDoc.id, ...deckDoc.data() });
            }
        };
        fetchDeck();
    }, [deckId]);

    // Handle saving updates to the existing deck
    const handleUpdateDeck = async (deckData) => {
        try {
            await updateDoc(doc(firestore, 'decks', deckId), {
                ...deckData,
                timestamp: new Date().toISOString()
            });
            alert('Deck updated successfully!');
        } catch (error) {
            alert('Error updating deck');
            console.error(error);
        }
    };

    if (!initialDeck) return <div>Loading deck...</div>;

    // Pass the deck data and editing mode to DeckBuilder
    return (
        <DeckBuilder 
            cards={cards}
            user={user}
            initialDeck={initialDeck}
            onSave={handleUpdateDeck}
            isEditing={true}
        />
    );
};

export default DeckEditor;
