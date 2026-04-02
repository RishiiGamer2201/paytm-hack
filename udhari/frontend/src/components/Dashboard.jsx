import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IndianRupee, Bell, Plus, Activity, CheckCircle, Clock } from 'lucide-react';
import AddUdharModal from './AddUdharModal';

const API_BASE = 'http://localhost:5000/api';

const Dashboard = () => {
  const [udhars, setUdhars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeIds, setActiveIds] = useState([]);

  const fetchUdhars = async () => {
    try {
      const res = await axios.get(`${API_BASE}/udhar`);
      setUdhars(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUdhars();
  }, []);

  // Initialize activeIds with a random subset that fits constraints on load
  useEffect(() => {
    if (udhars.length > 0 && activeIds.length === 0) {
      // 1. Get shuffle utility
      const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);
      
      const pendingPool = shuffle(udhars.filter(u => u.Status === 'PENDING'));
      const paidPool = shuffle(udhars.filter(u => u.Status === 'PAID'));
      
      let selectedPending = [];
      let pendingSum = 0;
      let targetPendingCount = Math.floor(Math.random() * 2) + 4; // 4 to 5

      for (let record of pendingPool) {
        if (selectedPending.length < targetPendingCount) {
          if (pendingSum + record.Amount <= 2000) {
            selectedPending.push(record);
            pendingSum += record.Amount;
          }
        }
        if (selectedPending.length === targetPendingCount && pendingSum >= 1000) break;
        // If we reached count but sum is too low, keep going/reset if needed (simplified)
      }

      let selectedPaid = [];
      let paidSum = 0;
      // Constraints: paid < unpaid, total 100-200
      let maxPaidCount = selectedPending.length - 1; 

      for (let record of paidPool) {
        if (selectedPaid.length < maxPaidCount) {
          if (paidSum + record.Amount <= 200) {
            selectedPaid.push(record);
            paidSum += record.Amount;
          }
        }
        if (paidSum >= 100) break;
      }

      setActiveIds([...selectedPending, ...selectedPaid].map(u => u._id));
    }
  }, [udhars]);

  const handleRemind = async (id) => {
    try {
      await axios.post(`${API_BASE}/udhar/${id}/remind`);
      fetchUdhars();
    } catch (err) {
      alert('Failed to send reminder');
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await axios.put(`${API_BASE}/udhar/${id}/pay`);
      fetchUdhars();
    } catch (err) {
      alert('Failed to mark as paid');
    }
  };

  // stable subset based on activeIds
  const displayedUdhars = React.useMemo(() => {
    return activeIds
      .map(id => udhars.find(u => u._id === id))
      .filter(Boolean);
  }, [activeIds, udhars]);

  // Metrics calculation from the displayed subset
  const totalPending = displayedUdhars
    .filter(u => u.Status === 'PENDING')
    .reduce((acc, curr) => acc + curr.Amount, 0);

  const totalCollected = displayedUdhars
    .filter(u => u.Status === 'PAID')
    .reduce((acc, curr) => acc + curr.Amount, 0);

  const activeCustomers = new Set(displayedUdhars.filter(u => u.Status === 'PENDING').map(u => u.Customer_Name)).size;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="container">
      <header>
        <div className="brand">
          <Activity color="#00d2ff" size={28} />
          <h1>Udhar Intelligence</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> New Udhar
          </button>
        </div>
      </header>

      <div className="metrics-grid">
        <div className="glass-panel metric-card">
          <div className="metric-title">Total Pending</div>
          <div className="metric-value" style={{ color: 'var(--warning)' }}>
            {formatCurrency(totalPending)}
          </div>
        </div>
        <div className="glass-panel metric-card">
          <div className="metric-title">Total Collected</div>
          <div className="metric-value" style={{ color: 'var(--success)' }}>
             {formatCurrency(totalCollected)}
          </div>
        </div>
        <div className="glass-panel metric-card">
          <div className="metric-title">Active Customers</div>
          <div className="metric-value">
            {activeCustomers}
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Active Udhar Records</h2>
        </div>
        
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Reminders</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedUdhars.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{record.Customer_Name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{record.Customer_Phone}</div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(record.Amount)}</td>
                    <td>{new Date(record.Due_Date).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span className={`status-badge status-${record.Status.toLowerCase()}`}>
                        {record.Status}
                      </span>
                    </td>
                    <td>{record.Reminders_Sent} sent</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {record.Status === 'PENDING' && (
                          <>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                              onClick={() => handleRemind(record._id)}
                              title="Send WhatsApp Reminder"
                            >
                              <Bell size={14} /> Send Link
                            </button>
                            <button 
                              className="btn btn-success" 
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                              onClick={() => handleMarkPaid(record._id)}
                              title="Mark as Paid"
                            >
                              <CheckCircle size={14} /> Paid
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <AddUdharModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={(newRecord) => {
            setIsModalOpen(false);
            fetchUdhars();
            if (newRecord && newRecord._id) {
              setActiveIds(prev => [newRecord._id, ...prev]);
            }
          }} 
        />
      )}
    </div>
  );
};

export default Dashboard;
