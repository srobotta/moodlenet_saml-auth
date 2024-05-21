import fs from 'node:fs'
import { shell } from '../shell.mjs'
import { LocalSamlConfig } from '../types.mjs'

export const validateConfigAndGetCert = () => {
  const confEntryExample = `
        Example:

        "@citricity/saml-auth": {
            "entryPoint": "http://localhost:8081/simplesaml/saml2/idp/SSOService.php",
            "issuer": "https://example.org/saml-idp",
            "sessionSecret": "anyoldtext",
            "attributeMap": {
                "email": "attributes.email",
                "uuid": "attributes.uuid",
                "firstName": "attributes.givenName",
                "lastName": "attributes.sn"
            }
        }
        `

  if (!shell.config) {
    throw new Error(`You are missing a citricity/saml-auth entry in your config file
        
        ${process.cwd()}/default.config.json

            ${confEntryExample}
        
        `)
  }

  const fields = [
    'entryPoint',
    'issuer',
    'sessionSecret',
    { attributeMap: ['email', 'uuid', 'firstName', 'lastName'] },
  ]

  const { config }: { config: LocalSamlConfig | any } = shell

  const confFieldMissingError = (fieldIdent: string) => {
    throw new Error(`You are missing the field ${fieldIdent} from your citricity/saml-auth entry in your config file
        
        ${process.cwd()}/default.config.json

        ${confEntryExample}
        
        `)
  }

  for (const field of fields) {
    if (typeof field === 'string') {
      if (config[field] === undefined) {
        confFieldMissingError(field)
      }
    } else {
      for (const prop in field) {
        if (config[prop] === undefined) {
          confFieldMissingError(prop)
        }
        for (const subField in config[prop]) {
          if (config[prop][subField] === undefined) {
            confFieldMissingError(`${prop}.${subField}`)
          }
        }
      }
    }
  }

  const certPath = `${process.cwd()}/saml.cert`
  if (!fs.existsSync(certPath)) {
    throw new Error(`A saml.cert file for your IDP needs to be placed in ${certPath}`)
  }

  const certStr = fs.readFileSync(certPath, 'utf8')
  const cert = certStr
    .replace('-----BEGIN CERTIFICATE-----', '')
    .replace('-----END CERTIFICATE-----', '')
    .replace(/\n/g, '')
    .trim()

  return {cert, config} as {cert: string, config: LocalSamlConfig};
}
