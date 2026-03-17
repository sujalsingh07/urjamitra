import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
  @keyframes profileFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

  .profile-shell {
    min-height: 100vh;
    padding: 32px 20px 64px;
    background:
      radial-gradient(circle at top left, rgba(251, 191, 36, 0.22), transparent 28%),
      radial-gradient(circle at bottom right, rgba(249, 115, 22, 0.14), transparent 30%),
      linear-gradient(180deg, #fffdf6 0%, #fff8eb 100%);
    font-family: "DM Sans", "Segoe UI", sans-serif;
  }

  .profile-grid {
    max-width: 720px;
    margin: 0 auto;
    display: block;
  }

  .profile-panel {
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.85);
    border-radius: 28px;
    box-shadow: 0 24px 60px rgba(180, 130, 0, 0.1);
    animation: profileFadeUp 0.55s ease both;
  }

  .profile-input,
  .profile-textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1.5px solid rgba(253, 230, 138, 0.85);
    background: rgba(255, 255, 255, 0.94);
    color: #451a03;
    border-radius: 16px;
    padding: 15px 16px;
    outline: none;
    transition: all 0.25s ease;
    font: inherit;
    font-size: 15px;
    box-shadow: inset 0 1px 2px rgba(120, 53, 15, 0.03);
  }

  .profile-input:focus,
  .profile-textarea:focus {
    border-color: #f59e0b;
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.12);
    transform: translateY(-1px);
  }

  .profile-textarea {
    min-height: 120px;
    resize: vertical;
  }

  .primary-btn {
    border: none;
    border-radius: 16px;
    padding: 16px 20px;
    font: inherit;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    color: white;
    background: linear-gradient(135deg, #f59e0b, #ea580c);
    box-shadow: 0 14px 26px rgba(234, 88, 12, 0.24);
    transition: transform 0.25s ease, box-shadow 0.25s ease, opacity 0.2s ease;
  }

  .primary-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 18px 32px rgba(234, 88, 12, 0.3);
  }

  .secondary-btn {
    border: 1.5px solid rgba(251, 191, 36, 0.5);
    border-radius: 14px;
    padding: 12px 14px;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    color: #9a3412;
    background: rgba(255, 251, 235, 0.9);
    transition: all 0.25s ease;
  }

  .secondary-btn:hover:not(:disabled) {
    background: white;
    border-color: #f59e0b;
    transform: translateY(-1px);
  }

  .secondary-btn:disabled,
  .primary-btn:disabled {
    cursor: not-allowed;
    opacity: 0.72;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 920px) {
    .profile-grid {
      max-width: 100%;
    }
  }
`;

const isTenDigitMobile = (value) => /^\d{10}$/.test(value);
const isValidCoordinate = (value) => typeof value === 'number' && Number.isFinite(value);

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', mobile: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null });
  const accountEmail = user?.email || '';

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
        const latitude = parsed?.location?.latitude;
        const longitude = parsed?.location?.longitude;
        setForm({
          name: parsed.name || '',
          mobile: parsed.mobile || '',
          address: parsed.address === 'Campus' ? '' : (parsed.address || '')
        });
        setCoordinates({
          latitude: isValidCoordinate(latitude) ? latitude : null,
          longitude: isValidCoordinate(longitude) ? longitude : null,
        });
        
        if (!isTenDigitMobile(parsed.mobile || '') || !parsed.address || parsed.address === 'Campus') {
            setError('Please complete your profile to continue.');
        }
      } catch (e) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleMobileChange = (value) => {
    if (value && !/^\d*$/.test(value)) {
      setMobileError('Mobile number can contain digits only.');
      return;
    }

    const nextValue = value.slice(0, 10);
    setForm((prev) => ({ ...prev, mobile: nextValue }));

    if (!nextValue) {
      setMobileError('');
      return;
    }

    setMobileError(nextValue.length === 10 ? '' : 'Mobile number must be exactly 10 digits.');
  };

  const handleUseCurrentLocation = async () => {
    setError('');
    setSuccess('');

    if (!navigator.geolocation) {
      setError('Current location is not supported in this browser.');
      return;
    }

    setLocationLoading(true);
    setLocationStatus('Fetching your location...');

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const latitude = Number(coords.latitude.toFixed(6));
        const longitude = Number(coords.longitude.toFixed(6));

        setCoordinates({ latitude, longitude });

        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          const nextAddress = data.display_name || `${latitude}, ${longitude}`;

          setForm((prev) => ({ ...prev, address: nextAddress }));
          setLocationStatus('Current location added. You can still edit the address manually.');
        } catch (fetchError) {
          setForm((prev) => ({ ...prev, address: `${latitude}, ${longitude}` }));
          setLocationStatus('Coordinates captured. Please review the address before saving.');
        } finally {
          setLocationLoading(false);
        }
      },
      (geoError) => {
        setLocationLoading(false);
        setLocationStatus('');
        setError(geoError.message || 'Unable to fetch your current location.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!form.name || !form.mobile || !form.address) {
      setError('Please fill in all fields.');
      return;
    }

    if (!isTenDigitMobile(form.mobile)) {
      setMobileError('Mobile number must be exactly 10 digits.');
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
      
      const payload = {
        ...form,
        location: isValidCoordinate(coordinates.latitude) && isValidCoordinate(coordinates.longitude)
          ? coordinates
          : undefined,
      };

      const res = await axios.put(`${apiBase}/users/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const updatedUser = { ...user, ...res.data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccess('Profile updated successfully!');
        
        setTimeout(() => {
            navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
       setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <style>{CSS}</style>
      <div className="profile-shell">
        <div className="profile-grid">
          <div className="profile-panel" style={{ padding: 32 }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 28, color: '#451a03', fontWeight: 900, fontFamily: "'Playfair Display',serif" }}>Personal details</h2>
              <p style={{ margin: 0, color: '#92400e', fontSize: 15 }}>
                {error && error === 'Please complete your profile to continue.'
                  ? 'Finish these details once, then the app can place you correctly across the network.'
                  : 'Keep your contact and location details accurate for local trading.'}
              </p>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px 16px', borderRadius: 14, marginBottom: 18, fontSize: 14 }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: 14, marginBottom: 18, fontSize: 14 }}>
                {success}
              </div>
            )}

            {locationStatus && (
              <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', color: '#1d4ed8', padding: '12px 16px', borderRadius: 14, marginBottom: 18, fontSize: 14 }}>
                {locationStatus}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 9, color: '#92400e', fontWeight: 700, fontSize: 14 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={accountEmail}
                  className="profile-input"
                  readOnly
                  disabled
                  placeholder="Email used to sign up"
                  style={{
                    background: 'rgba(255, 251, 235, 0.85)',
                    color: '#78350f',
                    cursor: 'not-allowed',
                    opacity: 1
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 9, color: '#92400e', fontWeight: 700, fontSize: 14 }}>Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="profile-input"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div>
                <div style={{ marginBottom: 9 }}>
                  <label style={{ color: '#92400e', fontWeight: 700, fontSize: 14 }}>Mobile Number</label>
                </div>
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={e => handleMobileChange(e.target.value)}
                  className="profile-input"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                />
                {mobileError && (
                  <div style={{ marginTop: 8, minHeight: 18, fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>
                    {mobileError}
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 9, flexWrap: 'wrap' }}>
                  <label style={{ color: '#92400e', fontWeight: 700, fontSize: 14 }}>Address</label>
                  <button type="button" onClick={handleUseCurrentLocation} disabled={locationLoading} className="secondary-btn">
                    {locationLoading ? 'Locating...' : 'Use current location'}
                  </button>
                </div>
                <textarea
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="profile-textarea"
                  placeholder="Enter your complete residential address or use your current location"
                />
                <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 14, background: 'rgba(255, 251, 235, 0.85)', border: '1px solid rgba(253, 230, 138, 0.7)', color: '#92400e', fontSize: 12, lineHeight: 1.6 }}>
                  Tip: tapping current location fills the address and saves coordinates for the map marker.
                </div>
              </div>

              <button type="submit" disabled={loading || locationLoading} className="primary-btn" style={{ marginTop: 6 }}>
                {loading ? 'Saving profile...' : 'Save profile and continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
