import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiUsers, FiCalendar, FiTrendingUp, FiDollarSign } from 'react-icons/fi';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

const DashboardContainer = styled.div`
  display: grid;
  gap: 30px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, ${props => props.color} 0%, ${props => props.colorDark} 100%);
  color: white;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const StatIcon = styled.div`
  font-size: 2rem;
  opacity: 0.8;
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
`;

const RecentActivity = styled.div`
  background: white;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ActivityItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid ${props => props.color};
`;

const ActivityText = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
`;

const ActivityTime = styled.div`
  font-size: 0.85rem;
  color: #666;
`;

const ActivityStatus = styled.span`
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => props.status === 'completed' ? '#d4edda' : '#fff3cd'};
  color: ${props => props.status === 'completed' ? '#155724' : '#856404'};
`;

const AdminDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReservations: 0,
    totalRevenue: 0,
    activeCourts: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats
        const statsResponse = await apiClient.get('/api/admin/stats', { token });
        setStats(statsResponse.data);

        // Fetch recent reservations for activity feed
        const reservationsResponse = await apiClient.get('/api/admin/reservations', { token });
        const reservations = reservationsResponse.data.slice(0, 5);
        
        // Transform reservations into activity items
        const activityItems = reservations.map(reservation => ({
          id: reservation._id,
          title: `New reservation by ${reservation.user?.username || 'Unknown User'}`,
          time: new Date(reservation.createdAt).toLocaleString(),
          status: reservation.status === 'confirmed' ? 'completed' : 'pending',
          color: reservation.status === 'confirmed' ? '#28a745' : '#ffc107'
        }));

        setRecentActivity(activityItems);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to mock data if API fails
        setStats({
          totalUsers: 0,
          totalReservations: 0,
          totalRevenue: 0,
          activeCourts: 0
        });
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  return (
    <DashboardContainer>
      <StatsGrid>
        <StatCard color="#667eea" colorDark="#764ba2">
          <StatHeader>
            <StatIcon><FiUsers /></StatIcon>
          </StatHeader>
          <StatValue>{stats.totalUsers.toLocaleString()}</StatValue>
          <StatLabel>Total Users</StatLabel>
        </StatCard>

        <StatCard color="#f093fb" colorDark="#f5576c">
          <StatHeader>
            <StatIcon><FiCalendar /></StatIcon>
          </StatHeader>
          <StatValue>{stats.totalReservations.toLocaleString()}</StatValue>
          <StatLabel>Total Reservations</StatLabel>
        </StatCard>

        <StatCard color="#4facfe" colorDark="#00f2fe">
          <StatHeader>
            <StatIcon><FiDollarSign /></StatIcon>
          </StatHeader>
          <StatValue>${stats.totalRevenue.toLocaleString()}</StatValue>
          <StatLabel>Total Revenue</StatLabel>
        </StatCard>

        <StatCard color="#43e97b" colorDark="#38f9d7">
          <StatHeader>
            <StatIcon><FiTrendingUp /></StatIcon>
          </StatHeader>
          <StatValue>{stats.activeCourts}</StatValue>
          <StatLabel>Active Courts</StatLabel>
        </StatCard>
      </StatsGrid>

      <RecentActivity>
        <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '1.2rem' }}>Recent Activity</h3>
        <ActivityList>
          {recentActivity.map(activity => (
            <ActivityItem key={activity.id} color={activity.color}>
              <ActivityText>
                <ActivityTitle>{activity.title}</ActivityTitle>
                <ActivityTime>{activity.time}</ActivityTime>
              </ActivityText>
              <ActivityStatus status={activity.status}>
                {activity.status}
              </ActivityStatus>
            </ActivityItem>
          ))}
        </ActivityList>
      </RecentActivity>
    </DashboardContainer>
  );
};

export default AdminDashboard;
