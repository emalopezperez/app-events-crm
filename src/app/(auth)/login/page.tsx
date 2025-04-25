'use client'

import React, { useState } from 'react'

import { Button } from '@/components/button'
import { Field, Label } from '@/components/fieldset'
import { Heading } from '@/components/heading'
import { Input } from '@/components/input'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const urlBackendLocal = 'http://localhost:5001/api/admin/auth/login'
  const enpoint = '/api/admin/auth/login'
  const urlBackendProdu = `process.env.NEXT_PUBLIC_BACKEND_URL${enpoint}`

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const res = await fetch(urlBackendProdu, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await res.json()

      if (data.success) {
        console.log(data)
        router.push('/')
      } else {
        setError('Login fallido. Verifica tus credenciales.')
      }
    } catch (err) {
      setError('Error al conectar con el servidor.')
      console.error(err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid w-full max-w-sm grid-cols-1 gap-8">
      <Heading>Iniciar sesión</Heading>
      {error && <div className="text-red-500">{error}</div>}
      <Field>
        <Label>Email</Label>
        <Input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field>
        <Label>Password</Label>
        <Input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>
      <Button type="submit" className="w-full">
        Login
      </Button>
    </form>
  )
}
