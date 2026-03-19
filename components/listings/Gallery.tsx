import React, { useCallback, useRef, useState } from "react";
import { View, Text, Pressable, Platform, LayoutChangeEvent } from "react-native";
import { Image } from "expo-image";
import { Anchor, ChevronLeft, ChevronRight } from "lucide-react-native";
import Carousel from "react-native-reanimated-carousel";
import type { ICarouselInstance } from "react-native-reanimated-carousel";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const isWeb = Platform.OS === "web";

export interface GalleryProps {
  photos: string[];
  height?: number;
  overlay?: React.ReactNode;
  showArrows?: boolean;
  loop?: boolean;
}

function GalleryImage({ uri, width, height }: { uri: string; width: number; height: number }) {
  if (isWeb) {
    return (
      // @ts-ignore
      <img
        src={uri}
        style={{ width, height, objectFit: "cover", display: "block" }}
        draggable={false}
      />
    );
  }
  return <Image source={{ uri }} style={{ width, height }} contentFit="cover" />;
}

export function Gallery({
  photos,
  height = 288,
  overlay,
  showArrows = true,
  loop = true,
}: GalleryProps) {
  const { theme } = useUnistyles();
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hovered, setHovered] = useState(false);
  const carouselRef = useRef<ICarouselInstance>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const prev = useCallback(() => {
    if (carouselRef.current) {
      carouselRef.current.prev();
    } else {
      setActiveIndex((i) => (i <= 0 ? photos.length - 1 : i - 1));
    }
  }, [photos.length]);

  const next = useCallback(() => {
    if (carouselRef.current) {
      carouselRef.current.next();
    } else {
      setActiveIndex((i) => (i >= photos.length - 1 ? 0 : i + 1));
    }
  }, [photos.length]);

  const hoverProps = isWeb ? {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  } : {};

  if (photos.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]} onLayout={onLayout}>
        <Anchor size={40} color={theme.colors.neutral[400]} />
        <Text style={styles.emptyText}>No photos yet</Text>
        {overlay && <View style={styles.overlay}>{overlay}</View>}
      </View>
    );
  }

  // Web: single image with hover arrows (same pattern as ListingCard)
  if (isWeb) {
    return (
      <View
        style={[styles.container, { height }]}
        onLayout={onLayout}
        {...hoverProps as any}
      >
        <GalleryImage uri={photos[activeIndex]} width={containerWidth || 960} height={height} />

        {/* Arrows on hover */}
        {photos.length > 1 && (showArrows || hovered) && (
          <>
            <Pressable
              style={[styles.arrow, styles.arrowLeft]}
              onPress={prev}
              hitSlop={8}
            >
              <ChevronLeft size={20} color="#fff" />
            </Pressable>
            <Pressable
              style={[styles.arrow, styles.arrowRight]}
              onPress={next}
              hitSlop={8}
            >
              <ChevronRight size={20} color="#fff" />
            </Pressable>
          </>
        )}

        {/* Clickable dots */}
        {photos.length > 1 && (
          <View style={styles.dotsContainer}>
            {photos.map((_: string, i: number) => (
              <Pressable key={i} onPress={() => setActiveIndex(i)} hitSlop={4}>
                <View style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]} />
              </Pressable>
            ))}
          </View>
        )}

        {overlay && <View style={styles.overlay}>{overlay}</View>}
      </View>
    );
  }

  // Native: reanimated carousel with swipe
  return (
    <View style={[styles.container, { height }]} onLayout={onLayout}>
      {containerWidth > 0 && (
        <Carousel
          ref={carouselRef}
          data={photos}
          width={containerWidth}
          height={height}
          loop={loop && photos.length > 1}
          enabled={photos.length > 1}
          onSnapToItem={setActiveIndex}
          onConfigurePanGesture={(g) => g.activeOffsetX([-10, 10])}
          renderItem={({ item }) => (
            <GalleryImage uri={item} width={containerWidth} height={height} />
          )}
        />
      )}

      {/* Arrows */}
      {showArrows && photos.length > 1 && (
        <>
          <Pressable style={[styles.arrow, styles.arrowLeft]} onPress={prev} hitSlop={8}>
            <ChevronLeft size={20} color="#fff" />
          </Pressable>
          <Pressable style={[styles.arrow, styles.arrowRight]} onPress={next} hitSlop={8}>
            <ChevronRight size={20} color="#fff" />
          </Pressable>
        </>
      )}

      {/* Clickable dots */}
      {photos.length > 1 && (
        <View style={styles.dotsContainer}>
          {photos.map((_: string, i: number) => (
            <Pressable
              key={i}
              onPress={() => carouselRef.current?.scrollTo({ index: i, animated: true })}
              hitSlop={4}
            >
              <View style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]} />
            </Pressable>
          ))}
        </View>
      )}

      {overlay && <View style={styles.overlay}>{overlay}</View>}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    position: "relative",
    backgroundColor: theme.colors.neutral[100],
    overflow: "hidden",
  },
  emptyContainer: {
    position: "relative",
    backgroundColor: theme.colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
  },
  dotsContainer: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    zIndex: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
  },
  dotInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  arrow: {
    position: "absolute",
    top: "50%",
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 7,
  },
  arrowLeft: {
    left: 12,
  },
  arrowRight: {
    right: 12,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
  },
}));
