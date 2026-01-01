import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { List, ListItem, ListItemText, IconButton, Typography, Box, ListItemButton } from '@mui/material';
import { Delete, CloudUpload } from '@mui/icons-material';

const FileUploader = ({ onFilesChange, onFileSelect, activeFileIndex }) => {
    const [files, setFiles] = useState([]);

    const onDrop = useCallback((acceptedFiles) => {
        const newFiles = [...files, ...acceptedFiles];
        setFiles(newFiles);
        onFilesChange(newFiles);
    }, [files, onFilesChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        accept: { 'application/pdf': ['.pdf'] } 
    });

    const handleRemoveFile = (index, e) => {
        e.stopPropagation(); // Prevents selecting the file while deleting it
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        onFilesChange(newFiles);
    };

    return (
        <Box className="file-uploader-wrapper">
            {/* Dropzone Area */}
            <Box 
                {...getRootProps()} 
                className={`dropzone-container ${isDragActive ? 'active' : ''}`}
                sx={{
                    border: '2px dashed #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragActive ? 'rgba(79, 70, 229, 0.05)' : '#fdfdfd',
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: '#4f46e5' }
                }}
            >
                <input {...getInputProps()} />
                <CloudUpload sx={{ color: '#4f46e5', fontSize: 32, mb: 1 }} />
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {isDragActive ? "Drop PDF here" : "Click or Drag PDF"}
                </Typography>
            </Box>

            {/* Scrollable File List */}
            <List sx={{ mt: 2, width: '100%' }}>
                {files.map((file, index) => (
                    <ListItem
                        key={`${file.name}-${index}`}
                        disablePadding
                        secondaryAction={
                            <IconButton 
                                edge="end" 
                                onClick={(e) => handleRemoveFile(index, e)}
                                sx={{ '&:hover': { color: '#ef4444' } }}
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                        }
                        sx={{
                            mb: 1,
                            borderRadius: '8px',
                            backgroundColor: index === activeFileIndex ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                            border: index === activeFileIndex ? '1px solid #4f46e5' : '1px solid #f1f5f9',
                        }}
                    >
                        <ListItemButton 
                            onClick={() => onFileSelect(index)}
                            sx={{ borderRadius: '8px' }}
                        >
                            <ListItemText 
                                primary={file.name} 
                                primaryTypographyProps={{ 
                                    fontSize: '13px', 
                                    fontWeight: index === activeFileIndex ? '600' : '400',
                                    noWrap: true 
                                }}
                                secondary={`${(file.size / 1024).toFixed(0)} KB`}
                                secondaryTypographyProps={{ fontSize: '11px' }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default FileUploader;