import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiSearch, FiUserPlus, FiEdit2, FiTrash2, FiShield, FiUser, FiX, FiCheck } from 'react-icons/fi';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

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

const AddUserButton = styled.button`
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
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  color: #333;
  cursor: pointer;
  transition: border-color 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;

  &:focus, &:hover {
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
`;

const TableHeaderCell = styled.th`
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e1e5e9;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #333;
`;

const UserEmail = styled.div`
  font-size: 0.85rem;
  color: #666;
`;

const RoleBadge = styled.span`
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => props.role === 'admin' ? '#667eea' : '#e2e3e5'};
  color: ${props => props.role === 'admin' ? 'white' : '#383d41'};
  display: inline-flex;
  align-items: center;
  gap: 5px;
`;

const StatusBadge = styled.span`
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => props.active ? '#d4edda' : '#f8d7da'};
  color: ${props => props.active ? '#155724' : '#721c24'};
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

const ManageUsers = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/api/admin/users', { token });
        setUsers(response.data);
        setTotalPages(Math.ceil(response.data.length / 10));
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleEdit = (id) => {
    console.log('Edit user:', id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiClient.delete(`/api/admin/users/${id}`, { token });
        setUsers(users.filter(u => u._id !== id));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const user = users.find(u => u._id === id);
      const newStatus = !user.isverified;
      
      await apiClient.patch(`/api/admin/users/${id}/status`, { 
        body: { isverified: newStatus },
        token 
      });
      
      setUsers(users.map(u => 
        u._id === id ? { ...u, isverified: newStatus } : u
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <Container>
      <Header>
        <Title>User Management</Title>
        <AddUserButton>
          <FiUserPlus />
          Add User
        </AddUserButton>
      </Header>

      <Controls>
        <SearchBox>
          <SearchInput
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SearchIcon>
            <FiSearch />
          </SearchIcon>
        </SearchBox>
        <FilterSelect
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </FilterSelect>
      </Controls>

      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Join Date</TableHeaderCell>
              <TableHeaderCell>Reservations</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  <UserInfo>
                    <UserAvatar>
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </UserAvatar>
                    <UserDetails>
                      <UserName>{user.username}</UserName>
                      <UserEmail>{user.email}</UserEmail>
                    </UserDetails>
                  </UserInfo>
                </TableCell>
                <TableCell>
                  <RoleBadge role={user.role}>
                    {user.role === 'admin' ? <FiShield /> : <FiUser />}
                    {user.role}
                  </RoleBadge>
                </TableCell>
                <TableCell>
                  <StatusBadge active={user.isverified}>
                    {user.isverified ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>-</TableCell>
                <TableCell>
                  <ActionButtons>
                    <ActionButton onClick={() => handleEdit(user._id)}>
                      <FiEdit2 />
                    </ActionButton>
                    <ActionButton 
                      onClick={() => handleToggleStatus(user._id)}
                      title={user.isverified ? 'Deactivate' : 'Activate'}
                    >
                      {user.isverified ? <FiX /> : <FiCheck />}
                    </ActionButton>
                    <ActionButton danger onClick={() => handleDelete(user._id)}>
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
          Showing {filteredUsers.length} users
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

export default ManageUsers;
