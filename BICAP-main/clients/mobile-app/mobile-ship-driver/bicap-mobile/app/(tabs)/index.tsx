// app/(tabs)/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Card, Text, Badge, Button, Title, ActivityIndicator, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { shipmentService, Shipment, ShipmentStatus } from '../../services/shipmentService';

export default function DriverHomeScreen() {
    const router = useRouter();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch shipments từ API
    const fetchShipments = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setIsLoading(true);
            setError(null);
            
            const data = await shipmentService.getMyShipments();
            setShipments(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách đơn hàng';
            setError(errorMessage);
            console.error('[Home] Fetch shipments error:', err);
            
            // Fallback: Hiển thị mock data nếu API chưa sẵn sàng
            if (__DEV__) {
                setShipments([
                    { 
                        id: 'SHIP001', 
                        status: 'ASSIGNED', 
                        fromLocation: 'Nông trại Xanh (Đà Lạt)',
                        toLocation: 'Siêu thị BigC (HCM)',
                        farmName: 'Nông trại Xanh',
                        retailerName: 'BigC Tân Phú',
                        createdAt: '25/05/2024'
                    },
                    { 
                        id: 'SHIP002', 
                        status: 'IN_TRANSIT',
                        fromLocation: 'Farm Hữu Cơ (Long An)',
                        toLocation: 'Cửa hàng WinMart',
                        farmName: 'Farm Hữu Cơ',
                        retailerName: 'WinMart Q1',
                        createdAt: '24/05/2024'
                    },
                    { 
                        id: 'SHIP003', 
                        status: 'PICKED_UP',
                        fromLocation: 'Nông trại ABC (Bình Dương)',
                        toLocation: 'Co.opmart Gò Vấp',
                        farmName: 'Nông trại ABC',
                        retailerName: 'Co.opmart',
                        createdAt: '24/05/2024'
                    },
                ]);
            }
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchShipments();
    }, [fetchShipments]);

    // Pull to refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchShipments(false);
    }, [fetchShipments]);

    // Màu sắc cho từng trạng thái
    const getStatusColor = (status: ShipmentStatus): string => {
        switch (status) {
            case 'PENDING': return '#9E9E9E';      // Xám
            case 'ASSIGNED': return '#FF9800';     // Cam
            case 'PICKED_UP': return '#9C27B0';    // Tím
            case 'IN_TRANSIT': return '#2196F3';   // Xanh dương
            case 'DELIVERED': return '#4CAF50';    // Xanh lá
            case 'COMPLETED': return '#4CAF50';    // Xanh lá
            case 'CANCELLED': return '#F44336';    // Đỏ
            default: return '#9E9E9E';
        }
    };

    // Text cho từng trạng thái
    const getStatusText = (status: ShipmentStatus): string => {
        switch (status) {
            case 'PENDING': return 'Chờ xử lý';
            case 'ASSIGNED': return 'Chờ lấy hàng';
            case 'PICKED_UP': return 'Đã lấy hàng';
            case 'IN_TRANSIT': return 'Đang vận chuyển';
            case 'DELIVERED': return 'Đã giao';
            case 'COMPLETED': return 'Hoàn thành';
            case 'CANCELLED': return 'Đã hủy';
            default: return status;
        }
    };

    // Icon cho từng trạng thái
    const getStatusIcon = (status: ShipmentStatus): string => {
        switch (status) {
            case 'PENDING': return 'clock-outline';
            case 'ASSIGNED': return 'package-variant-closed';
            case 'PICKED_UP': return 'package-variant';
            case 'IN_TRANSIT': return 'truck-fast';
            case 'DELIVERED': return 'check-circle';
            case 'COMPLETED': return 'check-all';
            case 'CANCELLED': return 'close-circle';
            default: return 'help-circle';
        }
    };

    // Render mỗi item shipment
    const renderShipmentItem = ({ item }: { item: Shipment }) => (
        <Card 
            style={styles.card} 
            onPress={() => router.push(`/shipment/${item.id}` as any)}
            mode="elevated"
        >
            <Card.Content>
                {/* Header: ID và Status */}
                <View style={styles.cardHeader}>
                    <Text style={styles.shipmentId}>#{item.id}</Text>
                    <Chip 
                        icon={() => (
                            <MaterialCommunityIcons 
                                name={getStatusIcon(item.status) as any} 
                                size={16} 
                                color="white" 
                            />
                        )}
                        style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
                        textStyle={styles.statusText}
                    >
                        {getStatusText(item.status)}
                    </Chip>
                </View>

                {/* Điểm lấy hàng */}
                <View style={styles.routeContainer}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="store-marker-outline" size={24} color="#4CAF50" />
                    </View>
                    <View style={styles.locationInfo}>
                        <Text style={styles.locationLabel}>Điểm lấy hàng</Text>
                        <Text style={styles.locationText} numberOfLines={1}>
                            {item.farmName || item.fromLocation}
                        </Text>
                    </View>
                </View>

                {/* Đường kẻ dọc */}
                <View style={styles.routeLine}>
                    <View style={styles.dashedLine} />
                </View>

                {/* Điểm giao hàng */}
                <View style={styles.routeContainer}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="map-marker-radius" size={24} color="#F44336" />
                    </View>
                    <View style={styles.locationInfo}>
                        <Text style={styles.locationLabel}>Điểm giao hàng</Text>
                        <Text style={styles.locationText} numberOfLines={1}>
                            {item.retailerName || item.toLocation}
                        </Text>
                    </View>
                </View>
            </Card.Content>

            <Card.Actions>
                <Button 
                    mode="contained-tonal" 
                    style={styles.detailButton}
                    icon="eye"
                    onPress={() => router.push(`/shipment/${item.id}` as any)}
                >
                    Xem chi tiết
                </Button>
            </Card.Actions>
        </Card>
    );

    // Loading state
    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={{ marginTop: 15, color: '#666' }}>Đang tải đơn hàng...</Text>
            </View>
        );
    }

    // Empty state
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant-closed-check" size={80} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
            <Text style={styles.emptySubtext}>
                Kéo xuống để làm mới hoặc chờ đơn hàng mới được giao
            </Text>
            <Button 
                mode="outlined" 
                onPress={() => fetchShipments()}
                style={{ marginTop: 20 }}
                icon="refresh"
            >
                Làm mới
            </Button>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Title style={styles.headerTitle}>🚚 Nhiệm vụ hôm nay</Title>
                <Chip icon="package-variant" style={styles.countChip}>
                    {shipments.length} đơn
                </Chip>
            </View>

            {/* Error banner */}
            {error && (
                <View style={styles.errorBanner}>
                    <MaterialCommunityIcons name="alert-circle" size={20} color="#D32F2F" />
                    <Text style={styles.errorText}>{error}</Text>
                    <Button compact onPress={() => fetchShipments()}>Thử lại</Button>
                </View>
            )}

            {/* Shipment List */}
            <FlatList
                data={shipments}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderShipmentItem}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh}
                        colors={['#2196F3']}
                    />
                }
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={shipments.length === 0 ? styles.emptyList : styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f5f5f5',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: { 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: { 
        color: '#333', 
        fontWeight: 'bold',
        fontSize: 20,
    },
    countChip: {
        backgroundColor: '#E3F2FD',
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        padding: 10,
        marginHorizontal: 15,
        marginTop: 10,
        borderRadius: 8,
    },
    errorText: {
        flex: 1,
        marginLeft: 10,
        color: '#D32F2F',
        fontSize: 13,
    },
    listContent: {
        padding: 15,
        paddingBottom: 30,
    },
    card: { 
        marginBottom: 15, 
        backgroundColor: 'white', 
        borderRadius: 12, 
    },
    cardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 15,
    },
    shipmentId: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333',
    },
    statusChip: {
        height: 28,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    routeContainer: { 
        flexDirection: 'row', 
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        alignItems: 'center',
    },
    locationInfo: {
        flex: 1,
        marginLeft: 5,
    },
    locationLabel: {
        fontSize: 11,
        color: '#999',
        textTransform: 'uppercase',
    },
    locationText: { 
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    routeLine: {
        paddingLeft: 20,
        paddingVertical: 2,
    },
    dashedLine: { 
        borderLeftWidth: 2, 
        borderLeftColor: '#ddd', 
        height: 20, 
        marginLeft: 0,
        borderStyle: 'dashed',
    },
    detailButton: {
        flex: 1,
        marginHorizontal: 5,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 20,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 40,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
    },
});