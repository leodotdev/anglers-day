import React, { forwardRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerStyle, editable, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const isDisabled = editable === false;
    const { theme } = useUnistyles();

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={theme.colors.neutral[400]}
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
    color: theme.colors.neutral[700],
  },
  input: {
    height: 48,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[900],
  },
  inputDefault: {
    borderColor: theme.colors.neutral[300],
  },
  inputFocused: {
    borderColor: theme.colors.primary[500],
  },
  inputError: {
    borderColor: theme.colors.error[500],
  },
  inputDisabled: {
    backgroundColor: theme.colors.neutral[50],
  },
  errorText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error[500],
  },
}));
