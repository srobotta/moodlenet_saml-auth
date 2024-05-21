export type LocalSamlConfig = {
  entryPoint: string;
  issuer: string;
  sessionSecret: string;
  attributeMap: {
    email: string;
    uuid: string;
    firstName: string;
    lastName: string;
  }
}