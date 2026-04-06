import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react'
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity } from 'react-native'
import { authStyles } from '../../assets/styles/auth.styles';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import VerifyEmail from './verify-email';

const SignUp = () => {

    const router = useRouter();
    const { isLoaded, signUp } = useSignUp();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);


    const handleSignUp = async () => {
        if (!email || !password)
            return Alert.alert("Error", "Please fill in all fields.");
        if (password.length < 8)
            return Alert.alert("Weak Password", "Password must be atleast 8 characters");
        if (!isLoaded) return;
        // Start sign-up process using email and password provided
        try {
            await signUp.create({
                emailAddress: email,
                password,
            })

            // Send user an email with verification code
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

            // Set 'pendingVerification' to true to display second form
            // and capture OTP code
            setPendingVerification(true)
        } catch (err) {
            // See https://clerk.com/docs/custom-flows/error-handling
            // for more info on error handling
            // Alert("Error", err.errors?.[0]?.message || "Sign Up Failed")
            const errorMessage = err.errors?.[0]?.message || "Verification Failed";
            Alert.alert("Error", errorMessage)
            // console.error(JSON.stringify(err, null, 2))
        }
        finally {
            setLoading(false);
        }
    };

    if (pendingVerification) return <VerifyEmail email={email} onBack={() => { setPendingVerification(false) }} />
    // render
    return (
        <View style={authStyles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} style={authStyles.keyboardView}>
                <ScrollView contentContainerStyle={authStyles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={authStyles.imageContainer}>
                        <Image source={require("../../assets/images/i2.png")} style={authStyles.image} contentFit='contain' />
                    </View>
                    <Text style={authStyles.title}>Create Account</Text>
                    {/* Form Container */}
                    <View style={authStyles.formContainer}>
                        {/* Email Input */}
                        <View style={authStyles.inputContainer}>
                            <TextInput style={authStyles.textInput} placeholder='Enter your Email' placeholderTextColor={COLORS.textLight} value={email} onChangeText={setEmail} keyboardType='email-address' autoCapitalize='none' />
                        </View>
                        {/* Password Input */}
                        <View style={authStyles.inputContainer}>
                            <TextInput style={authStyles.textInput} placeholder='Enter your Password' placeholderTextColor={COLORS.textLight} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize='none' />

                            <TouchableOpacity style={authStyles.eyeButton} onPress={() => {
                                setShowPassword(!showPassword)
                            }}>
                                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={COLORS.textLight} />
                            </TouchableOpacity>


                            {/* Sign Up Button */}

                            <TouchableOpacity style={[authStyles.authButton, loading && authStyles.buttonDisabled]} onPress={handleSignUp} disabled={loading} activeOpacity={0.8}>
                                <Text style={authStyles.buttonText}>{loading ? "Signing Up ..." : "Sign Up"}</Text>
                            </TouchableOpacity>

                            {/* Sign in Link */}


                            <TouchableOpacity style={authStyles.linkContainer} onPress={() => { router.back() }}>
                                <Text style={authStyles.linkText}>Already have an account? <Text style={authStyles.link}>Sign In</Text></Text>
                            </TouchableOpacity>

                        </View>
                    </View>


                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    )
}

export default SignUp
