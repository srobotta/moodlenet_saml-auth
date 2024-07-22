import { PrimaryButton } from '@moodlenet/component-library'
import { getCurrentLang } from '@moodlenet/core/i18n'
import type { LocalSamlConfig } from '../../server/types.mjs'
import { shell } from '../shell.mjs'

let label = ''
async function loadConfig() {
  if (label !== '') {
    return
  }
  const config: LocalSamlConfig = await shell.rpc.me('config')()
  const lang = getCurrentLang()
  label = config.linkText[lang] ?? 'Log in using Saml!'
}
await loadConfig()

export const LoginButton = () => {
  return <PrimaryButton color="blue">{label}</PrimaryButton>
}

export const LoginMethodPanelSaml = () => {
  return (
    <div>
      <PrimaryButton color="blue">
        <a href="/.pkg/@citricity/saml-auth/login">{label}</a>
      </PrimaryButton>
    </div>
  )
}
