//import React, { useState, useEffect } from 'react';
import React, { useEffect } from 'react';
import MultiSelectDropdown from './MultiSelectDropdown';

const FilterSidebar = ({
    cards = [],
    onFilteredCardsChange,
    selectedColors = [],
    onColorChange,
    availableColors = [],
    multicolorOnly = false,
    onMulticolorChange,
    searchQuery = '',
    onSearchChange,
    selectedTypes = [],
    onTypeChange,
    availableTypes = [],
    selectedCostValues = [],
    onCostChange,
    availableCostValues = [],
    selectedPowerValues = [],
    onPowerChange,
    availablePowerValues = [],
    selectedAttributes = [],
    onAttributeChange,
    availableAttributes = [],
    selectedCounterValues,
    onCounterChange,
    availableCounterValues = [],
    selectedGroupID = null,
    onGroupChange,
    groupMap = {},
    showOwnedOnly = false,
    onOwnedOnlyChange,
}) => {

    useEffect(() => {
        if (cards?.length > 0) {
    
            const filtered = cards.filter((card) => {
                // Ensure defensive handling for undefined/null properties
                const cardColors = card.extColor?.split(';') || [];
                const matchesColor = (() => {
                    if (multicolorOnly) {
                        const isMulticolor = cardColors.length > 1;
                        if (!isMulticolor) return false;
                        return (
                            selectedColors.length === 0 ||
                            selectedColors.some((color) => cardColors.includes(color))
                        );
                    }
                    return (
                        selectedColors.length === 0 ||
                        selectedColors.some((color) => cardColors.includes(color))
                    );
                })();
    
                const matchesSearchQuery = searchQuery?.trim()?.toLowerCase()
                    ? Object.values(card || {}).some((value) =>
                          value
                              ?.toString()
                              ?.toLowerCase()
                              ?.includes(searchQuery.trim().toLowerCase())
                      )
                    : true;
    
                const matchesType =
                    selectedTypes?.length === 0 ||
                    selectedTypes.includes(card.extCardType);
    
                const matchesCost =
                    selectedCostValues?.length === 0 ||
                    selectedCostValues.includes(parseInt(card.extCost, 10));
    
                const matchesPower =
                    selectedPowerValues?.length === 0 ||
                    selectedPowerValues.includes(parseInt(card.extPower, 10));
    
                const matchesAttribute =
                    selectedAttributes?.length === 0 ||
                    selectedAttributes.includes(card.extAttribute);
    
                const matchesCounter =
                    Array.isArray(selectedCounterValues) &&
                    selectedCounterValues.length > 0
                        ? selectedCounterValues.includes(
                              parseInt(card.extCounterplus, 10)
                          )
                        : true;
                
    
                const matchesGroup = (() => {
                    // Ensure consistent string comparison
                    const cardGroupId = String(card.groupId).trim();
                    const selectedId = String(selectedGroupID).trim();
                                        
                    return !selectedGroupID || cardGroupId === selectedId;
                })();

                return (
                    matchesColor &&
                    matchesSearchQuery &&
                    matchesType &&
                    matchesCost &&
                    matchesPower &&
                    matchesAttribute &&
                    matchesCounter &&
                    matchesGroup
                );
            });

            onFilteredCardsChange(filtered);
        }
    }, [
        cards,
        selectedColors,
        multicolorOnly,
        searchQuery,
        selectedTypes,
        selectedCostValues,
        selectedPowerValues,
        selectedAttributes,
        selectedCounterValues,
        selectedGroupID,
        onFilteredCardsChange,
    ]);
    
    return (
        <div className="sideFilter">
            {/* Search Field */}
            <div className="searchCards">
                <input
                    type="text"
                    placeholder="Search cards..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
    
            {/* Filter by Color */}
            {availableColors?.length > 0 && (
                <div className="color-options">
                    <MultiSelectDropdown
                        title="Color"
                        options={availableColors}
                        selectedOptions={selectedColors}
                        onOptionChange={onColorChange}
                        additionalOption={true}
                        additionalOptionLabel="Multicolor Only"
                        additionalOptionChecked={multicolorOnly}
                        onAdditionalOptionChange={onMulticolorChange}
                    />
                </div>
            )}
    
            {/* Filter by Card Type */}
            {availableTypes?.length > 0 && (
                <div className="type-options">
                    <MultiSelectDropdown
                        title="Type"
                        options={availableTypes}
                        selectedOptions={selectedTypes}
                        onOptionChange={onTypeChange}
                    />
                </div>
            )}
    
            {/* Filter by Cost */}
            {availableCostValues?.length > 0 && (
                <div className="cost-options">
                    <MultiSelectDropdown
                        title="Cost"
                        options={availableCostValues}
                        selectedOptions={selectedCostValues}
                        onOptionChange={onCostChange}
                    />
                </div>
            )}
    
            {/* Filter by Power */}
            {availablePowerValues?.length > 0 && (
                <div className="power-options">
                    <MultiSelectDropdown
                        title="Power"
                        options={availablePowerValues}
                        selectedOptions={selectedPowerValues}
                        onOptionChange={onPowerChange}
                    />
                </div>
            )}
    
            {/* Filter by Counter */}
            {availableCounterValues?.length > 0 && (
                <div className="counter-options">
                    <MultiSelectDropdown
                        title="Counter"
                        options={availableCounterValues}
                        selectedOptions={selectedCounterValues}
                        onOptionChange={onCounterChange}
                    />
                </div>
            )}
    
            {/* Filter by Attribute */}
            {availableAttributes?.length > 0 && (
                <div className="attribute-options">
                    <MultiSelectDropdown
                        title="Attribute"
                        options={availableAttributes}
                        selectedOptions={selectedAttributes}
                        onOptionChange={onAttributeChange}
                    />
                </div>
            )}
    
            {/* Filter by Set */}
                <div className="set-filter">
                    <select
                        id="groupFilter" 
                        value={selectedGroupID || ''}
                        onChange={(e) => {
                            //console.log('Set selected:', e.target.value);
                            onGroupChange(e.target.value);
                        }}
                    >
                        <option value="">All Sets</option>
                        {Object.entries(groupMap)
                            .sort(([_, nameA], [__, nameB]) => nameA.localeCompare(nameB))
                            .map(([id, name]) => (
                                <option key={id} value={id}>
                                    {name}
                                </option>
                            ))}
                    </select>
                </div>

                {/* Filter By Owned */}
                <div className="owned-filter">
                    <label>
                        <input
                            type="checkbox"
                            checked={showOwnedOnly}
                            onChange={onOwnedOnlyChange}
                        />
                        Owned Cards
                    </label>
                </div>
        </div>
    );
    
};

export default FilterSidebar;

