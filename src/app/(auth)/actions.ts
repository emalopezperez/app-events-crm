'use server'

import { deleteSession } from '../lib/session'

export async function logout() {
  await deleteSession()
}
