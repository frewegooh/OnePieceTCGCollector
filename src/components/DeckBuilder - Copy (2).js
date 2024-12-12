import React, { useState, useEffect } from 'react';
import FilterSidebar from './FilterSidebar';
import CardList from './CardList';
import CardDetail from './CardDetail';
import Modal from './Modal';

const DeckBuilder = ({ cards }) => {
    const [filteredCards, setFilteredCards] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [displayedCards, setDisplayedCards] = useState(25);
    // Filters
    const [selectedColors, setSelectedColors] = useState([]);
    const [multicolorOnly, setMulticolorOnly] = useState(false);
    const [selectedGroupID, setSelectedGroupID] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedCostValues, setSelectedCostValues] = useState([]);
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [selectedPowerValues, setSelectedPowerValues] = useState([]);
    const [selectedCounterValues, setSelectedCounterValues] = useState([]);
    const [availableColors, setAvailableColors] = useState([]);
    const [availableCostValues, setAvailableCostValues] = useState([]);
    const [availableAttributes, setAvailableAttributes] = useState([]);
    const [availablePowerValues, setAvailablePowerValues] = useState([]);
    const [availableCounterValues, setAvailableCounterValues] = useState([]);
    const [groupMap, setGroupMap] = useState({});
    const [deck, setDeck] = useState([]);
    const [deckUrl, setDeckUrl] = useState('');
    const [filters, setFilters] = useState({
        selectedColors: [],
        selectedGroupID: null,
        selectedCostValues: [],
        selectedPowerValues: [],
        selectedAttributes: [],
        selectedCounterValues: [],
        searchQuery: '',
        multicolorOnly: false,
    });

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
                setDisplayedCards(prevDisplayedCards => prevDisplayedCards + 25);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);



    const handleAddToDeck = (card) => {
        const isLeader = card.extCardType === 'Leader';
        const cardCount = deck.reduce((sum, deckCard) => sum + deckCard.quantity, 0);
        const existingCard = deck.find((deckCard) => deckCard.extNumber === card.extNumber);
    
        // Enforce leader card constraint
        if (isLeader) {
            if (deck.some((deckCard) => deckCard.extCardType === 'Leader')) {
                alert('You can only have one leader card.');
                return;
            }
            setDeck([...deck, { ...card, quantity: 1 }]);
            return;
        }
    
        // Enforce total card limit
        if (cardCount >= 50) {
            alert('Your deck cannot exceed 50 cards.');
            return;
        }
    
        // Enforce max copies per card
        if (existingCard) {
            if (existingCard.quantity >= 4) {
                alert(`You can only add up to 4 copies of ${card.name}.`);
                return;
            }
            setDeck(deck.map((deckCard) =>
                deckCard.extNumber === card.extNumber
                    ? { ...deckCard, quantity: deckCard.quantity + 1 }
                    : deckCard
            ));
        } else {
            setDeck([...deck, { ...card, quantity: 1 }]);
        }
    };




    const handleSaveDeck = async () => {
        const deckData = { deck };
        try {
            // Save the deck to a backend (e.g., Firebase) and get a unique ID
            const response = await fetch('/api/saveDeck', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deckData),
            });
            const { id } = await response.json();
            const url = `${window.location.origin}/deck/${id}`;
            setDeckUrl(url);
            alert('Deck saved! Share your deck using this link: ' + url);
        } catch (error) {
            alert('Failed to save the deck. Please try again.');
        }
    };
    
    


    useEffect(() => {
        if (cards.length > 0) {
            // Populate filter options
            const uniqueColors = [...new Set(cards.flatMap((card) => card.extColor?.split(';') || []))];
            const uniqueCosts = [...new Set(cards.map((card) => parseInt(card.extCost, 10)).filter(Boolean))];
            const uniqueAttributes = [...new Set(cards.map((card) => card.extAttribute).filter(Boolean))];
            const uniquePowers = [...new Set(cards.map((card) => card.extPower).filter(Boolean))];
            const uniqueCounters = [...new Set(cards.map((card) => card.extCounterplus).filter(Boolean))];
            const groups = cards.reduce((acc, card) => {
                if (card.groupID && card.groupName) acc[card.groupID] = card.groupName;
                return acc;
            }, {});

            setAvailableColors(uniqueColors);
            setAvailableCostValues(uniqueCosts.sort((a, b) => a - b));
            setAvailableAttributes(uniqueAttributes);
            setAvailablePowerValues(uniquePowers);
            setAvailableCounterValues(uniqueCounters);
            setGroupMap(groups);
        }
    }, [cards]);

    useEffect(() => {
        const filtered = cards.filter((card) => {
            const cardColors = card.extColor ? card.extColor.split(';') : [];
            const cardCost = card.extCost !== null && card.extCost !== undefined ? Number(card.extCost) : null;
            const cardPower = card.extPower !== null && card.extPower !== undefined ? Number(card.extPower) : null;
            const cardCounter = card.extCounterplus !== null && card.extCounterplus !== undefined ? Number(card.extCounterplus) : null;
    
            // Filters
            const matchesColor =
                selectedColors.length === 0 ||
                selectedColors.some((color) => cardColors.includes(color));
    
            const matchesSearchQuery =
                searchQuery.trim() === '' ||
                card.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    
            const matchesType =
                selectedTypes.length === 0 || selectedTypes.includes(card.extCardType);
    
            const matchesCost =
                selectedCostValues.length === 0 || // Match if no cost filter is applied
                (cardCost !== null && selectedCostValues.map(Number).includes(cardCost)); // Match only defined costs
    
            const matchesPower =
                selectedPowerValues.length === 0 || // Match if no power filter is applied
                (cardPower !== null && selectedPowerValues.map(Number).includes(cardPower)); // Match only defined power values
    
            const matchesCounter =
                selectedCounterValues.length === 0 || // Match if no counter filter is applied
                (cardCounter !== null && selectedCounterValues.map(Number).includes(cardCounter)); // Match only defined counter values
    
            const matchesAttribute =
                selectedAttributes.length === 0 ||
                selectedAttributes.includes(card.extAttribute);
    
            const matchesGroup =
                !selectedGroupID || String(card.groupID) === String(selectedGroupID);
    
            return (
                matchesColor &&
                matchesSearchQuery &&
                matchesType &&
                matchesCost &&
                matchesPower &&
                matchesCounter &&
                matchesAttribute &&
                matchesGroup
            );
        });
    
        setFilteredCards(filtered);
    }, [
        cards,
        selectedColors,
        multicolorOnly,
        searchQuery,
        selectedTypes,
        selectedCostValues,
        selectedAttributes,
        selectedPowerValues,
        selectedCounterValues,
        selectedGroupID,
        filters,
    ]);
    
    
    const handleFilterChange = (updatedFilters) => {
        setFilters((prevFilters) => ({ ...prevFilters, ...updatedFilters }));
    };

    const handleRemoveFromDeck = (card) => {
        setDeck(deck
            .map((deckCard) => {
                if (deckCard.extNumber === card.extNumber) {
                    return { ...deckCard, quantity: deckCard.quantity - 1 };
                }
                return deckCard;
            })
            .filter((deckCard) => deckCard.quantity > 0)
        );
    };

    
    
    useEffect(() => {
        const nonLeaders = cards.filter((card) => card.extCardType !== 'Leader');
    
        const uniqueColors = [
            ...new Set(nonLeaders.flatMap((card) => card.extColor?.split(';') || [])),
        ];
        const uniqueCosts = [
            ...new Set(nonLeaders.map((card) => parseInt(card.extCost, 10)).filter((value) => !isNaN(value))),
        ];
        const uniquePowers = [
            ...new Set(nonLeaders.map((card) => parseInt(card.extPower, 10)).filter((value) => !isNaN(value))),
        ];
        const uniqueCounters = [
            ...new Set(nonLeaders.map((card) => parseInt(card.extCounterplus, 10)).filter((value) => !isNaN(value))),
        ];
        const uniqueAttributes = [...new Set(nonLeaders.map((card) => card.extAttribute).filter(Boolean))];
        const groups = nonLeaders.reduce((acc, card) => {
            if (card.groupID && card.groupName) acc[card.groupID] = card.groupName;
            return acc;
        }, {});
    
        setAvailableColors(uniqueColors);
        setAvailableCostValues(uniqueCosts.sort((a, b) => a - b));
        setAvailablePowerValues(uniquePowers.sort((a, b) => a - b));
        setAvailableCounterValues(uniqueCounters.sort((a, b) => a - b));
        setAvailableAttributes(uniqueAttributes);
        setGroupMap(groups);
    }, [cards]);
    


    const handleViewDetails = (card) => {
        setSelectedCard(card);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedCard(null);
        setIsModalOpen(false);
    };

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
                    selectedAttributes={selectedAttributes}
                    onAttributeChange={setSelectedAttributes}
                    availableAttributes={availableAttributes}
                    selectedPowerValues={selectedPowerValues}
                    onPowerChange={setSelectedPowerValues}
                    availablePowerValues={availablePowerValues}
                    selectedCounterValues={selectedCounterValues}
                    onCounterChange={setSelectedCounterValues}
                    availableCounterValues={availableCounterValues}
                    selectedGroupID={selectedGroupID}
                    onGroupChange={setSelectedGroupID}
                    groupMap={groupMap}
                />
            </div>
            <div className='cardBuilderPar'>
                <div className="rightCardPanel cardListCSS">
                        <h2>Available Cards</h2>
                        <CardList
                            cards={filteredCards.slice(0, displayedCards)}
                            onSecondaryButtonClick={handleAddToDeck}
                            primaryButtonLabel="Add to Deck"
                        />
                    </div>
                    <div className='deckBuilder'>
                    <h2>Your Deck ({deck.reduce((sum, card) => sum + card.quantity, 0)}/50)</h2>
                    <CardList
                        cards={deck.slice(0, displayedCards)}
                        onPrimaryButtonClick={handleRemoveFromDeck}
                        primaryButtonLabel="Remove from Deck"
                    />

                    <button onClick={handleSaveDeck}>Save Deck</button>
                    {deckUrl && <div>Shareable Link: <a href={deckUrl}>{deckUrl}</a></div>}
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                {selectedCard && <CardDetail card={selectedCard} />}
            </Modal>

        </div>
        
        
    );
};

export default DeckBuilder;
