import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors'; // adjust to match your setup

const { width } = Dimensions.get('window');

const FeaturedCarousel = ({ featuredRecipes }) => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!featuredRecipes || featuredRecipes.length === 0) return null;

  return (
    <View style={{ alignItems: 'center', marginVertical: 10 }}>
      <Carousel
        loop
        width={width}
        height={260}
        autoPlay
        autoPlayInterval={2500}
        data={featuredRecipes}
        scrollAnimationDuration={800}
        // 👇 disable paging so sides can peek through
        pagingEnabled={true}
        onSnapToItem={(index) => setActiveIndex(index)}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 1,
          parallaxScrollingOffset: 70,
          parallaxAdjacentItemScale: 0.9,
        }}
        renderItem={({ item, animationValue }) => {
          // 👇 animated scale and opacity, but allow peeks
          const animatedStyle = useAnimatedStyle(() => {
            const scale = interpolate(animationValue.value, [-1, 0, 1], [0.9, 1, 0.9]);
            const opacity = interpolate(animationValue.value, [-1, 0, 1], [0.5, 1, 0.5]);
            return {
              transform: [{ scale }],
              opacity,
            };
          });

          return (
            <Animated.View
              style={[
                {
                  width: width * 0.9, // smaller width = visible sides
                  alignSelf: 'center',
                  marginHorizontal: 5,
                },
                animatedStyle,
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => router.push(`/recipe/${item.id}`)}
                style={{
                  borderRadius: 20,
                  overflow: 'hidden',
                  backgroundColor: COLORS.card,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <Image
                  source={{ uri: item.image }}
                  style={{
                    width: '100%',
                    height: 240,
                  }}
                  resizeMode="cover"
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    padding: 16,
                    backgroundColor: 'rgba(0,0,0,0.35)',
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.white,
                      fontSize: 18,
                      fontWeight: 'bold',
                    }}
                  >
                    {item.title}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      marginTop: 4,
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="time-outline" size={14} color={COLORS.white} />
                    <Text style={{ color: COLORS.white, marginLeft: 4 }}>
                      {item.cookTime}
                    </Text>
                    <Ionicons
                      name="people-outline"
                      size={14}
                      color={COLORS.white}
                      style={{ marginLeft: 10 }}
                    />
                    <Text style={{ color: COLORS.white, marginLeft: 4 }}>
                      {item.servings}
                    </Text>
                    {item.area && (
                      <>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color={COLORS.white}
                          style={{ marginLeft: 10 }}
                        />
                        <Text style={{ color: COLORS.white, marginLeft: 4 }}>
                          {item.area}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        }}
      />

      {/* Pagination Dots */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 10,
        }}
      >
        {featuredRecipes.map((_, i) => (
          <View
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              marginHorizontal: 4,
              backgroundColor:
                i === activeIndex
                  ? COLORS.primary
                  : COLORS.primary + '66',
            }}
          />
        ))}
      </View>
    </View>
  );
};

export default FeaturedCarousel;
