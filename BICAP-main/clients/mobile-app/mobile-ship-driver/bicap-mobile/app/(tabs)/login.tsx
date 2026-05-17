import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, Title, HelperText, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import service đã viết ở bước trước (nếu chưa có hãy xem lại phần authService)
import { authService } from '../../services/authService'; 

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    // Reset lỗi
    setError('');

    // Validate cơ bản
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      // 1. Gọi API Login qua Service
      // authService.login() already handles token storage and returns AuthResponse
      const data = await authService.login(email, password);
      
      // 2. Kiểm tra token trả về
      const token = data.token; 

      if (token) {
        // Token đã được lưu bởi authService.login()
        // 3. Lưu thông tin User (nếu có) để hiển thị Profile
        if (data.user) {
          await AsyncStorage.setItem('userInfo', JSON.stringify(data.user));
        }

        // 4. Chuyển hướng vào màn hình chính (Tab Bar của Tài xế)
        router.replace('/(tabs)'); 
      } else {
        setError('Không nhận được mã xác thực từ server.');
        Alert.alert('Lỗi Đăng nhập', 'Không nhận được mã xác thực từ server.');
      }

    } catch (err: any) {
      console.error('[LoginScreen] Login error:', err);
      // Xử lý thông báo lỗi từ Backend
      // err.message is already set by authService.login()
      const msg = err.message || err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
      setError(msg);
      Alert.alert('Lỗi Đăng nhập', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inner}>
        {/* LOGO & HEADING */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="truck-fast" size={60} color="#2196F3" />
          </View>
          <Title style={styles.title}>BiCap Driver</Title>
          <Text style={styles.subtitle}>Ứng dụng dành cho Tài xế</Text>
        </View>

        {/* FORM INPUT */}
        <View style={styles.form}>
          <TextInput
            label="Email / Số điện thoại"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            left={<TextInput.Icon icon="account" />}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            error={!!error}
          />
          
          <TextInput
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            mode="outlined"
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon 
                icon={showPassword ? "eye-off" : "eye"} 
                onPress={() => setShowPassword(!showPassword)} 
              />
            }
            style={styles.input}
            error={!!error}
          />

          {error ? <HelperText type="error" visible={!!error}>{error}</HelperText> : null}

          <Button 
            mode="contained" 
            onPress={handleLogin} 
            loading={loading}
            disabled={loading}
            contentStyle={{ height: 50 }}
            style={styles.button}
            labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
          >
            Đăng nhập
          </Button>

          <Button 
            mode="text" 
            onPress={() => Alert.alert('Hỗ trợ', 'Vui lòng liên hệ Admin để cấp lại mật khẩu.')}
            style={{ marginTop: 10 }}
          >
            Quên mật khẩu?
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#E3F2FD',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#2196F3', // Màu xanh Logistics
  }
});