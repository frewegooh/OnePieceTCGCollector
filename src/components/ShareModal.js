import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';

const ShareModal = ({ url, onClose }) => {
    const [showCopyNotification, setShowCopyNotification] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setShowCopyNotification(true);
        setTimeout(() => setShowCopyNotification(false), 2000);
    };

    return (
        <div className='shareModule'>
            <Dialog open={true} onClose={onClose}>
                <DialogTitle>Share Deck</DialogTitle>
                <DialogContent>
                    {showCopyNotification && (
                        <div style={{ color: 'green', marginBottom: '10px' }}>
                            Link Copied!
                        </div>
                    )}
                    <TextField
                        fullWidth
                        value={url}
                        readOnly
                        margin="dense"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCopy}>Copy URL</Button>
                    <Button onClick={onClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};


const MessageModal = ({ 
    isOpen, 
    onClose, 
    title, 
    message, 
    showInput, 
    inputValue, 
    actions,
    showCopyButton 
}) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(inputValue);
        // You could trigger a temporary success message here
    };

    return (
        <Dialog open={isOpen} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <p>{message}</p>
                {showInput && (
                    <TextField
                        fullWidth
                        value={inputValue}
                        readOnly
                        margin="dense"
                    />
                )}
            </DialogContent>
            <DialogActions>
                {showCopyButton && <Button onClick={handleCopy}>Copy URL</Button>}
                {actions || <Button onClick={onClose}>Close</Button>}
            </DialogActions>
        </Dialog>
    );
};

export { MessageModal };
export default ShareModal;
