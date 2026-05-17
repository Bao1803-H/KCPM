// app/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { authService, DRIVER_ROLE } from '../services/authService';

// Giữ splash screen hiển thị cho đến khi app sẵn sàng
SplashScreen.preventAutoHideAsync();

// Custom theme cho app
const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#2196F3',        // Màu xanh logistics
        secondary: '#FF9800',      // Màu cam cho trạng thái pending
        tertiary: '#4CAF50',       // Màu xanh lá cho success
        error: '#D32F2F',          // Màu đỏ cho error/report
        background: '#f5f5f5',
        surface: '#ffffff',
    },
};

// Context để quản lý auth state (optional - có thể dùng Zustand/Redux)
export const AuthContext = React.createContext<{
    signIn: (token: string) => void;
    signOut: () => void;
    isLoading: boolean;
    userToken: string | null;
    isDriver: boolean;
}>({
    signIn: () => {},
    signOut: () => {},
    isLoading: true,
    userToken: null,
    isDriver: false,
});

export default function RootLayout() {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [isDriver, setIsDriver] = useState(false);
    const router = useRouter();
    const segments = useSegments();

    // Kiểm tra auth state và role khi app khởi động
    useEffect(() => {
        const bootstrapAsync = async () => {
            try {
                // Lấy token từ storage
                const token = await AsyncStorage.getItem('userToken');
                
                if (token) {
                    // Validate token and check driver role
                    const hasAccess = await authService.validateDriverAccess();
                    
                    if (hasAccess) {
                        setUserToken(token);
                        setIsDriver(true);
                    } else {
                        // Token invalid or user is not a driver - clear auth data
                        console.log('[Auth] Invalid token or non-driver user, clearing auth data');
                        await authService.logout();
                        setUserToken(null);
                        setIsDriver(false);
                    }
                } else {
                    setUserToken(null);
                    setIsDriver(false);
                }
            } catch (error) {
                console.error('[Auth] Error loading token:', error);
                setUserToken(null);
                setIsDriver(false);
            } finally {
                setIsLoading(false);
                // Ẩn splash screen
                await SplashScreen.hideAsync();
            }
        };

        bootstrapAsync();
    }, []);

    // Xử lý navigation dựa trên auth state và role
    useEffect(() => {
        if (isLoading) return;

        const currentSegment = segments[0] as string;
        const inAuthGroup = currentSegment === '(auth)' || currentSegment === 'login';
        const inTabsGroup = currentSegment === '(tabs)';

        // Must have token AND be a driver to access main app
        if (!userToken || !isDriver) {
            if (!inAuthGroup && currentSegment !== 'login') {
                // Not logged in or not a driver -> redirect to login
                router.replace('/login');
            }
        } else if (userToken && isDriver && (inAuthGroup || currentSegment === 'login')) {
            // Logged in as driver but still on login screen -> go to dashboard
            router.replace('/(tabs)/dashboard');
        }
    }, [userToken, isDriver, segments, isLoading]);

    // Auth context functions
    const authContext = React.useMemo(
        () => ({
            signIn: async (token: string) => {
                // Validate driver role before setting token
                const hasAccess = await authService.validateDriverAccess();
                if (hasAccess) {
                    await AsyncStorage.setItem('userToken', token);
                    setUserToken(token);
                    setIsDriver(true);
                } else {
                    Alert.alert(
                        'Không có quyền truy cập',
                        'Tài khoản không có quyền truy cập ứng dụng tài xế.',
                        [{ text: 'OK' }]
                    );
                    await authService.logout();
                    setUserToken(null);
                    setIsDriver(false);
                }
            },
            signOut: async () => {
                await authService.logout();
                setUserToken(null);
                setIsDriver(false);
                router.replace('/login');
            },
            isLoading,
            userToken,
            isDriver,
        }),
        [isLoading, userToken, isDriver]
    );

    // Loading screen
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    return (
        <AuthContext.Provider value={authContext}>
            <PaperProvider theme={theme}>
                <StatusBar style="auto" />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        animation: 'slide_from_right',
                    }}
                >
                    {/* Tab screens - Main app */}
                    <Stack.Screen 
                        name="(tabs)" 
                        options={{ headerShown: false }} 
                    />
                    
                    {/* Shipment detail screen */}
                    <Stack.Screen 
                        name="shipment/[id]" 
                        options={{ 
                            headerShown: false,
                            presentation: 'card',
                        }} 
                    />
                    
                    {/* QR Scan screen */}
                    <Stack.Screen 
                        name="scan/[type]" 
                        options={{ 
                            headerShown: false,
                            presentation: 'fullScreenModal',
                            animation: 'fade',
                        }} 
                    />
                    
                    {/* Report issue screen */}
                    <Stack.Screen 
                        name="report/[id]" 
                        options={{ 
                            headerShown: false,
                            presentation: 'modal',
                        }} 
                    />
                    
                    {/* Login screen (nếu có) */}
                    <Stack.Screen 
                        name="login" 
                        options={{ 
                            headerShown: false,
                            presentation: 'card',
                        }} 
                    />
                </Stack>
            </PaperProvider>
        </AuthContext.Provider>
    );
}

// Hook để sử dụng auth context
export function useAuth() {
    return React.useContext(AuthContext);
}
