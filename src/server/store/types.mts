import type { DocumentMetadata } from '@moodlenet/arangodb/server'

export type Email = string


export type SamlUserData = {
  email: Email
  uuid: string
  created: string
  webUserKey: string
}
export type SamlUser = SamlUserData & { _key: string }
export type SamlUserDoc = SamlUserData & DocumentMetadata
