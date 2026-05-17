// app/(tabs)/dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Card, Text, Title, Chip, ActivityIndicator, Appbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { shipmentService, Shipment } from '../../services/shipmentService';
import { authService } from '../../services/authService';

const { width } = Dimensions.get('window');

interface DashboardStats {
    total: number;
    pending: number;
    inTransit: number;
    completed: number;
    todayDeliveries: number;
}

export default function DashboardScreen() {
    const [stats, setStats] = useState<DashboardStats>({
        total: 0,
        pending: 0,
        inTransit: 0,
        completed: 0,
        todayDeliveries: 0,
    });
    const [userName, setUserName] = useState<string>('Tài xế');
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadDashboardData = useCallback(async () => {
        try {
            // Load user name
            const user = await authService.getStoredUser();
            if (user?.fullName) {
                setUserName(user.fullName);
            }

            // Load shipments and calculate stats
            try {
                const shipments = await shipmentService.getMyShipments();
                calculateStats(shipments);
            } catch {
                // Use mock stats in development
                if (__DEV__) {
                    setStats({
                        total: 5,
                        pending: 2,
                        inTransit: 1,
                        completed: 2,
                        todayDeliveries: 1,
                    });
                }
            }
        } catch (error) {
            console.error('[Dashboard] Load error:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    const calculateStats = (shipments: Shipment[]) => {
        const today = new Date().toDateString();
        
        const newStats = shipments.reduce((acc, shipment) => {
            acc.total++;
            
            switch (shipment.status) {
                case 'ASSIGNED':
                case 'PICKED_UP':
                    acc.pending++;
                    break;
                case 'IN_TRANSIT':
                    acc.inTransit++;
                    break;
                case 'DELIVERED':
                case 'COMPLETED':
                    acc.completed++;
                    // Check if delivered today
                    if (shipment.deliveryTime) {
                        const deliveryDate = new Date(shipment.deliveryTime).toDateString();
                        if (deliveryDate === today) {
                            acc.todayDeliveries++;
                        }
                    }
                    break;
            }
            
            return acc;
        }, {
            total: 0,
            pending: 0,
            inTransit: 0,
            completed: 0,
            todayDeliveries: 0,
        });

        setStats(newStats);
    };

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.header}>
                <Appbar.Content 
                    title={`${getGreeting()}, ${userName}! 👋`}
                    titleStyle={styles.headerTitle}
                />
            </Appbar.Header>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <Card style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
                        <Card.Content style={styles.statContent}>
                            <MaterialCommunityIcons name="package-variant" size={32} color="#2196F3" />
                            <Text style={styles.statNumber}>{stats.total}</Text>
                            <Text style={styles.statLabel}>Tổng đơn</Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
                        <Card.Content style={styles.statContent}>
                            <MaterialCommunityIcons name="clock-outline" size={32} color="#FF9800" />
                            <Text style={styles.statNumber}>{stats.pending}</Text>
                            <Text style={styles.statLabel}>Chờ xử lý</Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
                        <Card.Content style={styles.statContent}>
                            <MaterialCommunityIcons name="truck-fast" size={32} color="#4CAF50" />
                            <Text style={styles.statNumber}>{stats.inTransit}</Text>
                            <Text style={styles.statLabel}>Đang giao</Text>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
                        <Card.Content style={styles.statContent}>
                            <MaterialCommunityIcons name="check-circle" size={32} color="#9C27B0" />
                            <Text style={styles.statNumber}>{stats.completed}</Text>
                            <Text style={styles.statLabel}>Hoàn thành</Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Today's Performance */}
                <Card style={styles.performanceCard}>
                    <Card.Content>
                        <View style={styles.performanceHeader}>
                            <MaterialCommunityIcons name="calendar-today" size={24} color="#2196F3" />
                            <Text style={styles.performanceTitle}>Hôm nay</Text>
                        </View>
                        
                        <View style={styles.performanceStats}>
                            <View style={styles.performanceItem}>
                                <Text style={styles.performanceNumber}>{stats.todayDeliveries}</Text>
                                <Text style={styles.performanceLabel}>Đơn đã giao</Text>
                            </View>
                            <View style={styles.performanceDivider} />
                            <View style={styles.performanceItem}>
                                <Text style={styles.performanceNumber}>{stats.pending + stats.inTransit}</Text>
                                <Text style={styles.performanceLabel}>Đơn cần xử lý</Text>
                            </View>
                        </View>
                    </Card.Content>
                </Card>

                {/* Quick Tips */}
                <Card style={styles.tipsCard}>
                    <Card.Content>
                        <Text style={styles.tipsTitle}>💡 Mẹo hay</Text>
                        <View style={styles.tipItem}>
                            <MaterialCommunityIcons name="check" size={16} color="#4CAF50" />
                            <Text style={styles.tipText}>Quét mã QR tại điểm lấy/giao để cập nhật trạng thái</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <MaterialCommunityIcons name="check" size={16} color="#4CAF50" />
                            <Text style={styles.tipText}>Báo cáo ngay nếu có sự cố để được hỗ trợ kịp thời</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <MaterialCommunityIcons name="check" size={16} color="#4CAF50" />
                            <Text style={styles.tipText}>Kéo xuống để làm mới dữ liệu</Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appInfoText}>BiCap Driver v1.0.0</Text>
                    <Text style={styles.appInfoSubtext}>Powered by Blockchain</Text>
                </View>
            </ScrollView>
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
        backgroundColor: 'white',
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 15,
        paddingBottom: 30,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    statCard: {
        width: (width - 45) / 2,
        marginBottom: 15,
        borderRadius: 12,
    },
    statContent: {
        alignItems: 'center',
        paddingVertical: 15,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    performanceCard: {
        marginBottom: 15,
        borderRadius: 12,
        backgroundColor: 'white',
    },
    performanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    performanceTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
        color: '#333',
    },
    performanceStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    performanceItem: {
        alignItems: 'center',
        flex: 1,
    },
    performanceNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2196F3',
    },
    performanceLabel: {
        fontSize: 13,
        color: '#666',
        marginTop: 5,
    },
    performanceDivider: {
        width: 1,
        height: 50,
        backgroundColor: '#eee',
    },
    tipsCard: {
        marginBottom: 15,
        borderRadius: 12,
        backgroundColor: 'white',
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    tipText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    appInfo: {
        alignItems: 'center',
        marginTop: 10,
    },
    appInfoText: {
        fontSize: 12,
        color: '#999',
    },
    appInfoSubtext: {
        fontSize: 11,
        color: '#ccc',
        marginTop: 2,
    },
});