import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Sidebar.css';

const Sidebar = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  return (
    <div className="sidebar d-flex flex-column flex-shrink-0 p-3 bg-white shadow">
      <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-dark text-decoration-none">
        <span className="fs-4 fw-bold text-success">BICAP Shipping</span>
      </a>
      <hr />
      <ul className="nav nav-pills flex-column mb-auto">
        <li className="nav-item">
          <NavLink
            to="/orders"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : 'link-dark'}`}
          >
            📦 Đơn hàng chờ
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/shipments"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : 'link-dark'}`}
          >
            🚚 Quản lý Vận chuyển
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/vehicles"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : 'link-dark'}`}
          >
            🚛 Quản lý Xe
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/drivers"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : 'link-dark'}`}
          >
            👤 Quản lý Tài xế
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/reports"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : 'link-dark'}`}
          >
            📊 Báo cáo
          </NavLink>
        </li>
      </ul>
      <hr />
      <div className="dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          type="button"
          className="d-flex align-items-center link-dark text-decoration-none dropdown-toggle border-0 bg-transparent p-0 w-100"
          id="dropdownUser2"
          onClick={() => setShowDropdown(!showDropdown)}
          style={{ cursor: 'pointer' }}
        >
          <strong>{user.username || user.email || 'User'}</strong>
        </button>
        {showDropdown && (
          <ul 
            className="dropdown-menu text-small shadow show" 
            aria-labelledby="dropdownUser2"
            style={{ 
              display: 'block', 
              position: 'absolute', 
              bottom: '100%', 
              left: '0', 
              marginBottom: '0.5rem',
              minWidth: '150px'
            }}
          >
            <li>
              <button
                className="dropdown-item"
                onClick={handleLogout}
                style={{ cursor: 'pointer' }}
              >
                Đăng xuất
              </button>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
