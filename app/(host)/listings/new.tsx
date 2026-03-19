import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import {
  Ship,
  FileText,
  MapPin,
  Settings,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  X,
} from "lucide-react-native";
import { api } from "@/convex/_generated/api";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const TRIP_TYPES = [
  { value: "offshore", label: "Offshore" },
  { value: "inshore", label: "Inshore" },
  { value: "deep_sea", label: "Deep Sea" },
  { value: "fly_fishing", label: "Fly Fishing" },
  { value: "bottom_fishing", label: "Bottom Fishing" },
  { value: "trolling", label: "Trolling" },
  { value: "spearfishing", label: "Spearfishing" },
  { value: "sunset_cruise", label: "Sunset Cruise" },
  { value: "custom", label: "Custom" },
] as const;

const CANCELLATION_POLICIES = [
  {
    id: "flexible",
    title: "Flexible",
    description: "Full refund up to 24 hours before the trip",
  },
  {
    id: "moderate",
    title: "Moderate",
    description: "Full refund up to 5 days before the trip",
  },
  {
    id: "strict",
    title: "Strict",
    description: "50% refund up to 7 days before the trip",
  },
];

const STEP_ICONS = [Ship, FileText, MapPin, Settings];
const STEP_LABELS = ["Boat", "Details", "Departure", "Settings"];

type FormData = {
  boatId: string;
  title: string;
  description: string;
  tripType: string;
  duration: string;
  price: string;
  priceType: string;
  departurePort: string;
  departureCity: string;
  departureState: string;
  includesEquipment: boolean;
  includesBait: boolean;
  includesLunch: boolean;
  customInclusions: string[];
  targetSpecies: string[];
  maxGuests: string;
  minGuests: string;
  captainIncluded: boolean;
  captainName: string;
  captainBio: string;
  cancellationPolicy: string;
  instantBook: boolean;
};

function NewListingContent() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newInclusion, setNewInclusion] = useState("");
  const [newSpecies, setNewSpecies] = useState("");

  const { theme } = useUnistyles();

  const boats = useQuery(api.boats.getByHost);

  const createListing = useMutation(api.listings.create);
  const publishListing = useMutation(api.listings.publish);

  const [form, setForm] = useState<FormData>({
    boatId: "",
    title: "",
    description: "",
    tripType: "",
    duration: "",
    price: "",
    priceType: "per_trip",
    departurePort: "",
    departureCity: "",
    departureState: "",
    includesEquipment: true,
    includesBait: true,
    includesLunch: false,
    customInclusions: [],
    targetSpecies: [],
    maxGuests: "",
    minGuests: "1",
    captainIncluded: true,
    captainName: "",
    captainBio: "",
    cancellationPolicy: "moderate",
    instantBook: false,
  });

  const updateForm = (key: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 0:
        // Boat selection - optional for now
        return true;
      case 1:
        if (!form.title.trim()) {
          Alert.alert("Required", "Please enter a title");
          return false;
        }
        if (!form.description.trim()) {
          Alert.alert("Required", "Please enter a description");
          return false;
        }
        if (!form.tripType) {
          Alert.alert("Required", "Please select a trip type");
          return false;
        }
        if (!form.duration || isNaN(Number(form.duration))) {
          Alert.alert("Required", "Please enter a valid duration");
          return false;
        }
        if (!form.price || isNaN(Number(form.price))) {
          Alert.alert("Required", "Please enter a valid price");
          return false;
        }
        return true;
      case 2:
        if (!form.departurePort.trim()) {
          Alert.alert("Required", "Please enter a departure port");
          return false;
        }
        if (!form.departureCity.trim()) {
          Alert.alert("Required", "Please enter a city");
          return false;
        }
        if (!form.departureState.trim()) {
          Alert.alert("Required", "Please enter a state");
          return false;
        }
        return true;
      case 3:
        if (!form.maxGuests || isNaN(Number(form.maxGuests))) {
          Alert.alert("Required", "Please enter max guests");
          return false;
        }
        if (
          form.captainIncluded &&
          !form.captainName.trim()
        ) {
          Alert.alert("Required", "Please enter captain name");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!form.boatId) {
      Alert.alert("Required", "Please select a boat");
      return;
    }

    setIsSubmitting(true);
    try {
      const listingId = await createListing({
        boatId: form.boatId as Id<"boats">,
        title: form.title.trim(),
        description: form.description.trim(),
        tripType: form.tripType as any,
        durationHours: Number(form.duration),
        priceCents: Math.round(Number(form.price) * 100),
        priceType: form.priceType as "per_person" | "per_trip",
        maxGuests: Number(form.maxGuests),
        minGuests: form.minGuests ? Number(form.minGuests) : undefined,
        captainIncluded: form.captainIncluded,
        captainName: form.captainIncluded ? form.captainName.trim() : undefined,
        captainBio: form.captainIncluded && form.captainBio.trim() ? form.captainBio.trim() : undefined,
        targetSpecies: form.targetSpecies,
        departurePort: form.departurePort.trim(),
        departureLatitude: 0, // TODO: geocode
        departureLongitude: 0, // TODO: geocode
        departureCity: form.departureCity.trim(),
        departureState: form.departureState.trim(),
        includesEquipment: form.includesEquipment,
        includesBait: form.includesBait,
        includesLunch: form.includesLunch,
        customInclusions: form.customInclusions,
        cancellationPolicy: form.cancellationPolicy as "flexible" | "moderate" | "strict",
        instantBook: form.instantBook,
      });

      await publishListing({ id: listingId });

      Alert.alert("Success", "Listing created and published!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addInclusion = () => {
    if (newInclusion.trim()) {
      updateForm("customInclusions", [
        ...form.customInclusions,
        newInclusion.trim(),
      ]);
      setNewInclusion("");
    }
  };

  const removeInclusion = (index: number) => {
    updateForm(
      "customInclusions",
      form.customInclusions.filter((_, i) => i !== index)
    );
  };

  const addSpecies = () => {
    if (newSpecies.trim()) {
      updateForm("targetSpecies", [
        ...form.targetSpecies,
        newSpecies.trim(),
      ]);
      setNewSpecies("");
    }
  };

  const removeSpecies = (index: number) => {
    updateForm(
      "targetSpecies",
      form.targetSpecies.filter((_, i) => i !== index)
    );
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEP_ICONS.map((Icon, index) => (
        <View key={index} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              index <= step && styles.stepCircleActive,
              index < step && styles.stepCircleCompleted,
            ]}
          >
            {index < step ? (
              <Check size={16} color="#fff" />
            ) : (
              <Icon
                size={16}
                color={index <= step ? "#fff" : theme.colors.neutral[400]}
              />
            )}
          </View>
          <Text
            style={[
              styles.stepLabel,
              index <= step && styles.stepLabelActive,
            ]}
          >
            {STEP_LABELS[index]}
          </Text>
          {index < STEP_ICONS.length - 1 && (
            <View
              style={[
                styles.stepLine,
                index < step && styles.stepLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep0 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Your Boat</Text>
      <Text style={styles.stepSubtitle}>
        Choose which boat to use for this charter
      </Text>

      {boats === undefined ? (
        <ActivityIndicator
          size="small"
          color={theme.colors.primary[500]}
          style={{ marginTop: 20 }}
        />
      ) : Array.isArray(boats) && boats.length > 0 ? (
        boats.map((boat: any) => (
          <TouchableOpacity
            key={boat._id}
            style={[
              styles.boatCard,
              form.boatId === boat._id && styles.boatCardSelected,
            ]}
            onPress={() => updateForm("boatId", boat._id)}
          >
            <Ship
              size={24}
              color={
                form.boatId === boat._id
                  ? theme.colors.primary[500]
                  : theme.colors.neutral[400]
              }
            />
            <View style={styles.boatInfo}>
              <Text style={styles.boatName}>{boat.name ?? boat.title}</Text>
              <Text style={styles.boatType}>
                {boat.type ?? boat.tripType ?? "Boat"}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText}>
          No boats found. You can still create a listing.
        </Text>
      )}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Trip Details</Text>
      <Text style={styles.stepSubtitle}>
        Describe your charter experience
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Offshore Deep Sea Adventure"
          placeholderTextColor={theme.colors.neutral[400]}
          value={form.title}
          onChangeText={(v) => updateForm("title", v)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your fishing charter..."
          placeholderTextColor={theme.colors.neutral[400]}
          value={form.description}
          onChangeText={(v) => updateForm("description", v)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Trip Type</Text>
        <View style={styles.chipContainer}>
          {TRIP_TYPES.map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.chip,
                form.tripType === value && styles.chipSelected,
              ]}
              onPress={() => updateForm("tripType", value)}
            >
              <Text
                style={[
                  styles.chipText,
                  form.tripType === value && styles.chipTextSelected,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Duration (hours)</Text>
          <TextInput
            style={styles.input}
            placeholder="4"
            placeholderTextColor={theme.colors.neutral[400]}
            value={form.duration}
            onChangeText={(v) => updateForm("duration", v)}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Price ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="500"
            placeholderTextColor={theme.colors.neutral[400]}
            value={form.price}
            onChangeText={(v) => updateForm("price", v)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Price Type</Text>
        <View style={styles.chipContainer}>
          {[
            { value: "per_trip", label: "Per Trip" },
            { value: "per_person", label: "Per Person" },
          ].map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.chip,
                form.priceType === value && styles.chipSelected,
              ]}
              onPress={() => updateForm("priceType", value)}
            >
              <Text
                style={[
                  styles.chipText,
                  form.priceType === value && styles.chipTextSelected,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Departure & Inclusions</Text>
      <Text style={styles.stepSubtitle}>
        Where guests will meet and what's included
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Departure Port</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Marina Bay Dock A"
          placeholderTextColor={theme.colors.neutral[400]}
          value={form.departurePort}
          onChangeText={(v) => updateForm("departurePort", v)}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="Miami"
            placeholderTextColor={theme.colors.neutral[400]}
            value={form.departureCity}
            onChangeText={(v) => updateForm("departureCity", v)}
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            placeholder="FL"
            placeholderTextColor={theme.colors.neutral[400]}
            value={form.departureState}
            onChangeText={(v) => updateForm("departureState", v)}
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>Inclusions</Text>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Fishing Equipment</Text>
        <Switch
          value={form.includesEquipment}
          onValueChange={(v) => updateForm("includesEquipment", v)}
          trackColor={{
            false: theme.colors.neutral[300],
            true: theme.colors.primary[300],
          }}
          thumbColor={
            form.includesEquipment ? theme.colors.primary[500] : theme.colors.neutral[100]
          }
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Bait & Tackle</Text>
        <Switch
          value={form.includesBait}
          onValueChange={(v) => updateForm("includesBait", v)}
          trackColor={{
            false: theme.colors.neutral[300],
            true: theme.colors.primary[300],
          }}
          thumbColor={
            form.includesBait ? theme.colors.primary[500] : theme.colors.neutral[100]
          }
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Lunch</Text>
        <Switch
          value={form.includesLunch}
          onValueChange={(v) => updateForm("includesLunch", v)}
          trackColor={{
            false: theme.colors.neutral[300],
            true: theme.colors.primary[300],
          }}
          thumbColor={
            form.includesLunch ? theme.colors.primary[500] : theme.colors.neutral[100]
          }
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Custom Inclusions</Text>
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="e.g. Ice & cooler"
            placeholderTextColor={theme.colors.neutral[400]}
            value={newInclusion}
            onChangeText={setNewInclusion}
            onSubmitEditing={addInclusion}
          />
          <TouchableOpacity style={styles.addButton} onPress={addInclusion}>
            <Plus size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.chipContainer}>
          {form.customInclusions.map((item, index) => (
            <View key={index} style={styles.chipWithRemove}>
              <Text style={styles.chipRemoveText}>{item}</Text>
              <TouchableOpacity onPress={() => removeInclusion(index)}>
                <X size={14} color={theme.colors.neutral[500]} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Target Species</Text>
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="e.g. Mahi-Mahi"
            placeholderTextColor={theme.colors.neutral[400]}
            value={newSpecies}
            onChangeText={setNewSpecies}
            onSubmitEditing={addSpecies}
          />
          <TouchableOpacity style={styles.addButton} onPress={addSpecies}>
            <Plus size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.chipContainer}>
          {form.targetSpecies.map((species, index) => (
            <TouchableOpacity
              key={index}
              style={styles.chipWithRemove}
              onPress={() => removeSpecies(index)}
            >
              <Text style={styles.chipRemoveText}>{species}</Text>
              <X size={14} color={theme.colors.neutral[500]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Settings</Text>
      <Text style={styles.stepSubtitle}>
        Configure guests, captain, and policies
      </Text>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Max Guests</Text>
          <TextInput
            style={styles.input}
            placeholder="6"
            placeholderTextColor={theme.colors.neutral[400]}
            value={form.maxGuests}
            onChangeText={(v) => updateForm("maxGuests", v)}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Min Guests</Text>
          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor={theme.colors.neutral[400]}
            value={form.minGuests}
            onChangeText={(v) => updateForm("minGuests", v)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Captain Included</Text>
        <Switch
          value={form.captainIncluded}
          onValueChange={(v) => updateForm("captainIncluded", v)}
          trackColor={{
            false: theme.colors.neutral[300],
            true: theme.colors.primary[300],
          }}
          thumbColor={
            form.captainIncluded ? theme.colors.primary[500] : theme.colors.neutral[100]
          }
        />
      </View>

      {form.captainIncluded && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Captain Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Captain's name"
              placeholderTextColor={theme.colors.neutral[400]}
              value={form.captainName}
              onChangeText={(v) => updateForm("captainName", v)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Captain Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brief bio about the captain..."
              placeholderTextColor={theme.colors.neutral[400]}
              value={form.captainBio}
              onChangeText={(v) => updateForm("captainBio", v)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </>
      )}

      <Text style={styles.sectionLabel}>Cancellation Policy</Text>
      {CANCELLATION_POLICIES.map((policy) => (
        <TouchableOpacity
          key={policy.id}
          style={[
            styles.policyCard,
            form.cancellationPolicy === policy.id && styles.policyCardSelected,
          ]}
          onPress={() => updateForm("cancellationPolicy", policy.id)}
        >
          <View style={styles.policyHeader}>
            <View
              style={[
                styles.radioCircle,
                form.cancellationPolicy === policy.id &&
                  styles.radioCircleSelected,
              ]}
            >
              {form.cancellationPolicy === policy.id && (
                <View style={styles.radioInner} />
              )}
            </View>
            <Text style={styles.policyTitle}>{policy.title}</Text>
          </View>
          <Text style={styles.policyDescription}>{policy.description}</Text>
        </TouchableOpacity>
      ))}

      <View style={[styles.switchRow, { marginTop: 16 }]}>
        <View>
          <Text style={styles.switchLabel}>Instant Book</Text>
          <Text style={styles.switchSublabel}>
            Guests can book without approval
          </Text>
        </View>
        <Switch
          value={form.instantBook}
          onValueChange={(v) => updateForm("instantBook", v)}
          trackColor={{
            false: theme.colors.neutral[300],
            true: theme.colors.primary[300],
          }}
          thumbColor={
            form.instantBook ? theme.colors.primary[500] : theme.colors.neutral[100]
          }
        />
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <View style={styles.wizardContainer}>
      {renderStepIndicator()}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderCurrentStep()}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={18} color={theme.colors.neutral[700]} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {step < 3 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
            <ChevronRight size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.nextButtonText}>Create & Publish</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function NewListingScreen() {
  const { theme } = useUnistyles();
  return (
    <RoleGuard roles={["host", "admin"]}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={theme.colors.neutral[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Listing</Text>
          <View style={{ width: 24 }} />
        </View>
        <NewListingContent />
      </SafeAreaView>
    </RoleGuard>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.neutral[900],
  },
  wizardContainer: {
    flex: 1,
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleActive: {
    backgroundColor: theme.colors.primary[500],
  },
  stepCircleCompleted: {
    backgroundColor: theme.colors.success[500],
  },
  stepLabel: {
    fontSize: 11,
    color: theme.colors.neutral[400],
    position: "absolute",
    bottom: -18,
    alignSelf: "center",
    left: -4,
    width: 44,
    textAlign: "center",
  },
  stepLabelActive: {
    color: theme.colors.primary[500],
    fontWeight: "600",
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: theme.colors.neutral[200],
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: theme.colors.success[500],
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    paddingTop: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.neutral[900],
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    color: theme.colors.neutral[500],
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.neutral[700],
    marginBottom: 6,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.neutral[800],
    marginBottom: 12,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.neutral[900],
    backgroundColor: theme.colors.neutral[50],
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  chipSelected: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[500],
  },
  chipText: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    fontWeight: "500",
  },
  chipTextSelected: {
    color: theme.colors.primary[700],
  },
  chipWithRemove: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral[100],
  },
  chipRemoveText: {
    fontSize: 13,
    color: theme.colors.neutral[700],
  },
  addRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  switchLabel: {
    fontSize: 16,
    color: theme.colors.neutral[800],
    fontWeight: "500",
  },
  switchSublabel: {
    fontSize: 13,
    color: theme.colors.neutral[500],
    marginTop: 2,
  },
  policyCard: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  policyCardSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  policyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.neutral[300],
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleSelected: {
    borderColor: theme.colors.primary[500],
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary[500],
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.neutral[800],
  },
  policyDescription: {
    fontSize: 13,
    color: theme.colors.neutral[500],
    marginLeft: 30,
  },
  boatCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: 12,
    marginBottom: 10,
  },
  boatCardSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  boatInfo: {
    flex: 1,
  },
  boatName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.neutral[900],
  },
  boatType: {
    fontSize: 13,
    color: theme.colors.neutral[500],
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.neutral[400],
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[100],
    backgroundColor: theme.colors.white,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.neutral[700],
    fontWeight: "600",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.primary[500],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
}));
