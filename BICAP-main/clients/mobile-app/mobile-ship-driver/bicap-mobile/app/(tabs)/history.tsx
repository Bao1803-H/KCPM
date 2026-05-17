// app/(tabs)/history.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { List, Divider, Text, Appbar, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { shipmentService, Shipment, ShipmentStatus } from '../../services/shipmentService';

export default function HistoryScreen() {
    const router = useRouter();
    const [history, setHistory] = useState<Shipment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadHistory = useCallback(async () => {
        try {
            const data = await shipmentService.getDeliveryHistory();
            // Filter only completed/delivered shipments
            const completedShipments = data.filter(
                s => ['DELIVERED', 'COMPLETED'].includes(s.status)
            );
            setHistory(completedShipments);
        } catch (error) {
            console.error('[History] Load error:', error);
            
            // Mock data for development
            if (__DEV__) {
                setHistory([
                    { 
                        id: 'SHIP000', 
                        status: 'COMPLETED',
                        fromLocation: 'Farm A - Đà Lạt',
                        toLocation: 'BigC Tân Phú',
                        deliveryTime: '2024-05-20T10:30:00',
                    },
                    { 
                        id: 'SHIP-OLD', 
                        status: 'COMPLETED',
                        fromLocation: 'Farm B - Long An',
                        toLocation: 'WinMart Q1',
                        deliveryTime: '2024-05-19T15:45:00',
                    },
                    { 
                        id: 'SHIP-OLD2', 
                        status: 'COMPLETED',
                        fromLocation: 'Farm C - Bình Dương',
                        toLocation: 'Co.opmart Gò Vấp',
                        deliveryTime: '2024-05-18T14:20:00',
                    },
                ]);
            }
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const onRefresh = () => {
        setRefreshing(true);
        loadHistory();
    };

    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    const getStatusColor = (status: ShipmentStatus): string => {
        switch (status) {
            case 'COMPLETED': return '#4CAF50';
            case 'DELIVERED': return '#4CAF50';
            case 'CANCELLED': return '#F44336';
            default: return '#9E9E9E';
        }
    };

    const renderItem = ({ item }: { item: Shipment }) => (
        <List.Item
            title={`Đơn #${item.id}`}
            titleStyle={styles.itemTitle}
            description={() => (
                <View style={styles.itemDescription}>
                    <View style={styles.locationRow}>
                        <MaterialCommunityIcons name="store-marker-outline" size={14} color="#4CAF50" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {item.fromLocation}
                        </Text>
                    </View>
                    <View style={styles.locationRow}>
                        <MaterialCommunityIcons name="map-marker-radius" size={14} color="#F44336" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {item.toLocation}
                        </Text>
                    </View>
                    <Text style={styles.dateText}>
                        Giao lúc: {formatDate(item.deliveryTime)}
                    </Text>
                </View>
            )}
            left={() => (
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons 
                        name="check-circle" 
                        size={28} 
                        color={getStatusColor(item.status)} 
                    />
                </View>
            )}
            right={() => (
                <Chip 
                    compact 
                    style={[styles.statusChip, { backgroundColor: '#E8F5E9' }]}
                    textStyle={{ color: '#4CAF50', fontSize: 11 }}
                >
                    Hoàn thành
                </Chip>
            )}
            onPress={() => router.push(`/shipment/${item.id}` as any)}
            style={styles.listItem}
        />
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="history" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có lịch sử giao hàng</Text>
            <Text style={styles.emptySubtext}>
                Các đơn hàng hoàn thành sẽ xuất hiện ở đây
            </Text>
        </View>
    );

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
                <Appbar.Content title="Lịch sử giao hàng" />
                <Appbar.Action icon="refresh" onPress={onRefresh} />
            </Appbar.Header>
            
            {/* Stats summary */}
            <View style={styles.statsBar}>
                <Chip icon="check-all" style={styles.statsChip}>
                    {history.length} đơn hoàn thành
                </Chip>
            </View>

            <FlatList
                data={history}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <Divider style={styles.divider} />}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={history.length === 0 ? styles.emptyList : undefined}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: 'white',
        elevation: 2,
    },
    statsBar: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#f5f5f5',
    },
    statsChip: {
        alignSelf: 'flex-start',
        backgroundColor: '#E8F5E9',
    },
    listItem: {
        paddingVertical: 10,
    },
    itemTitle: {
        fontWeight: '600',
        fontSize: 15,
    },
    itemDescription: {
        marginTop: 5,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
    },
    locationText: {
        marginLeft: 5,
        fontSize: 13,
        color: '#666',
        flex: 1,
    },
    dateText: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    iconContainer: {
        justifyContent: 'center',
        paddingLeft: 10,
    },
    statusChip: {
        alignSelf: 'center',
    },
    divider: {
        marginHorizontal: 15,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyList: {
        flex: 1,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginTop: 15,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
    },
});