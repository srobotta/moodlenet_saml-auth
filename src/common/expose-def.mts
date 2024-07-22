import type { PkgExposeDef } from '@moodlenet/core'
import type { LocalSamlConfig } from '../server/types.mjs'
export type SamlAuthExposeType = PkgExposeDef<{
  rpc: {
    config(): Promise<LocalSamlConfig>
  }
}>
