// UpgradePlanModal.js / PaymentForm.js

import React, { useState } from 'react';

export default function UpgradePlanModal({ currentUser, onClose }) {
  const [trxId, setTrxId] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Image ko Base64 mein convert karne ka helper
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPayment = (e) => {
    e.preventDefault();
    if (!trxId && !proofImage) {
      setMessage('Please enter TRX ID or upload screenshot');
      return;
    }

    setLoading(true);

    // Fixed Structure: Status ko strictly 'pending' rakha hai
    const newRequest = {
      id: 'REQ_' + Date.now(),
      userId: currentUser?.id || 'USR_GUEST',
      userName: currentUser?.name || 'Trading User',
      userEmail: currentUser?.email || 'user@example.com',
      trxId: trxId,
      proofImage: proofImage,
      plan: 'VIP Plan',
      status: 'pending', // Important Fix: Same status tag for Admin fetch
      submittedAt: new Date().toISOString()
    };

    // LocalStorage Sync (agar Supabase/Firebase use kar rahe hain to wahan insert karein)
    const existingRequests = JSON.parse(localStorage.getItem('payment_verifications') || '[]');
    existingRequests.push(newRequest);
    localStorage.setItem('payment_verifications', JSON.stringify(existingRequests));

    // Event Trigger taake Admin Panel bina reload ke refresh ho jaye
    window.dispatchEvent(new Event('paymentSubmitted'));

    setLoading(false);
    setMessage('Payment submitted successfully! Status: Under Review');
    setTrxId('');
    setProofImage('');

    setTimeout(() => {
      if (onClose) onClose();
    }, 1500);
  };

  return (
    <div className="payment-modal">
      <h2>Upgrade to VIP Plan</h2>
      {message && <p className="msg">{message}</p>}
      <form onSubmit={handleSubmitPayment}>
        <div>
          <label>Transaction ID (Trx ID):</label>
          <input
            type="text"
            value={trxId}
            onChange={(e) => setTrxId(e.target.value)}
            placeholder="Enter TRX ID"
          />
        </div>
        <div>
          <label>Payment Screenshot:</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Payment Proof'}
        </button>
      </form>
    </div>
  );
}

// AdminPendingPayments.js

import React, { useState, useEffect } from 'react';

export default function AdminPendingPayments() {
  const [pendingList, setPendingList] = useState([]);

  // Load Pending Requests
  const loadRequests = () => {
    const allRequests = JSON.parse(localStorage.getItem('payment_verifications') || '[]');
    
    // Bug Fix: Filter matching both 'pending' and 'inreview' statuses
    const filtered = allRequests.filter(
      (item) => item.status === 'pending' || item.status === 'inreview'
    );
    
    setPendingList(filtered);
  };

  useEffect(() => {
    loadRequests();

    // Listener for Realtime Update jab user submit kare
    window.addEventListener('paymentSubmitted', loadRequests);
    return () => window.removeEventListener('paymentSubmitted', loadRequests);
  }, []);

  // Status Change Handler (Approve / Reject)
  const handleStatusUpdate = (reqId, newStatus) => {
    const allRequests = JSON.parse(localStorage.getItem('payment_verifications') || '[]');
    const updated = allRequests.map((item) => {
      if (item.id === reqId) {
        return { ...item, status: newStatus };
      }
      return item;
    });

    localStorage.setItem('payment_verifications', JSON.stringify(updated));
    loadRequests(); // UI Refresh
  };

  return (
    <div style={{ marginTop: '20px', padding: '15px', background: '#13111C', borderRadius: '8px' }}>
      <h3 style={{ color: '#FFB800' }}>💳 Admin: Pending Payment Verifications</h3>

      {pendingList.length === 0 ? (
        <p style={{ color: '#aaa' }}>No pending verification requests.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {pendingList.map((req) => (
            <div
              key={req.id}
              style={{
                background: '#1D1A2B',
                padding: '12px',
                borderRadius: '6px',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>User: {req.userName} ({req.userEmail})</p>
                <p style={{ margin: '4px 0', fontSize: '13px', color: '#ccc' }}>TRX ID: {req.trxId || 'N/A'}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                  Time: {new Date(req.submittedAt).toLocaleString()}
                </p>
                {req.proofImage && (
                  <a
                    href={req.proofImage}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#00BFFF', fontSize: '12px', textDecoration: 'underline' }}
                  >
                    View Screenshot
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleStatusUpdate(req.id, 'approved')}
                  style={{ background: '#28a745', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate(req.id, 'rejected')}
                  style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
