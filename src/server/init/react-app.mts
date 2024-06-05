import { plugin } from '@moodlenet/react-app/server'
import { shell } from '../shell.mjs'

shell.call(plugin)({
  initModuleLoc: ['dist', 'webapp', 'exports', 'init.mjs'],
  deps: {},
})
