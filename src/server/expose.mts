import type { SamlAuthExposeType } from '../common/expose-def.mjs'
import { validateConfigAndGetCert } from './init/configtools.mjs'
import { shell } from './shell.mjs'

export const expose = await shell.expose<SamlAuthExposeType>({
  rpc: {
    config: {
      guard: () => true,
      async fn() {
        const { config } = validateConfigAndGetCert()
        return config
      },
    },
  },
})
