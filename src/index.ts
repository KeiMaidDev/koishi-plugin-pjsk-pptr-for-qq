import { Context, Logger } from 'koishi'
import {} from '@koishijs/plugin-help'
import {} from 'koishi-plugin-puppeteer'
import type { Config as PjskConfig } from './config'
import { createRuntime } from './runtime'
import type { PjskRuntime } from './runtime'
import { createMessageService } from './message'
import { createDrawingService } from './drawing'
import { createCharacterHelpers } from './characters'
import { registerCommands } from './commands'

export { Config } from './config'
export type { PJSK } from './config'

export const name = 'pjsk-pptr'
export const inject = {
  required: ['puppeteer', 'database'],
  optional: ['assets']
}
export const usage = `
## 使用

1. 启动 \`puppeteer\` 服务。
2. 设置指令别名。
3. （可选）启用 \`assets\` 服务以在 QQ 官方机器人 Markdown 消息中展示图片。

## 特性

- \`pjsk.列表.角色分类\` 指令可触发表情包绘制引导。
- \`pjsk.绘制 [文本]\` 指令可直接绘制表情包。

## 关键指令

- \`pjsk.绘制 [文本]\` - 将自定义文本渲染到随机或指定的表情包中，使用 / 可以换行。
  - \`-n\` - 指定表情包 ID。
  - \`-y\` - 指定文本垂直位置。
  - \`-x\` - 指定文本水平位置。
  - \`-r\` - 指定文本旋转角度。
  - \`-s\` - 指定文本字体大小（自适应时不生效）。
  - \`-c\` - 是否启用文本曲线。
  - \`--space\` - 指定文本行间距。

## QQ 群

- 956758505
`

const logger = new Logger('PJSK')

export function apply(ctx: Context, config: PjskConfig) {
  const runtime = { ...createRuntime(ctx, config, logger) } as PjskRuntime
  Object.assign(runtime, createMessageService(runtime))
  Object.assign(runtime, createDrawingService(runtime))
  Object.assign(runtime, createCharacterHelpers(runtime))
  registerCommands(runtime)
}
