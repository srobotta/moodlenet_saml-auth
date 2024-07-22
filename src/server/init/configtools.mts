import fs from 'node:fs'
import { shell } from '../shell.mjs'
import type { LocalSamlConfig } from '../types.mjs'

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

  const cert: string[] = []
  fs.readdirSync(process.cwd()).forEach(file => {
    if (file.substring(file.length - 5, file.length) === '.cert') {
      const certStr = fs.readFileSync(`${process.cwd()}/${file}`, 'utf8')
      cert.push(certStr)
    }
  })

  if (cert.length === 0) {
    throw new Error(
      `Certificates for the IDP must be placed in ${process.cwd()}. No .cert file found.`,
    )
  }

  const keyPath = `${process.cwd()}/saml.pem`
  if (!fs.existsSync(keyPath)) {
    throw new Error(`A saml.pem file for your IDP needs to be placed in ${keyPath}`)
  }
  const key = fs.readFileSync(keyPath, 'utf8')
  return { cert, config, key } as { cert: string[]; config: LocalSamlConfig; key: string }
}
