import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Text, TouchableOpacity, View } from "react-native";
import { recipeDetailStyles } from "../assets/styles/recipe-detail.styles";
import { COLORS } from "../constants/colors";
import { useRouter } from "expo-router";

const RecipeNotFound = () => {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.background]}
      style={recipeDetailStyles.errorContainer}
    >
      <View style={recipeDetailStyles.errorContent}>
        <Ionicons name="restaurant-outline" size={80} color={COLORS.white} />
        <Text style={recipeDetailStyles.errorTitle}>Recipe not found</Text>
        <Text style={recipeDetailStyles.errorDescription}>
          Sorry, we couldn&apos;t find this recipe. Please try again.
        </Text>
        <TouchableOpacity style={recipeDetailStyles.errorButton} onPress={() => router.back()}>
          <Text style={recipeDetailStyles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};
export default RecipeNotFound;