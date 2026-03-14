import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiHome, FiCalendar, FiUsers, FiSettings, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import AdminDashboard from '../components/admin/AdminDashboard';
import ManageReservations from '../components/admin/ManageReservations';
import ManageUsers from '../components/admin/ManageUsers';
import ManageCourts from '../components/admin/ManageCourts';
import Settings from '../components/admin/Settings';

const AdminContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const Sidebar = styled.div`
  width: ${props => props.collapsed ? '80px' : '250px'};
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transition: width 0.3s ease;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
`;

const SidebarHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.h2`
  margin: 0;
  font-size: ${props => props.collapsed ? '1.2rem' : '1.5rem'};
  transition: font-size 0.3s ease;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 5px;
  border-radius: 5px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgba(255,255,255,0.1);
  }
`;

const NavMenu = styled.nav`
  padding: 20px 0;
`;

const NavItem = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  border-left: 4px solid ${props => props.active ? '#fff' : 'transparent'};

  &:hover {
    background-color: rgba(255,255,255,0.1);
  }

  svg {
    margin-right: ${props => props.collapsed ? '0' : '15px'};
    font-size: 1.2rem;
  }
`;

const NavText = styled.span`
  font-size: 0.95rem;
  display: ${props => props.collapsed ? 'none' : 'block'};
`;

const MainContent = styled.div`
  flex: 1;
  padding: 30px;
  overflow-y: auto;
`;

const Header = styled.div`
  background: white;
  padding: 20px 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  color: #333;
  font-size: 2rem;
`;

const LogoutButton = styled.button`
  background: #ff4757;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s ease;

  &:hover {
    background: #ff3838;
  }
`;

const ContentArea = styled.div`
  background: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  min-height: 600px;
`;

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
    { id: 'reservations', label: 'Reservations', icon: FiCalendar },
    { id: 'users', label: 'Users', icon: FiUsers },
    { id: 'courts', label: 'Courts', icon: FiSettings },
    { id: 'settings', label: 'Settings', icon: FiSettings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'reservations':
        return <ManageReservations />;
      case 'users':
        return <ManageUsers />;
      case 'courts':
        return <ManageCourts />;
      case 'settings':
        return <Settings />;
      default:
        return <AdminDashboard />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth';
  };

  return (
    <AdminContainer>
      <Sidebar collapsed={collapsed}>
        <SidebarHeader>
          <Logo collapsed={collapsed}>Admin</Logo>
          <ToggleButton onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <FiMenu /> : <FiX />}
          </ToggleButton>
        </SidebarHeader>
        <NavMenu>
          {menuItems.map(item => (
            <NavItem
              key={item.id}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              collapsed={collapsed}
            >
              <item.icon />
              <NavText collapsed={collapsed}>{item.label}</NavText>
            </NavItem>
          ))}
        </NavMenu>
      </Sidebar>

      <MainContent>
        <Header>
          <HeaderTitle>
            {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
          </HeaderTitle>
          <LogoutButton onClick={handleLogout}>
            <FiLogOut />
            Logout
          </LogoutButton>
        </Header>

        <ContentArea>
          {renderContent()}
        </ContentArea>
      </MainContent>
    </AdminContainer>
  );
};

export default Admin;
