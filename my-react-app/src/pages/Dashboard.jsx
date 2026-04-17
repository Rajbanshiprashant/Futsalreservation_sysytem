import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiClient } from '../services/apiClient.js';
import styles from './Dashboard.module.css';

// Helper: compute hours remaining until booking start
function hoursUntilStart(dateStr, startTime) {
  const bookingStart = new Date(`${new Date(dateStr).toISOString().slice(0, 10)}T${startTime}:00`);
  return (bookingStart - new Date()) / (1000 * 60 * 60);
}

export default function Dashboard() {
  const { user, logout, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  // Cancellation modal state
  const [cancelModal, setCancelModal] = useState(null); // { res, refundAmt, fee, cancelling }
  const [cancelResult, setCancelResult] = useState(null); // { refund } after success

  useEffect(() => {
    if (!token) return;
    
    apiClient.get('/api/reservations', { token })
      .then(data => {
        const rawRes = Array.isArray(data) ? data : [];
        
        // Group reservations by stripeSessionId (if they have one) so Multi-Day bookings appear as 1 ticket
        const grouped = [];
        const sessionMap = {};

        rawRes.forEach(res => {
          if (!res.stripeSessionId) {
            // Legacy or no stripeSessionId, push as individual
            grouped.push({ ...res, isGroup: false });
          } else {
            if (!sessionMap[res.stripeSessionId]) {
              sessionMap[res.stripeSessionId] = {
                ...res,
                isGroup: true,
                groupCount: 1,
                allDates: [new Date(res.date)],
                summedPrice: res.totalPrice || 0,
                childIds: [res._id]
              };
              grouped.push(sessionMap[res.stripeSessionId]);
            } else {
              sessionMap[res.stripeSessionId].groupCount += 1;
              sessionMap[res.stripeSessionId].allDates.push(new Date(res.date));
              sessionMap[res.stripeSessionId].summedPrice += (res.totalPrice || 0);
              sessionMap[res.stripeSessionId].childIds.push(res._id);
            }
          }
        });

        // Sort allDates to find start/end range — do this for ALL groups, even single-day ones
        grouped.forEach(g => {
          if (g.isGroup && g.allDates?.length > 0) {
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

  // Open cancellation modal — pre-compute refund amounts client-side for display
  const openCancelModal = (reservationObj) => {
    const price = reservationObj.isGroup
      ? Math.round(reservationObj.summedPrice)
      : Math.round(reservationObj.totalPrice || 0);
    const fee = Math.round(price * 0.20);
    const refund = Math.round(price * 0.80);
    setCancelModal({ res: reservationObj, price, fee, refund, cancelling: false });
  };

  const handleCancelBooking = async () => {
    if (!cancelModal) return;
    const { res: reservationObj } = cancelModal;
    setCancelModal(m => ({ ...m, cancelling: true }));

    try {
      const idsToCancel = reservationObj.isGroup ? reservationObj.childIds : [reservationObj._id];

      const results = await Promise.all(
        idsToCancel.map(id => apiClient.put(`/api/reservations/${id}/cancel`, { token }))
      );

      // Use refund data from first result
      const refundData = results[0]?.refund;

      // Update local state to show cancelled
      setReservations(prev =>
        prev.map(res => res._id === reservationObj._id
          ? { ...res, status: 'cancelled', refundAmount: refundData?.refundAmount || cancelModal.refund }
          : res
        )
      );

      setCancelModal(null);
      setCancelResult(refundData || { refundAmount: cancelModal.refund, cancellationFee: cancelModal.fee });
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      setCancelModal(m => ({ ...m, cancelling: false }));
      alert(error.message || 'Failed to cancel booking. It may have already been cancelled or the 12-hour deadline has passed.');
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
                  {reservations.map(res => {
                    const isCancellable = ['pending', 'confirmed'].includes(res.status);
                    const price = res.isGroup ? Math.round(res.summedPrice) : Math.round(res.totalPrice || 0);
                    // Use startDate for groups (always set now), fall back to res.date for non-groups
                    const displayDate = (res.isGroup && res.startDate) ? res.startDate : res.date;
                    const displayTime = res.startTime || '00:00';
                    const hrs = displayDate ? hoursUntilStart(displayDate, displayTime) : 999;
                    const nearCutoff = hrs > 0 && hrs < 24;
                    const pastCutoff = hrs < 12 && hrs > 0;

                    return (
                      <div key={res._id} className={`${styles.bookingCard} ${res.status === 'cancelled' ? styles.bookingCardCancelled : ''}`}>
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
                            {/* 12-hour warning */}
                            {isCancellable && nearCutoff && (
                              <p className={`${styles.cutoffWarning} ${pastCutoff ? styles.cutoffPast : ''}`}>
                                {pastCutoff
                                  ? '⛔ Cannot cancel — less than 12 hours until booking'
                                  : `⚠️ Less than 24 hrs left — cancel before the 12-hour cutoff`
                                }
                              </p>
                            )}
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
                            <span>NPR {price}</span>
                            {/* Show refund info on cancelled bookings */}
                            {res.status === 'cancelled' && res.refundAmount > 0 && (
                              <span className={styles.refundBadge}>
                                💰 Refund: NPR {Math.round(res.refundAmount)}
                              </span>
                            )}
                            {/* Cancel button — only for pending/confirmed and not past deadline */}
                            {isCancellable && !pastCutoff && (
                              <button 
                                className={styles.cancelBtnText} 
                                onClick={() => openCancelModal(res)}
                                title="Cancel this booking"
                              >
                                ✖ Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

      {/* ── Cancellation Modal ── */}
      {cancelModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.cancelModal}>
            <p className={styles.modalEyebrow}>⚠️ Cancel Booking</p>
            <h3 className={styles.modalTitle}>Are you sure?</h3>
            <p className={styles.modalSub}>
              {cancelModal.res.court?.name || 'Futsal Court'} · {cancelModal.res.startTime}–{cancelModal.res.endTime}
            </p>

            <div className={styles.refundBreakdown}>
              <div className={styles.refundRow}>
                <span>Original Amount</span>
                <span>NPR {cancelModal.price}</span>
              </div>
              <div className={styles.refundRow} style={{ color: '#f87171' }}>
                <span>Cancellation Fee (20%)</span>
                <span>− NPR {cancelModal.fee}</span>
              </div>
              <div className={`${styles.refundRow} ${styles.refundTotal}`}>
                <span>💰 You Get Back</span>
                <span>NPR {cancelModal.refund}</span>
              </div>
            </div>

            <p className={styles.refundNote}>
              Refund will be processed within 5–7 business days to your original payment method.
            </p>

            <div className={styles.modalActions}>
              <button
                className={styles.modalBack}
                onClick={() => setCancelModal(null)}
                disabled={cancelModal.cancelling}
              >
                Keep Booking
              </button>
              <button
                className={styles.modalConfirmRed}
                onClick={handleCancelBooking}
                disabled={cancelModal.cancelling}
              >
                {cancelModal.cancelling ? 'Cancelling…' : 'Yes, Cancel & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Success Toast ── */}
      {cancelResult && (
        <div className={styles.toastOverlay} onClick={() => setCancelResult(null)}>
          <div className={styles.toast}>
            <p className={styles.toastIcon}>✅</p>
            <h4 className={styles.toastTitle}>Booking Cancelled</h4>
            <p className={styles.toastBody}>
              NPR {cancelResult.refundAmount} will be refunded within 5–7 business days.
            </p>
            <p className={styles.toastSub}>Tap anywhere to dismiss</p>
          </div>
        </div>
      )}
    </div>
  );
}
