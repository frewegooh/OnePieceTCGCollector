import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
//import CardList from './CardList';
import { Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShareModal from './ShareModal';
import API_URL from '../config';
import { auth } from '../firebase';
import Modal from './Modal';
import CardDetail from './CardDetail';
import DeckAnalytics from './DeckAnalytics';
//import { getImageUrl } from '../config';

const DeckView = ({ getImageUrl, userQuantities }) => {
    const { deckId } = useParams();
    const navigate = useNavigate();
    const [deck, setDeck] = useState(null);
    const [cardData, setCardData] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [showExportMessage, setShowExportMessage] = useState(false);

    const handleViewDetails = (card, source) => {
        let cardIndex;
        if (source === 'leader') {
            cardIndex = 0;
        } else {
            cardIndex = deck.cards.findIndex(c => c.productId === card.productId);
        }
        
        setSelectedCard({ 
            ...card, 
            index: cardIndex, 
            source: source,
            displayedArray: deck.cards 
        });
        setIsModalOpen(true);
    };

    //Deck Navigation
    const handlePreviousCard = () => {
        if (!selectedCard) return;
        
        const cardArray = selectedCard.displayedArray;
        if (selectedCard.index > 0) {
            const previousCard = cardArray[selectedCard.index - 1];
            setSelectedCard({ 
                ...previousCard, 
                index: selectedCard.index - 1,
                source: selectedCard.source,
                displayedArray: selectedCard.displayedArray
            });
        }
    };
    
    const handleNextCard = () => {
        if (!selectedCard) return;
        
        const cardArray = selectedCard.displayedArray;
        if (selectedCard.index < cardArray.length - 1) {
            const nextCard = cardArray[selectedCard.index + 1];
            setSelectedCard({ 
                ...nextCard, 
                index: selectedCard.index + 1,
                source: selectedCard.source,
                displayedArray: selectedCard.displayedArray
            });
        }
    };

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
        if (deck && cardData.length > 0) {
            navigate(`/deck/edit/${deckId}`, { 
                state: { 
                    deck: {
                        name: deck.name,
                        leader: deck.leader,
                        cards: deck.cards || [],
                        extCardType: deck.extCardType,
                        extSubtypes: deck.extSubtypes,
                        extDescription: deck.extDescription,
                        extCost: deck.extCost,
                        extPower: deck.extPower,
                        extCounterplus: deck.extCounterplus,
                        id: deck.id,
                    },
                    userQuantities 
                }
            });
        }
        handleMenuClose();
    };
    
    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this deck?')) {
            await deleteDoc(doc(firestore, 'decks', deckId));
            navigate('/my-decks'); 
        }
        handleMenuClose();
    };

    const handleShare = () => {
        setShowShareModal(true);
        handleMenuClose();
    };


    const handleExport = async () => {
        const leaderText = `1x${deck.leader.extNumber}`;
        const deckText = deck.cards.map(card => 
            `${card.quantity}x${card.extNumber}`
        ).join('\n');
        const exportText = `${leaderText}\n${deckText}`;
        
        try {
            await navigator.clipboard.writeText(exportText);
            setShowExportMessage(true);
            setTimeout(() => setShowExportMessage(false), 2000); // Message disappears after 2 seconds
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        
        handleMenuClose();
    };

    // Copy Deck
    const handleCopyDeck = async () => {
        if (!auth.currentUser) return;

        try {
            const newDeckData = {
                userId: auth.currentUser.uid,
                name: `${deck.name} (Copy)`,
                leaderId: deck.leader.productId,
                cardIds: deck.cards.map(card => ({
                    productId: card.productId,
                    quantity: card.quantity
                })),
                timestamp: new Date().toISOString()
            };

            const deckRef = await addDoc(collection(firestore, 'decks'), newDeckData);
            navigate(`/deck/${deckRef.id}`);
        } catch (error) {
            console.error('Error copying deck:', error);
        }
    };


    if (!deck) return <div>Loading deck...</div>;

    return (
        <div className="deck-view">
            <div className="deck-header">
                <h1>{deck.name}</h1>
                {auth.currentUser ? (
                <>
                    <MoreVertIcon onClick={handleMenuClick} className="menu-icon" />
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        {isOwner ? (
                            [
                                <MenuItem key="edit" onClick={handleEdit}>Edit Deck</MenuItem>,
                                <MenuItem key="delete" onClick={handleDelete}>Delete Deck</MenuItem>,
                                <MenuItem key="share" onClick={handleShare}>Share Deck</MenuItem>,
                                <MenuItem key="export" onClick={handleExport}>Export Deck</MenuItem>
                            ]
                        ) : (
                            [
                                <MenuItem key="copy" onClick={handleCopyDeck}>Copy Deck</MenuItem>,
                                <MenuItem key="share" onClick={handleShare}>Share Deck</MenuItem>,
                                <MenuItem key="export" onClick={handleExport}>Export Deck</MenuItem>
                            ]
                        )}
                    </Menu>
                </>
            ) : (
                <>
                    <MoreVertIcon onClick={handleMenuClick} className="menu-icon" />
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={handleShare}>Share Deck</MenuItem>
                        <MenuItem onClick={handleExport}>Export Deck</MenuItem>
                    </Menu>
                </>
            )}
            </div>
                <div className='deck-cards-container'>

                    <div className="leaderSection">
                            <h2>Leader</h2>
                            <img 
                                src={getImageUrl(deck.leader.imageUrl)}
                                alt={deck.leader.name}
                                className="card-image leader-card-image"
                            />

                            <button 
                                className="viewBttn" 
                                onClick={() => handleViewDetails(deck.leader)}
                            >
                                View Details
                            </button>
                    </div>

                    <div className="deckCards">
                        
                        {deck.cards.map((card, index) => (
                            <div key={index} className="card-container">
                                <div className="card-quantity">{card.quantity}</div>
                                <img 
                                    src={getImageUrl(card.imageUrl)}
                                    alt={card.name}
                                    className="card-image"
                                />
                                <button 
                                    className="viewBttn" 
                                    onClick={() => handleViewDetails(card)}
                                >
                                    View Details
                                </button>
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

            {showExportMessage && (
                <div className="export-message">
                    Deck Copied
                    <style>
                    {`
                        .export-message {
                            position: fixed;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background-color: rgba(0, 0, 0, 0.8);
                            color: white;
                            padding: 20px;
                            border-radius: 5px;
                            z-index: 1000;
                        }
                    `}
                </style>
                </div>
            )}

            <style>
                {`
                    .card-container {
                        position: relative;
                        display: inline-block;
                        margin: 10px;
                    }
                    .card-quantity {
                        background-color: rgba(0, 0, 0, 0.7);
                        color: white;
                        padding: 2px 6px;
                        border-radius: 500px 500px 0px 0px;
                        font-weight: bold;
                        z-index: 1;
                        width: fit-content;
                        margin-left:auto;
                        margin-right:0;
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
                `}
            </style>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {selectedCard && (
                    <CardDetail 
                        card={selectedCard}
                        onPrevious={selectedCard.source !== 'leader' ? handlePreviousCard : undefined}
                        onNext={selectedCard.source !== 'leader' ? handleNextCard : undefined}
                    />
                )}
            </Modal>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {selectedCard && (
                    <CardDetail 
                        card={selectedCard}
                        onPrevious={selectedCard.source !== 'leader' ? handlePreviousCard : undefined}
                        onNext={selectedCard.source !== 'leader' ? handleNextCard : undefined}
                    />
                )}
            </Modal>

            {/* Add the analytics here */}
            <div className="deck-analytics-section">
                <DeckAnalytics 
                    deck={deck.cards} 
                    leader={deck.leader} 
                    userCollection={userQuantities}
                    getImageUrl={getImageUrl}
                    handleViewDetails={handleViewDetails}
                    cards={cardData}
                />
            </div>
        </div>    


    );
};

export default DeckView;
