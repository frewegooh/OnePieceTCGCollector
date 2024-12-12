// src/components/CostFilter.js
import React from 'react';

const CostFilter = ({ selectedCostRange, onCostChange }) => {
    return (
        <div className="CostFilter">
            <h3>Filter by Cost</h3>
            <input
                type="range"
                min="0"
                max="10"
                value={selectedCostRange[0]}
                onChange={(e) => onCostChange([+e.target.value, selectedCostRange[1]])}
            />
            <input
                type="range"
                min="0"
                max="10"
                value={selectedCostRange[1]}
                onChange={(e) => onCostChange([selectedCostRange[0], +e.target.value])}
            />
            <p>Selected Cost Range: {selectedCostRange[0]} - {selectedCostRange[1]}</p>
        </div>
    );
};

export default CostFilter;
