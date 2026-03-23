import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiClient } from '../services/apiClient.js';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user, logout, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    
    apiClient.get('/api/reservations', { token })
      .then(data => {
        const rawRes = Array.isArray(data) ? data : [];
        
        // Group reservations by pidx (if they have one) so Multi-Day bookings appear as 1 ticket
        const grouped = [];
        const pidxMap = {};

        rawRes.forEach(res => {
          if (!res.pidx) {
            // Legacy or no pidx, push as individual
            grouped.push({ ...res, isGroup: false });
          } else {
            if (!pidxMap[res.pidx]) {
              pidxMap[res.pidx] = {
                ...res,
                isGroup: true,
                groupCount: 1,
                allDates: [new Date(res.date)],
                summedPrice: res.totalPrice || 0,
                childIds: [res._id]
              };
              grouped.push(pidxMap[res.pidx]);
            } else {
              pidxMap[res.pidx].groupCount += 1;
              pidxMap[res.pidx].allDates.push(new Date(res.date));
              pidxMap[res.pidx].summedPrice += (res.totalPrice || 0);
              pidxMap[res.pidx].childIds.push(res._id);
            }
          }
        });

        // Sort allDates to find start/end range
        grouped.forEach(g => {
          if (g.isGroup && g.allDates.length > 1) {
            g.allDates.sort((a, b) => a - b);
            g.startDate = g.allDates[0];
            g.endDate = g.allDates[g.allDates.length - 1];
          }
        });

        setReservations(grouped);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load reservations:', err);
        setLoading(false);
      });
  }, [token]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return '#34d399';
      case 'pending': return '#fbbf24';
      case 'cancelled': return '#f87171';
      default: return '#9ca3af';
    }
  };

const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleCancelBooking = async (reservationObj) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      // If it's a group, we cancel ALL child reservations in the group
      const idsToCancel = reservationObj.isGroup ? reservationObj.childIds : [reservationObj._id];

      await Promise.all(idsToCancel.map(id => 
        apiClient.put(`/api/reservations/${id}/cancel`, { token })
      ));

      // Update local state to show it cancelled immediately
      setReservations(prev => 
        prev.map(res => res._id === reservationObj._id ? { ...res, status: 'cancelled' } : res)
      );
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('Failed to cancel booking. It may have already been processed.');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // basic validation
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Compress image using canvas
      const compressedBase64 = await compressImage(file, 400, 400);

      // Upload to backend
      const response = await apiClient.put('/api/auth/profile/avatar', {
        token,
        body: { avatar: compressedBase64 }
      });

      // Update local context
      updateUser({ avatar: compressedBase64 });
    } catch (error) {
      console.error('Avatar upload failed:', error);
      alert('Failed to upload avatar. Please try a smaller image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Helper to resize/compress images for quick db storage
  const compressImage = (file, maxWidth, maxHeight) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8)); // 80% quality jpeg
      };
      img.onerror = reject;
    });
  };

  return (
    <div className={styles.dashboardShell}>
      {/* Top Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navBrand}>
          <span className={styles.navLogo}>⚽</span>
          <span>Himalayan <strong>Futsal</strong></span>
        </div>
        <div className={styles.navLinks}>
          <a className={styles.navLink} href="/">Home</a>
          <a className={styles.navLink} href="/reservations">Book Courts</a>
          <a className={`${styles.navLink} ${styles.navLinkActive}`} href="/dashboard">My Bookings</a>
          {user?.role === 'admin' && (
            <a className={styles.navLink} href="/admin" style={{ color: '#f97316', fontWeight: 600 }}>Admin Panel</a>
          )}
        </div>
        <div className={styles.navRight}>
          <button className={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </nav>

      <main className={styles.main}>
        <header className={styles.dashboardHeader}>
          <div>
            <h2 className={styles.dashboardTitle}>Welcome back, {user?.username || 'Player'}!</h2>
            <p className={styles.dashboardSub}>Here are your recent bookings and account details.</p>
          </div>
          <button className={styles.primaryBtn} onClick={() => navigate('/reservations')}>
            Book New Court
          </button>
        </header>

        <div className={styles.grid}>
          {/* Left Column: Bookings */}
          <div className={styles.bookingsCol}>
            <h3 className={styles.sectionTitle}>📅 My Bookings</h3>
            
            {loading ? (
              <p className={styles.mutedText}>Loading your reservations...</p>
            ) : reservations.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🏟️</div>
                <p>You have no upcoming bookings yet.</p>
                <button className={styles.outlineBtn} onClick={() => navigate('/reservations')}>
                  Make your first booking
                </button>
              </div>
            ) : (
              <div className={styles.bookingsList}>
                {reservations.map(res => (
                  <div key={res._id} className={styles.bookingCard}>
                    <div className={styles.bookingCardTop}>
                      <div>
                        <h4 className={styles.courtName}>{res.court?.name || 'Futsal Court'}</h4>
                        <p className={styles.dateText}>
                          {res.isGroup && res.groupCount > 1 ? (
                            <>
                              {res.startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {res.endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} 
                              <span style={{color:'#f97316', marginLeft:'6px'}}>({res.groupCount} Days)</span> • {res.startTime}–{res.endTime}
                            </>
                          ) : (
                            <>
                              {new Date(res.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} • {res.startTime}–{res.endTime}
                            </>
                          )}
                        </p>
                      </div>
                      <span 
                        className={styles.statusBadge}
                        style={{ 
                          color: getStatusColor(res.status), 
                          background: `${getStatusColor(res.status)}15`,
                          border: `1px solid ${getStatusColor(res.status)}40`
                        }}
                      >
                        {res.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                    <div className={styles.bookingCardBottom}>
                      <div className={styles.infoRow}>
                        <span>Player:</span> {res.name}
                      </div>
                      <div className={styles.infoRow}>
                        <span>Contact:</span> {res.contact}
                      </div>
                      <div className={styles.priceRow}>
                        NPR {res.isGroup ? Math.round(res.summedPrice) : Math.round(res.totalPrice || 1500)}
                        {res.status === 'pending' && (
                          <button 
                            className={styles.cancelBtnText} 
                            onClick={() => handleCancelBooking(res)}
                            title="Cancel this booking"
                          >
                            ✖ Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Profile details */}
          <div className={styles.profileCol}>
            <h3 className={styles.sectionTitle}>👤 Profile</h3>
            <div className={styles.profileCard}>
              <div 
                className={`${styles.avatarLarge} ${uploadingAvatar ? styles.uploading : ''}`}
                onClick={handleAvatarClick}
                title="Click to change profile picture"
              >
                {uploadingAvatar ? (
                  <span className={styles.spinnerSmall} />
                ) : user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className={styles.avatarImg} />
                ) : (
                  user?.username ? user.username.charAt(0).toUpperCase() : 'U'
                )}
                <div className={styles.avatarOverlay}>
                  <span>📷</span>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              
              <h4 className={styles.profileName}>{user?.username || 'User'}</h4>
              <p className={styles.profileEmail}>{user?.email || 'No email provided'}</p>
              
              <div className={styles.statsRow}>
                <div className={styles.statBox}>
                  <strong>{reservations.length}</strong>
                  <span>Total Bookings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
