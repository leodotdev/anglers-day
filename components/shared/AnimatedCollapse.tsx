import React, { useEffect, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface AnimatedCollapseProps {
  expanded: boolean;
  children: React.ReactNode;
}

export function AnimatedCollapse({ expanded, children }: AnimatedCollapseProps) {
  const [contentHeight, setContentHeight] = useState(0);
  const animHeight = useSharedValue(0);
  const animOpacity = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== contentHeight) {
      setContentHeight(h);
      if (expanded) {
        animHeight.value = h;
      }
    }
  };

  useEffect(() => {
    const config = { duration: 250, easing: Easing.out(Easing.cubic) };
    if (expanded) {
      animHeight.value = withTiming(contentHeight || 200, config);
      animOpacity.value = withTiming(1, { duration: 200 });
    } else {
      animHeight.value = withTiming(0, config);
      animOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [expanded, contentHeight]);

  const style = useAnimatedStyle(() => ({
    height: animHeight.value,
    opacity: animOpacity.value,
    overflow: "hidden" as const,
  }));

  return (
    <Animated.View style={style}>
      <Animated.View onLayout={onLayout}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}
