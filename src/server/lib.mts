import {
  createWebUser, getProfileRecord, getWebUser,
  sendWebUserTokenCookie,
  signWebUserJwtToken,
  verifyCurrentTokenCtx, WebUserRecord,
} from '@moodlenet/web-user/server'
import assert from 'assert'
import { SamlUserCollection } from './init/arangodb.mjs'
import { shell } from './shell.mjs'
import * as store from './store.mjs'
import { type LocalSamlConfig } from './types.mjs'
import { SamlUser } from './store/types.mjs'

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

type UpsertSamlUser = {
  success: boolean,
  webUser: WebUserRecord,
  samlUser: SamlUser,
  profile: any,
  sendHttpJwtToken: () => void
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
}): Promise<UpsertSamlUser> {
  const samlUser = await store.getByUuid(uuid)

  if (samlUser) {
    // TODO - update saml user.
    // Found an existing user!
    const webUser = await getWebUser({ _key: samlUser.webUserKey })
    if (!webUser) {
      throw new Error(`Could not find web user with key ${samlUser.webUserKey}`)
    }
    const jwtToken = await shell.call(signWebUserJwtToken)({ webUserkey: samlUser.webUserKey })
    assert(jwtToken, `Couldn't sign token for webUserKey:${samlUser.webUserKey}`)
    // Getting the profileRecord doesn't seem to work even though I can see it in the DB and it has the correct key.
    const profileRecord = await getProfileRecord(webUser.profileKey)
    return {
      success: true,
      webUser: (webUser as WebUserRecord),
      samlUser: samlUser,
      profile: profileRecord,
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
    throw new Error('Failed to create new web user');
  }

  const { jwtToken, newWebUser, newProfile } = createNewWebUserResp

  const newSamlUser = await store.create({
    uuid,
    email,
    webUserKey: newWebUser._key,
  })

  return {
    success: true,
    webUser: newWebUser,
    samlUser: newSamlUser,
    profile: newProfile,
    sendHttpJwtToken() {
      shell.call(sendWebUserTokenCookie)(jwtToken)
    },
  }
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
