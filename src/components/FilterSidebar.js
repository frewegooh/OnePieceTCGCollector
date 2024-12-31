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
                const cardColors = Array.isArray(card.extColor) ? 
                    card.extColor : 
                    (typeof card.extColor === 'string' ? card.extColor.split(';') : []);
                    
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
    
    const handleClearFilters = () => {
        onColorChange([]);
        onTypeChange([]);
        onCostChange([]);
        onPowerChange([]);
        onAttributeChange([]);
        onCounterChange([]);
        onGroupChange('');
        onSearchChange('');
        if (multicolorOnly) {
            onMulticolorChange();
        }
        if (showOwnedOnly) {
            onOwnedOnlyChange();
        }
    };
    
    const setNameToId = {
        // Main Sets
        'Emperors in the New World': '23589',
        'Premium Booster -The Best-': '23496',
        'Two Legends': '23462',
        '500 Years in the Future': '23387',
        'Wings of the Captain': '23272',
        'Awakening of the New Era': '23213',
        'Kingdoms of Intrigue': '23024',
        'Pillars of Strength': '22890',
        'Paramount War': '17698',
        'Romance Dawn': '3188',
        'Starter Deck 1: Straw Hat Crew': '3189',
        'Starter Deck 2: Worst Generation': '3191',
        'Starter Deck 3: The Seven Warlords of The Sea': '3192',
        'Starter Deck 4: Animal Kingdom Pirates': '3190',
        'Starter Deck 5: Film Edition': '17687',
        'Starter Deck 6: Absolute Justice': '17699',
        'Starter Deck 7: Big Mom Pirates': '22930',
        'Starter Deck 8: Monkey.D.Luffy': '22956',
        'Starter Deck 9: Yamato': '22957',
        'Ultra Deck: The Three Captains': '23243',
        'Starter Deck 11: Uta': '23250',
        'Starter Deck 12: Zoro and Sanji': '23348',
        'Ultra Deck: The Three Brothers': '23349',
        'Starter Deck 14: 3D2Y': '23489',
        'Starter Deck 15: RED Edward.Newgate': '23490',
        'Starter Deck 16: GREEN Uta': '23491',
        'Starter Deck 17: BLUE Donquixote Doflamingo': '23492',
        'Starter Deck 18: PURPLE Monkey.D.Luffy': '23493',
        'Starter Deck 19: BLACK Smoker': '23494',
        'Starter Deck 20: YELLOW Charlotte Katakuri': '23495',
        'Emperors in the New World: 2nd Anniversary Tournament Cards': '23590',
        'Two Legends Pre-Release Cards': '23737',
        '500 Years in the Future Pre-Release Cards': '23512',
        'Wings of the Captain Pre-Release Cards': '23424',
        'Awakening of the New Era: 1st Anniversary Tournament Cards': '23368',
        'Extra Booster: Anime 25th Collection': '23834',
        'Extra Booster: Memorial Collection': '23333',
        'Kingdoms of Intrigue Pre-Release Cards': '23297',
        'One Piece Collection Sets': '23304',
        'One Piece Demo Deck Cards': '23907',
        'One Piece Promotion Cards': '17675',
        'Paramount War Pre-Release Cards': '22934',
        'Pillars of Strength Pre-Release Cards': '23232',
        'Revision Pack Cards': '23890',
        'Super Pre-Release Starter Deck 1: Straw Hat Crew': '17659',
        'Super Pre-Release Starter Deck 2: Worst Generation': '17658',
        'Super Pre-Release Starter Deck 3: The Seven Warlords of the Sea': '17660',
        'Super Pre-Release Starter Deck 4: Animal Kingdom Pirates': '17661',
        'Royal Bloodlines': '23766'
    };

    //const setOrder = [
    //    // Main Sets
    //    'OP09', 'OP08', 'OP07', 'OP06', 'OP05', 'OP04', 'OP03', 'OP02', 'OP01',
        // Starter Decks
    //    'ST20', 'ST19', 'ST18', 'ST17', 'ST16', 'ST15', 'ST14', 'ST13', 'ST12',
    //    'ST11', 'ST10', 'ST09', 'ST08', 'ST07', 'ST06', 'ST05', 'ST04', 'ST03',
    //    'ST02', 'ST01'
    //];

    return (
        <div className="sideFilter">
            {/* Search Field */}
            <div className="searchCards">
                <input
                    type="text"
                    placeholder="Search all..."
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
                            onGroupChange(e.target.value);
                        }}
                    >
                        <option value="">All Sets</option>
                        {Object.entries(groupMap)
                        .sort(([idA, nameA], [idB, nameB]) => {
                            const orderA = Object.values(setNameToId).indexOf(idA);
                            const orderB = Object.values(setNameToId).indexOf(idB);
                            
                            if (orderA !== -1 && orderB !== -1) return orderA - orderB;
                            if (orderA !== -1) return -1;
                            if (orderB !== -1) return 1;
                            
                            return nameA.localeCompare(nameB);
                        })
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

                <div className="sideFilter">
                    <button 
                        onClick={handleClearFilters}
                        className="clear-filters-button"
                    >
                        Clear All Filters
                    </button>
                    
                    {/* Rest of your existing filter components */}
                </div>
        </div>
    );
    
};

export default FilterSidebar;

