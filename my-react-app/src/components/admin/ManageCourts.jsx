import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiSettings, FiMapPin, FiX } from 'react-icons/fi';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import CourtEditModal from './CourtEditModal';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
`;

const Title = styled.h2`
  margin: 0;
  color: #333;
`;

const AddCourtButton = styled.button`
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const CourtsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
`;

const CourtCard = styled.div`
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
  }
`;

const CourtImage = styled.div`
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 3rem;
  position: relative;
`;

const CourtStatus = styled.div`
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => props.available ? '#d4edda' : '#f8d7da'};
  color: ${props => props.available ? '#155724' : '#721c24'};
`;

const CourtContent = styled.div`
  padding: 20px;
`;

const CourtName = styled.h3`
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.3rem;
`;

const CourtInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 0.95rem;
`;

const CourtFeatures = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
`;

const FeatureTag = styled.span`
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 15px;
  font-size: 0.85rem;
  color: #666;
`;

const CourtActions = styled.div`
  display: flex;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid #e1e5e9;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 10px 5px; /* Reduced side padding so buttons fit on one line */
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 0.9rem;
  color: #666;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.danger ? '#ff4757' : '#667eea'};
    color: white;
    border-color: ${props => props.danger ? '#ff4757' : '#667eea'};
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
`;

const ManageCourts = () => {
  const { token } = useAuth();
  const [courts, setCourts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    maintenance: 0,
    occupied: 0
  });
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/api/admin/courts', { token });
        setCourts(response.data);
        
        // Calculate stats
        const total = response.data.length;
        const available = response.data.filter(c => c.available && !c.maintenanceMode).length;
        const maintenance = response.data.filter(c => c.maintenanceMode).length;
        const occupied = response.data.filter(c => !c.available && !c.maintenanceMode).length;
        
        setStats({ total, available, maintenance, occupied });
      } catch (error) {
        console.error('Error fetching courts:', error);
        setCourts([]);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCourts();
    }
  }, [token]);

  const handleEdit = (court) => {
    setEditingCourt(court);
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this court?')) {
      try {
        await apiClient.delete(`/api/admin/courts/${id}`, { token });
        setCourts(courts.filter(c => c._id !== id));
        // Update stats
        setStats(prev => ({
          ...prev,
          total: prev.total - 1
        }));
      } catch (error) {
        console.error('Error deleting court:', error);
        alert('Error deleting court: ' + error.message);
      }
    }
  };

  const handleView = (court) => {
    console.log('View court details:', court);
  };

  const handleToggleAvailability = async (id) => {
    try {
      const court = courts.find(c => c._id === id);
      const newAvailability = !court.available;
      
      await apiClient.patch(`/api/admin/courts/${id}/availability`, { 
        body: { available: newAvailability },
        token 
      });
      
      setCourts(courts.map(c => 
        c._id === id ? { ...c, available: newAvailability } : c
      ));
    } catch (error) {
      console.error('Error updating court availability:', error);
      alert('Error updating court availability');
    }
  };

  const handleSaveCourt = async (courtData) => {
    try {
      if (editingCourt) {
        // Update existing court
        const response = await apiClient.put(`/api/admin/courts/${editingCourt._id}`, {
          body: courtData,
          token
        });
        setCourts(courts.map(c => c._id === editingCourt._id ? response.data : c));
      } else {
        // Create new court
        const response = await apiClient.post('/api/admin/courts', {
          body: courtData,
          token
        });
        setCourts([...courts, response.data]);
      }
      
      setShowEditModal(false);
      setEditingCourt(null);
    } catch (error) {
      console.error('Error saving court:', error);
      alert('Error saving court: ' + error.message);
    }
  };

  const handleAddCourt = () => {
    setEditingCourt(null);
    setShowEditModal(true);
  };

  return (
    <Container>
      <Header>
        <Title>Court Management</Title>
        <AddCourtButton onClick={handleAddCourt}>
          <FiPlus />
          Add Court
        </AddCourtButton>
      </Header>

      <StatsContainer>
        <StatCard>
          <StatValue>{stats.total}</StatValue>
          <StatLabel>Total Courts</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.available}</StatValue>
          <StatLabel>Available</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.occupied}</StatValue>
          <StatLabel>Occupied</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.maintenance}</StatValue>
          <StatLabel>Maintenance</StatLabel>
        </StatCard>
      </StatsContainer>

      <CourtsGrid>
        {courts.map((court) => (
          <CourtCard key={court._id}>
            <CourtImage>
              <FiSettings />
              <CourtStatus available={court.available && !court.maintenanceMode}>
                {court.maintenanceMode ? 'Maintenance' : court.available ? 'Available' : 'Occupied'}
              </CourtStatus>
            </CourtImage>
            <CourtContent>
              <CourtName>{court.name}</CourtName>
              <CourtInfo>
                <InfoItem>
                  <FiMapPin />
                  {court.location} • {court.type}
                </InfoItem>
                <InfoItem>
                  Capacity: {court.capacity} players
                </InfoItem>
                <InfoItem>
                  ${court.hourlyRate}/hour
                </InfoItem>
                {court.currentOccupancy > 0 && (
                  <InfoItem>
                    Current occupancy: {court.currentOccupancy}/{court.capacity}
                  </InfoItem>
                )}
              </CourtInfo>
              <CourtFeatures>
                {court.features?.map((feature, index) => (
                  <FeatureTag key={index}>{feature}</FeatureTag>
                ))}
              </CourtFeatures>
              <CourtActions>
                <ActionButton onClick={() => handleView(court)}>
                  <FiEye />
                  View
                </ActionButton>
                <ActionButton onClick={() => handleEdit(court)}>
                  <FiEdit2 />
                  Edit
                </ActionButton>
                <ActionButton danger onClick={() => handleDelete(court._id)}>
                  <FiTrash2 />
                  Delete
                </ActionButton>
              </CourtActions>
            </CourtContent>
          </CourtCard>
        ))}
      </CourtsGrid>
      
      <CourtEditModal
        court={editingCourt}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCourt(null);
        }}
        onSave={handleSaveCourt}
      />
    </Container>
  );
};

export default ManageCourts;
