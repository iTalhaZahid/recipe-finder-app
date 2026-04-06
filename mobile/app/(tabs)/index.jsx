import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { MealAPI } from '../../services/mealAPI';
import { homeStyles } from '../../assets/styles/home.styles';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import CategoryFilter from '../../components/CategoryFilter';
import RecipeCard from '../../components/RecipeCard';
import { useNetwork } from '../../context/NetworkContext'
import FeaturedCarousel from '../../components/FeaturedCarousel';

const HomeScreen = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredRecipes, setFeaturedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const { isConnected } = useNetwork();
  const loadData = async () => {
    try {
      if (!isConnected) {
        // console.log('Skipped API calls: offline'); // 🔹 ADDED
        setLoading(false);
        return;
      }

      setLoading(true);
      const [apiCategories, randomMeals, featuredMeals] = await Promise.all([
        MealAPI.getCategories(),
        MealAPI.getRandomMeals(12),
        MealAPI.getRandomMeals(4), // load 4 featured recipes
      ]);

      const transformedCategories = apiCategories.map((category, index) => ({
        id: index + 1,
        name: category.strCategory,
        image: category.strCategoryThumb,
        description: category.strCategoryDescription,
      }));

      setCategories(transformedCategories);
      if (!selectedCategory) setSelectedCategory(transformedCategories[0].name);

      const transformedMeals = randomMeals
        .map((meal) => MealAPI.transformMealData(meal))
        .filter((meal) => meal !== null);

      setRecipes(transformedMeals);

      const transformedFeatured = featuredMeals
        .map((meal) => MealAPI.transformMealData(meal))
        .filter((meal) => meal !== null);

      setFeaturedRecipes(transformedFeatured);
    } catch (error) {
      console.log('Error loading the data', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryData = async (category) => {
    try {
      if (!isConnected) return; // 🔹 ADDED: Avoid API calls offline
      const meals = await MealAPI.filterByCategory(category);
      const transformedMeals = meals
        .map((meal) => MealAPI.transformMealData(meal))
        .filter((meal) => meal !== null);
      setRecipes(transformedMeals);
    } catch (error) {
      console.error('Error loading category data:', error);
      setRecipes([]);
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    await loadCategoryData(category);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [isConnected]); // 🔹 UPDATED: re-run when connection restores

  return (
    <View style={homeStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={homeStyles.scrollContent}
      >
        {/* ANIMAL ICONS */}
        <View style={homeStyles.welcomeSection}>
          <Image
            source={require('../../assets/images/lamb.png')}
            style={{ width: 100, height: 100 }}
          />
          <Image
            source={require('../../assets/images/chicken.png')}
            style={{ width: 100, height: 100 }}
          />
          <Image
            source={require('../../assets/images/goat.png')}
            style={{ width: 100, height: 100 }}
          />
        </View>

        {/* Featured Carousel */}

        <FeaturedCarousel featuredRecipes={featuredRecipes} />
       
        {/* Category Filter */}
        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />
        )}

        {/* Recipes Section */}
        <View style={homeStyles.recipesSection}>
          <View style={homeStyles.sectionHeader}>
            <Text style={homeStyles.sectionTitle}>{selectedCategory}</Text>
          </View>

          <FlatList
            data={recipes}
            renderItem={({ item }) => <RecipeCard recipe={item} />}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={homeStyles.row}
            contentContainerStyle={homeStyles.recipesGrid}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={homeStyles.emptyState}>
                <Ionicons
                  name="restaurant-outline"
                  size={64}
                  color={COLORS.textLight}
                />
                <Text style={homeStyles.emptyTitle}>No Recipes Found</Text>
                <Text style={homeStyles.emptyDescription}>
                  Try a different category
                </Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
