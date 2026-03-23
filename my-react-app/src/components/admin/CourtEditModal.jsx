import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiX, FiSave, FiUpload, FiImage } from 'react-icons/fi';
import { apiClient, API_BASE } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 15px;
  padding: 30px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #333;
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 5px;
  border-radius: 5px;
  transition: all 0.3s ease;

  &:hover {
    background: #f5f5f5;
    color: #333;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 12px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  color: #333;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Select = styled.select`
  width: 100%;
  box-sizing: border-box;
  padding: 12px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  color: #333;
  cursor: pointer;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  padding: 12px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  color: #333;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  ${props => props.primary && `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover {
      transform: translateY(-2px);
    }
  `}

  ${props => props.secondary && `
    background: white;
    color: #666;
    border: 2px solid #e1e5e9;

    &:hover {
      border-color: #667eea;
      color: #667eea;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ImageUploadArea = styled.div`
  border: 2px dashed ${props => props.hasImage ? '#667eea' : '#e1e5e9'};
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.hasImage ? '#f8f7ff' : '#fafafa'};

  &:hover {
    border-color: #667eea;
    background: #f8f7ff;
  }
`;

const ImagePreview = styled.div`
  position: relative;
  margin-bottom: 12px;

  img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
    object-fit: cover;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 71, 87, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: #ff4757;
    transform: scale(1.1);
  }
`;

const UploadIcon = styled.div`
  font-size: 2rem;
  color: #667eea;
  margin-bottom: 8px;
`;

const UploadText = styled.p`
  margin: 0;
  color: #666;
  font-size: 0.9rem;
`;

const UploadHint = styled.p`
  margin: 4px 0 0;
  color: #999;
  font-size: 0.8rem;
`;

const CourtEditModal = ({ court, isOpen, onClose, onSave }) => {
  const { token } = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'indoor',
    location: '',
    capacity: 10,
    hourlyRate: 50,
    available: true,
    maintenanceMode: false,
    features: [],
    description: '',
    imageUrl: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    if (court) {
      setFormData({
        name: court.name || '',
        type: court.type || 'indoor',
        location: court.location || '',
        capacity: court.capacity || 10,
        hourlyRate: court.hourlyRate || 50,
        available: court.available !== false,
        maintenanceMode: court.maintenanceMode || false,
        features: court.features || [],
        description: court.description || '',
        imageUrl: court.imageUrl || ''
      });
      // Set existing image as preview
      if (court.imageUrl) {
        const fullUrl = court.imageUrl.startsWith('http') ? court.imageUrl : `${API_BASE}${court.imageUrl}`;
        setImagePreviewUrl(fullUrl);
      } else {
        setImagePreviewUrl('');
      }
      setSelectedFile(null);
    } else {
      setFormData({
        name: '',
        type: 'indoor',
        location: '',
        capacity: 10,
        hourlyRate: 50,
        available: true,
        maintenanceMode: false,
        features: [],
        description: '',
        imageUrl: ''
      });
      setImagePreviewUrl('');
      setSelectedFile(null);
    }
  }, [court]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be under 5MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setImagePreviewUrl('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addFeature = () => {
    if (featureInput.trim() && !formData.features.includes(featureInput.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalImageUrl = formData.imageUrl;

      // Upload image file if one was selected
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('image', selectedFile);
        const uploadResponse = await apiClient.upload('/api/admin/courts/upload-image', {
          formData: uploadData,
          token
        });
        finalImageUrl = uploadResponse.data.imageUrl;
      }

      onSave({ ...formData, imageUrl: finalImageUrl });
    } catch (error) {
      console.error('Error saving court:', error);
      alert('Error saving court: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{court ? 'Edit Court' : 'Add New Court'}</ModalTitle>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormRow>
            <FormGroup>
              <Label htmlFor="name">Court Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Court A"
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="type">Type *</Label>
              <Select id="type" name="type" value={formData.type} onChange={handleChange}>
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
              </Select>
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="e.g., Building 1, Ground Floor"
            />
          </FormGroup>

          <FormRow>
            <FormGroup>
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                max="20"
                value={formData.capacity}
                onChange={handleChange}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="hourlyRate">Hourly Rate (RS) *</Label>
              <Input
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                value={formData.hourlyRate}
                onChange={handleChange}
                required
              />
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the court..."
              maxLength="500"
            />
          </FormGroup>

          {/* Image Upload */}
          <FormGroup>
            <Label>Court Image</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <ImageUploadArea
              hasImage={!!imagePreviewUrl}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreviewUrl ? (
                <ImagePreview>
                  <img src={imagePreviewUrl} alt="Court preview" />
                  <RemoveImageButton type="button" onClick={handleRemoveImage}>
                    <FiX />
                  </RemoveImageButton>
                </ImagePreview>
              ) : (
                <>
                  <UploadIcon>
                    <FiUpload />
                  </UploadIcon>
                  <UploadText>Click to upload a court image</UploadText>
                  <UploadHint>JPG, PNG, GIF, or WebP — Max 5MB</UploadHint>
                </>
              )}
            </ImageUploadArea>
          </FormGroup>

          <FormGroup>
            <Label>Features</Label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <Input
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                placeholder="Add a feature (e.g., LED Lighting)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <Button type="button" onClick={addFeature}>Add</Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {formData.features.map((feature, index) => (
                <span
                  key={index}
                  style={{
                    background: '#667eea',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '15px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </FormGroup>

          <FormRow>
            <CheckboxGroup>
              <Checkbox
                id="available"
                name="available"
                checked={formData.available}
                onChange={handleChange}
              />
              <Label htmlFor="available" style={{ margin: 0 }}>Available</Label>
            </CheckboxGroup>
            <CheckboxGroup>
              <Checkbox
                id="maintenanceMode"
                name="maintenanceMode"
                checked={formData.maintenanceMode}
                onChange={handleChange}
              />
              <Label htmlFor="maintenanceMode" style={{ margin: 0 }}>Maintenance Mode</Label>
            </CheckboxGroup>
          </FormRow>

          <ButtonGroup>
            <Button type="button" secondary onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" primary disabled={uploading}>
              <FiSave />
              {uploading ? 'Uploading...' : court ? 'Update Court' : 'Create Court'}
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CourtEditModal;
