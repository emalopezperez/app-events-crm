import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clerk } from '@clerk/clerk-sdk-node'
import { Search, Users } from 'lucide-react'

export default async function Collaborators() {
  const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY! })
  const users = await clerk.users.getUserList({ limit: 100 })

  return (
    <div className="mx-auto min-h-screen px-4 py-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lista de colaboradores</h1>
          <p className="text-muted-foreground mt-1">Manage your team members and their roles.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input type="search" placeholder="Search collaborators..." className="w-full pl-8" />
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All Collaborators</TabsTrigger>
          <TabsTrigger value="admin">Admins</TabsTrigger>
          <TabsTrigger value="member">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <CollaboratorCard
                key={user.id}
                imageUrl={user.imageUrl}
                name={`${user.firstName} ${user.lastName}`}
                email={user.emailAddresses[0]?.emailAddress || 'No email'}
                role={(user.publicMetadata?.role as string) || 'Member'}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="admin" className="mt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users
              .filter((user) => (user.publicMetadata?.role as string) === 'Admin')
              .map((user) => (
                <CollaboratorCard
                  key={user.id}
                  imageUrl={user.imageUrl}
                  name={`${user.firstName} ${user.lastName}`}
                  email={user.emailAddresses[0]?.emailAddress || 'No email'}
                  role="Admin"
                />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="member" className="mt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users
              .filter((user) => (user.publicMetadata?.role as string) === 'Member' || !user.publicMetadata?.role)
              .map((user) => (
                <CollaboratorCard
                  key={user.id}
                  imageUrl={user.imageUrl}
                  name={`${user.firstName} ${user.lastName}`}
                  email={user.emailAddresses[0]?.emailAddress || 'No email'}
                  role="Member"
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="text-lg font-medium">No collaborators found</h3>
          <p className="text-muted-foreground mt-1">Invite team members to get started.</p>
        </div>
      )}
    </div>
  )
}

interface CollaboratorCardProps {
  imageUrl: string
  name: string
  email: string
  role: string
}

function CollaboratorCard({ imageUrl, name, email, role }: CollaboratorCardProps) {
  // Get initials from name for avatar fallback
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 border">
            <AvatarImage src={imageUrl || '/placeholder.svg'} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="truncate font-medium">{name}</h3>
              <RoleBadge role={role} />
            </div>
            <p className="text-muted-foreground mt-1 truncate text-sm">{email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RoleBadge({ role }: { role: string }) {
  const variant = role.toLowerCase() === 'admin' ? 'destructive' : 'secondary'

  return (
    <Badge variant={variant} className="ml-2">
      {role}
    </Badge>
  )
}
