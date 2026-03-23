import React, { useState } from 'react';
import styled from 'styled-components';
import { FiSave, FiBell, FiLock, FiDatabase, FiGlobe } from 'react-icons/fi';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const Title = styled.h2`
  margin: 0;
  color: #333;
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const SettingsCard = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f8f9fa;
`;

const CardIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
`;

const CardTitle = styled.h3`
  margin: 0;
  color: #333;
  font-size: 1.2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 600;
  font-size: 0.95rem;
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 12px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 0.95rem;
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
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
`;

const SwitchLabel = styled.span`
  color: #333;
  font-weight: 600;
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: #667eea;
  }

  &:checked + span:before {
    transform: translateX(26px);
  }
`;

const SwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
`;

const SaveButton = styled.button`
  padding: 12px 30px;
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

const CancelButton = styled.button`
  padding: 12px 30px;
  background: white;
  color: #666;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    border-color: #667eea;
    color: #667eea;
  }
`;

const Settings = () => {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Futsal Reservation System',
    siteEmail: 'admin@futsal.com',
    language: 'English'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    bookingConfirmations: true,
    paymentAlerts: true,
    maintenanceAlerts: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordExpiry: '90',
    maxLoginAttempts: '5'
  });

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false
  });

  const handleSave = () => {
    console.log('Saving settings...');
    // Add actual save logic here
    alert('Settings saved successfully!');
  };

  const handleCancel = () => {
    console.log('Canceling changes...');
    // Add actual cancel logic here
  };

  return (
    <Container>
      <Title>System Settings</Title>

      <SettingsGrid>
        <SettingsCard>
          <CardHeader>
            <CardIcon>
              <FiGlobe />
            </CardIcon>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          
          <FormGroup>
            <Label>Site Name</Label>
            <Input
              type="text"
              value={generalSettings.siteName}
              onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
            />
          </FormGroup>

          <FormGroup>
            <Label>Site Email</Label>
            <Input
              type="email"
              value={generalSettings.siteEmail}
              onChange={(e) => setGeneralSettings({...generalSettings, siteEmail: e.target.value})}
            />
          </FormGroup>
        </SettingsCard>

        <SettingsCard>
          <CardHeader>
            <CardIcon>
              <FiBell />
            </CardIcon>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>

          <SwitchContainer>
            <SwitchLabel>Email Notifications</SwitchLabel>
            <Switch>
              <SwitchInput
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
              />
              <SwitchSlider />
            </Switch>
          </SwitchContainer>

          <SwitchContainer>
            <SwitchLabel>SMS Notifications</SwitchLabel>
            <Switch>
              <SwitchInput
                type="checkbox"
                checked={notificationSettings.smsNotifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, smsNotifications: e.target.checked})}
              />
              <SwitchSlider />
            </Switch>
          </SwitchContainer>

          <SwitchContainer>
            <SwitchLabel>Booking Confirmations</SwitchLabel>
            <Switch>
              <SwitchInput
                type="checkbox"
                checked={notificationSettings.bookingConfirmations}
                onChange={(e) => setNotificationSettings({...notificationSettings, bookingConfirmations: e.target.checked})}
              />
              <SwitchSlider />
            </Switch>
          </SwitchContainer>

          <SwitchContainer>
            <SwitchLabel>Payment Alerts</SwitchLabel>
            <Switch>
              <SwitchInput
                type="checkbox"
                checked={notificationSettings.paymentAlerts}
                onChange={(e) => setNotificationSettings({...notificationSettings, paymentAlerts: e.target.checked})}
              />
              <SwitchSlider />
            </Switch>
          </SwitchContainer>

          <SwitchContainer>
            <SwitchLabel>Maintenance Alerts</SwitchLabel>
            <Switch>
              <SwitchInput
                type="checkbox"
                checked={notificationSettings.maintenanceAlerts}
                onChange={(e) => setNotificationSettings({...notificationSettings, maintenanceAlerts: e.target.checked})}
              />
              <SwitchSlider />
            </Switch>
          </SwitchContainer>
        </SettingsCard>

        <SettingsCard>
          <CardHeader>
            <CardIcon>
              <FiLock />
            </CardIcon>
            <CardTitle>Security Settings</CardTitle>
          </CardHeader>

          <SwitchContainer>
            <SwitchLabel>Two-Factor Authentication</SwitchLabel>
            <Switch>
              <SwitchInput
                type="checkbox"
                checked={securitySettings.twoFactorAuth}
                onChange={(e) => setSecuritySettings({...securitySettings, twoFactorAuth: e.target.checked})}
              />
              <SwitchSlider />
            </Switch>
          </SwitchContainer>

          <FormGroup>
            <Label>Session Timeout (minutes)</Label>
            <Input
              type="number"
              value={securitySettings.sessionTimeout}
              onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: e.target.value})}
            />
          </FormGroup>

          <FormGroup>
            <Label>Password Expiry (days)</Label>
            <Input
              type="number"
              value={securitySettings.passwordExpiry}
              onChange={(e) => setSecuritySettings({...securitySettings, passwordExpiry: e.target.value})}
            />
          </FormGroup>

          <FormGroup>
            <Label>Max Login Attempts</Label>
            <Input
              type="number"
              value={securitySettings.maxLoginAttempts}
              onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: e.target.value})}
            />
          </FormGroup>
        </SettingsCard>

        <SettingsCard>
          <CardHeader>
            <CardIcon>
              <FiDatabase />
            </CardIcon>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>

          <SwitchContainer>
            <SwitchLabel>Maintenance Mode</SwitchLabel>
            <Switch>
              <SwitchInput
                type="checkbox"
                checked={systemSettings.maintenanceMode}
                onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
              />
              <SwitchSlider />
            </Switch>
          </SwitchContainer>
        </SettingsCard>
      </SettingsGrid>

      <ButtonContainer>
        <CancelButton onClick={handleCancel}>Cancel</CancelButton>
        <SaveButton onClick={handleSave}>
          <FiSave />
          Save Changes
        </SaveButton>
      </ButtonContainer>
    </Container>
  );
};

export default Settings;
