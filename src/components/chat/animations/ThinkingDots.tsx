import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';

interface ThinkingDotsProps {
  colors: { text: string; primary?: string; background?: string };
  messages?: string[];
  speed?: number;
}

const DEFAULT_MESSAGES = [
  'Thinking',
  'Processing',
  'Analyzing',
  'Searching',
  'Gathering insights',
  'Optimizing results',
] as const;

export const ThinkingDots: React.FC<ThinkingDotsProps> = React.memo(({
  colors,
  messages = DEFAULT_MESSAGES,
  speed = 800,
}) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [dotCount, setDotCount] = useState(0);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const dotAnimations = useRef(
    Array(3).fill(0).map(() => new Animated.Value(0))
  ).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const currentText = useMemo(() => messages[currentMessage], [messages, currentMessage]);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();

    // Sophisticated indicator animation
    const indicatorAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(indicatorAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(indicatorAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    // Shimmer effect animation
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Staggered dot animations
    const createDotAnimation = (index: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(dotAnimations[index], {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(dotAnimations[index], {
            toValue: 0,
            duration: 600,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      );
    };

    indicatorAnimation.start();
    shimmerAnimation.start();
    
    const dotAnimationRefs = dotAnimations.map((_, index) => 
      createDotAnimation(index)
    );
    dotAnimationRefs.forEach(anim => anim.start());

    // Message rotation with smooth transition
    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, speed * 2.5);

    return () => {
      indicatorAnimation.stop();
      shimmerAnimation.stop();
      dotAnimationRefs.forEach(anim => anim.stop());
      clearInterval(messageInterval);
    };
  }, [fadeAnim, slideAnim, indicatorAnim, dotAnimations, shimmerAnim, speed, messages.length]);

  const indicatorScale = indicatorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.2, 1],
  });

  const indicatorOpacity = indicatorAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1, 0.6],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <Animated.View style={[
      styles.container,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }
    ]}>
      <View style={styles.contentContainer}>
        {/* Animated indicator with glow effect */}
        <View style={styles.indicatorContainer}>
          <Animated.View 
            style={[
              styles.indicatorGlow,
              {
                backgroundColor: colors.primary || '#007AFF',
                transform: [{ scale: indicatorScale }],
                opacity: indicatorOpacity,
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.indicator,
              {
                backgroundColor: colors.primary || '#007AFF',
                transform: [{ scale: indicatorScale }],
              }
            ]} 
          />
        </View>

        {/* Text with shimmer effect */}
        <View style={styles.textContainer}>
          <View style={styles.textBackground}>
            <Text style={[styles.text, { color: colors.text }]}>
              {currentText}
            </Text>
            
            {/* Shimmer overlay */}
            <Animated.View 
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX: shimmerTranslate }],
                }
              ]}
            />
          </View>

          {/* Sophisticated dot animation */}
          <View style={styles.dotsContainer}>
            {dotAnimations.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: colors.primary || '#007AFF',
                    transform: [{
                      scale: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                      })
                    }],
                    opacity: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  }
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

ThinkingDots.displayName = 'ThinkingDots';

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indicatorContainer: {
    position: 'relative',
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 2,
  },
  indicatorGlow: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 6,
    opacity: 0.3,
    zIndex: 1,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textBackground: {
    position: 'relative',
    overflow: 'hidden',
  },
  text: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.3,
    opacity: 0.85,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.6,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 32,
    justifyContent: 'flex-start',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default ThinkingDots;