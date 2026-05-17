import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ShipmentsPage = () => {
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shipmentsData, driversData, vehiclesData] = await Promise.all([
        api.getAllShipments(),
        api.getAllDrivers(),
        api.getAllVehicles()
      ]);
      setShipments(shipmentsData);
      setDrivers(driversData);
      setVehicles(vehiclesData);
    } catch (err) {
      setError('Không thể tải dữ liệu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (shipmentId) => {
    if (!selectedDriver || !selectedVehicle) {
      alert('Vui lòng chọn tài xế và xe');
      return;
    }

    try {
      await api.assignDriverAndVehicle(shipmentId, selectedDriver, selectedVehicle);
      alert('Gán xe và tài xế thành công!');
      setShowAssignModal(null);
      setSelectedDriver('');
      setSelectedVehicle('');
      loadData();
    } catch (err) {
      alert('Lỗi khi gán xe: ' + (err.message || 'Vui lòng thử lại'));
      console.error(err);
    }
  };

  const handleCancelShipment = async (shipmentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy vận đơn này?')) {
      return;
    }

    try {
      await api.cancelShipment(shipmentId);
      alert('Hủy vận đơn thành công!');
      loadData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Vui lòng thử lại';
      alert('Lỗi khi hủy vận đơn: ' + errorMsg);
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'badge-pending',
      ASSIGNED: 'badge-assigned',
      IN_TRANSIT: 'badge-in-transit',
      DELIVERED: 'badge-delivered',
      CANCELLED: 'badge-cancelled'
    };
    return badges[status] || 'badge-secondary';
  };

  const getStatusText = (status) => {
    const texts = {
      PENDING: 'Chờ xử lý',
      ASSIGNED: 'Đã gán xe',
      IN_TRANSIT: 'Đang vận chuyển',
      DELIVERED: 'Đã giao hàng',
      CANCELLED: 'Đã hủy'
    };
    return texts[status] || status;
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
      <h2 className="mb-4">🚚 Quản lý Vận chuyển</h2>
      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}
      <div className="card shadow-sm">
        <div className="card-body">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Mã Vận Đơn</th>
                <th>Mã Đơn Hàng</th>
                <th>Từ / Đến</th>
                <th>Tài xế / Xe</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {shipments.length > 0 ? (
                shipments.map((shipment) => (
                  <tr key={shipment.id}>
                    <td><strong>#{shipment.id}</strong></td>
                    <td>#{shipment.orderId}</td>
                    <td>
                      <div>
                        <small className="text-muted">Từ:</small> {shipment.fromLocation || 'N/A'}
                      </div>
                      <div>
                        <small className="text-muted">Đến:</small> {shipment.toLocation || 'N/A'}
                      </div>
                    </td>
                    <td>
                      {shipment.driver ? (
                        <div>
                          <div>{shipment.driver.name}</div>
                          <small className="text-muted">{shipment.vehicle?.plate || 'N/A'}</small>
                        </div>
                      ) : (
                        <span className="text-danger">Chưa gán</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(shipment.status)}`}>
                        {getStatusText(shipment.status)}
                      </span>
                    </td>
                    <td>
                      {shipment.status === 'PENDING' && (
                        <>
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => setShowAssignModal(shipment.id)}
                          >
                            Gán xe
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleCancelShipment(shipment.id)}
                          >
                            Hủy
                          </button>
                        </>
                      )}
                      {shipment.status !== 'PENDING' && shipment.status !== 'DELIVERED' && shipment.status !== 'CANCELLED' && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleCancelShipment(shipment.id)}
                        >
                          Hủy
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    Chưa có chuyến vận chuyển nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Gán xe cho đơn #{showAssignModal}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAssignModal(null);
                    setSelectedDriver('');
                    setSelectedVehicle('');
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Chọn Tài xế</label>
                  <select
                    className="form-select"
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn tài xế --</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} ({driver.license})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Chọn Xe</label>
                  <select
                    className="form-select"
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn xe --</option>
                    {vehicles
                      .filter((v) => v.status === 'AVAILABLE')
                      .map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.plate} - {vehicle.type}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAssignModal(null);
                    setSelectedDriver('');
                    setSelectedVehicle('');
                  }}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleAssign(showAssignModal)}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentsPage;
