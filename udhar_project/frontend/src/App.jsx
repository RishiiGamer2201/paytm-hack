import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Activity, Mic } from 'lucide-react';
import AddUdharModal from './components/AddUdharModal';
import Dashboard from './components/Dashboard';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [udhars, setUdhars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const fetchUdhars = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/udhar`);
      setUdhars(response.data);
    } catch (error) {
      console.error('Error fetching udhars:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUdhars();
  }, []);

  const handleAddUdhar = async (newUdhar) => {
    try {
      await axios.post(`${API_URL}/udhar`, newUdhar);
      setShowModal(false);
      fetchUdhars();
    } catch (error) {
      console.error('Error adding udhar:', error);
      alert('Failed to add Udhar');
    }
  };

  const handleMarkPaid = async (id) => {
    const amountStr = window.prompt("Enter amount paid (or leave blank to settle full amount):");
    if (amountStr === null) return; 
    
    let paymentAmount = parseFloat(amountStr);
    const udhar = udhars.find(u => u.Udhar_ID === id);
    if (!paymentAmount || isNaN(paymentAmount)) {
      paymentAmount = udhar.Amount;
    }

    try {
        await axios.patch(`${API_URL}/udhar/${id}/pay`, { paymentAmount });
        fetchUdhars();
    } catch (error) {
        console.error('Error updating status:', error);
    }
  };

  const handleRemind = async (id) => {
    try {
      await axios.post(`${API_URL}/udhar/${id}/remind`);
      alert('Reminder sent!');
      fetchUdhars();
    } catch (error) {
      console.error('Error sending reminder', error);
    }
  };

  // Improved Voice Recognition
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice recognition not supported. Use Chrome/Edge.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-IN'; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log('Transcript:', transcript);
      
      const amountMatch = transcript.match(/\d+/);
      const amount = amountMatch ? parseFloat(amountMatch[0]) : null;
      const isPayment = transcript.includes('diye') || transcript.includes('paid') || transcript.includes('kam') || transcript.includes('jama');
      
      let name = '';
      
      // Exact Match Strategy First
      for (const u of udhars) {
        const fullName = u.Customer_Name.toLowerCase();
        const firstName = fullName.split(' ')[0];
        if (transcript.includes(fullName) || transcript.includes(firstName + ' ')) {
            name = u.Customer_Name;
            break;
        }
      }

      // Regex Extraction Strategy
      if (!name) {
          const match = transcript.match(/^(.*?)(?=\s+(per|par|pe|ne|se|ko|rs|rupee|rupees|gave|has|isne|usne)\b|\s*\d+)/i);
          let potentialName = match ? match[1].trim() : transcript.replace(/\d+/g, '').trim();
          
          let cleanWords = [];
          for (let w of potentialName.split(' ')) {
              if (!['udhar', 'hai', 'diye', 'de', 'liye', 'pay', 'paid'].includes(w)) {
                  cleanWords.push(w.charAt(0).toUpperCase() + w.slice(1));
              }
          }
          name = cleanWords.join(' ');
      }

      if (!amount) {
          alert('Could not detect an amount. E.g., "Ramesh par 500 udhar hai"');
          return;
      }

      if (!name || name.length <= 1) {
          name = prompt(`Could not automatically detect the name. You spoke: "${transcript}". Please manually enter the Customer Name for ₹${amount}:`);
          if (!name) return;
      } else {
         const confirm = window.prompt(`Detected Name: ${name}\nDetected Amount: ₹${amount}\n\nPlease click OK to accept or correct the name below:`, name);
         if (!confirm) return;
         name = confirm;
      }

      if (isPayment) {
        const existing = udhars.find(u => u.Customer_Name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(u.Customer_Name.toLowerCase()));
        if (existing) {
          if (window.confirm(`Mark ₹${amount} as paid for ${existing.Customer_Name}?`)) {
            await axios.patch(`${API_URL}/udhar/${existing.Udhar_ID}/pay`, { paymentAmount: amount });
            fetchUdhars();
          }
        } else {
          alert(`No existing customer found matching "${name}".`);
        }
      } else {
        let phone = '+919999999999';
        const existing = udhars.find(u => u.Customer_Name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(u.Customer_Name.toLowerCase()));
        
        if (!existing) {
           phone = window.prompt(`New customer detected: ${name}. Enter Phone Number:`, "+91");
           if (!phone) return;
        } else {
           phone = existing.Customer_Phone;
           name = existing.Customer_Name;
        }

        if (window.confirm(`Add ₹${amount} to ${name}?`)) {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          await handleAddUdhar({
            Customer_Name: name,
            Customer_Phone: phone,
            Amount: amount,
            Due_Date: nextWeek.toISOString().split('T')[0]
          });
        }
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const pendingUdhars = udhars.filter(u => u.Status === 'PENDING');
  
  const totalPending = pendingUdhars.reduce((sum, u) => sum + u.Amount, 0);
  const totalCollected = udhars.filter(u => u.Status === 'PAID').reduce((sum, u) => sum + u.Amount, 0);
  const activeCustomers = new Set(pendingUdhars.map(u => u.Customer_Phone)).size;

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-brand">
          <Activity size={24}/> Udhar Intelligence
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={startListening} className="btn" style={{ background: isListening ? '#F97316' : 'rgba(255,255,255,0.1)', color: 'white' }}>
            <Mic size={16}/> {isListening ? 'Listening...' : 'Voice Entry'}
          </button>
          <button onClick={() => setShowModal(true)} className="btn btn-header">
            <Plus size={16}/> New Udhar
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Pending</div>
            <div className="stat-value text-orange">₹{totalPending.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Collected</div>
            <div className="stat-value text-green">₹{totalCollected.toLocaleString()}</div>
          </div>
          <div className="stat-card">
             <div className="stat-label">Active Customers</div>
             <div className="stat-value text-white">{activeCustomers || pendingUdhars.length}</div>
          </div>
        </div>

        <div className="dashboard-controls">
          <h2>Active Udhar Records</h2>
        </div>

        <Dashboard 
          loading={loading} 
          data={pendingUdhars} 
          onMarkPaid={handleMarkPaid} 
          onRemind={handleRemind}
        />
      </main>

      {showModal && (
        <AddUdharModal 
          onClose={() => setShowModal(false)} 
          onSubmit={handleAddUdhar} 
        />
      )}
    </div>
  );
}

export default App;
