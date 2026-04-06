import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated } from "react-native";
import { Image } from "expo-image";
import { homeStyles } from "../assets/styles/home.styles";

export default function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  // 👇 Filter out unwanted categories here
  const excludedCategories = ["Pork"]; // add more e.g. ["Pork", "Beef", "Lamb"]
  const visibleCategories = categories.filter(
    (category) => !excludedCategories.includes(category.name)
  );

  return (
    <View style={homeStyles.categoryFilterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={homeStyles.categoryFilterScrollContent}
      >
        {visibleCategories.map((category) => {
          const isSelected = selectedCategory === category.name;

          const scaleAnim = useRef(new Animated.Value(isSelected ? 1.15 : 1)).current;

          useEffect(() => {
            Animated.spring(scaleAnim, {
              toValue: isSelected ? 1.15 : 1,
              useNativeDriver: true,
              friction: 5,
            }).start();
          }, [isSelected]);

          return (
            <TouchableOpacity
              key={category.id}
              style={[
                homeStyles.categoryButton,
                isSelected && homeStyles.selectedCategory,
              ]}
              onPress={() => onSelectCategory(category.name)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={{
                  transform: [{ scale: scaleAnim }],
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  key={`${category.id}-${isSelected}`}
                  source={{ uri: category.image, cache: "reload" }}
                  style={[
                    homeStyles.categoryImage,
                    isSelected && homeStyles.selectedCategoryImage,
                  ]}
                  contentFit="cover"
                  transition={300}
                />
              </Animated.View>

              <Text
                style={[
                  homeStyles.categoryText,
                  isSelected && homeStyles.selectedCategoryText,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
