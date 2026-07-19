import { Stack } from 'expo-router';
import React from 'react';



const Layout = () => {
  return (
   
      <Stack>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="signup-user" options={{headerShown: false}} /> 
        <Stack.Screen name="signup-business" options={{headerShown: false}} /> 
        <Stack.Screen name="signup-rider" options={{headerShown: false}} /> 

        <Stack.Screen name="sign-in" options={{headerShown: false}} /> 
        <Stack.Screen name="role-selection" options={{headerShown: false}} />   
        <Stack.Screen name="forgot-password" options={{headerShown: false}} />        
     
      </Stack>
     
    
  );
}
export default Layout;
