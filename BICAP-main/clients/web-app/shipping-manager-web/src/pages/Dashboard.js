import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSummaryReport();
  }, []);

  const loadSummaryReport = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getSummaryReport();
      setReport(data);
      console.log('Dashboard data loaded:', data);
    } catch (err) {
      const errorMsg = err.message || err.toString() || 'Không thể tải báo cáo tổng hợp';
      setError(`Lỗi: ${errorMsg}`);
      console.error('Dashboard error:', err);
      // Set default values để UI không bị lỗi
      setReport({
        totalShipments: 0,
        totalDrivers: 0,
        totalVehicles: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Tổng quan hoạt động</h2>
      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}
      <div className="row">
        <div className="col-md-4 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <h3 className="text-primary">{report?.totalShipments || 0}</h3>
              <p className="text-muted mb-0">Tổng chuyến hàng</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <h3 className="text-success">{report?.totalDrivers || 0}</h3>
              <p className="text-muted mb-0">Tổng số tài xế</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card">
            <div className="card-body text-center">
              <h3 className="text-info">{report?.totalVehicles || 0}</h3>
              <p className="text-muted mb-0">Tổng số xe</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
