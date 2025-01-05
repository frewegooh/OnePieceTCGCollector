import React, { useState, useEffect } from 'react';
import FilterSidebar from './FilterSidebar';
import CardList from './CardList';
import CardDetail from './CardDetail';
import Modal from './Modal';
import { addDoc, collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import Papa from 'papaparse';
import { useAuth } from '../contexts/AuthContext';
import LoginPrompt from './LoginPrompt';
import { MessageModal } from './ShareModal';
import DeckAnalytics from './DeckAnalytics';
import ImportDeckModal from './ImportDeckModal';

const DeckBuilder = ({ cards, user, initialDeck, onSave, isEditing, getImageUrl, userQuantities }) => {
    const { currentUser } = useAuth();
    // Move ALL useState declarations here, before any conditional checks
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [filteredCards, setFilteredCards] = useState([]);
    const [showLeaderPicker, setShowLeaderPicker] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [displayedCards, setDisplayedCards] = useState(55);
    const [availableColors, setAvailableColors] = useState([]);
    const [multicolorOnly, setMulticolorOnly] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedCostValues, setSelectedCostValues] = useState([]);
    const [availableCostValues, setAvailableCostValues] = useState([]);
    const [selectedPowerValues, setSelectedPowerValues] = useState([]);
    const [selectedCounterValues, setSelectedCounterValues] = useState([]);
    const [availableCounterValues, setAvailableCounterValues] = useState([]);
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [selectedGroupID, setSelectedGroupID] = useState(null);
    const [groupMap, setGroupMap] = useState({});
    const [availablePowerValues, setAvailablePowerValues] = useState([]);
    const [availableAttributes, setAvailableAttributes] = useState([]);
    const [leader, setLeader] = useState(null);
    const [deck, setDeck] = useState(initialDeck?.cards || []);
    const [selectedColors, setSelectedColors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showOwnedOnly, setShowOwnedOnly] = useState(false);
    const [deckName, setDeckName] = useState('');
    const [showDeckBuilder, setShowDeckBuilder] = useState(false);
    //const leaderCards = cards?.filter((card) => card.extCardType === 'Leader') || [];
    const [showImportModal, setShowImportModal] = useState(false);

    const handleImportDeck = (matchedCards) => {
        if (matchedCards.length > 0) {
            // Find and set the leader
            const leaderCard = matchedCards.find(card => card.extCardType === 'Leader');
            if (leaderCard) {
                setLeader(leaderCard);
                // Remove leader from deck array
                const deckCards = matchedCards.filter(card => card.extCardType !== 'Leader');
                setDeck(deckCards);
            } else {
                setDeck(matchedCards);
            }
    
            setMessageModal({
                isOpen: true,
                title: 'Success',
                message: `Imported ${matchedCards.length} cards successfully!`
            });
        } else {
            setMessageModal({
                isOpen: true,
                title: 'Error',
                message: 'No valid cards found in import text'
            });
        }
    };



    const [messageModal, setMessageModal] = useState({ 
        isOpen: false, 
        title: '', 
        message: '' 
    });



    // Infinite Scroll
    useEffect(() => {
        const cardListContainer = document.querySelector('.rightCardPanel.cardListCSS');
        if (cardListContainer && showDeckBuilder) {
            let timeoutId;
            const handleScroll = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                timeoutId = setTimeout(() => {
                    const { scrollTop, scrollHeight, clientHeight } = cardListContainer;
                    if (scrollTop + clientHeight >= scrollHeight - 50) {
                        setDisplayedCards(prevDisplayedCards => prevDisplayedCards + 25);
                    }
                }, 150);
            };
            cardListContainer.addEventListener('scroll', handleScroll);
            return () => {
                cardListContainer.removeEventListener('scroll', handleScroll);
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            };
        }
    }, [showDeckBuilder]);

    // Update the useEffect that handles leader changes
    useEffect(() => {
        if (leader && Array.isArray(cards)) {
            const leaderColors = Array.isArray(leader.extColor) ? 
                leader.extColor : 
                (typeof leader.extColor === 'string' ? leader.extColor.split(';') : []);
                const filtered = cards.filter((card) => {
                    if (!card) return false;
                    const validType = ['Character', 'Stage', 'Event'].includes(card.extCardType);
                    const cardColors = Array.isArray(card.extColor) ? 
                        card.extColor : 
                        (typeof card.extColor === 'string' ? card.extColor.split(';') : []);
                    const matchesColor = cardColors.some(color => leaderColors.includes(color));
                    return validType && matchesColor;
                });
            setFilteredCards(filtered);
        } else if (Array.isArray(cards)) {
            setFilteredCards(cards);
        }
    }, [leader, cards]);

    useEffect(() => {
        if (showLeaderPicker) {
            setSelectedTypes(['Leader']);
        }
    }, [showLeaderPicker]);

    // Modify handleSaveDeck to check auth
    const handleSaveDeck = async () => {
        console.log('Current user:', currentUser);
        console.log('Deck data:', {
            name: deckName,
            leaderId: leader.productId,
            cardIds: deck.map(card => ({
                productId: card.productId,
                quantity: card.quantity
            }))
        });
        if (!currentUser) {
            setShowLoginPrompt(true);
            return;
        }
    
        if (!deckName.trim()) {
            setMessageModal({
                isOpen: true,
                title: 'Missing Information',
                message: 'Please enter a deck name'
            });
            return;
        }
    
        const deckData = {
            userId: currentUser.uid,
            name: deckName.trim(),
            leaderId: leader.productId,
            cardIds: deck.map(card => ({
                productId: card.productId,
                quantity: card.quantity
            })),
            timestamp: new Date().toISOString()
        };
    
        try {
            // Query for existing deck with same name
            const decksQuery = query(
                collection(firestore, 'decks'),
                where('userId', '==', currentUser.uid),
                where('name', '==', deckName.trim())
            );
            const querySnapshot = await getDocs(decksQuery);
    
            let deckRef;
            if (!querySnapshot.empty) {
                // Update existing deck
                deckRef = doc(firestore, 'decks', querySnapshot.docs[0].id);
                await setDoc(deckRef, deckData);
            } else {
                // Create new deck
                deckRef = await addDoc(collection(firestore, 'decks'), deckData);
            }
    
            const shareableUrl = `${window.location.origin}/deck/${deckRef.id}`;
            setMessageModal({
                isOpen: true,
                title: 'Success',
                message: `Deck "${deckName}" saved!`,
                showInput: true,
                inputValue: shareableUrl,
                showCopyButton: true
            });
            setDeckName('');
        } catch (error) {
            setMessageModal({
                isOpen: true,
                title: 'Error',
                message: `Error saving deck: ${error.message}`
            });
            console.error('Detailed error:', error);
        }
    };

        // Add this effect near your other useEffect hooks
        useEffect(() => {
            // When in editing mode and initial deck data is provided
            if (initialDeck && isEditing) {
                // Load the existing deck name
                setDeckName(initialDeck.name);
                // Set the deck's leader card
                setLeader(initialDeck.leader);
                // Load all the deck's cards
                setDeck(initialDeck.cards);
            }
        }, [initialDeck, isEditing]);

    // Update handlePickLeader to enforce single leader rule
    const handlePickLeader = (card) => {
        setLeader(card);
        setShowLeaderPicker(false);
        setShowDeckBuilder(false);
    };


    useEffect(() => {
        if (cards && cards.length > 0) {
            // Extract unique color values
            const uniqueColors = [...new Set(cards.flatMap((card) => {
                if (Array.isArray(card.extColor)) {
                    return card.extColor;
                }
                return typeof card.extColor === 'string' ? card.extColor.split(';') : [];
            }))];
            setAvailableColors(uniqueColors);
            // Extract unique cost values
            const uniqueCosts = [...new Set(cards.map(card => parseInt(card.extCost, 10)).filter(cost => !isNaN(cost)))];
            setAvailableCostValues(uniqueCosts.sort((a, b) => a - b));

            // Extract unique power values
            const uniquePowers = [...new Set(cards.map(card => card.extPower).filter(power => power !== undefined && power !== null))];
            setAvailablePowerValues(uniquePowers.sort((a, b) => a - b));

            // Extract unique attribute values
            const uniqueAttributes = [...new Set(cards.map(card => card.extAttribute).filter(attr => attr))];
            setAvailableAttributes(uniqueAttributes.sort());

            // Extract unique counter values
            const uniqueCounters = [...new Set(cards.map(card => card.extCounterplus).filter(counter => counter !== undefined))];
            setAvailableCounterValues(uniqueCounters.sort((a, b) => a - b));
        }
    }, [cards]);

    useEffect(() => {
        const fetchGroupData = async () => {
            const response = await fetch('/OnePieceCardGameGroups.csv');
            const csvText = await response.text();
            const parsedData = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
    
            const groups = parsedData.reduce((map, group) => {
                if (group.groupId && group.name) {
                    map[group.groupId] = group.name;
                }
                return map;
            }, {});
            
            setGroupMap(groups);
        };
        fetchGroupData();
    }, []);


    useEffect(() => {

        if (!Array.isArray(cards)) {
            setFilteredCards([]);
            return;
        }
        const filtered = cards.filter((card) => {
            if (!card) return false;

            const cardColors = Array.isArray(card.extColor) ? 
                card.extColor : 
                (typeof card.extColor === 'string' ? card.extColor.split(';') : []);

            const matchesColor = (() => {
                if (multicolorOnly) {
                    const isMulticolor = cardColors.length > 1;
                    if (!isMulticolor) return false;
                    if (selectedColors.length > 0) {
                        return selectedColors.some((color) => cardColors.includes(color));
                    }
                    return true;
                }
                return (
                    selectedColors.length === 0 ||
                    selectedColors.some((color) => cardColors.includes(color))
                );
            })();

            const matchesSearchQuery = searchQuery.trim().toLowerCase()
                ? Object.values(card).some((value) =>
                      value &&
                      value.toString().toLowerCase().includes(searchQuery.trim().toLowerCase())
                  )
                : true;

            const matchesType =
                selectedTypes.length === 0 || selectedTypes.includes(card.extCardType);

            const matchesCounter =
                selectedCounterValues.length === 0 || selectedCounterValues.includes(card.extCounterplus);

            const matchesCost =
                selectedCostValues.length === 0 ||
                (card.extCost &&
                    !isNaN(Number(card.extCost)) &&
                    selectedCostValues.includes(String(card.extCost)));

            const matchesPower =
                selectedPowerValues.length === 0 || selectedPowerValues.includes(card.extPower);

            const matchesGroup =
                !selectedGroupID || String(card.groupId) === String(selectedGroupID);

            const matchesAttribute =
                selectedAttributes.length === 0 ||
                selectedAttributes.includes(card.extAttribute);

            const matchesOwned = !showOwnedOnly || (userQuantities && userQuantities[card.productId] > 0);         

            return (
                matchesColor &&
                matchesSearchQuery &&
                matchesType &&
                matchesCost &&
                matchesPower &&
                matchesGroup &&
                matchesAttribute &&
                matchesCounter &&
                matchesOwned
            );
        });

        setFilteredCards(filtered);
    }, [
        selectedColors,
        selectedCostValues,
        selectedPowerValues,
        selectedGroupID,
        cards,
        multicolorOnly,
        searchQuery,
        selectedTypes,
        selectedAttributes,
        selectedCounterValues,
        showOwnedOnly,
        showLeaderPicker,
        userQuantities
    ]);


    if (!cards) {
        return <div>Loading cards...</div>;
    }


    const handleAddToDeck = (card) => {
        // Check if trying to add a Leader when one already exists
        if (card.extCardType === 'Leader') {
            setMessageModal({
                isOpen: true,
                title: 'Invalid Action',
                message: 'Leaders can only be added through the Pick Leader button'
            });
            return;
        }
    
        // Rest of your existing handleAddToDeck logic
        const sameNumberCards = deck.filter((c) => c.extNumber === card.extNumber);
        const totalCount = sameNumberCards.reduce((sum, c) => sum + c.quantity, 0);
    
        if (totalCount >= 4) {
            setMessageModal({
                isOpen: true,
                title: 'Error',
                message: `Maximum 4 cards with same number allowed`
            });

            //alert('Maximum 4 cards with same number allowed');
            return;
        }
    
        setDeck((prev) => {
            const existing = prev.find((c) => c.productId === card.productId);
            if (existing) {
                return prev.map((c) =>
                    c.productId === card.productId
                        ? { ...c, quantity: c.quantity + 1 }
                        : c
                );
            }
            return [...prev, { ...card, quantity: 1 }];
        });
    };

    const handleRemoveFromDeck = (card) => {
        setDeck(
            deck
                .map((deckCard) => {
                    if (deckCard.productId === card.productId) {
                        return { ...deckCard, quantity: deckCard.quantity - 1 };
                    }
                    return deckCard;
                })
                .filter((deckCard) => deckCard.quantity > 0)
        );
    };

    // Add card detail viewing functionality
    const handleViewDetails = (card, source) => {
        let cardIndex;
        const displayedCardArray = showLeaderPicker 
            ? filteredCards.filter(card => card.extCardType === 'Leader').slice(0, displayedCards)
            : filteredCards.slice(0, displayedCards);
        
        if (source === 'deck') {
            cardIndex = deck.findIndex(c => c.productId === card.productId);
        } else {
            cardIndex = displayedCardArray.findIndex(c => c.productId === card.productId);
        }
        
        setSelectedCard({ 
            ...card, 
            index: cardIndex, 
            source: source,
            displayedArray: displayedCardArray 
        });
        setIsModalOpen(true);
    };

    const handlePreviousCard = () => {
        if (!selectedCard) return;
        
        const cardArray = selectedCard.source === 'deck' ? deck : selectedCard.displayedArray;
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
        
        const cardArray = selectedCard.source === 'deck' ? deck : selectedCard.displayedArray;
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


    if (!Array.isArray(cards)) {
        return <div>Loading cards...</div>;
    }


    // Return JSX
    return (
        <div className="deck-builder">
            <div className="cardBuilderPar">
                <div className="deckSection">
                    <div className='deckBuilderHead'>
                        <h2>Your Deck ({deck ? deck.reduce((sum, card) => sum + card.quantity, 0) : 0}/50)</h2>
                        <button onClick={() => setShowImportModal(true)}>Import Deck</button>
                        <input
                            type="text"
                            value={deckName}
                            onChange={(e) => setDeckName(e.target.value)}
                            placeholder="Enter deck name"
                            className="deck-name-input"
                        />
                        
                        <button 
                            onClick={handleSaveDeck} 
                            disabled={!leader || !deck?.length || !deckName.trim()}
                        >
                            {currentUser ? 'Save Deck' : 'Login to Save Deck'}
                        </button>
                        <LoginPrompt 
                            open={showLoginPrompt} 
                            onClose={() => setShowLoginPrompt(false)} 
                        />
                    </div>
                    <div className="deck-cards-container">
                        {!leader ? (
                            <button onClick={() => {
                                setShowLeaderPicker(true);
                                setShowDeckBuilder(true);
                            }}>Pick Leader</button>
                        ) : (
                            <>
                        <div className="leaderSection">
                            <h3>Leader</h3>
                            <CardList 
                                cards={[leader]} 
                                showQuantity={false}
                                onSecondaryButtonClick={() => {
                                    setLeader(null);
                                    setShowLeaderPicker(false);
                                }}
                                onPrimaryButtonClick={(card) => handleViewDetails(card, 'leader')}
                                primaryButtonLabel="Details"
                                secondaryButtonLabel="-"
                                enableCardClick={true}
                            />
                        </div>
                        <div className="deckCards">
                            {deck.length > 0 && deck.sort((a, b) => {
                                if (a.extCardType === 'Leader') return -1;
                                if (b.extCardType === 'Leader') return 1;
                                return 0;
                            }).map(card => (
                                <div key={card.productId} className="card-container">
                                    <div className="card-quantity">{card.quantity}</div>
                                    <img src={getImageUrl(card.imageUrl)} alt={card.name} />
                                    <div className="card-controls">
                                        <button onClick={() => handleRemoveFromDeck(card)}>-</button>
                                        <button onClick={() => handleAddToDeck(card)}>+</button>
                                        <button onClick={() => handleViewDetails(card, 'deck')}>Details</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    {!showDeckBuilder && (
                        <button onClick={() => {
                            setShowDeckBuilder(true);
                            setSelectedTypes([]);  // This clears the Leader type filter
                        }}>Add Cards</button>
                    )}
                    </>
                )}
            </div>

            <DeckAnalytics 
                deck={deck} 
                leader={leader} 
                userCollection={userQuantities}
                getImageUrl={getImageUrl}
                handleViewDetails={handleViewDetails}
                cards={cards}
            />
        </div>
        
        {showDeckBuilder && (
            <div className='deckBuilderContainer' style={{
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                background: 'white', 
                display: 'flex',
                flexDirection: 'column'
            }}>
                    <div className='builderCardPickerHolder' style={{
                        display: 'flex',
                        flex: 1,
                        minHeight: 0  // This is crucial for proper scrolling
                    }}>
                        <div className="sideFilterPar">
                            <FilterSidebar
                                cards={cards}
                                onFilteredCardsChange={setFilteredCards}
                                selectedColors={selectedColors}
                                onColorChange={setSelectedColors}
                                availableColors={availableColors}
                                multicolorOnly={multicolorOnly}
                                onMulticolorChange={() => setMulticolorOnly(!multicolorOnly)}
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                selectedTypes={selectedTypes}
                                onTypeChange={setSelectedTypes}
                            //availableTypes={['Character', 'Event', 'Stage', 'Leader']}
                                selectedCostValues={selectedCostValues}
                                onCostChange={setSelectedCostValues}
                                availableCostValues={availableCostValues}
                                selectedPowerValues={selectedPowerValues}
                                onPowerChange={setSelectedPowerValues}
                                availablePowerValues={availablePowerValues}
                                selectedCounterValues={selectedCounterValues}
                                onCounterChange={setSelectedCounterValues}
                                availableCounterValues={availableCounterValues}
                                selectedAttributes={selectedAttributes}
                                onAttributeChange={setSelectedAttributes}
                                availableAttributes={availableAttributes}
                                availableTypes={['Character', 'Event', 'Stage', 'Leader']}
                                selectedGroupID={selectedGroupID}
                                onGroupChange={setSelectedGroupID}
                                groupMap={groupMap}
                                showOwnedOnly={showOwnedOnly}
                                onOwnedOnlyChange={() => setShowOwnedOnly(!showOwnedOnly)}
                                isLeaderPicker={showLeaderPicker} // Add this new prop
                                // Remove other filter props when picking leader
                                {...(!showLeaderPicker && {
                                    selectedCostValues,
                                    onCostChange: setSelectedCostValues,
                                    availableCostValues,
                                    selectedPowerValues,
                                    onPowerChange: setSelectedPowerValues,
                                    availablePowerValues,
                                    selectedCounterValues,
                                    onCounterChange: setSelectedCounterValues,
                                    availableCounterValues,
                                    selectedAttributes,
                                    onAttributeChange: setSelectedAttributes,
                                    availableAttributes
                                })}
                            />
                        </div>
                <div className="rightCardPanel cardListCSS">
                    <CardList
                        cards={showLeaderPicker 
                            ? filteredCards.filter(card => card.extCardType === 'Leader').slice(0, displayedCards)
                            : filteredCards.slice(0, displayedCards)}
                        onSecondaryButtonClick={showLeaderPicker ? handlePickLeader : handleAddToDeck}
                        onPrimaryButtonClick={(card) => handleViewDetails(card, 'picker')}
                        onCardClick={handleViewDetails}
                        primaryButtonLabel="Details"
                        secondaryButtonLabel="+"
                        showQuantity={true}
                        deckQuantities={deck.reduce((acc, card) => {
                            acc[card.productId] = card.quantity;
                            return acc;
                        }, {})}
                        disableQuantityEdit={true}
                        enableCardClick={true}
                    />
                </div>
                <div className='viewBttnHldr'>
                    <button 
                        onClick={() => setShowDeckBuilder(false)}
                        className='deckBuilderViewDeckbttn'
                    >
                        View Deck / Close
                    </button>
                </div>
            </div>
            </div>
        )}
    </div>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            {selectedCard && (
                <CardDetail 
                    card={selectedCard} 
                    onPrevious={selectedCard.source !== 'leader' ? handlePreviousCard : undefined}
                    onNext={selectedCard.source !== 'leader' ? handleNextCard : undefined}
                />
            )}
        </Modal>

        <ImportDeckModal 
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={handleImportDeck}
        />


        <MessageModal 
            {...messageModal}
            onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
        />
        </div>
    );
};

export default DeckBuilder;
