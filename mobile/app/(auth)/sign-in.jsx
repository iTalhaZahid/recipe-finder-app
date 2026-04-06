import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authStyles } from '../../assets/styles/auth.styles';
import { COLORS } from '../../constants/colors';
import { useSignIn } from '@clerk/clerk-expo';


const SignIn = () => {
    // render
    const router = useRouter();
    const { signIn, setActive, isLoaded } = useSignIn();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in all fields!");
            return
        }

        if (!isLoaded) return;
        setLoading(true)

        try {
            const signInAttempt = await signIn.create({
                identifier: email,
                password,
            })

            // If sign-in process is complete, set the created session as active
            // and redirect the user
            if (signInAttempt.status === 'complete') {
                await setActive({ session: signInAttempt.createdSessionId })
                router.replace('/')
            } else {
                // If the status isn't complete, check why. User might need to
                // complete further steps.
                Alert.alert("Error", err.errors?.[0]?.message || "Sign in Failed");
                console.error(JSON.stringify(signInAttempt, null, 2))
            }
        } catch (err) {
            // See https://clerk.com/docs/custom-flows/error-handling
            // for more info on error handling
            Alert.alert("Error", err.errors?.[0]?.message || "Sign in Failed")
            console.error(JSON.stringify(err, null, 2))
        }
        finally {
            setLoading(false)
        }
    }


    return (
        <View style={authStyles.container}>
            <KeyboardAvoidingView style={authStyles.KeyboardView} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
                <ScrollView contentContainerStyle={authStyles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={authStyles.imageContainer}>
                        <Image source={require("../../assets/images/i1.png")} style={authStyles.image} contentFit='contain' />
                    </View>
                    <Text style={authStyles.title}>Welcome Back</Text>
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
                        </View>

                        {/* Sign in Button */}

                        <TouchableOpacity style={[authStyles.authButton, loading && authStyles.buttonDisabled]} onPress={handleSignIn} disabled={loading} activeOpacity={0.8}>
                            <Text style={authStyles.buttonText}>{loading ? "Signing In ..." : "Sign In"}</Text>
                        </TouchableOpacity>

                        {/* Sign Up Link */}


                        <TouchableOpacity style={authStyles.linkContainer} onPress={() => { router.push("/(auth)/sign-up") }}>
                            <Text style={authStyles.linkText}>Don't have an account? <Text style={authStyles.link}>Sign up</Text></Text>
                        </TouchableOpacity>
                        <View style={{justifyContent:'center',alignItems:'center'}}>
                            <Text style={authStyles.link}>Demo Email:
                                <Text style={authStyles.subtitle}>demo@example.com</Text>
                            </Text>
                            <Text style={authStyles.link}>Demo Password:
                                <Text style={authStyles.subtitle}>Pak!12@1</Text>
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    )
}

export default SignIn
