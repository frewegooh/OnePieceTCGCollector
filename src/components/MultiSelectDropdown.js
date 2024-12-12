import React, { useState, useEffect, useRef } from 'react';

const MultiSelectDropdown = ({
    title,
    options = [],
    selectedOptions = [],
    onOptionChange,
    additionalOption,
    additionalOptionLabel,
    additionalOptionChecked,
    onAdditionalOptionChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Ensure both options and selected options are treated consistently as strings for comparison
    const normalizedOptions = options.map(String);
    const normalizedSelectedOptions = selectedOptions.map(String);

    // Handle toggling of options
    const handleOptionChange = (option) => {
        const isSelected = normalizedSelectedOptions.includes(option);
        const updatedOptions = isSelected
            ? selectedOptions.filter((selected) => String(selected) !== option) // Remove if selected
            : [...selectedOptions, option]; // Add if not selected

        onOptionChange(updatedOptions); // Update parent component
    };

    // Filter out invalid options
    const validOptions = normalizedOptions.filter(
        (option) => option !== undefined && option !== null && option !== ''
    );

    return (
        <div className="multi-select-dropdown" ref={dropdownRef}>
            <button onClick={() => setIsOpen((prev) => !prev)}>{title}</button>
            {isOpen && (
                <ul className="dropdown-options">
                    {validOptions.map((option) => {
                        const displayValue = option.replace(/;/g, '/'); // Replace ';' with '/'
                        return (
                            <li key={option} className={`dropdown-item ${option.toLowerCase().replace(/\s+/g, '-').replace(/;/g, '-')}`}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={normalizedSelectedOptions.includes(option)}
                                        onChange={() => handleOptionChange(option)}
                                    />
                                    {displayValue}
                                </label>
                            </li>
                        );
                    })}
                    {additionalOption && (
                        <li>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={additionalOptionChecked}
                                    onChange={onAdditionalOptionChange}
                                />
                                {additionalOptionLabel}
                            </label>
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default MultiSelectDropdown;
