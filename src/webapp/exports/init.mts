import { registerAppRoutes } from '@moodlenet/react-app/webapp'
import { LoginPlugins } from '@moodlenet/web-user/webapp'
import { useMemo } from 'react'
import { routes } from '../routes.js'
import '../shell.mjs'
import { LoginMethodPanelSaml, LoginButton } from '../ui/LoginMethodPanelSaml.js'

registerAppRoutes({ routes })

LoginPlugins.register(function useLoginMethod() {
  const loginMethod = useMemo(
    () => ({
      default: { Icon: LoginButton, Panel: LoginMethodPanelSaml },
    }),
    [],
  )
  return {
    loginMethod,
  }
})
