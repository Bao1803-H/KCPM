import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, RefreshControl, Platform } from 'react-native';
import { Button, Text, Card, Divider, List, Appbar, ActivityIndicator, Chip, Portal, Dialog } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { shipmentService, Shipment, ShipmentStatus } from '../../services/shipmentService';

// Web-safe alert helper
const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n${message}`);
    } else {
        Alert.alert(title, message);
    }
};

export default function ShipmentDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Dialog state for web
    const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);

    // Fetch shipment detail
    const fetchShipmentDetail = async (showLoading = true) => {
        try {
            if (showLoading) setIsLoading(true);
            
            if (id) {
                const data = await shipmentService.getShipmentDetail(id);
                setShipment(data);
            }
        } catch (error) {
            console.error('[ShipmentDetail] Fetch error:', error);
            
            // Fallback: Mock data cho development
            if (__DEV__) {
                setShipment({
                    id: id || 'UNKNOWN',
                    status: 'ASSIGNED',
                    fromLocation: '123 Đường Nông Trại, Đà Lạt',
                    toLocation: '456 Đường Lê Lợi, TP.HCM',
                    farmAddress: '123 Đường Nông Trại, Đà Lạt',
                    retailerAddress: '456 Đường Lê Lợi, TP.HCM',
                    farmName: 'Nông trại Xanh',
                    retailerName: 'BigC Tân Phú',
                    products: [
                        { name: 'Cà chua Organic', quantity: '500 kg' },
                        { name: 'Dâu tây', quantity: '100 kg' }
                    ]
                });
            }
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchShipmentDetail();
    }, [id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchShipmentDetail(false);
    };

    // Màu sắc và text cho status
    const getStatusInfo = (status: ShipmentStatus) => {
        switch (status) {
            case 'PENDING':
                return { color: '#9E9E9E', text: 'ĐANG CHỜ XỬ LÝ', icon: 'clock-outline' };
            case 'ASSIGNED':
                return { color: '#FF9800', text: 'ĐANG CHỜ LẤY HÀNG', icon: 'package-variant-closed' };
            case 'PICKED_UP':
                return { color: '#9C27B0', text: 'ĐÃ LẤY HÀNG', icon: 'package-variant' };
            case 'IN_TRANSIT':
                return { color: '#2196F3', text: 'ĐANG GIAO HÀNG', icon: 'truck-fast' };
            case 'DELIVERED':
                return { color: '#4CAF50', text: 'ĐÃ GIAO HÀNG', icon: 'check-circle' };
            case 'COMPLETED':
                return { color: '#4CAF50', text: 'HOÀN THÀNH', icon: 'check-all' };
            case 'CANCELLED':
                return { color: '#F44336', text: 'ĐÃ HỦY', icon: 'close-circle' };
            default:
                return { color: '#9E9E9E', text: status, icon: 'help-circle' };
        }
    };

    // Xác định action chính dựa trên status
    const getPrimaryAction = () => {
        if (!shipment) return null;

        switch (shipment.status) {
            case 'ASSIGNED':
                return {
                    label: 'QUÉT MÃ NHẬN HÀNG',
                    color: '#FF9800',
                    icon: 'qrcode-scan',
                    action: () => router.push(`/scan/pickup?shipmentId=${id}` as any),
                };
            case 'PICKED_UP':
                return {
                    label: 'BẮT ĐẦU VẬN CHUYỂN',
                    color: '#2196F3',
                    icon: 'truck-fast',
                    action: handleStartTransit,
                };
            case 'IN_TRANSIT':
                return {
                    label: 'QUÉT MÃ GIAO HÀNG',
                    color: '#4CAF50',
                    icon: 'qrcode-scan',
                    action: () => router.push(`/scan/deliver?shipmentId=${id}` as any),
                };
            default:
                return null;
        }
    };

    // Bắt đầu vận chuyển
    const handleStartTransit = async () => {
        if (Platform.OS === 'web') {
            setConfirmDialogVisible(true);
        } else {
            Alert.alert(
                'Xác nhận',
                'Bạn đã sẵn sàng bắt đầu vận chuyển?',
                [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Bắt đầu', onPress: performStartTransit },
                ]
            );
        }
    };

    const performStartTransit = async () => {
        setConfirmDialogVisible(false);
        try {
            setIsUpdating(true);
            if (id) {
                await shipmentService.startTransit(id);
                await fetchShipmentDetail(false);
                showAlert('Thành công', 'Đã bắt đầu vận chuyển!');
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Đã xảy ra lỗi';
            showAlert('Lỗi', msg);
        } finally {
            setIsUpdating(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <View style={[styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={{ marginTop: 15 }}>Đang tải thông tin...</Text>
            </View>
        );
    }

    // Error state
    if (!shipment) {
        return (
            <View style={styles.loadingContainer}>
                <MaterialCommunityIcons name="alert-circle" size={60} color="#F44336" />
                <Text style={{ marginTop: 15, fontSize: 16 }}>Không tìm thấy đơn hàng</Text>
                <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 20 }}>
                    Quay lại
                </Button>
            </View>
        );
    }

    const statusInfo = getStatusInfo(shipment.status);
    const primaryAction = getPrimaryAction();

    return (
        <View style={{ flex: 1 }}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title={`Đơn hàng #${id}`} />
                <Appbar.Action icon="refresh" onPress={onRefresh} />
            </Appbar.Header>

            <ScrollView 
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Thông tin trạng thái */}
                <Card style={styles.card}>
                    <Card.Content style={styles.statusContent}>
                        <MaterialCommunityIcons 
                            name={statusInfo.icon as any}
                            size={50} 
                            color={statusInfo.color}
                        />
                        <Text 
                            variant="titleLarge" 
                            style={[styles.statusText, { color: statusInfo.color }]}
                        >
                            {statusInfo.text}
                        </Text>
                        
                        {/* Progress indicator */}
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressDot, { backgroundColor: '#4CAF50' }]} />
                            <View style={[styles.progressLine, { 
                                backgroundColor: ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(shipment.status) 
                                    ? '#4CAF50' 
                                    : '#ddd' 
                            }]} />
                            <View style={[styles.progressDot, { 
                                backgroundColor: ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(shipment.status) 
                                    ? '#4CAF50' 
                                    : '#ddd' 
                            }]} />
                            <View style={[styles.progressLine, { 
                                backgroundColor: ['IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(shipment.status) 
                                    ? '#4CAF50' 
                                    : '#ddd' 
                            }]} />
                            <View style={[styles.progressDot, { 
                                backgroundColor: ['DELIVERED', 'COMPLETED'].includes(shipment.status) 
                                    ? '#4CAF50' 
                                    : '#ddd' 
                            }]} />
                        </View>
                        <View style={styles.progressLabels}>
                            <Text style={styles.progressLabel}>Lấy hàng</Text>
                            <Text style={styles.progressLabel}>Vận chuyển</Text>
                            <Text style={styles.progressLabel}>Giao hàng</Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Thông tin lộ trình */}
                <Card style={styles.card}>
                    <Card.Title 
                        title="Lộ trình vận chuyển" 
                        left={(props) => <MaterialCommunityIcons {...props} name="map-marker-path" size={24} color="#2196F3" />} 
                    />
                    <Card.Content>
                        <List.Item
                            title="Điểm lấy hàng (Farm)"
                            description={shipment.farmAddress || shipment.fromLocation}
                            left={() => <List.Icon icon="barn" color="#4CAF50" />}
                            titleStyle={styles.locationTitle}
                        />
                        <View style={styles.routeDivider}>
                            <View style={styles.dashedLineVertical} />
                            <MaterialCommunityIcons name="arrow-down" size={20} color="#ccc" />
                            <View style={styles.dashedLineVertical} />
                        </View>
                        <List.Item
                            title="Điểm giao hàng (Retailer)"
                            description={shipment.retailerAddress || shipment.toLocation}
                            left={() => <List.Icon icon="store" color="#F44336" />}
                            titleStyle={styles.locationTitle}
                        />
                    </Card.Content>
                </Card>

                {/* Danh sách hàng hóa */}
                {shipment.products && shipment.products.length > 0 && (
                    <Card style={styles.card}>
                        <Card.Title 
                            title="Danh sách hàng hóa" 
                            left={(props) => <MaterialCommunityIcons {...props} name="package-variant" size={24} color="#FF9800" />}
                        />
                        <Card.Content>
                            {shipment.products.map((p, index) => (
                                <View key={index} style={styles.productRow}>
                                    <View style={styles.productInfo}>
                                        <MaterialCommunityIcons name="leaf" size={16} color="#4CAF50" />
                                        <Text style={styles.productName}>{p.name}</Text>
                                    </View>
                                    <Chip compact style={styles.quantityChip}>
                                        {p.quantity}
                                    </Chip>
                                </View>
                            ))}
                        </Card.Content>
                    </Card>
                )}

                {/* Nút báo cáo sự cố */}
                {!['COMPLETED', 'CANCELLED'].includes(shipment.status) && (
                    <Button
                        mode="outlined"
                        icon="alert-circle"
                        textColor="#D32F2F"
                        style={styles.reportButton}
                        onPress={() => router.push(`/report/${id}` as any)}
                    >
                        Báo cáo sự cố / Hư hỏng
                    </Button>
                )}

                {/* Spacer for footer */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer Button cố định */}
            {primaryAction && (
                <View style={styles.footer}>
                    <Button
                        mode="contained"
                        contentStyle={styles.primaryButtonContent}
                        icon={primaryAction.icon}
                        buttonColor={primaryAction.color}
                        onPress={primaryAction.action}
                        loading={isUpdating}
                        disabled={isUpdating}
                    >
                        {primaryAction.label}
                    </Button>
                </View>
            )}

            {/* Confirm Dialog for Web */}
            <Portal>
                <Dialog visible={confirmDialogVisible} onDismiss={() => setConfirmDialogVisible(false)}>
                    <Dialog.Title>Xác nhận</Dialog.Title>
                    <Dialog.Content>
                        <Text>Bạn đã sẵn sàng bắt đầu vận chuyển?</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setConfirmDialogVisible(false)}>Hủy</Button>
                        <Button onPress={performStartTransit}>Bắt đầu</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    container: { 
        flex: 1, 
        backgroundColor: '#f5f5f5', 
        padding: 15 
    },
    card: { 
        marginBottom: 15, 
        backgroundColor: 'white',
        borderRadius: 12,
    },
    statusContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    statusText: {
        marginTop: 10,
        fontWeight: 'bold',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 20,
    },
    progressDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    progressLine: {
        flex: 1,
        height: 3,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
        marginTop: 8,
    },
    progressLabel: {
        fontSize: 11,
        color: '#666',
    },
    locationTitle: {
        fontWeight: '600',
    },
    routeDivider: {
        alignItems: 'center',
        paddingLeft: 40,
        marginVertical: -5,
    },
    dashedLineVertical: {
        width: 2,
        height: 15,
        backgroundColor: '#ddd',
    },
    productRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingVertical: 10, 
        borderBottomWidth: 0.5, 
        borderBottomColor: '#eee' 
    },
    productInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    productName: {
        marginLeft: 8,
        fontSize: 15,
    },
    quantityChip: {
        backgroundColor: '#E8F5E9',
    },
    reportButton: {
        borderColor: '#D32F2F',
        marginBottom: 15,
    },
    footer: { 
        padding: 15, 
        backgroundColor: 'white', 
        borderTopWidth: 1, 
        borderTopColor: '#ddd',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    primaryButtonContent: {
        height: 50,
    },
});