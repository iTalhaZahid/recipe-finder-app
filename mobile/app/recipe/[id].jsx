import { useUser } from '@clerk/clerk-expo';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  Animated,
  Platform,
  Easing,
  ToastAndroid,
} from 'react-native';
import { API_URL } from '../../constants/api';
import { MealAPI } from '../../services/mealAPI';
import LoadingSpinner from '../../components/LoadingSpinner';
import { recipeDetailStyles } from '../../assets/styles/recipe-detail.styles';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { WebView } from 'react-native-webview';
import { useNetwork } from '../../context/NetworkContext';

const RecipeDetailScreen = () => {
  const { id: recipeID } = useLocalSearchParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { isConnected } = useNetwork();
  const [completedIngredients, setCompletedIngredients] = useState([]);
  const [completedSteps, setCompletedSteps] = useState([]);

  const { user } = useUser();
  const userId = user?.id;

  // ===== Animations =====
  const fadeAnim = useRef(new Animated.Value(0)).current;          // screen fade-in
  const scrollY = useRef(new Animated.Value(0)).current;           // parallax

  // per-item entry animations (opacity + translateY)
  const ingEntryRefs = useRef([]).current; // { opacity: Animated.Value, translateY: Animated.Value }[]
  const stepEntryRefs = useRef([]).current;

  // tap feedback animations
  const scaleAnimRefs = useRef([]).current; // for ingredients (bounce)
  const fadeStepRefs = useRef([]).current;  // for steps (pulse)

  useEffect(() => {
    if (!isConnected) return;
    const checkIfSaved = async () => {
      try {
        if (!userId) return;
        const response = await fetch(`${API_URL}/favourites/${userId}`);
        const favorites = await response.json();
        const isRecipeSaved = favorites.some(
          (fav) => fav.receipeId === parseFloat(recipeID)
        );
        setIsSaved(isRecipeSaved);
      } catch (error) {
        console.log('Error checking saved recipe', error);
      }
    };

    const loadRecipeDetail = async () => {
      try {
        setLoading(true);
        const mealData = await MealAPI.getMealByID(recipeID);
        if (mealData) {
          const transformedRecipe = MealAPI.transformMealData(mealData);
          const recipeWithVideo = {
            ...transformedRecipe,
            youtubeUrl: mealData.strYoutube || null,
          };
          setRecipe(recipeWithVideo);
          setCompletedIngredients(new Array(recipeWithVideo.ingredients.length).fill(false));
          setCompletedSteps(new Array(recipeWithVideo.instructions.length).fill(false));

          // prepare refs for new lengths
          // ingredients
          ingEntryRefs.length = recipeWithVideo.ingredients.length;
          scaleAnimRefs.length = recipeWithVideo.ingredients.length;
          for (let i = 0; i < recipeWithVideo.ingredients.length; i++) {
            if (!ingEntryRefs[i]) {
              ingEntryRefs[i] = {
                opacity: new Animated.Value(0),
                translateY: new Animated.Value(12),
              };
            } else {
              ingEntryRefs[i].opacity.setValue(0);
              ingEntryRefs[i].translateY.setValue(12);
            }
            if (!scaleAnimRefs[i]) scaleAnimRefs[i] = new Animated.Value(1);
          }
          // steps
          stepEntryRefs.length = recipeWithVideo.instructions.length;
          fadeStepRefs.length = recipeWithVideo.instructions.length;
          for (let i = 0; i < recipeWithVideo.instructions.length; i++) {
            if (!stepEntryRefs[i]) {
              stepEntryRefs[i] = {
                opacity: new Animated.Value(0),
                translateY: new Animated.Value(12),
              };
            } else {
              stepEntryRefs[i].opacity.setValue(0);
              stepEntryRefs[i].translateY.setValue(12);
            }
            if (!fadeStepRefs[i]) fadeStepRefs[i] = new Animated.Value(1);
          }
        }
      } catch (error) {
        console.log('Error loading recipe details', error);
      } finally {
        setLoading(false);

        // screen fade-in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
    };

    checkIfSaved();
    loadRecipeDetail();
  }, [recipeID, userId, isConnected]);

  // run staggered entry animations once recipe is ready
  useEffect(() => {
    if (!recipe) return;

    const ingAnims = (recipe.ingredients || []).map((_, i) =>
      Animated.parallel([
        Animated.timing(ingEntryRefs[i]?.opacity || new Animated.Value(1), {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ingEntryRefs[i]?.translateY || new Animated.Value(0), {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    const stepAnims = (recipe.instructions || []).map((_, i) =>
      Animated.parallel([
        Animated.timing(stepEntryRefs[i]?.opacity || new Animated.Value(1), {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(stepEntryRefs[i]?.translateY || new Animated.Value(0), {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    // stagger both groups slightly apart for a buttery feel
    Animated.sequence([
      Animated.stagger(60, ingAnims),
      Animated.delay(120),
      Animated.stagger(70, stepAnims),
    ]).start();
  }, [recipe]);

  const getYoutubeEmbedUrl = (url) => {
    // Remove any extra params (like ?si=xyz)
    const videoId = url.split("v=")[1];

    return `https://www.youtube.com/embed/${videoId}`;
  };

  const handleToggleSave = async () => {
    if (!userId || !recipe) {
      Alert.alert('Login required', 'Please log in to save recipes.');
      return;
    }

    try {
      setIsSaving(true);

      if (isSaved) {
        const response = await fetch(
          `${API_URL}/favourites/${userId}/${recipeID}`,
          { method: 'DELETE' }
        );
        if (!response.ok) throw new Error('Failed to remove from Favorites');
        setIsSaved(false);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Removed from favorites', ToastAndroid.SHORT);
        } else {
          Alert.alert('Removed from favorites');
        }
      } else {
        const response = await fetch(`${API_URL}/favourites/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            receipeId: parseInt(recipeID),
            title: recipe.title,
            image: recipe.image,
            cookTime: recipe.cookTime,
            servings: recipe.servings,
          }),
        });

        if (Platform.OS === 'android') {
          ToastAndroid.show('Added to favorites', ToastAndroid.SHORT);
        } else {
          Alert.alert('Added to favorites');
        }

        if (!response.ok) throw new Error('Failed to add to Favorites');
        setIsSaved(true);
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Please try again!');
    } finally {
      setIsSaving(false);
    }
  };

  // tap feedback (kept logic identical)
  const toggleIngredient = (index) => {
    setCompletedIngredients((prev) =>
      prev.map((item, i) => (i === index ? !item : item))
    );

    if (!scaleAnimRefs[index]) scaleAnimRefs[index] = new Animated.Value(1);
    Animated.sequence([
      Animated.spring(scaleAnimRefs[index], {
        toValue: 0.97,
        damping: 12,
        mass: 0.6,
        stiffness: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimRefs[index], {
        toValue: 1,
        damping: 10,
        mass: 0.6,
        stiffness: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleStep = (index) => {
    setCompletedSteps((prev) =>
      prev.map((item, i) => (i === index ? !item : item))
    );

    if (!fadeStepRefs[index]) fadeStepRefs[index] = new Animated.Value(1);
    Animated.sequence([
      Animated.timing(fadeStepRefs[index], {
        toValue: 0.5,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(fadeStepRefs[index], {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (loading || !recipe) return <LoadingSpinner message="Loading Recipe Details..." />;

  // parallax
  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[recipeDetailStyles.container, { opacity: fadeAnim }]}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {/* HEADER */}
        <View style={recipeDetailStyles.headerContainer}>
          <Animated.View
            style={[
              recipeDetailStyles.imageContainer,
              { transform: [{ translateY: imageTranslateY }] },
            ]}
          >
            <Image
              source={{ uri: recipe.image }}
              style={recipeDetailStyles.headerImage}
              contentFit="cover"
            />
          </Animated.View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
            style={recipeDetailStyles.gradientOverlay}
          />

          <View style={recipeDetailStyles.floatingButtons}>
            <TouchableOpacity
              style={recipeDetailStyles.floatingButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                recipeDetailStyles.floatingButton,
                { backgroundColor: isSaving ? COLORS.gray : COLORS.primary },
              ]}
              onPress={handleToggleSave}
              disabled={isSaving}
            >
              <Ionicons
                name={
                  isSaving
                    ? 'hourglass'
                    : isSaved
                      ? 'bookmark'
                      : 'bookmark-outline'
                }
                size={24}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </View>

          {/* TITLE */}
          <View style={recipeDetailStyles.titleSection}>
            <View style={recipeDetailStyles.categoryBadge}>
              <Text style={recipeDetailStyles.categoryText}>{recipe.category}</Text>
            </View>
            <Text style={recipeDetailStyles.recipeTitle}>{recipe.title}</Text>
            {recipe.area && (
              <View style={recipeDetailStyles.locationRow}>
                <Ionicons name="location" size={16} color={COLORS.white} />
                <Text style={recipeDetailStyles.locationText}>
                  {recipe.area} Cuisine
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* CONTENT */}
        <View style={recipeDetailStyles.contentSection}>
          {/* STATS */}
          <View style={recipeDetailStyles.statsContainer}>
            <View style={recipeDetailStyles.statCard}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                style={recipeDetailStyles.statIconContainer}
              >
                <Ionicons name="time" size={20} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.statValue}>{recipe.cookTime}</Text>
              <Text style={recipeDetailStyles.statLabel}>Prep Time</Text>
            </View>

            <View style={recipeDetailStyles.statCard}>
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                style={recipeDetailStyles.statIconContainer}
              >
                <Ionicons name="people" size={20} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.statValue}>{recipe.servings}</Text>
              <Text style={recipeDetailStyles.statLabel}>Servings</Text>
            </View>
          </View>

          {/* VIDEO */}
          {recipe.youtubeUrl && (
            <View style={recipeDetailStyles.sectionContainer}>
              <View style={recipeDetailStyles.sectionTitleRow}>
                <LinearGradient
                  colors={['#FF0000', '#CC0000']}
                  style={recipeDetailStyles.sectionIcon}
                >
                  <Ionicons name="play" size={16} color={COLORS.white} />
                </LinearGradient>
                <Text style={recipeDetailStyles.sectionTitle}>Video Tutorial</Text>
              </View>

              <View style={recipeDetailStyles.videoCard}>
                <WebView
                  style={recipeDetailStyles.webview}
                  source={{ uri: getYoutubeEmbedUrl(recipe.youtubeUrl) }}
                  allowsFullscreenVideo
                  mediaPlaybackRequiresUserAction={false}
                />
              </View>
            </View>
          )}

          {/* INGREDIENTS */}
          <View style={recipeDetailStyles.sectionContainer}>
            <View style={recipeDetailStyles.sectionTitleRow}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primary + '80']}
                style={recipeDetailStyles.sectionIcon}
              >
                <Ionicons name="list" size={16} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.sectionTitle}>Ingredients</Text>
              <View style={recipeDetailStyles.countBadge}>
                <Text style={recipeDetailStyles.countText}>
                  {recipe.ingredients.length}
                </Text>
              </View>
            </View>

            <View style={recipeDetailStyles.ingredientsGrid}>
              {recipe.ingredients.map((ingredient, index) => {
                const checked = completedIngredients[index];

                // ensure refs exist
                if (!ingEntryRefs[index]) {
                  ingEntryRefs[index] = {
                    opacity: new Animated.Value(1),
                    translateY: new Animated.Value(0),
                  };
                }
                if (!scaleAnimRefs[index]) scaleAnimRefs[index] = new Animated.Value(1);

                return (
                  <Animated.View
                    key={`ing-${index}`}
                    style={{
                      opacity: ingEntryRefs[index].opacity,
                      transform: [
                        { translateY: ingEntryRefs[index].translateY },
                        { scale: scaleAnimRefs[index] },
                      ],
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        recipeDetailStyles.ingredientCard,
                        checked && {
                          backgroundColor: COLORS.primary + '15',
                          opacity: 0.7,
                        },
                      ]}
                      onPress={() => toggleIngredient(index)}
                    >
                      <View style={recipeDetailStyles.ingredientNumber}>
                        <Text style={recipeDetailStyles.ingredientNumberText}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text
                        style={[
                          recipeDetailStyles.ingredientText,
                          checked && {
                            textDecorationLine: 'line-through',
                            color: COLORS.textLight,
                          },
                        ]}
                      >
                        {ingredient}
                      </Text>
                      <View style={recipeDetailStyles.ingredientCheck}>
                        <Ionicons
                          name={
                            checked
                              ? 'checkmark-circle'
                              : 'checkmark-circle-outline'
                          }
                          size={22}
                          color={checked ? COLORS.primary : COLORS.textLight}
                        />
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </View>

          {/* INSTRUCTIONS */}
          <View style={recipeDetailStyles.sectionContainer}>
            <View style={recipeDetailStyles.sectionTitleRow}>
              <LinearGradient
                colors={['#9C27B0', '#673AB7']}
                style={recipeDetailStyles.sectionIcon}
              >
                <Ionicons name="book" size={16} color={COLORS.white} />
              </LinearGradient>
              <Text style={recipeDetailStyles.sectionTitle}>Instructions</Text>
              <View style={recipeDetailStyles.countBadge}>
                <Text style={recipeDetailStyles.countText}>
                  {recipe.instructions.length}
                </Text>
              </View>
            </View>

            <View style={recipeDetailStyles.instructionsContainer}>
              {recipe.instructions.map((instruction, index) => {
                const done = completedSteps[index];

                if (!stepEntryRefs[index]) {
                  stepEntryRefs[index] = {
                    opacity: new Animated.Value(1),
                    translateY: new Animated.Value(0),
                  };
                }
                if (!fadeStepRefs[index]) fadeStepRefs[index] = new Animated.Value(1);

                return (
                  <Animated.View
                    key={`step-${index}`}
                    style={{
                      opacity: Animated.multiply(
                        stepEntryRefs[index].opacity,
                        fadeStepRefs[index]
                      ),
                      transform: [{ translateY: stepEntryRefs[index].translateY }],
                    }}
                  >
                    <View style={recipeDetailStyles.instructionCard}>
                      <LinearGradient
                        colors={
                          done
                            ? [COLORS.primary, COLORS.primary + 'AA']
                            : [COLORS.primary, COLORS.primary + '33']
                        }
                        style={recipeDetailStyles.stepIndicator}
                      >
                        <Text style={recipeDetailStyles.stepNumber}>{index + 1}</Text>
                      </LinearGradient>

                      <View style={recipeDetailStyles.instructionContent}>
                        <Text
                          style={[
                            recipeDetailStyles.instructionText,
                            done && {
                              textDecorationLine: 'line-through',
                              color: COLORS.textLight,
                            },
                          ]}
                        >
                          {instruction}
                        </Text>

                        <View style={recipeDetailStyles.instructionFooter}>
                          <Text style={recipeDetailStyles.stepLabel}>
                            Step {index + 1}
                          </Text>
                          <TouchableOpacity
                            style={[
                              recipeDetailStyles.completeButton,
                              done && { backgroundColor: COLORS.primary + '40' },
                            ]}
                            onPress={() => toggleStep(index)}
                          >
                            <Ionicons
                              name={done ? 'checkmark' : 'ellipse-outline'}
                              size={16}
                              color={done ? COLORS.primary : COLORS.textLight}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </View>

          {/* SAVE BUTTON */}
          <TouchableOpacity
            style={recipeDetailStyles.primaryButton}
            onPress={handleToggleSave}
            disabled={isSaving}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primary + 'CC']}
              style={recipeDetailStyles.buttonGradient}
            >
              <Ionicons name="heart" size={20} color={COLORS.white} />
              <Text style={recipeDetailStyles.buttonText}>
                {isSaved ? 'Remove from Favorites' : 'Add to Favorites'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </Animated.View>
  );
};

export default RecipeDetailScreen;
