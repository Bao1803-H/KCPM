import React, { useState, useEffect } from 'react';
import api from '../services/api';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingShipment, setCreatingShipment] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(null);
  const [shipmentForm, setShipmentForm] = useState({
    fromLocation: '',
    toLocation: ''
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getConfirmedOrders();
      setOrders(data || []);
      console.log('Orders loaded:', data);
    } catch (err) {
      const errorMsg = err.message || err.toString() || 'Không thể tải danh sách đơn hàng';
      setError(`Lỗi: ${errorMsg}`);
      console.error('Error loading orders:', err);
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    setShipmentForm({
      fromLocation: order?.farmAddress || order?.fromLocation || '',
      toLocation: order?.retailerAddress || order?.toLocation || ''
    });
    setShowCreateModal(orderId);
  };

  const handleCloseModal = () => {
    setShowCreateModal(null);
    setShipmentForm({
      fromLocation: '',
      toLocation: ''
    });
  };

  const handleCreateShipment = async (orderId) => {
    if (!shipmentForm.fromLocation || !shipmentForm.toLocation) {
      alert('Vui lòng nhập đầy đủ địa chỉ xuất phát và địa chỉ đến');
      return;
    }

    try {
      setCreatingShipment(orderId);
      const shipmentData = {
        orderId: orderId,
        fromLocation: shipmentForm.fromLocation,
        toLocation: shipmentForm.toLocation
      };
      
      await api.createShipment(shipmentData);
      alert('Tạo vận đơn thành công!');
      handleCloseModal();
      // Remove order from list after creating shipment
      setOrders(orders.filter(o => o.id !== orderId));
      // Reload orders to refresh list
      loadOrders();
    } catch (err) {
      alert('Lỗi khi tạo vận đơn: ' + (err.message || 'Vui lòng thử lại'));
      console.error(err);
    } finally {
      setCreatingShipment(null);
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
      <h2 className="mb-4">📦 Đơn hàng chờ vận chuyển</h2>
      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}
      <div className="card shadow-sm">
        <div className="card-body">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Mã Đơn</th>
                <th>Nhà bán lẻ</th>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Ngày đặt</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.retailerName || order.retailer?.name || 'N/A'}</td>
                    <td>{order.productName || order.product?.name || 'Nông sản'}</td>
                    <td>{order.quantity || 0}</td>
                    <td>{order.orderDate ? new Date(order.orderDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenCreateModal(order.id)}
                        disabled={creatingShipment === order.id}
                      >
                        🚚 Tạo Vận Chuyển
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    Không có đơn hàng nào cần vận chuyển.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Shipment Modal */}
      {showCreateModal && (
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
                <h5 className="modal-title">Tạo vận đơn cho đơn hàng #{showCreateModal}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  disabled={creatingShipment === showCreateModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Địa chỉ xuất phát (Farm)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={shipmentForm.fromLocation}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, fromLocation: e.target.value })}
                    placeholder="Nhập địa chỉ nông trại"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Địa chỉ đến (Retailer)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={shipmentForm.toLocation}
                    onChange={(e) => setShipmentForm({ ...shipmentForm, toLocation: e.target.value })}
                    placeholder="Nhập địa chỉ nhà bán lẻ"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                  disabled={creatingShipment === showCreateModal}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleCreateShipment(showCreateModal)}
                  disabled={creatingShipment === showCreateModal}
                >
                  {creatingShipment === showCreateModal ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo vận đơn'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
