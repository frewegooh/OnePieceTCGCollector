import React, { useState } from 'react';
import API_URL from '../config';

const ImportDeckModal = ({ isOpen, onClose, onImport }) => {
    const [importText, setImportText] = useState('');

    const handleImport = async () => {
        const deckList = importText
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                const match = line.match(/(\d+)x(.+)/);
                if (match) {
                    return {
                        quantity: parseInt(match[1]),
                        extNumber: match[2].trim()
                    };
                }
                return null;
            })
            .filter(item => item !== null);
    
        try {
            const response = await fetch(`${API_URL}/api/deck-import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ deckList })
            });
            
            const matchedCards = await response.json();
            onImport(matchedCards);
            setImportText('');
            onClose();
        } catch (error) {
            console.error('Error importing deck:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal importDeckModule">
            <div className="modal-content">
                <h2>Import Deck</h2>
                <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Paste deck list here (format: 4xOP02-106)"
                    rows={10}
                    style={{ width: '100%' }}
                />
                <div className="modal-buttons">
                    <button onClick={handleImport}>Import</button>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default ImportDeckModal;
