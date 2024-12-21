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

export default ShareModal;
