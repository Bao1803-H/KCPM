import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { CameraView, Camera } from "expo-camera";
import { Button, Text, IconButton, Portal, Dialog, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { shipmentService, ShipmentStatus } from '../../services/shipmentService';

export default function QRScanScreen() {
    const { type, shipmentId } = useLocalSearchParams<{ type: string; shipmentId: string }>();
    const router = useRouter();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Dialog states for web
    const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
    const [successDialogVisible, setSuccessDialogVisible] = useState(false);
    const [scannedData, setScannedData] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Manual QR input for web (since camera may not work)
    const [manualQrInput, setManualQrInput] = useState('');
    const [showManualInput, setShowManualInput] = useState(false);

    const isPickup = type === 'pickup';
    const actionText = isPickup ? 'Nhận hàng' : 'Giao hàng';

    useEffect(() => {
        (async () => {
            if (Platform.OS === 'web') {
                // On web, show manual input option
                setShowManualInput(true);
                setHasPermission(false);
            } else {
                const { status } = await Camera.requestCameraPermissionsAsync();
                setHasPermission(status === 'granted');
            }
        })();
    }, []);

    const processQrCode = async (data: string) => {
        if (Platform.OS === 'web') {
            setScannedData(data);
            setConfirmDialogVisible(true);
        } else {
            // Mobile - use Alert
            Alert.alert(
                "Xác nhận quét mã!",
                `Mã kiện hàng: ${data}\nLoại: ${actionText}\nĐơn hàng: #${shipmentId}`,
                [
                    { text: "Xác nhận & Cập nhật", onPress: () => confirmAndUpdate(data) },
                    { text: "Quét lại", onPress: resetScan, style: "cancel" }
                ]
            );
        }
    };

    const confirmAndUpdate = async (data: string) => {
        setConfirmDialogVisible(false);
        try {
            setIsProcessing(true);
            const status: ShipmentStatus = isPickup ? 'PICKED_UP' : 'DELIVERED';
            
            if (shipmentId) {
                await shipmentService.updateStatus(shipmentId, status, data);
            }
            
            const msg = `Đã ${isPickup ? 'xác nhận nhận hàng' : 'xác nhận giao hàng thành công'}!`;
            
            if (Platform.OS === 'web') {
                setSuccessMessage(msg);
                setSuccessDialogVisible(true);
            } else {
                Alert.alert("Thành công!", msg, [{ text: "OK", onPress: () => router.back() }]);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi';
            if (Platform.OS === 'web') {
                window.alert(`Lỗi: Không thể cập nhật trạng thái: ${errorMessage}`);
            } else {
                Alert.alert("Lỗi", `Không thể cập nhật trạng thái: ${errorMessage}`, [{ text: "OK", onPress: resetScan }]);
            }
            resetScan();
        } finally {
            setIsProcessing(false);
        }
    };

    const resetScan = () => {
        setScanned(false);
        setIsProcessing(false);
        setManualQrInput('');
    };

    const handleBarCodeScanned = async ({ type: barcodeType, data }: { type: string; data: string }) => {
        if (scanned || isProcessing) return;
        setScanned(true);
        setIsProcessing(true);
        await processQrCode(data);
    };

    const handleManualSubmit = async () => {
        if (!manualQrInput.trim()) {
            window.alert('Vui lòng nhập mã QR');
            return;
        }
        setScanned(true);
        setIsProcessing(true);
        await processQrCode(manualQrInput.trim());
    };

    // Loading permission
    if (hasPermission === null) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={{ marginTop: 10, color: 'white' }}>Đang kiểm tra quyền camera...</Text>
            </View>
        );
    }

    // No permission - show manual input for web
    if (hasPermission === false) {
        return (
            <View style={[styles.container, styles.centered]}>
                <IconButton icon="camera-off" iconColor="white" size={50} />
                <Text style={styles.permissionText}>
                    {Platform.OS === 'web' ? '📱 Camera không khả dụng trên Web' : 'Không có quyền truy cập camera'}
                </Text>
                <Text style={styles.permissionSubtext}>
                    {Platform.OS === 'web' 
                        ? 'Vui lòng nhập mã QR thủ công hoặc sử dụng ứng dụng mobile'
                        : 'Vui lòng cấp quyền camera trong Cài đặt để sử dụng tính năng quét QR'}
                </Text>
                
                {Platform.OS === 'web' && (
                    <View style={{ width: '80%', maxWidth: 300, marginTop: 20 }}>
                        <TextInput
                            label="Nhập mã QR thủ công"
                            value={manualQrInput}
                            onChangeText={setManualQrInput}
                            mode="outlined"
                            style={{ backgroundColor: 'white', marginBottom: 15 }}
                        />
                        <Button 
                            mode="contained" 
                            onPress={handleManualSubmit}
                            loading={isProcessing}
                            disabled={isProcessing}
                            style={{ marginBottom: 10 }}
                        >
                            Xác nhận
                        </Button>
                    </View>
                )}
                
                <Button 
                    mode="outlined" 
                    onPress={() => router.back()}
                    textColor="white"
                    style={{ marginTop: 10, borderColor: 'white' }}
                >
                    Quay lại
                </Button>

                {/* Dialogs for web */}
                <Portal>
                    <Dialog visible={confirmDialogVisible} onDismiss={() => setConfirmDialogVisible(false)}>
                        <Dialog.Title>Xác nhận quét mã!</Dialog.Title>
                        <Dialog.Content>
                            <Text>Mã kiện hàng: {scannedData}</Text>
                            <Text>Loại: {actionText}</Text>
                            <Text>Đơn hàng: #{shipmentId}</Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={resetScan}>Nhập lại</Button>
                            <Button onPress={() => confirmAndUpdate(scannedData)}>Xác nhận & Cập nhật</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>

                <Portal>
                    <Dialog visible={successDialogVisible} onDismiss={() => {}}>
                        <Dialog.Title>Thành công!</Dialog.Title>
                        <Dialog.Content>
                            <Text>{successMessage}</Text>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => {
                                setSuccessDialogVisible(false);
                                router.back();
                            }}>OK</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            />
            
            {/* Overlay hướng dẫn */}
            <View style={styles.overlay}>
                <View style={styles.topContent}>
                    <Text style={styles.instruction}>
                        {type === 'pickup' 
                            ? '📦 Quét mã QR tại Nông Trại để nhận hàng' 
                            : '🏪 Quét mã QR tại Nhà Bán Lẻ để giao hàng'}
                    </Text>
                    {shipmentId && (
                        <Text style={styles.shipmentInfo}>
                            Đơn hàng: #{shipmentId}
                        </Text>
                    )}
                </View>
                
                {/* Khung quét */}
                <View style={styles.scanFrameContainer}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                    <View style={styles.scanFrame} />
                </View>
                
                {/* Processing indicator */}
                {isProcessing && (
                    <View style={styles.processingContainer}>
                        <ActivityIndicator size="large" color="#00FF00" />
                        <Text style={styles.processingText}>Đang xử lý...</Text>
                    </View>
                )}
                
                <View style={styles.bottomContent}>
                    <Text style={styles.hint}>
                        Đưa camera đến mã QR trên kiện hàng
                    </Text>
                    <IconButton 
                        icon="close-circle" 
                        iconColor="white" 
                        size={50} 
                        onPress={() => router.back()} 
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        justifyContent: 'center',
        backgroundColor: 'black',
    },
    centered: {
        alignItems: 'center',
    },
    overlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
    },
    topContent: { 
        paddingTop: 60, 
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    instruction: { 
        color: 'white', 
        fontSize: 18, 
        textAlign: 'center', 
        fontWeight: 'bold',
        marginBottom: 10,
    },
    shipmentInfo: {
        color: '#00FF00',
        fontSize: 14,
        fontWeight: '600',
    },
    scanFrameContainer: {
        width: 260,
        height: 260,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: { 
        width: 250, 
        height: 250, 
        borderWidth: 2, 
        borderColor: '#00FF00', 
        backgroundColor: 'transparent',
        borderRadius: 10,
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#00FF00',
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 10,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 10,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 10,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 10,
    },
    processingContainer: {
        position: 'absolute',
        top: '50%',
        alignItems: 'center',
    },
    processingText: {
        color: '#00FF00',
        marginTop: 10,
        fontWeight: 'bold',
    },
    bottomContent: { 
        paddingBottom: 40,
        alignItems: 'center',
    },
    hint: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 10,
    },
    permissionText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 15,
    },
    permissionSubtext: {
        color: '#ccc',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 40,
    },
});