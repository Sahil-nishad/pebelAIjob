import { initializeApp, getApps, cert, type AppOptions } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  const appOptions: AppOptions = {}
  if (projectId) appOptions.projectId = projectId

  if (projectId && clientEmail && privateKey) {
    appOptions.credential = cert({
      projectId,
      clientEmail,
      privateKey,
    })
  }

  initializeApp(appOptions)
}

export const adminAuth = getAuth()
