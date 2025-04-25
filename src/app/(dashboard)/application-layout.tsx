'use client'

import { Navbar, NavbarSection, NavbarSpacer } from '@/components/navbar'
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from '@/components/sidebar'
import { SidebarLayout } from '@/components/sidebar-layout'
import { getEvents } from '@/data'
import { SignInButton, SignedOut, UserButton } from '@clerk/nextjs'
import { Squares2X2Icon } from '@heroicons/react/16/solid'
import { Cog6ToothIcon, HomeIcon, QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import { usePathname } from 'next/navigation'

export function ApplicationLayout({
  events,
  children,
}: {
  events: Awaited<ReturnType<typeof getEvents>>
  children: React.ReactNode
}) {
  let pathname = usePathname()

  const routes = [
    { name: 'Welcome', url: '/welcome' },
    { name: 'Fotos Galeria', url: '/photo-galery' },
    { name: 'Escaner QR', url: '/scan-qr' },
  ]

  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            <UserButton />
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <div>
              <h1>Admin Eventos</h1>
            </div>
          </SidebarHeader>

          <SidebarBody>
            <SidebarSection>
              <SidebarItem href="/" current={pathname === '/'}>
                <HomeIcon />
                <SidebarLabel>Home</SidebarLabel>
              </SidebarItem>

              <SidebarItem href="/settings" current={pathname.startsWith('/settings')}>
                <Cog6ToothIcon />
                <SidebarLabel>Settings</SidebarLabel>
              </SidebarItem>

              <SidebarItem href="/generate-qr" current={pathname.startsWith('/generate-qr')}>
                <Squares2X2Icon />
                <SidebarLabel>Generar QR</SidebarLabel>
              </SidebarItem>
            </SidebarSection>

            <SidebarSection className="max-lg:hidden">
              <SidebarHeading>Pantallas del evento</SidebarHeading>
              {routes.map((event) => (
                <SidebarItem key={event.name} href={event.url}>
                  {event.name}
                </SidebarItem>
              ))}
            </SidebarSection>

            <SidebarSpacer />

            <SidebarSection>
              <SidebarItem href="#">
                <QuestionMarkCircleIcon />
                <SidebarLabel>Support</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>

          <SidebarFooter className="flex w-full justify-center max-lg:hidden">
            <UserButton />

            <SignedOut>
              <SignInButton />
            </SignedOut>
          </SidebarFooter>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
}
