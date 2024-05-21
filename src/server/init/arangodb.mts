import { ensureDocumentCollection, getMyDB } from '@moodlenet/arangodb/server'
import { shell } from '../shell.mjs'
import type { SamlUserData } from '../store/types.mjs'

export const { db } = await shell.call(getMyDB)()
export const { collection: SamlUserCollection /* ,newlyCreated */ } = await shell.call(
  ensureDocumentCollection,
)<SamlUserData>('SamlUser')
