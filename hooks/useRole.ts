import { useCurrentUser } from "./useCurrentUser";

export type UserRole = "guest" | "host" | "admin";

export function useRole(): {
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
} {
  const { user, isLoading, isAuthenticated } = useCurrentUser();

  return {
    role: user?.role ?? "guest",
    isLoading,
    isAuthenticated,
  };
}
