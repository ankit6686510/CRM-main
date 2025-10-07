import React from 'react';
import { Modal, Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const AiInsightModal = ({ onClose }) => {
  return (
    <Modal
      open={true}
      onClose={onClose}
      aria-labelledby="ai-insight-modal"
      aria-describedby="ai-insight-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            AI Insights
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Typography id="ai-insight-description" sx={{ mt: 2 }}>
          Your AI insights will appear here.
        </Typography>
      </Box>
    </Modal>
  );
};

export default AiInsightModal; 