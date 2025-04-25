'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('jwt')

    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="bg-red-95w-full w-full cursor-pointer rounded-md p-2 text-left text-sm font-medium text-red-800 hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
    >
      Logout
    </button>
  )
}
