import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('summary'); // summary, driver-reports, admin-reports
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Summary Report
  const [summaryLoading, setSummaryLoading] = useState(true);
  
  // Driver Reports
  const [driverReports, setDriverReports] = useState([]);
  const [driverReportsLoading, setDriverReportsLoading] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [drivers, setDrivers] = useState([]);
  
  // Admin Reports
  const [adminReports, setAdminReports] = useState([]);
  const [adminReportsLoading, setAdminReportsLoading] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportType: 'SUMMARY',
    title: '',
    description: '',
    priority: 'MEDIUM'
  });
  const [sendingReport, setSendingReport] = useState(false);

  useEffect(() => {
    loadSummaryReport();
    loadDrivers();
  }, []);

  useEffect(() => {
    if (activeTab === 'driver-reports') {
      loadDriverReports();
    } else if (activeTab === 'admin-reports') {
      loadAdminReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadSummaryReport = async () => {
    try {
      setSummaryLoading(true);
      const data = await api.getSummaryReport();
      setReport(data);
    } catch (err) {
      setError('Không thể tải báo cáo tổng hợp');
      console.error(err);
    } finally {
      setSummaryLoading(false);
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const data = await api.getAllDrivers();
      setDrivers(data);
    } catch (err) {
      console.error('Error loading drivers:', err);
    }
  };

  const loadDriverReports = async () => {
    try {
      setDriverReportsLoading(true);
      const data = selectedDriverId 
        ? await api.getDriverReports(selectedDriverId)
        : await api.getAllDriverReports();
      setDriverReports(data);
    } catch (err) {
      alert('Không thể tải báo cáo từ tài xế: ' + (err.message || 'Vui lòng thử lại'));
      console.error(err);
    } finally {
      setDriverReportsLoading(false);
    }
  };

  const loadAdminReports = async () => {
    try {
      setAdminReportsLoading(true);
      const data = await api.getMyAdminReports();
      setAdminReports(data);
    } catch (err) {
      alert('Không thể tải báo cáo đã gửi: ' + (err.message || 'Vui lòng thử lại'));
      console.error(err);
    } finally {
      setAdminReportsLoading(false);
    }
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!reportForm.title || !reportForm.description) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setSendingReport(true);
      await api.sendReportToAdmin(reportForm);
      alert('Gửi báo cáo thành công!');
      setReportForm({ 
        reportType: 'SUMMARY',
        title: '', 
        description: '',
        priority: 'MEDIUM'
      });
      loadAdminReports();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Vui lòng thử lại';
      alert('Lỗi khi gửi báo cáo: ' + errorMsg);
      console.error(err);
    } finally {
      setSendingReport(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'badge-warning',
      REVIEWED: 'badge-info',
      RESOLVED: 'badge-success'
    };
    return badges[status] || 'badge-secondary';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      LOW: 'badge-secondary',
      MEDIUM: 'badge-info',
      HIGH: 'badge-warning',
      URGENT: 'badge-danger'
    };
    return badges[priority] || 'badge-secondary';
  };

  const getStatusText = (status) => {
    const texts = {
      PENDING: 'Chờ xử lý',
      REVIEWED: 'Đã xem',
      RESOLVED: 'Đã giải quyết'
    };
    return texts[status] || status;
  };

  const getPriorityText = (priority) => {
    const texts = {
      LOW: 'Thấp',
      MEDIUM: 'Trung bình',
      HIGH: 'Cao',
      URGENT: 'Khẩn cấp'
    };
    return texts[priority] || priority;
  };

  return (
    <div>
      <h2 className="mb-4">📊 Báo cáo & Thống kê</h2>

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Thống kê tổng hợp
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'driver-reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('driver-reports')}
          >
            Báo cáo từ Tài xế
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'admin-reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin-reports')}
          >
            Gửi báo cáo Admin
          </button>
        </li>
      </ul>

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div>
          {summaryLoading ? (
            <div className="text-center p-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Thống kê nhanh</h5>
                <div className="row text-center">
                  <div className="col-md-3 mb-3">
                    <div className="p-3 border bg-light rounded">
                      <h3 className="text-primary">{report?.totalShipments || 0}</h3>
                      <p className="mb-0">Tổng chuyến hàng</p>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="p-3 border bg-light rounded">
                      <h3 className="text-success">{report?.totalDrivers || 0}</h3>
                      <p className="mb-0">Tổng số tài xế</p>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="p-3 border bg-light rounded">
                      <h3 className="text-info">{report?.totalVehicles || 0}</h3>
                      <p className="mb-0">Tổng số xe</p>
                    </div>
                  </div>
                  <div className="col-md-3 mb-3">
                    <div className="p-3 border bg-light rounded">
                      <h3 className="text-warning">{report?.pendingShipments || 0}</h3>
                      <p className="mb-0">Chờ xử lý</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Driver Reports Tab */}
      {activeTab === 'driver-reports' && (
        <div>
          <div className="card shadow-sm mb-3">
            <div className="card-body">
              <div className="row align-items-end">
                <div className="col-md-6">
                  <label className="form-label">Lọc theo tài xế</label>
                  <select
                    className="form-select"
                    value={selectedDriverId || ''}
                    onChange={async (e) => {
                      const driverId = e.target.value || null;
                      setSelectedDriverId(driverId);
                      // Load reports after state update
                      setTimeout(() => {
                        loadDriverReports();
                      }, 0);
                    }}
                  >
                    <option value="">Tất cả tài xế</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} - {driver.license}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <button
                    className="btn btn-primary"
                    onClick={loadDriverReports}
                    disabled={driverReportsLoading}
                  >
                    {driverReportsLoading ? 'Đang tải...' : 'Làm mới'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {driverReportsLoading ? (
            <div className="text-center p-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Báo cáo từ Tài xế</h5>
                {driverReports.length > 0 ? (
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tài xế</th>
                        <th>Loại báo cáo</th>
                        <th>Tiêu đề</th>
                        <th>Trạng thái</th>
                        <th>Ngày báo cáo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driverReports.map((report) => (
                        <tr key={report.id}>
                          <td>{report.id}</td>
                          <td>{report.driver?.name || 'N/A'}</td>
                          <td>{report.reportType || 'N/A'}</td>
                          <td>{report.title || 'N/A'}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(report.status)}`}>
                              {getStatusText(report.status)}
                            </span>
                          </td>
                          <td>
                            {report.reportedAt 
                              ? new Date(report.reportedAt).toLocaleString('vi-VN')
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center">Chưa có báo cáo nào từ tài xế.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Reports Tab */}
      {activeTab === 'admin-reports' && (
        <div>
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="card-title">Gửi báo cáo cho Admin</h5>
              <form onSubmit={handleSendReport}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Loại báo cáo</label>
                    <select
                      className="form-select"
                      value={reportForm.reportType}
                      onChange={(e) => setReportForm({ ...reportForm, reportType: e.target.value })}
                      required
                    >
                      <option value="SUMMARY">Tổng hợp</option>
                      <option value="ISSUE">Vấn đề</option>
                      <option value="REQUEST">Yêu cầu</option>
                      <option value="GENERAL">Chung</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Mức độ ưu tiên</label>
                    <select
                      className="form-select"
                      value={reportForm.priority}
                      onChange={(e) => setReportForm({ ...reportForm, priority: e.target.value })}
                      required
                    >
                      <option value="LOW">Thấp</option>
                      <option value="MEDIUM">Trung bình</option>
                      <option value="HIGH">Cao</option>
                      <option value="URGENT">Khẩn cấp</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Tiêu đề báo cáo</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="VD: Báo cáo vận chuyển tháng 10"
                    value={reportForm.title}
                    onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Nội dung chi tiết</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    placeholder="Nhập nội dung báo cáo..."
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary" disabled={sendingReport}>
                  {sendingReport ? 'Đang gửi...' : 'Gửi báo cáo'}
                </button>
              </form>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Báo cáo đã gửi</h5>
              {adminReportsLoading ? (
                <div className="text-center p-3">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : adminReports.length > 0 ? (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Loại</th>
                      <th>Tiêu đề</th>
                      <th>Mức độ</th>
                      <th>Trạng thái</th>
                      <th>Ngày gửi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminReports.map((report) => (
                      <tr key={report.id}>
                        <td>{report.id}</td>
                        <td>{report.reportType || 'N/A'}</td>
                        <td>{report.title || 'N/A'}</td>
                        <td>
                          <span className={`badge ${getPriorityBadge(report.priority)}`}>
                            {getPriorityText(report.priority)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(report.status)}`}>
                            {getStatusText(report.status)}
                          </span>
                        </td>
                        <td>
                          {report.reportedAt 
                            ? new Date(report.reportedAt).toLocaleString('vi-VN')
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center">Chưa có báo cáo nào đã gửi.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
