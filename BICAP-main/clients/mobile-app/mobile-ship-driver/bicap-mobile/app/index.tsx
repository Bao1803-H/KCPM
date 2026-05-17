// app/index.tsx
// Root index - redirects to appropriate screen based on auth state
import { Redirect } from 'expo-router';
import { useContext } from 'react';
import { AuthContext } from './_layout';

export default function Index() {
    const { userToken, isDriver, isLoading } = useContext(AuthContext);
    
    // Wait for auth check to complete
    if (isLoading) {
        return null;
    }
    
    // If logged in and is driver, go to dashboard
    if (userToken && isDriver) {
        return <Redirect href="/(tabs)/dashboard" />;
    }
    
    // Otherwise, go to login
    return <Redirect href="/login" />;
}
