import { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { useNavigation } from "expo-router";
import { Search, Fish, X } from "lucide-react-native";
import { api } from "@/convex/_generated/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useLocation } from "@/hooks/useLocation";
import { ListingCard } from "@/components/listings/ListingCard";
import { SearchFilters, SearchFilterValues, getWeekendDates } from "@/components/listings/SearchFilters";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { getListingPhotos } from "@/lib/dummyPhotos";

const GRID_GAP = 16;
const GRID_PADDING = 20;
const isWeb = Platform.OS === "web";

function useGridLayout() {
  const { width } = useWindowDimensions();
  if (!isWeb) return { numColumns: 1, itemWidth: undefined };
  const containerWidth = Math.min(width, 1280) - GRID_PADDING * 2;
  let numColumns = 1;
  if (width >= 1200) numColumns = 3;
  else if (width >= 768) numColumns = 2;
  const itemWidth = (containerWidth - GRID_GAP * (numColumns - 1)) / numColumns;
  return { numColumns, itemWidth };
}

export default function ExploreScreen() {
  const listRef = useRef<FlatList>(null);
  const searchInputRef = useRef<TextInput>(null);
  const navigation = useNavigation();
  const { location, loading: locationLoading } = useLocation();
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const thisWeekend = useMemo(() => getWeekendDates(0), []);
  const [filters, setFilters] = useState<SearchFilterValues>({
    tripTypes: [],
    date: thisWeekend.start,
    dateEnd: thisWeekend.end,
  });

  // Scroll to top when Home tab is pressed while already on explore index
  useEffect(() => {
    const unsubs: (() => void)[] = [];
    // Try every parent level — covers different Expo Router versions
    let nav = navigation.getParent();
    while (nav) {
      try {
        const u = nav.addListener("tabPress" as any, () => {
          if (navigation.isFocused()) {
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
          }
        });
        if (u) unsubs.push(u);
      } catch {}
      nav = nav.getParent();
    }
    return () => unsubs.forEach((u) => u());
  }, [navigation]);

  // Auto-set nearby sort when location becomes available (first load only)
  const [hasAutoSorted, setHasAutoSorted] = useState(false);
  useEffect(() => {
    if (location && !hasAutoSorted && !filters.sortBy && !filters.city) {
      setFilters((prev) => ({ ...prev, sortBy: "nearby" }));
      setHasAutoSorted(true);
    }
  }, [location]);

  const { theme } = useUnistyles();

  const debouncedSearch = useDebounce(searchText, 300);
  const { numColumns, itemWidth } = useGridLayout();

  const useNearby = filters.sortBy === "nearby" && location && !filters.city;

  // Standard search args (when not using nearby)
  const searchArgs = useMemo(() => {
    if (useNearby) return "skip" as const;
    return {
      searchTerm: debouncedSearch || undefined,
      tripType: filters.tripTypes.length === 1 ? filters.tripTypes[0] : undefined,
      city: filters.city,
      date: filters.date,
      dateEnd: filters.dateEnd,
      minGuests: filters.guests,
      sortBy: filters.sortBy === "nearby" ? undefined : filters.sortBy,
    };
  }, [debouncedSearch, filters, useNearby]);

  // Nearby args
  const nearbyArgs = useMemo(() => {
    if (!useNearby || !location) return "skip" as const;
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      radiusMiles: 100,
    };
  }, [useNearby, location]);

  const standardListings = useQuery(api.search.searchListings, searchArgs);
  const nearbyListings = useQuery(api.search.getNearby, nearbyArgs);
  const filterOptions = useQuery(api.search.getFilterOptions);

  const rawListings = useNearby ? nearbyListings : standardListings;
  const isLoading = rawListings === undefined;

  const filteredListings = useMemo(() => {
    if (!rawListings) return [];
    let results = rawListings;

    // Client-side trip type filtering for multi-select
    if (filters.tripTypes.length > 0) {
      results = results.filter((l) =>
        filters.tripTypes.some(
          (t) => t.toLowerCase().replace(/ /g, "_") === l.tripType
        )
      );
    }

    // Client-side guest count filtering (for nearby results)
    if (filters.guests && filters.guests > 1) {
      results = results.filter((l) => l.maxGuests >= filters.guests!);
    }

    return results;
  }, [rawListings, filters.tripTypes, filters.guests]);

  const resultLabel = useMemo(() => {
    const count = filteredListings.length;
    const base = `${count} ${count === 1 ? "charter" : "charters"}`;
    if (useNearby && location?.city) return `${base} near ${location.city}`;
    if (filters.city) return `${base} in ${filters.city}`;
    return base;
  }, [filteredListings.length, useNearby, location, filters.city]);

  const handleUseMyLocation = () => {
    if (location) {
      setFilters((prev) => ({ ...prev, city: undefined, sortBy: "nearby" }));
    }
  };

  const renderGrid = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      );
    }

    if (filteredListings.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Fish size={64} color={theme.colors.neutral[300]} />
          <Text style={styles.emptyTitle}>No charters found</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your search or filters
          </Text>
        </View>
      );
    }

    // On web, render as a flex-wrap grid
    if (isWeb) {
      return (
        <View style={styles.grid}>
          {filteredListings.map((item) => (
            <View
              key={item._id}
              style={itemWidth ? { width: itemWidth } : styles.gridItemFull}
            >
              <ListingCard listing={item} photoUrls={getListingPhotos(item._id)} searchDate={filters.date} searchGuests={filters.guests} />
            </View>
          ))}
        </View>
      );
    }

    // On native, use FlatList for performance
    return (
      <FlatList
        ref={listRef}
        data={filteredListings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            photoUrls={getListingPhotos(item._id)}
            searchDate={filters.date}
            searchGuests={filters.guests}
          />
        )}
        contentContainerStyle={styles.nativeListContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.resultCount}>
            <Text style={styles.resultCountText}>{resultLabel}</Text>
          </View>
        }
      />
    );
  };

  const webStyles = {
    outerContainer: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1,
      display: "flex" as const,
      flexDirection: "column" as const,
    },
    stickyHeader: {
      flexShrink: 0,
      backgroundColor: theme.colors.neutral[50],
      zIndex: 2,
      display: "flex" as const,
      flexDirection: "column" as const,
      alignItems: "center" as const,
    },
    scrollContainer: {
      flex: 1,
      overflowY: "auto" as const,
      paddingBottom: 120,
      display: "flex" as const,
      flexDirection: "column" as const,
      alignItems: "center" as const,
      backgroundColor: theme.colors.neutral[50],
    },
  };

  const filterBar = (
    <SearchFilters
      filters={filters}
      onApply={setFilters}
      cities={filterOptions?.cities ?? []}
      locationCity={location?.city}
      onUseMyLocation={location ? handleUseMyLocation : undefined}
      locationLoading={locationLoading}
    />
  );

  // On web: the whole page is a scrollable div, header stays in flow
  if (isWeb) {
    return (
      <div style={webStyles.outerContainer}>
        <div style={webStyles.stickyHeader}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Explore</Text>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color={theme.colors.neutral[400]} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search fishing charters..."
                placeholderTextColor={theme.colors.neutral[400]}
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
              />
            </View>
          </View>

          {filterBar}
        </div>

        <div style={webStyles.scrollContainer}>
          {!isLoading && filteredListings.length > 0 && (
            <View style={styles.resultCount}>
              <Text style={styles.resultCountText}>{resultLabel}</Text>
            </View>
          )}

          {renderGrid()}
        </div>
      </div>
    );
  }

  const toggleSearch = () => {
    if (searchVisible) {
      setSearchVisible(false);
      setSearchText("");
    } else {
      setSearchVisible(true);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  // On native: sticky header with FlatList below
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Pressable onPress={toggleSearch} hitSlop={8} style={styles.searchIcon}>
          <Search size={20} color={theme.colors.neutral[700]} />
        </Pressable>
      </View>

      {searchVisible && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={theme.colors.neutral[400]} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search fishing charters..."
              placeholderTextColor={theme.colors.neutral[400]}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={() => {
                if (!searchText.trim()) toggleSearch();
              }}
            />
            <Pressable onPress={toggleSearch} hitSlop={8}>
              <X size={18} color={theme.colors.neutral[400]} />
            </Pressable>
          </View>
        </View>
      )}

      {filterBar}

      {renderGrid()}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: GRID_PADDING,
    paddingVertical: 12,
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.neutral[900],
  },
  searchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: GRID_PADDING,
    marginBottom: 12,
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.neutral[100],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.neutral[900],
    outlineStyle: "none",
  } as any,
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  resultCount: {
    paddingHorizontal: GRID_PADDING,
    paddingVertical: 8,
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
  },
  resultCountText: {
    fontSize: 14,
    color: theme.colors.neutral[500],
    fontWeight: "500",
  },
  nativeListContent: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 120,
    gap: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
  },
  gridItemFull: {
    width: "100%",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.neutral[700],
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.neutral[500],
  },
}));
