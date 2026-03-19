import React, { useEffect } from "react";
import { ViewProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

export interface SkeletonProps extends ViewProps {}

export function Skeleton({ style, ...props }: SkeletonProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.base, animatedStyle, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.radius.lg,
  },
}));
