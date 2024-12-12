// src/utils/textUtils.js

import React from 'react';

export const formatCardText = (text) => {
    return text.split(/(\[[^\]]+\])/g).map((segment, index) => {
        if (segment.startsWith('[') && segment.endsWith(']')) {
            // Remove brackets and get the first three letters for the class
            const content = segment.slice(1, -1);
            const className = content.slice(0, 3).toLowerCase();

            return (
                <span key={index} className={`card-text-${className}`}>
                    [{content}]
                </span>
            );
        }
        return segment; // Return regular text segments as-is
    });
};
