import { useSignUp } from '@clerk/clerk-expo'
import { useState, useEffect } from 'react'
import { View, Text, KeyboardAvoidingView, ScrollView, TextInput, TouchableOpacity, Platform, Alert } from 'react-native'
import { authStyles } from '../../assets/styles/auth.styles';
import { Image } from 'expo-image';
import { COLORS } from '../../constants/colors';
import { OtpInput } from "react-native-otp-entry";
import { useRouter } from 'expo-router';

const VerifyEmail = ({ email, onBack }) => {

    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(60);
    const { isLoaded, signUp, setActive } = useSignUp();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Cooldown countdown logic
    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [cooldown]);


    const handleVerification = async (enteredCode = code) => {
        if (!isLoaded) return

        setLoading(true);
        try {
            // Use the code the user provided to attempt verification
            const signUpAttempt = await signUp.attemptEmailAddressVerification({
                code: enteredCode,
            })

            // If verification was completed, set the session to active
            // and redirect the user
            if (signUpAttempt.status === 'complete') {
                await setActive({ session: signUpAttempt.createdSessionId })
                router.replace('/')
            } else {
                // If the status is not complete, check why. User may need to
                // complete further steps.
                Alert.alert(
                    "Verification Error",
                    signUpAttempt?.errors?.[0]?.message || "Verification failed. Please try again."
                );
                // console.error(JSON.stringify(signUpAttempt, null, 2))
            }
        } catch (err) {
            // See https://clerk.com/docs/custom-flows/error-handling
            // for more info on error handling
            Alert.alert("Error", err?.errors?.[0]?.message || "Something went wrong.");
            // console.error(JSON.stringify(err, null, 2))
        }
        finally {
            setLoading(false);
        }
    };


    // Resend verification code
    const handleResendCode = async () => {
        if (!isLoaded || resending || cooldown > 0) return;

        setResending(true);
        try {
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            Alert.alert('Verification Code Sent', 'Please check your inbox for a new code.');
            setCooldown(60); // 60-second cooldown
        } catch (err) {
            Alert.alert('Error', err?.errors?.[0]?.message || 'Failed to resend verification code.');
        } finally {
            setResending(false);
        }
    };

    // render
    return (
        <View style={authStyles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} style={authStyles.keyboardView}>
                <ScrollView contentContainerStyle={authStyles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={authStyles.imageContainer}>
                        <Image source={require("../../assets/images/i3.png")} style={authStyles.image} contentFit='contain' />
                    </View>
                    <Text style={authStyles.title}>Verify Your Email</Text>
                    <Text style={authStyles.subtitle}>We've sent a verification code to your email <Text style={authStyles.link}>{email}</Text>.</Text>

                    {/* <TextInput style={authStyles.textInput} placeholder='Enter Verifcation Code' placeholderTextColor={COLORS.textLight} value={code} onChangeText={setCode} keyboardType='number-pad' autoCapitalize='none' /> */}


                    <OtpInput
                        autoFocus
                        numberOfDigits={6}
                        focusColor={COLORS.primary}
                        type="numeric"
                        blurOnFilled={true}
                        onFilled={(text) => {
                            setCode(text);
                            handleVerification(text);
                        }}
                    />

                    {/* verify Button */}
                    <TouchableOpacity style={[authStyles.authButton, loading && authStyles.buttonDisabled]} onPress={handleVerification} disabled={loading} activeOpacity={0.8}>
                        <Text style={authStyles.buttonText}>{loading ? "Verifying ..." : "Verify Email"}</Text>
                    </TouchableOpacity>

                    {/* Resend Code Button */}
                    <TouchableOpacity
                        style={authStyles.linkContainer}
                        onPress={handleResendCode}
                        disabled={resending || cooldown > 0}
                    >
                        <Text style={[authStyles.link, (resending || cooldown > 0) && { opacity: 0.5 }]}>
                            {resending
                                ? 'Resending...'
                                : cooldown > 0
                                    ? `Resend Code in ${cooldown}s`
                                    : 'Resend Code'}
                        </Text>
                    </TouchableOpacity>


                    {/* Back to Sign Up */}
                    <TouchableOpacity style={authStyles.linkContainer} onPress={() => router.back()}>
                        <Text style={authStyles.link}>Back to Sign Up</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    )
}

export default VerifyEmail
