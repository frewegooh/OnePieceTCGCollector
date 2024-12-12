import React from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';

const ShareModal = ({ url, onClose }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        alert('URL copied to clipboard!');
    };

    return (
        <Dialog open={true} onClose={onClose}>
            <DialogTitle>Share Deck</DialogTitle>
            <DialogContent>
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
    );
};

export default ShareModal;