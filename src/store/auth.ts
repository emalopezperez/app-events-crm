import { create } from "zustand"
import { persist } from "zustand/middleware"

type User = {
  id: string
  username: string
  role: string
  // Add any other user properties you need
}

type AuthState = {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  hasPermission: (requiredRole: string | string[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      hasPermission: (requiredRole) => {
        const { user } = get()
        if (!user) return false

        if (Array.isArray(requiredRole)) {
          return requiredRole.includes(user.role)
        }

        return user.role === requiredRole
      },
    }),
    {
      name: "auth-storage",
      // Only persist these keys
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
