import React, { useState, useEffect } from 'react';
import api from '../services/api';

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    plate: '',
    type: '',
    status: 'AVAILABLE'
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await api.getAllVehicles();
      setVehicles(data);
    } catch (err) {
      setError('Không thể tải danh sách xe');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        plate: vehicle.plate || '',
        type: vehicle.type || '',
        status: vehicle.status || 'AVAILABLE'
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        plate: '',
        type: '',
        status: 'AVAILABLE'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVehicle(null);
    setFormData({
      plate: '',
      type: '',
      status: 'AVAILABLE'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await api.updateVehicle(editingVehicle.id, formData);
        alert('Cập nhật xe thành công!');
      } else {
        await api.createVehicle(formData);
        alert('Thêm xe thành công!');
      }
      handleCloseModal();
      loadVehicles();
    } catch (err) {
      alert('Lỗi: ' + (err.message || 'Vui lòng thử lại'));
      console.error(err);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa xe này?')) {
      return;
    }

    try {
      await api.deleteVehicle(vehicleId);
      alert('Xóa xe thành công!');
      loadVehicles();
    } catch (err) {
      alert('Lỗi khi xóa xe: ' + (err.message || 'Vui lòng thử lại'));
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
        <h2>🚛 Quản lý Phương tiện</h2>
        <button className="btn btn-success" onClick={() => handleOpenModal()}>
          + Thêm xe mới
        </button>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        {vehicles.length > 0 ? (
          vehicles.map((vehicle) => (
            <div key={vehicle.id} className="col-md-4 mb-3">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{vehicle.plate}</h5>
                  <p className="card-text text-muted">{vehicle.type}</p>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className={`badge ${vehicle.status === 'AVAILABLE' ? 'badge-available' : 'badge-busy'}`}>
                      {vehicle.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Đang bận'}
                    </span>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleOpenModal(vehicle)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(vehicle.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <p className="text-center">Chưa có phương tiện nào.</p>
          </div>
        )}
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
                  {editingVehicle ? 'Sửa thông tin xe' : 'Thêm xe mới'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Biển số xe</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.plate}
                      onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Loại xe</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      placeholder="VD: Xe tải, Xe container..."
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Trạng thái</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="AVAILABLE">Sẵn sàng</option>
                      <option value="BUSY">Đang bận</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Đóng
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingVehicle ? 'Cập nhật' : 'Thêm'}
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

export default VehiclesPage;
