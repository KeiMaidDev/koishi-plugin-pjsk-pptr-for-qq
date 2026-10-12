import { Schema } from 'koishi'

export interface Config {
  isTextSizeAdaptationEnabled: boolean
  shouldSendDrawingGuideText: boolean
  shouldSendSuccessMessageAfterDrawingEmoji: boolean
  retractDelay: number
  shouldMentionUserInMessage: boolean
  isEnableQQOfficialRobotMarkdownTemplate: boolean
  customTemplateId: string
  key: string
  enableQQNativeMarkdown: boolean
  enableQQInlineCmd: boolean
  enableDetailedDebugLog: boolean
  // key2: string
  // key3: string
  numberOfMessageButtonsPerRow: number
  shouldPrefixAtForMarkdownMessage: boolean
  shouldWaitForUserInputBeforeSendingCommands: boolean
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    isTextSizeAdaptationEnabled: Schema.boolean().default(true).description('是否启用文本大小自适应。'),
    shouldSendDrawingGuideText: Schema.boolean().default(true).description('（QQ 官方机器人自动开启）是否发送提示文本信息，当开启后，将会发送引导用户绘制表情包的提示文本信息。'),
    shouldSendSuccessMessageAfterDrawingEmoji: Schema.boolean().default(true).description(`（QQ 官方机器人自动开启）是否发送绘制表情包成功的提示信息，即 \`🎉 表情包绘制完成！\`。`),
    shouldMentionUserInMessage: Schema.boolean().default(false).description(`（非 QQ 官方机器人）是否在消息中 @ 用户。`),
    retractDelay: Schema.number().min(0).default(0).description(`自动撤回等待的时间，单位是秒。值为 0 时不启用自动撤回功能。`),
    isEnableQQOfficialRobotMarkdownTemplate: Schema.boolean().default(false).description(`是否启用 QQ 官方机器人的 Markdown 模板，带消息按钮。`),
    enableQQNativeMarkdown: Schema.boolean().default(false).description('是否启用原生 Markdown。启用的前提下，未配置官方模板时会自动使用原生 Markdown 排版。'),
    enableQQInlineCmd: Schema.boolean().default(false).description('是否在开启原生 Markdown 时启用 mqqapi 快捷点击指令菜单。'),
    enableDetailedDebugLog: Schema.boolean().default(false).description('是否在发送失败时将详细且完整的 API 报错负载记录输出到控制台。'),
  }),
  Schema.union([
    Schema.object({
      isEnableQQOfficialRobotMarkdownTemplate: Schema.const(true).required(),
      customTemplateId: Schema.string().default('').description(`自定义模板 ID。`),
      key: Schema.string().default('').description(`文本内容中特定插值的 key，用于存放文本。如果你的插值为 {{.info}}，那么请在这里填 info。`),
      // key2: Schema.string().default('').description(`发送图片信息的特定插值的 key，用于存放图片的宽高。与下面的 key3 联动，Markdown 源码中形如：{{.key2}}{{.key3}}。`),
      // key3: Schema.string().default('').description(`发送图片URL的特定插值的 key，用于存放图片的URL。`),
      numberOfMessageButtonsPerRow: Schema.number().min(3).max(5).default(3).description(`每行消息按钮的数量。`),
      shouldPrefixAtForMarkdownMessage: Schema.boolean().default(false).description(`是否在 Markdown 消息的文本前加上一行 @用户。`),
      shouldWaitForUserInputBeforeSendingCommands: Schema.boolean().default(false).description(`是否在点击“随机绘制”按钮后等待用户输入。`),
    }),
    Schema.object({}),
  ]),
]) as any

declare module 'koishi' {
  interface Tables {
    pjsk: PJSK
  }
}

export interface PJSK {
  id: number
  userId: string
  username: string
  // 字体大小 文字曲线 角色ID 文本 x y 行间距 旋转角度
  fontSize: number
  curve: boolean
  characterId: number
  text: string
  x: number
  y: number
  spaceSize: number
  rotate: number
}
