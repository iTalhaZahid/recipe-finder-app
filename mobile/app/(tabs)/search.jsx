import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, FlatList } from 'react-native'
import { MealAPI } from '../../services/mealAPI'
import { useDebounce } from '../../hooks/useDebounce';
import { searchStyles } from '../../assets/styles/search.styles'
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import RecipeCard from '../../components/RecipeCard'
import NoResultsFound from '../../components/RecipeNotFound'
import LoadingSpinner from '../../components/LoadingSpinner';
import { useNetwork } from '../../context/NetworkContext';
import Toast from 'react-native-toast-message';

const Search = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const { isConnected } = useNetwork();
    // const { isConnected } = useState(false);

    const debouncedSearchQuery = useDebounce(searchQuery, 300)


    const performSearch = async (query) => {
        if (!isConnected) {
            Toast.show({
                type: 'error',
                text1: 'No Internet Connection',
                text2: 'Please check your network before searching.',
            }); // 🔹 ADDED
            return [];
        }


        //if no search Query
        if (!query.trim()) {
            const randomMeals = await MealAPI.getRandomMeals(12);
            return randomMeals.map(meal => MealAPI.transformMealData(meal)).filter(meal => meal !== null)
        }

        //search by name first,then by ingredient if no result

        const nameResults = await MealAPI.searchMealsByName(query);
        let results = nameResults;

        if (results.length === 0) {
            const ingredientResults = await MealAPI.filterByIngredient(query);
            results = ingredientResults
        }
        return results.slice(0, 12).map(meal => MealAPI.transformMealData(meal)).filter(meal => meal !== null);


    }
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                if (!isConnected) {
                    setInitialLoading(false); // 🔹 ADDED: skip loading if offline
                    return;
                }
                const results = await performSearch("")
                setRecipes(results)
            } catch (error) {
                console.log(error)
            }
            finally {
                setInitialLoading(false);
            }
        }
        loadInitialData();
    }, [isConnected])


    useEffect(() => {
        if (initialLoading) return;
        const handleSearch = async () => {
            // 🔹 Skip if offline
            if (!isConnected) {
                setRecipes([]); // clear results while offline
                Toast.show({
                    type: 'error',
                    text1: 'Offline',
                    text2: 'Cannot search while offline.',
                });
                return;
            }
            try {
                setLoading(true);
                const results = await performSearch(debouncedSearchQuery);
                setRecipes(results);
            } catch (error) {
                console.log("Error Searching", error);
                setRecipes([]);
            }
            finally {
                setLoading(false);
            }
        }

        handleSearch();
    }, [debouncedSearchQuery, initialLoading, isConnected])

    // if (initialLoading) return <LoadingSpinner />
    // 🔹 Offline placeholder
    if (!isConnected) {
        return (
            <View
                style={[
                    searchStyles.container,
                    {
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: COLORS.background, // optional, to match your theme
                    },
                ]}
            >
                <View
                    style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8, // 🔹 spacing between items (RN 0.71+)
                    }}
                >
                    <Ionicons name="wifi" size={72} color={COLORS.primary} style={{ marginBottom: 8 }} />
                    <Text
                        style={[
                            {
                                color: COLORS.primary, fontWeight: '600', fontSize: 18,

                            },
                        ]}
                    >
                        No Internet Connection
                    </Text>
                    <Text
                        style={[
                            searchStyles.resultsCount,
                            {
                                color: COLORS.textLight,
                                marginTop: 4,
                                fontSize: 14,
                                textAlign: 'center',
                                width: '80%',
                            },
                        ]}
                    >
                        Please reconnect to search recipes.
                    </Text>
                </View>
            </View>

        );
    }
    // render
    return (
        <View style={searchStyles.container}>
            <View style={searchStyles.searchSection}>
                <View style={searchStyles.searchContainer}>
                    <Ionicons
                        name='search'
                        size={20}
                        color={COLORS.textLight}
                        style={searchStyles.searchIcon}
                    />
                    <TextInput
                        style={searchStyles.searchInput}
                        placeholder='Search recipes,ingredients...'
                        placeholderTextColor={searchStyles.textLight}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType='search'
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")} style={searchStyles.clearButton}>
                            <Ionicons name='close-circle' size={20} color={COLORS.textLight} />
                        </TouchableOpacity>
                    )}

                </View>
            </View>

            <View style={searchStyles.resultsSection}>
                <View style={searchStyles.resultsHeader}>
                    <Text style={searchStyles.resultsTitle}>

                        {searchQuery ? `Results for "${searchQuery}"` : "Popular Recipes"}
                    </Text>
                    <Text style={searchStyles.resultsCount}>{recipes.length} found</Text>
                </View>
                {loading ? (
                    <View style={searchStyles.loadingContainer}>
                        <LoadingSpinner message='Searching Recipes' size='small' />
                    </View>
                ) : (
                    <FlatList
                        data={recipes}
                        renderItem={({ item }) => <RecipeCard recipe={item} />}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={2}
                        columnWrapperStyle={searchStyles.recipesGrid}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={<NoResultsFound />}
                    />
                )}
            </View>
        </View>
    )
}

export default Search
