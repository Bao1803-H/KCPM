import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Appbar, Text, SegmentedButtons, ActivityIndicator, Portal, Dialog } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { shipmentService } from '../../services/shipmentService';

type ReportType = 'DAMAGE' | 'DELAY' | 'OTHER';

// Web-safe alert helper
const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n${message}`);
        if (onOk) onOk();
    } else {
        Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
};

export default function ReportScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [reportType, setReportType] = useState<ReportType>('DAMAGE');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Success dialog for web
    const [successDialogVisible, setSuccessDialogVisible] = useState(false);

    // Chụp ảnh từ camera
    const takePhoto = async () => {
        try {
            // Xin quyền camera
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showAlert('Thông báo', 'Cần cấp quyền camera để chụp ảnh');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: 0.7,
                allowsEditing: true,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets[0]) {
                setImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('[Report] Camera error:', error);
            showAlert('Lỗi', 'Không thể mở camera');
        }
    };

    // Chọn ảnh từ thư viện
    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                showAlert('Thông báo', 'Cần cấp quyền truy cập thư viện ảnh');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.7,
                allowsEditing: true,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets[0]) {
                setImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('[Report] Image picker error:', error);
            showAlert('Lỗi', 'Không thể chọn ảnh');
        }
    };

    // Xóa ảnh đã chọn
    const removeImage = () => {
        setImage(null);
    };

    // Gửi báo cáo
    const submitReport = async () => {
        // Validate
        if (!description.trim()) {
            showAlert('Thiếu thông tin', 'Vui lòng nhập mô tả sự cố');
            return;
        }

        if (description.trim().length < 10) {
            showAlert('Thiếu thông tin', 'Mô tả sự cố cần ít nhất 10 ký tự');
            return;
        }

        setIsSubmitting(true);

        try {
            // Gọi API gửi báo cáo
            if (id) {
                await shipmentService.reportIssue(
                    id,
                    `[${getReportTypeLabel(reportType)}] ${description}`,
                    image || undefined
                );
            }

            if (Platform.OS === 'web') {
                setSuccessDialogVisible(true);
            } else {
                Alert.alert(
                    "Gửi thành công!", 
                    "Báo cáo của bạn đã được ghi nhận. Chúng tôi sẽ xử lý trong thời gian sớm nhất.",
                    [{ text: "OK", onPress: () => router.back() }]
                );
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi';
            showAlert("Lỗi", `Không thể gửi báo cáo: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getReportTypeLabel = (type: ReportType): string => {
        switch (type) {
            case 'DAMAGE': return 'Hư hỏng';
            case 'DELAY': return 'Chậm trễ';
            case 'OTHER': return 'Khác';
            default: return type;
        }
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Báo cáo sự cố" subtitle={`Đơn hàng #${id}`} />
            </Appbar.Header>

            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                    {/* Loại sự cố */}
                    <Text variant="titleMedium" style={styles.sectionTitle}>Loại sự cố</Text>
                    <SegmentedButtons
                        value={reportType}
                        onValueChange={(value) => setReportType(value as ReportType)}
                        buttons={[
                            { 
                                value: 'DAMAGE', 
                                label: '🔴 Hư hỏng',
                                icon: 'package-variant-remove',
                            },
                            { 
                                value: 'DELAY', 
                                label: '🟡 Chậm trễ',
                                icon: 'clock-alert',
                            },
                            { 
                                value: 'OTHER', 
                                label: '🔵 Khác',
                                icon: 'help-circle',
                            },
                        ]}
                        style={styles.segmentedButtons}
                    />

                    {/* Mô tả */}
                    <Text variant="titleMedium" style={styles.sectionTitle}>Mô tả sự cố *</Text>
                    <TextInput
                        label="Chi tiết sự cố"
                        placeholder="VD: Hàng bị vỡ do va đập trong quá trình vận chuyển..."
                        value={description}
                        onChangeText={setDescription}
                        mode="outlined"
                        multiline
                        numberOfLines={5}
                        style={styles.textInput}
                        maxLength={500}
                    />
                    <Text style={styles.charCount}>{description.length}/500</Text>

                    {/* Ảnh */}
                    <Text variant="titleMedium" style={styles.sectionTitle}>Ảnh minh chứng</Text>
                    
                    {image ? (
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: image }} style={styles.previewImage} />
                            <Button 
                                mode="outlined" 
                                icon="close" 
                                onPress={removeImage}
                                style={styles.removeImageButton}
                                textColor="#D32F2F"
                            >
                                Xóa ảnh
                            </Button>
                        </View>
                    ) : (
                        <View style={styles.imageButtons}>
                            <Button 
                                mode="outlined" 
                                icon="camera" 
                                onPress={takePhoto}
                                style={styles.imageButton}
                            >
                                Chụp ảnh
                            </Button>
                            <Button 
                                mode="outlined" 
                                icon="image" 
                                onPress={pickImage}
                                style={styles.imageButton}
                            >
                                Chọn từ thư viện
                            </Button>
                        </View>
                    )}

                    {/* Gợi ý */}
                    <View style={styles.tipsContainer}>
                        <Text variant="labelLarge" style={styles.tipsTitle}>💡 Lưu ý:</Text>
                        <Text style={styles.tipsText}>• Mô tả chi tiết giúp xử lý nhanh hơn</Text>
                        <Text style={styles.tipsText}>• Ảnh rõ ràng là bằng chứng quan trọng</Text>
                        <Text style={styles.tipsText}>• Báo cáo sẽ được xử lý trong 24h</Text>
                    </View>
                </ScrollView>

                {/* Submit Button */}
                <View style={styles.footer}>
                    <Button 
                        mode="contained" 
                        onPress={submitReport} 
                        buttonColor="#D32F2F"
                        contentStyle={styles.submitButtonContent}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                        icon="send"
                    >
                        {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                    </Button>
                </View>
            </KeyboardAvoidingView>

            {/* Success Dialog for Web */}
            <Portal>
                <Dialog visible={successDialogVisible} onDismiss={() => {}}>
                    <Dialog.Title>Gửi thành công!</Dialog.Title>
                    <Dialog.Content>
                        <Text>Báo cáo của bạn đã được ghi nhận. Chúng tôi sẽ xử lý trong thời gian sớm nhất.</Text>
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

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: 'white' 
    },
    content: { 
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    sectionTitle: {
        marginTop: 15,
        marginBottom: 10,
        fontWeight: '600',
    },
    segmentedButtons: {
        marginBottom: 10,
    },
    textInput: {
        backgroundColor: 'white',
    },
    charCount: {
        textAlign: 'right',
        color: '#666',
        fontSize: 12,
        marginTop: 5,
    },
    imageContainer: {
        alignItems: 'center',
    },
    previewImage: { 
        width: '100%', 
        height: 200, 
        borderRadius: 10,
        marginBottom: 10,
    },
    removeImageButton: {
        borderColor: '#D32F2F',
    },
    imageButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    imageButton: {
        flex: 1,
        marginHorizontal: 5,
    },
    tipsContainer: {
        marginTop: 25,
        padding: 15,
        backgroundColor: '#FFF3E0',
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
    },
    tipsTitle: {
        color: '#E65100',
        marginBottom: 8,
    },
    tipsText: {
        color: '#666',
        fontSize: 13,
        marginBottom: 4,
    },
    footer: {
        padding: 15,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    submitButtonContent: {
        height: 50,
    },
});