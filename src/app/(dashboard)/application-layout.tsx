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
import { SignInButton, SignedOut, UserButton } from '@clerk/nextjs'
import { Squares2X2Icon } from '@heroicons/react/16/solid'
import { CalendarIcon, CameraIcon, Cog6ToothIcon, HomeIcon, QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import { usePathname } from 'next/navigation'

export function ApplicationLayout({ children }: { children: React.ReactNode }) {
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
              <SidebarItem href="/" current={pathname.startsWith('/')}>
                <HomeIcon />
                <SidebarLabel>Inicio</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/events-generate-qr" current={pathname.startsWith('/events-generate-qr')}>
                <CalendarIcon />
                <SidebarLabel>Eventos Qr</SidebarLabel>
              </SidebarItem>

              <SidebarItem href="/utilidad-generate-qr" current={pathname.startsWith('/utilidad-generate-qr')}>
                <Squares2X2Icon />
                <SidebarLabel>Utilidad QR</SidebarLabel>
              </SidebarItem>

              <SidebarItem href="/download-images-by-event" current={pathname.startsWith('/download-images-by-event')}>
                <CameraIcon />
                <SidebarLabel>Descargar fotos por evento</SidebarLabel>
              </SidebarItem>

              <SidebarItem href="/settings" current={pathname.startsWith('/settings')}>
                <Cog6ToothIcon />
                <SidebarLabel>Settings</SidebarLabel>
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
