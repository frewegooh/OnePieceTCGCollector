import React, { useState, useEffect } from 'react';
import FilterSidebar from './FilterSidebar';
import CardList from './CardList';
import CardDetail from './CardDetail';
import Modal from './Modal';
import { addDoc, collection } from 'firebase/firestore';
import { firestore } from '../firebase';
import Papa from 'papaparse';
import { useAuth } from '../contexts/AuthContext';
import LoginPrompt from './LoginPrompt';


const DeckBuilder = ({ cards, user, initialDeck, onSave, isEditing, getImageUrl }) => {
    const { currentUser } = useAuth();
    // Move ALL useState declarations here, before any conditional checks
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [filteredCards, setFilteredCards] = useState([]);
    const [showLeaderPicker, setShowLeaderPicker] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [displayedCards, setDisplayedCards] = useState(35);
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

    const leaderCards = cards?.filter((card) => card.extCardType === 'Leader') || [];

    // Infinite Scroll
    useEffect(() => {
        const cardListContainer = document.querySelector('.cardListCSS');
        if (cardListContainer) {
            const handleScroll = () => {
                const { scrollTop, scrollHeight, clientHeight } = cardListContainer;
                if (scrollTop + clientHeight >= scrollHeight - 50) {
                    setDisplayedCards(prevDisplayedCards => prevDisplayedCards + 25);
                }
            };
            cardListContainer.addEventListener('scroll', handleScroll);
            return () => cardListContainer.removeEventListener('scroll', handleScroll);
        }
    }, []);

    // Update the useEffect that handles leader changes
    useEffect(() => {
        if (leader && Array.isArray(cards)) {
            const leaderColors = leader.extColor ? leader.extColor.split(';') : [];
            const filtered = cards.filter((card) => {
                if (!card) return false;
                const validType = ['Character', 'Stage', 'Event'].includes(card.extCardType);
                const cardColors = card.extColor ? card.extColor.split(';') : [];
                const matchesColor = cardColors.some(color => leaderColors.includes(color));
                return validType && matchesColor;
            });
            setFilteredCards(filtered);
        } else if (Array.isArray(cards)) {
            setFilteredCards(cards);
        }
    }, [leader, cards]);

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
            alert('Please enter a deck name');
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
            const deckRef = await addDoc(collection(firestore, 'decks'), deckData);
            const shareableUrl = `${window.location.origin}/deck/${deckRef.id}`;
            alert(`Deck "${deckName}" saved! Share using: ${shareableUrl}`);
            setDeckName('');
        } catch (error) {
            alert(`Error saving deck: ${error.message}`);
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
    };


    useEffect(() => {
        if (cards && cards.length > 0) {
            // Extract unique color values
            const uniqueColors = [...new Set(cards.flatMap((card) => card.extColor?.split(';') || []))];
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

            const cardColors = card.extColor ? card.extColor.split(';') : [];
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
                !selectedGroupID || String(card.groupID) === String(selectedGroupID);

            const matchesAttribute =
                selectedAttributes.length === 0 ||
                selectedAttributes.includes(card.extAttribute);

            const matchesOwned = !showOwnedOnly || card.quantity > 0;        

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
    ]);


    if (!cards) {
        return <div>Loading cards...</div>;
    }


    const handleAddToDeck = (card) => {
        // Check if trying to add a Leader when one already exists
        if (card.extCardType === 'Leader') {
            if (deck.some(c => c.extCardType === 'Leader')) {
                alert('Only one Leader card is allowed in a deck');
                return;
            }
        }
    
        // Rest of your existing handleAddToDeck logic
        const sameNumberCards = deck.filter((c) => c.extNumber === card.extNumber);
        const totalCount = sameNumberCards.reduce((sum, c) => sum + c.quantity, 0);
    
        if (totalCount >= 4) {
            alert('Maximum 4 cards with same number allowed');
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
    const handleViewDetails = (card) => {
        const cardIndex = filteredCards.findIndex(c => c.productId === card.productId);
        setSelectedCard({ ...card, index: cardIndex });
        setIsModalOpen(true);
    };


    if (!Array.isArray(cards)) {
        return <div>Loading cards...</div>;
    }


    // Return JSX
    return (
        <div className="deck-builder">
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
                    availableTypes={['Character', 'Event', 'Stage', 'Leader']}
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
                    selectedGroupID={selectedGroupID}
                    onGroupChange={setSelectedGroupID}
                    groupMap={groupMap}
                    showOwnedOnly={showOwnedOnly}
                    onOwnedOnlyChange={() => setShowOwnedOnly(!showOwnedOnly)}
                />
            </div>
            <div className="cardBuilderPar">
                <div className="rightCardPanel cardListCSS">
                    <CardList
                        cards={showLeaderPicker 
                            ? leaderCards.slice(0, displayedCards) 
                            : filteredCards.slice(0, displayedCards)}
                        onSecondaryButtonClick={showLeaderPicker ? handlePickLeader : handleAddToDeck}
                        onPrimaryButtonClick={handleViewDetails}
                        primaryButtonLabel="Details"
                        secondaryButtonLabel="+"
                        showQuantity={true}
                        disableQuantityEdit={true}
                        enableCardClick={true}
                    />
                </div>

                <div className="deckSection">

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

                    <h2>Your Deck ({deck ? deck.reduce((sum, card) => sum + card.quantity, 0) : 0}/50)</h2>
                    {!leader ? (
                        <button onClick={() => setShowLeaderPicker(true)}>Pick Leader</button>
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
                                    secondaryButtonLabel="-"
                                />
                            </div>
                        </>
                    )}
                    {deck.length > 0 && (
                        <div className="deckCards">
                        {deck.sort((a, b) => {
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
                                </div>
                            </div>
                        ))}
                    </div>
                    )}
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {selectedCard && <CardDetail card={selectedCard} />}
            </Modal>
        </div>
    );
};

export default DeckBuilder;
