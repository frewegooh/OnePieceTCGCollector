import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

const LoginPrompt = ({ open, onClose }) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Login Required</DialogTitle>
            <DialogContent>
                Create an account or login to access this feature!
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                <Button href="/login" variant="contained" color="primary">
                    Login / Sign Up
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LoginPrompt;
