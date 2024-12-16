import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
//import CardList from './CardList';
import { Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShareModal from './ShareModal';
import API_URL from '../config';
import { auth } from '../firebase';

const DeckView = ({ getImageUrl }) => {
    const { deckId } = useParams();
    const navigate = useNavigate();
    const [deck, setDeck] = useState(null);
    const [cardData, setCardData] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isOwner, setIsOwner] = useState(false);

    // Fetch card data from server
    useEffect(() => {
        fetch(`${API_URL}/api/cards`)
            .then(response => response.json())
            .then(data => setCardData(data));
    }, []);

    useEffect(() => {
        const fetchDeck = async () => {
            const deckDoc = await getDoc(doc(firestore, 'decks', deckId));
            if (deckDoc.exists() && cardData.length > 0) {
                const deckData = deckDoc.data();
                // Check if current user is the deck owner
                setIsOwner(auth.currentUser?.uid === deckData.userId);
                // Find leader card
                const leaderCard = cardData.find(card => card.productId === deckData.leaderId);
                
                // Map card IDs to full card data
                const cardsWithData = deckData.cardIds.map(cardId => {
                    const card = cardData.find(c => c.productId === cardId.productId);
                    return {
                        ...card,
                        quantity: cardId.quantity
                    };
                });

                setDeck({
                    id: deckDoc.id,
                    ...deckData,
                    leader: leaderCard,
                    cards: cardsWithData
                });
            }
        };
        fetchDeck();
    }, [deckId, cardData]);

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleEdit = () => {
        navigate(`/deck/edit/${deckId}`);
        handleMenuClose();
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this deck?')) {
            await deleteDoc(doc(firestore, 'decks', deckId));
            navigate('/decks');
        }
        handleMenuClose();
    };

    const handleShare = () => {
        setShowShareModal(true);
        handleMenuClose();
    };

    if (!deck) return <div>Loading deck...</div>;

    return (
        <div className="deck-view">
            <div className="deck-header">
                <h1>{deck.name}</h1>
                {isOwner && (
                    <>
                        <MoreVertIcon onClick={handleMenuClick} className="menu-icon" />
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                        >
                            <MenuItem onClick={handleEdit}>Edit Deck</MenuItem>
                            <MenuItem onClick={handleDelete}>Delete Deck</MenuItem>
                            <MenuItem onClick={handleShare}>Share Deck</MenuItem>
                        </Menu>
                    </>
                )}
            </div>

            <div className="deck-leader">
                <h2>Leader</h2>
                <div className="card-container">
                    <img 
                        src={getImageUrl(deck.leader.imageUrl)} 
                        alt={deck.leader.name}
                        className="card-image"
                    />
                </div>
            </div>

            <div className="deck-cards">
                <h2>Cards</h2>
                <div className="cards-grid">
                    {deck.cards.map((card, index) => (
                        <div key={index} className="card-container">
                            <div className="card-quantity">{card.quantity}</div>
                            <img 
                                src={getImageUrl(card.imageUrl)} 
                                alt={card.name}
                                className="card-image"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {showShareModal && (
                <ShareModal 
                    url={`${window.location.origin}/deck/${deckId}`}
                    onClose={() => setShowShareModal(false)}
                />
            )}

            <style jsx>{`
                .card-container {
                    position: relative;
                    display: inline-block;
                    margin: 10px;
                }
                .card-quantity {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background-color: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 50%;
                    font-weight: bold;
                    z-index: 1;
                }
                .card-image {
                    max-width: 200px;
                    height: auto;
                }
                .cards-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 20px;
                }
            `}</style>
        </div>
    );
};

export default DeckView;
