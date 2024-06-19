import { shell } from './shell.mjs'
import { SamlAuthExposeType } from '../common/expose-def.mjs'
import { validateConfigAndGetCert } from './init/configtools.mjs'

export const expose = await shell.expose<SamlAuthExposeType>({
  rpc: {
    config: {
      guard: () => true,
      async fn() {
        const {config} = validateConfigAndGetCert();
        return config;
      },
    },
  },
})
