import assert from 'assert'
import type { DocumentSelector } from '../../../arangodb/dist/server/exports.mjs'
import { db, SamlUserCollection } from './init/arangodb.mjs'
import { shell } from './shell.mjs'
import type { Email, SamlUser, SamlUserData, SamlUserDoc } from './store/types.mjs'

export async function getByUuid(uuid: string): Promise<SamlUser | undefined> {
  const cursor = await db.query<SamlUserDoc | null>(
    `FOR u in @@SamlUserCollection 
          FILTER u.uuid == @uuid
          LIMIT 1
        RETURN u`,
    { '@SamlUserCollection': SamlUserCollection.name, uuid },
  )

  const [userDoc] = await cursor.all()
  return _user(userDoc)
}

export async function getByEmail(email: Email): Promise<SamlUser | undefined> {
  const cursor = await db.query<SamlUserDoc | null>(
    `FOR u in @@SamlUserCollection 
          FILTER u.email == @email
          LIMIT 1
        RETURN u`,
    { '@SamlUserCollection': SamlUserCollection.name, email },
  )

  const [userDoc] = await cursor.all()
  return _user(userDoc)
}

export async function getByWebUserKey(webUserKey: string): Promise<SamlUser | undefined> {
  const cursor = await db.query<SamlUserDoc | null>(
    `FOR u in @@SamlUserCollection 
          FILTER u.webUserKey == @webUserKey
          LIMIT 1
        RETURN u`,
    { '@EmailPwdUserCollection': SamlUserCollection.name, webUserKey },
  )

  const [userDoc] = await cursor.all()
  return _user(userDoc)
}

export async function getById(sel: DocumentSelector): Promise<SamlUser | undefined> {
  const userDoc = await SamlUserCollection.document(sel, { graceful: true })

  return _user(userDoc)
}

export async function delUser(sel: DocumentSelector) {
  const { old: oldUserDoc } = await SamlUserCollection.remove(sel, { returnOld: true })

  return _user(oldUserDoc)
}

export async function create(_newUserData: Omit<SamlUserData, 'created'>): Promise<SamlUser> {
  const newUserData: SamlUserData = {
    ..._newUserData,
    created: shell.now().toISOString(),
  }
  const { new: oldUserDoc } = await SamlUserCollection.save(newUserData, { returnNew: true })
  const newUser = _user(oldUserDoc)
  assert(newUser)

  return newUser
}

function _user(user: SamlUserDoc | null | undefined): undefined | SamlUser {
  return user
    ? {
        _key: user._key,
        webUserKey: user.webUserKey,
        created: user.created,
        uuid: user.uuid,
        email: user.email,
      }
    : undefined
}
