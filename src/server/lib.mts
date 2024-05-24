import {
  createWebUser,
  sendWebUserTokenCookie,
  signWebUserJwtToken,
  verifyCurrentTokenCtx,
} from '@moodlenet/web-user/server'
import assert from 'assert'
import { SamlUserCollection } from './init/arangodb.mjs'
import { shell } from './shell.mjs'
import * as store from './store.mjs'
import { type LocalSamlConfig } from './types.mjs'

export async function login({ uuid }: { uuid: string }) {
  const user = await store.getByUuid(uuid)
  if (!user) {
    return { success: false } as const
  }

  const jwtToken = await shell.call(signWebUserJwtToken)({ webUserkey: user.webUserKey })
  assert(jwtToken, `Couldn't sign token for webUserKey:${user.webUserKey}`)
  shell.call(sendWebUserTokenCookie)(jwtToken)
  return { success: true } as const
}

export async function upsertSamlUser({
  uuid,
  displayName,
  email,
  publisher = false, // Hard coded to false for now - see sipmle email auth server lib.mts to set this via env
  isAdmin = false,
}: {
  uuid: string
  displayName: string
  email: string
  publisher?: boolean
  isAdmin?: boolean
}) {
  const existing = await store.getByUuid(uuid)
  if (existing) {
    // TODO - update web user and saml user.
    // Found an existing user!
    return {
      success: true,
      samlUser: existing,
      sendHttpJwtToken() {
        shell.call(sendWebUserTokenCookie)(jwtToken)
      },
    }
  }

  const createNewWebUserResp = await shell.call(createWebUser)({
    displayName,
    isAdmin,
    publisher,
    contacts: { email },
  })

  if (!createNewWebUserResp) {
    return { success: false, msg: 'could not create new WebUser' } as const
  }

  const { jwtToken, newWebUser, newProfile } = createNewWebUserResp

  const samlUser = await store.create({
    uuid,
    email,
    webUserKey: newWebUser._key,
  })

  return {
    success: true,
    samlUser,
    newWebUser,
    newProfile,
    sendHttpJwtToken() {
      shell.call(sendWebUserTokenCookie)(jwtToken)
    },
  } as const
}

export async function webUserDeleted({ webUserKey }: { webUserKey: string }) {
  const samlUser = await store.getByWebUserKey(webUserKey)
  if (!samlUser) {
    return
  }
  await SamlUserCollection.remove({ _key: samlUser._key })
  return samlUser
}

export async function getCurrentSamlUser() {
  const tokenCtx = await verifyCurrentTokenCtx()
  if (!tokenCtx || tokenCtx.payload.isRoot) {
    return
  }
  const currentSamlUser = store.getByWebUserKey(tokenCtx.payload.webUser._key)
  return currentSamlUser
}

function getAttributeValueFromPath(obj: any, path: string) {
  return path.split('.').reduce((acc, part) => {
    if (acc && part in acc) {
      return acc[part]
    } else {
      throw new Error(`Missing required SAML profile field: ${path}`)
    }
  }, obj)
}

export function extractAttributesFromSamlProfile(
  attributeMap: LocalSamlConfig['attributeMap'],
  profile: any,
) {
  const result: any = {}
  for (const [key, path] of Object.entries(attributeMap)) {
    result[key] = getAttributeValueFromPath(profile, path as string)
  }

  return result as LocalSamlConfig['attributeMap']
}
