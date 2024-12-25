import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const DeckAnalytics = ({ deck, leader }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Calculate card type distribution
    const typeDistribution = {
        Leader: leader ? 1 : 0,
        Character: 0,
        Event: 0,
        Stage: 0
    };

    deck?.forEach(card => {
        if (typeDistribution.hasOwnProperty(card.extCardType)) {
            typeDistribution[card.extCardType] += card.quantity;
        }
    });

    // Calculate cost distribution
    const costDistribution = deck?.reduce((acc, card) => {
        const cost = parseInt(card.extCost);
        if (!isNaN(cost)) {
            acc[cost] = (acc[cost] || 0) + card.quantity;
        }
        return acc;
    }, {});

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


    return (
        <div className={`deck-analytics ${isOpen ? 'open' : ''}`}>
            <div className="toggle-tab" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? '>' : '<'}
            </div>
            <div className="analytics-content">
                <div className='typeDistribution'>
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
                
                <div className='counterDistribution'>
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

                <div className='subtypeDistribution'>
                    <h3>Subtype Distribution</h3>
                    <div className="distribution-section">
                        {Object.entries(subtypeDistribution || {}).map(([subtype, count]) => (
                            <div key={subtype} className="distribution-row">
                                <span>{count}x {subtype}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='specialAbilities'>
                    <h3>Special Abilities</h3>
                    <div className="distribution-section">
                        {Object.entries(specialAbilitiesDistribution || {}).map(([ability, count]) => (
                            <div key={ability} className="distribution-row">
                                <span>{count}x {ability}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='deckValue'>
                    <h3>Deck Value</h3>
                    <div className="distribution-section">
                        <div className="distribution-row value-row">
                            <span className='title'>Estimated Market Price: </span>
                            <span>${totalDeckValue}</span>
                        </div>
                    </div> 
                </div>



            </div>

       


            <style>{`
                .deck-analytics {
                    position: fixed;
                    right: -350px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 350px;
                    background: white;
                    border: 1px solid #ccc;
                    border-radius: 8px 0 0 8px;
                    transition: right 0.3s ease;
                    box-shadow: -2px 0 5px rgba(0,0,0,0.1);
                    z-index: 1000;
                }

                .deck-analytics.open {
                    right: 0;
                }

                .toggle-tab {
                    position: absolute;
                    left: -30px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 30px;
                    height: 60px;
                    background: white;
                    border: 1px solid #ccc;
                    border-right: none;
                    border-radius: 8px 0 0 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .analytics-content {
                    padding: 20px;
                    overflow-y: auto;
                    max-height: 80vh;
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