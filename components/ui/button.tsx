import React, { forwardRef } from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  Text,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";

export type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<
  React.ComponentRef<typeof TouchableOpacity>,
  ButtonProps
>(
  (
    {
      variant = "default",
      size = "default",
      loading = false,
      disabled,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const { theme } = useUnistyles();

    const variantStyle = styles[`variant_${variant}`];
    const sizeStyle = styles[`size_${size}`];
    const textVariantStyle = styles[`text_${variant}`];
    const textSizeStyle = styles[`textSize_${size}`];

    const loaderColor =
      variant === "default" || variant === "destructive"
        ? "#FFFFFF"
        : theme.colors.neutral[900];

    return (
      <TouchableOpacity
        ref={ref}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={[
          styles.base,
          variantStyle,
          sizeStyle,
          isDisabled && styles.disabled,
          style,
        ]}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={loaderColor} size="small" />
        ) : typeof children === "string" ? (
          <Text style={[styles.textBase, textVariantStyle, textSizeStyle]}>
            {children}
          </Text>
        ) : (
          children
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = "Button";

const styles = StyleSheet.create((theme) => ({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  // Variant styles
  variant_default: {
    backgroundColor: theme.colors.primary[500],
  },
  variant_secondary: {
    backgroundColor: theme.colors.neutral[100],
  },
  variant_outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
  },
  variant_ghost: {
    backgroundColor: "transparent",
  },
  variant_destructive: {
    backgroundColor: theme.colors.error[500],
  },
  // Size styles
  size_default: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: theme.radius.xl,
  },
  size_sm: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: theme.radius.lg,
  },
  size_lg: {
    height: 56,
    paddingHorizontal: 32,
    borderRadius: theme.radius.xl,
  },
  size_icon: {
    height: 40,
    width: 40,
    borderRadius: theme.radius.full,
  },
  // Text styles
  textBase: {
    fontWeight: "600",
    textAlign: "center",
  },
  text_default: {
    color: "#FFFFFF",
  },
  text_secondary: {
    color: theme.colors.neutral[900],
  },
  text_outline: {
    color: theme.colors.neutral[900],
  },
  text_ghost: {
    color: theme.colors.neutral[900],
  },
  text_destructive: {
    color: "#FFFFFF",
  },
  textSize_default: {
    fontSize: theme.fontSize.base,
  },
  textSize_sm: {
    fontSize: theme.fontSize.sm,
  },
  textSize_lg: {
    fontSize: theme.fontSize.lg,
  },
  textSize_icon: {
    fontSize: theme.fontSize.base,
  },
}));
