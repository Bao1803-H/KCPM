import React, { useState, useEffect } from 'react';
import api from '../services/api';

const DriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license: '',
    citizenId: '',
    userId: null
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const data = await api.getAllDrivers();
      setDrivers(data);
    } catch (err) {
      setError('Không thể tải danh sách tài xế');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (driver = null) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        name: driver.name || '',
        phone: driver.phone || '',
        license: driver.license || '',
        citizenId: driver.citizenId || '',
        userId: driver.userId || null
      });
    } else {
      setEditingDriver(null);
      setFormData({
        name: '',
        phone: '',
        license: '',
        citizenId: '',
        userId: null
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDriver(null);
    setFormData({
      name: '',
      phone: '',
      license: '',
      citizenId: '',
      userId: null
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await api.updateDriver(editingDriver.id, formData);
        alert('Cập nhật tài xế thành công!');
      } else {
        await api.createDriver(formData);
        alert('Thêm tài xế thành công!');
      }
      handleCloseModal();
      loadDrivers();
    } catch (err) {
      alert('Lỗi: ' + (err.message || 'Vui lòng thử lại'));
      console.error(err);
    }
  };

  const handleDelete = async (driverId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài xế này?')) {
      return;
    }

    try {
      await api.deleteDriver(driverId);
      alert('Xóa tài xế thành công!');
      loadDrivers();
    } catch (err) {
      alert('Lỗi khi xóa tài xế: ' + (err.message || 'Vui lòng thử lại'));
      console.error(err);
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>👤 Quản lý Tài xế</h2>
        <button className="btn btn-success" onClick={() => handleOpenModal()}>
          + Thêm tài xế
        </button>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-body">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Số điện thoại</th>
                <th>Bằng lái</th>
                <th>Số CCCD</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length > 0 ? (
                drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td>{driver.id}</td>
                    <td>{driver.name}</td>
                    <td>{driver.phone}</td>
                    <td>{driver.license}</td>
                    <td>{driver.citizenId || 'N/A'}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleOpenModal(driver)}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(driver.id)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    Chưa có tài xế nào trong hệ thống.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingDriver ? 'Sửa thông tin tài xế' : 'Thêm tài xế mới'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Họ tên</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Bằng lái <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.license}
                      onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                      required
                    />
                    <small className="form-text text-muted">Giấy phép lái xe phải là duy nhất</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Số căn cước công dân (CCCD) <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.citizenId}
                      onChange={(e) => setFormData({ ...formData, citizenId: e.target.value })}
                      placeholder="VD: 001234567890"
                      required
                    />
                    <small className="form-text text-muted">Số CCCD phải là duy nhất</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">User ID (tùy chọn)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.userId || ''}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="ID người dùng từ Auth Service"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Đóng
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingDriver ? 'Cập nhật' : 'Thêm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversPage;
