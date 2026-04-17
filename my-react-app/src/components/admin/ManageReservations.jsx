import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiSearch, FiFilter, FiEdit2, FiTrash2, FiEye, FiCheck, FiX } from 'react-icons/fi';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Controls = styled.div`
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchBox = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
`;

const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 12px 40px 12px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
`;

const FilterSelect = styled.select`
  padding: 12px 20px 12px 15px;
  background: white;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  color: #333;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;

  &:hover, &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f8f9fa;
`;

const TableRow = styled.tr`
  &:hover {
    background: #f8f9ff;
  }
`;

const TableCell = styled.td`
  padding: 15px;
  border-bottom: 1px solid #e1e5e9;
  color: #333;
`;

const TableHeaderCell = styled.th`
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e1e5e9;
`;

const StatusBadge = styled.span`
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => {
    switch (props.status) {
      case 'confirmed': return '#d4edda';
      case 'pending': return '#fff3cd';
      case 'cancelled': return '#f8d7da';
      case 'completed': return '#d1ecf1';
      default: return '#e2e3e5';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'confirmed': return '#155724';
      case 'pending': return '#856404';
      case 'cancelled': return '#721c24';
      case 'completed': return '#0c5460';
      default: return '#383d41';
    }
  }};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 8px;
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.danger ? '#ff4757' : '#667eea'};
    color: white;
    border-color: ${props => props.danger ? '#ff4757' : '#667eea'};
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
`;

const PaginationInfo = styled.div`
  color: #666;
  font-size: 0.9rem;
`;

const PaginationControls = styled.div`
  display: flex;
  gap: 10px;
`;

const PaginationButton = styled.button`
  padding: 8px 12px;
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 5px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: #667eea;
    color: white;
    border-color: #667eea;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ManageReservations = () => {
  const { token } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/api/admin/reservations', { token });
        setReservations(response.data);
        setTotalPages(Math.ceil(response.data.length / 10));
      } catch (error) {
        console.error('Error fetching reservations:', error);
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchReservations();
    }
  }, [token]);

  const handleView = (id) => {
    console.log('View reservation:', id);
  };

  const handleEdit = (id) => {
    console.log('Edit reservation:', id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this reservation?')) {
      try {
        await apiClient.delete(`/api/admin/reservations/${id}`, { token });
        setReservations(reservations.filter(r => r._id !== id));
      } catch (error) {
        console.error('Error deleting reservation:', error);
        alert('Error deleting reservation');
      }
    }
  };

  const handleConfirm = async (id) => {
    try {
      await apiClient.patch(`/api/admin/reservations/${id}/status`, {
        body: { status: 'confirmed' },
        token
      });
      setReservations(reservations.map(r =>
        r._id === id ? { ...r, status: 'confirmed' } : r
      ));
    } catch (error) {
      console.error('Error confirming reservation:', error);
      alert('Error confirming reservation');
    }
  };

  const handleCancel = async (id) => {
    try {
      await apiClient.patch(`/api/admin/reservations/${id}/status`, {
        body: { status: 'cancelled' },
        token
      });
      setReservations(reservations.map(r =>
        r._id === id ? { ...r, status: 'cancelled' } : r
      ));
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Error cancelling reservation');
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    // 1. Check Search Term
    const userName = reservation.user?.username || '';
    const userEmail = reservation.user?.email || '';
    const courtName = reservation.court?.name || reservation.court || '';
    const searchMatch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courtName.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Check Status Filter
    const statusMatch = statusFilter === 'all' || reservation.status === statusFilter;

    return searchMatch && statusMatch;
  });

  return (
    <Container>
      <Controls>
        <SearchBox>
          <SearchInput
            type="text"
            placeholder="Search reservations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SearchIcon>
            <FiSearch />
          </SearchIcon>
        </SearchBox>
        <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </FilterSelect>
      </Controls>

      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Court</TableHeaderCell>
              <TableHeaderCell>Date & Time</TableHeaderCell>
              <TableHeaderCell>Amount</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {filteredReservations.map((reservation) => (
              <TableRow key={reservation._id}>
                <TableCell>#{reservation._id}</TableCell>
                <TableCell>
                  <div>
                    <div style={{ fontWeight: 600 }}>{reservation.user?.username || 'Unknown User'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      {reservation.user?.email || 'No email'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{reservation.court?.name || 'Unknown Court'}</TableCell>
                <TableCell>
                  <div>{new Date(reservation.date).toLocaleDateString()}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {reservation.startTime} - {reservation.endTime}
                  </div>
                </TableCell>
                <TableCell>
                  <div>NPR {reservation.totalPrice || 0}</div>
                  {reservation.status === 'cancelled' && reservation.refundAmount > 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#e63946', marginTop: '4px', fontWeight: 600 }}>
                      Refund: NPR {reservation.refundAmount}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={reservation.status}>
                    {reservation.status}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <ActionButtons>
                    <ActionButton onClick={() => handleView(reservation._id)}>
                      <FiEye />
                    </ActionButton>
                    <ActionButton onClick={() => handleEdit(reservation._id)}>
                      <FiEdit2 />
                    </ActionButton>
                    {reservation.status === 'pending' && (
                      <>
                        <ActionButton onClick={() => handleConfirm(reservation._id)}>
                          <FiCheck />
                        </ActionButton>
                        <ActionButton onClick={() => handleCancel(reservation._id)}>
                          <FiX />
                        </ActionButton>
                      </>
                    )}
                    <ActionButton danger onClick={() => handleDelete(reservation._id)}>
                      <FiTrash2 />
                    </ActionButton>
                  </ActionButtons>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      <Pagination>
        <PaginationInfo>
          Showing {filteredReservations.length} reservations
        </PaginationInfo>
        <PaginationControls>
          <PaginationButton
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </PaginationButton>
          <PaginationButton
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </PaginationButton>
        </PaginationControls>
      </Pagination>
    </Container>
  );
};

export default ManageReservations;
