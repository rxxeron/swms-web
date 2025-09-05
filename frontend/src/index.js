import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// React Toastify CSS
import 'react-toastify/dist/ReactToastify.css';
// React Datepicker CSS
import 'react-datepicker/dist/react-datepicker.css';
// Custom CSS
import './styles/globals.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
