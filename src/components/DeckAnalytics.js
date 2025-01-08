import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
//import { getImageUrl } from '../config';

const DeckAnalytics = ({ deck, leader, userCollection, getImageUrl, handleViewDetails, cards }) => {
    const [isOpen] = useState(false);

    // Calculate card type distribution
    const typeDistribution = {
        Leader: leader ? 1 : 0,
        Character: 0,
        Event: 0,
        Stage: 0
    };

    deck?.forEach(card => {
        if (typeDistribution.hasOwnProperty(card?.extCardType)) {
            typeDistribution[card.extCardType] += (card.quantity || 0);
        }
    });

    // Calculate cost distribution
    const costDistribution = deck?.reduce((acc, card) => {
        const cost = parseInt(card?.extCost);
        if (!isNaN(cost)) {
            acc[cost] = (acc[cost] || 0) + (card.quantity || 0);
        }
        return acc;
    }, {}) || {};

    // Power distribution calculation (new)
    const powerDistribution = deck?.reduce((acc, card) => {
        const power = parseInt(card.extPower);
        if (!isNaN(power)) {
            acc[power] = (acc[power] || 0) + card.quantity;
        }
        return acc;
    }, {});

    // Counter distribution (new)
    const counterDistribution = {
        'No Counter': 0,
        '+1000': 0,
        '+2000': 0
    };

    deck?.forEach(card => {
        const counter = card.extCounterplus;
        if (!counter) {
            counterDistribution['No Counter'] += card.quantity;
        } else {
            counterDistribution[`+${counter}`] += card.quantity;
        }
    });

    // Subtype distribution (new)
    const subtypeDistribution = deck?.reduce((acc, card) => {
        if (card.extSubtypes) {
            const subtypes = card.extSubtypes.split(';');
            subtypes.forEach(subtype => {
                acc[subtype] = (acc[subtype] || 0) + card.quantity;
            });
        }
        return acc;
    }, {});

    // Prepare data for charts
    const costData = Object.entries(costDistribution || {}).map(([cost, count]) => ({
        value: cost,
        count
    })).sort((a, b) => parseInt(a.value) - parseInt(b.value));

    const powerData = Object.entries(powerDistribution || {}).map(([power, count]) => ({
        value: power,
        count
    })).sort((a, b) => parseInt(a.value) - parseInt(b.value));


     // Calculate total deck value (new)
     const calculateTotalValue = () => {
        let total = 0;
        
        // Add leader value if present
        if (leader?.marketPrice) {
            total += parseFloat(leader.marketPrice);
        }

        // Add up all card values including multiples
        deck?.forEach(card => {
            if (card.marketPrice) {
                total += parseFloat(card.marketPrice) * card.quantity;
            }
        });

        return total.toFixed(2);
    };

    const totalDeckValue = calculateTotalValue();


    // New special abilities distribution calculation
    const specialAbilitiesDistribution = deck?.reduce((acc, card) => {
        if (card.extDescription) {
            const matches = card.extDescription.match(/\[(.*?)\]/g);
            if (matches) {
                matches.forEach(ability => {
                    acc[ability] = (acc[ability] || 0) + card.quantity;
                });
            }
        }
        return acc;
    }, {});

     // Add this new function to calculate missing cards
     const calculateMissingCards = () => {
        //console.log('User Collection:', userCollection);
        //console.log('Deck Cards:', deck);
        //console.log('Leader:', leader);
        //console.log('Cards Database:', cards);
        const missingCards = [];
        
        if (!userCollection || !cards) return missingCards;

        // Check leader card
        if (leader) {
            const leaderExtNumber = leader.extNumber;
            const totalLeaderQuantity = Object.entries(userCollection)
                .reduce((total, [productId, quantity]) => {
                    // Find all versions of this card in the database
                    const card = cards?.find(c => c.productId === productId);
                    if (card && card.extNumber === leaderExtNumber) {
                        return total + quantity;
                    }
                    return total;
                }, 0);
    
            if (totalLeaderQuantity < 1) {
                missingCards.push({
                    ...leader,
                    neededQuantity: 1,
                    ownedQuantity: totalLeaderQuantity,
                    id: leader.productId 
                });
            }
        }
    
        // Check deck cards
        deck?.forEach(deckCard => {
            const cardExtNumber = deckCard.extNumber;
            const totalQuantity = Object.entries(userCollection)
                .reduce((total, [productId, quantity]) => {
                    // Find all versions of this card in the database
                    const card = cards?.find(c => c.productId === productId);
                    if (card && card.extNumber === cardExtNumber) {
                        return total + quantity;
                    }
                    return total;
                }, 0);
    
            if (totalQuantity < deckCard.quantity) {
                missingCards.push({
                    ...deckCard,
                    neededQuantity: deckCard.quantity - totalQuantity,
                    ownedQuantity: totalQuantity,
                    id: deckCard.productId
                });
            }
        });
    
        return missingCards;
    };

    const missingCards = calculateMissingCards();


    return (
        <div className={`deck-analytics ${isOpen ? 'open' : ''}`}>
            <div className="analytics-content">
                <div className='AnalyticsTitle'>
                    <h2>Deck Stats</h2>
                </div>

                <div className='costDistribution'>
                    <h3>Cost Distribution</h3>
                    <BarChart width={300} height={200} data={costData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="value" label={{ value: 'Cost', position: 'bottom' }} />
                        <YAxis label={{ value: 'Count', angle: -90, position: 'left' }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                </div>
                
                <div className='powerDistribution'>
                    <h3>Power Distribution</h3>
                    <BarChart width={300} height={200} data={powerData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="value" label={{ value: 'Power', position: 'bottom' }} />
                        <YAxis label={{ value: 'Count', angle: -90, position: 'left' }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                </div>
                <hr />
                <div className='typeDistribution fullWidth'>
                    <h3>Card Type Distribution</h3>
                    <div className="distribution-section">
                        {Object.entries(typeDistribution).map(([type, count]) => (
                            <div key={type} className="distribution-row">
                                <span className='title'>{type}: </span>
                                <span>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <hr />
                <div className='counterDistribution fullWidth'>
                    <h3>Counter Distribution</h3>
                    <div className="distribution-section">
                        {Object.entries(counterDistribution).map(([counter, count]) => (
                            <div key={counter} className="distribution-row">
                                <span className='title'>{counter}: </span>
                                <span>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <hr />
                <div className='subtypeDistribution fullWidth'>
                    <h3>Subtype Distribution</h3>
                    <div className="distribution-section">
                        {Object.entries(subtypeDistribution || {}).map(([subtype, count]) => (
                            <div key={subtype} className="distribution-row">
                                <span>{count}x {subtype}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <hr />
                <div className='specialAbilities fullWidth'>
                    <h3>Special Abilities</h3>
                    <div className="distribution-section">
                        {Object.entries(specialAbilitiesDistribution || {}).map(([ability, count]) => (
                            <div key={ability} className="distribution-row">
                                <span>{count}x {ability}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <hr />
                <div className='deckValue'>
                    <h3>Deck Value</h3>
                    <div className="distribution-section">
                        <div className="distribution-row value-row">
                            <span className='title'>Estimated Market Price: </span>
                            <span>${totalDeckValue}</span>
                        </div>
                    </div> 
                </div>
                <hr />
                <div className='missingCards'>
                    <h3>Cards Needed to Complete Deck</h3>
                    <div className="missing-cards-grid">
                        {missingCards.length > 0 ? (
                            missingCards.map((card) => (
                                <div key={card.id} className="card-container">
                                    <div className="cards-needed">
                                        <strong>Not Owned:</strong> {card.neededQuantity}
                                    </div>
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
                            ))
                        ) : (
                            <div className="complete-message">
                                You have all the cards needed! 🎉
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .deck-analytics {
                    width: 100%;
                    background: white;
                    margin-top: 20px;
                }

                .deck-analytics.open {
                    right: 0;
                }

                .analytics-content {
                    padding: 20px;
                }

                .distribution-section {
                    margin-bottom: 20px;
                }
                .distribution-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 5px 0;
                }
            `}</style>
        </div>
    );
};

export default DeckAnalytics;