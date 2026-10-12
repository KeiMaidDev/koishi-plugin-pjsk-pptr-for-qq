import type { PjskRuntime } from '../runtime'
import { registerHelpCommands } from './help'
import { registerAdjustCommands } from './adjust'
import { registerDrawCommands } from './draw'

export function registerCommands(runtime: PjskRuntime) {
  registerHelpCommands(runtime)
  registerAdjustCommands(runtime)
  registerDrawCommands(runtime)
}
