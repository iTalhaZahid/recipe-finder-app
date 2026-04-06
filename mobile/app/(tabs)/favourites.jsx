import { useClerk, useUser } from '@clerk/clerk-expo'
import React, { useEffect, useState } from 'react'
import { View, Text, Alert, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native'
import { API_URL } from '../../constants/api';
import { favoritesStyles } from '../../assets/styles/favorites.styles'
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from "../../constants/colors";
import RecipeCard from '../../components/RecipeCard'
import NoFavoritesFound from '../../components/NoFavoritesFound';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNetwork } from '../../context/NetworkContext';

const Favourites = () => {
    const { signOut } = useClerk();
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [favouriteRecipes, setFavouriteRecipes] = useState([]);
    const { isConnected } = useNetwork();

    useEffect(() => {
        const loadFavourites = async () => {
            if (!isConnected) {
                Alert.alert("No Internet", "Please check your connection before loading favorites.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/favourites/${user.id}`);
                if (!response.ok) throw new Error("Failed to fetch Favourites");
                const favourites = await response.json();

                // 🔹 Transform data to match RecipeCard
                const transformFavourites = favourites.map(favourite => ({
                    ...favourite,
                    id: favourite.receipeId
                }));

                setFavouriteRecipes(transformFavourites);
            } catch (error) {
                Alert.alert("Error", "Failed to load favorites.");
            } finally {
                setLoading(false);
            }
        };

        loadFavourites();
    }, [isConnected]);

    const handleSignOut = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", onPress: signOut, style: "destructive" }
            ],
            { cancelable: true }
        );
    };

    return (
        <View style={favoritesStyles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* 🔹 Header always visible */}
                <View style={favoritesStyles.header}>
                    <Text style={favoritesStyles.title}>Favorites</Text>
                    <TouchableOpacity
                        style={favoritesStyles.logoutButton}
                        onPress={handleSignOut}
                    >
                        <Ionicons name='log-out-outline' size={22} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                {/* 🔹 Loading spinner centered */}
                {loading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
                        <LoadingSpinner message="Loading Your Favorites..." />
                    </View>
                ) : (
                    <>
                        {/* 🔹 Offline view */}
                        {!isConnected ? (
                            <View style={favoritesStyles.emptyState}>
                                <Ionicons name="wifi" size={64} color={COLORS.textLight} />
                                <Text style={favoritesStyles.emptyTitle}>Offline Mode</Text>
                                <Text style={favoritesStyles.emptyDescription}>
                                    Please reconnect to view your latest favorites.
                                </Text>
                            </View>
                        ) : (
                            <View style={favoritesStyles.recipesSection}>
                                <FlatList
                                    data={favouriteRecipes}
                                    renderItem={({ item }) => <RecipeCard recipe={item} />}
                                    keyExtractor={(item, index) =>
                                        item?.id ? item.id.toString() : index.toString()
                                    }
                                    numColumns={2}
                                    columnWrapperStyle={favoritesStyles.row}
                                    contentContainerStyle={favoritesStyles.recipesGrid}
                                    scrollEnabled={false}
                                    ListEmptyComponent={<NoFavoritesFound />}
                                />
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

export default Favourites;
