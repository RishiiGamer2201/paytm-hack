import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const AddUdharModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    Customer_Name: '',
    Customer_Phone: '',
    Amount: '',
    Due_Date: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/udhar`, {
        ...formData,
        Amount: Number(formData.Amount)
      });
      onSuccess(res.data);
    } catch (err) {
      alert('Failed to add Udhar');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        <h2 style={{ marginBottom: '1.5rem' }}>Add New Udhar</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Customer Name</label>
            <input 
              type="text" 
              name="Customer_Name" 
              className="form-input" 
              required 
              value={formData.Customer_Name}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label>Customer WhatsApp Number</label>
            <input 
              type="tel" 
              name="Customer_Phone" 
              className="form-input" 
              placeholder="+91..."
              required 
              value={formData.Customer_Phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Amount (₹)</label>
            <input 
              type="number" 
              name="Amount" 
              className="form-input" 
              required 
              min="1"
              value={formData.Amount}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Due Date</label>
            <input 
              type="date" 
              name="Due_Date" 
              className="form-input" 
              required 
              value={formData.Due_Date}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Save Udhar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUdharModal;
