export type LocalSamlConfig = {
  entryPoint: string;
  issuer: string;
  sessionSecret: string;
  linkText: string;
  privateKey?: string;
  decryptionPvk?: string;
  attributeMap: {
    email: string;
    uuid: string;
    firstName: string;
    lastName: string;
  }
}
