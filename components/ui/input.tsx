import React, { forwardRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { colors } from "@/lib/colors";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerStyle, editable, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const isDisabled = editable === false;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={colors.neutral[400]}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[
            styles.input,
            styles.inputDefault,
            focused && styles.inputFocused,
            error && styles.inputError,
            isDisabled && styles.inputDisabled,
            style,
          ]}
          {...props}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

Input.displayName = "Input";

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: 6,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500",
    color: colors.neutral[700],
  },
  input: {
    height: 48,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    fontSize: theme.fontSize.base,
    color: colors.neutral[900],
  },
  inputDefault: {
    borderColor: colors.neutral[300],
  },
  inputFocused: {
    borderColor: colors.primary[500],
  },
  inputError: {
    borderColor: colors.error[500],
  },
  inputDisabled: {
    backgroundColor: colors.neutral[50],
  },
  errorText: {
    fontSize: theme.fontSize.xs,
    color: colors.error[500],
  },
}));
