export type LocalSamlConfig = {
  entryPoint: string
  issuer: string
  sessionSecret: string
  linkText: {
    [key: string]: string
  }
  privateKey?: string
  decryptionPvk?: string
  attributeMap: {
    email: string
    uuid: string
    firstName: string
    lastName: string
  }
}
