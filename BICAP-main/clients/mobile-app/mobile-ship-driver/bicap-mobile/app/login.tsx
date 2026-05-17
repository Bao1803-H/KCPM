// app/login.tsx
import React, { useState, useContext } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { authService, DRIVER_ROLE } from '../services/authService';
import { setCustomBaseUrl, API_CONFIG } from '../services/axiosInstance';
import { AuthContext } from './_layout';

// Web alert helper
const showWebAlert = (message: string) => {
    if (typeof window !== 'undefined' && window.alert) {
        window.alert(message);
    }
};

export default function LoginScreen() {
    const router = useRouter();
    const { signIn } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: { email?: string; password?: string } = {};
        
        if (!email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!password.trim()) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
        } else if (password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle login with role checking
    const handleLogin = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            // authService.login() now validates ROLE_DELIVERYDRIVER
            const data = await authService.login(email.trim(), password);
            
            console.log('[Login] Success! Updating auth state...');
            
            // Update auth context state - this will trigger navigation in _layout.tsx
            await signIn(data.token);
            
            // Show success message on mobile only (navigation handled by AuthContext)
            if (Platform.OS !== 'web') {
                Alert.alert(
                    'Đăng nhập thành công',
                    `Chào mừng ${data.user?.fullName || 'Tài xế'}!`
                );
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Đăng nhập thất bại';
            console.error('[Login] Error:', errorMessage);
            
            // Show different alerts based on error type
            if (Platform.OS === 'web') {
                // Use window.alert on web
                showWebAlert(errorMessage);
            } else if (errorMessage.includes('quyền truy cập') || errorMessage.includes('tài xế')) {
                Alert.alert(
                    'Không có quyền truy cập',
                    errorMessage,
                    [{ text: 'Đã hiểu' }]
                );
            } else {
                Alert.alert('Lỗi đăng nhập', errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Config API URL (for development)
    const handleConfigApi = () => {
        Alert.prompt(
            'Cấu hình Server',
            `Nhập IP LAN của máy tính:`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Lưu',
                    onPress: (ip: string | undefined) => {
                        if (ip) {
                            const newUrl = `http://${ip}:8000`;
                            setCustomBaseUrl(newUrl);
                            Alert.alert('Đã cập nhật', `Server URL: ${newUrl}`);
                        }
                    },
                },
            ],
            'plain-text',
            API_CONFIG.LAN_IP
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo & Title */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>🚚</Text>
                    </View>
                    <Text style={styles.title}>BiCap Driver</Text>
                    <Text style={styles.subtitle}>Ứng dụng dành cho Tài xế</Text>
                </View>

                {/* Login Form */}
                <View style={styles.form}>
                    <TextInput
                        label="Email"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        left={<TextInput.Icon icon="email" />}
                        error={!!errors.email}
                        style={styles.input}
                    />
                    {errors.email && (
                        <HelperText type="error" visible={!!errors.email}>
                            {errors.email}
                        </HelperText>
                    )}

                    <TextInput
                        label="Mật khẩu"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        mode="outlined"
                        secureTextEntry={!showPassword}
                        left={<TextInput.Icon icon="lock" />}
                        right={
                            <TextInput.Icon
                                icon={showPassword ? 'eye-off' : 'eye'}
                                onPress={() => setShowPassword(!showPassword)}
                            />
                        }
                        error={!!errors.password}
                        style={styles.input}
                    />
                    {errors.password && (
                        <HelperText type="error" visible={!!errors.password}>
                            {errors.password}
                        </HelperText>
                    )}

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={isLoading}
                        disabled={isLoading}
                        style={styles.loginButton}
                        contentStyle={styles.loginButtonContent}
                    >
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </Button>

                    <Button
                        mode="text"
                        onPress={() => {
                            const msg = 'Vui lòng liên hệ quản trị viên để được hỗ trợ.';
                            Platform.OS === 'web' ? showWebAlert(msg) : Alert.alert('Thông báo', msg);
                        }}
                        style={styles.forgotButton}
                    >
                        Quên mật khẩu?
                    </Button>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    {__DEV__ && (
                        <>
                            <Button
                                mode="text"
                                onPress={handleConfigApi}
                                style={styles.configButton}
                                icon="cog"
                            >
                                Cấu hình Server
                            </Button>
                        </>
                    )}
                    
                    <Text style={styles.footerText}>
                        BiCap - Blockchain Integrated Crop Agricultural Platform
                    </Text>
                    <Text style={styles.versionText}>v1.0.0</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoText: {
        fontSize: 50,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2196F3',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
    },
    form: {
        marginBottom: 30,
    },
    input: {
        marginBottom: 5,
        backgroundColor: 'white',
    },
    loginButton: {
        marginTop: 20,
        borderRadius: 8,
    },
    loginButtonContent: {
        height: 50,
    },
    forgotButton: {
        marginTop: 10,
    },
    footer: {
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: 20,
    },
    devButton: {
        marginBottom: 10,
        borderColor: '#FF9800',
    },
    configButton: {
        marginBottom: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
    versionText: {
        fontSize: 11,
        color: '#ccc',
        marginTop: 5,
    },
});
