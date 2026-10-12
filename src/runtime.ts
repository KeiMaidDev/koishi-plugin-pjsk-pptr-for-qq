import { Context, Logger } from 'koishi'
import path from 'path'
import * as fs from 'fs'
import type { Config } from './config'
import type {
  CharacterEntry,
  CreateButtons,
  DrawFunction,
  DrawList,
  DrawList2,
  GetCharacterImageBuffer,
  GetCharacterImagePath,
  GetCharacterName,
  ProcessUserInput,
  SendMessage,
  SendQQNativeMarkdown,
  UploadImageToAssets,
} from './types'

export interface PjskBaseRuntime {
  ctx: Context
  config: Config
  logger: Logger
  characters: CharacterEntry[]
  characterNames: string[]
  pjskListDir: Record<string, string>
  dependencyPjskDir: string
  filePath: string
  baseCdn: string
  isTemplateMDEnabled: boolean
  isNativeMDEnabled: boolean
  isQQOfficialRobotMarkdownTemplateEnabled: boolean
}

export interface PjskRuntime extends PjskBaseRuntime {
  sendMessage: SendMessage
  sendQQNativeMarkdown: SendQQNativeMarkdown
  createButtons: CreateButtons
  uploadImageToAssets: UploadImageToAssets
  draw: DrawFunction
  drawList: DrawList
  drawList2: DrawList2
  getCharacterName: GetCharacterName
  getCharacterImagePath: GetCharacterImagePath
  getCharacterImageBuffer: GetCharacterImageBuffer
  processUserInput: ProcessUserInput
}

export function createRuntime(ctx: Context, config: Config, logger: Logger): PjskBaseRuntime {
  ctx.model.extend('pjsk', {
    id: 'unsigned',
    userId: 'string',
    username: 'string',
    fontSize: 'unsigned',
    curve: 'boolean',
    characterId: 'unsigned',
    text: 'string',
    x: 'unsigned',
    y: 'unsigned',
    spaceSize: 'unsigned',
    rotate: 'integer',
  }, { primary: 'id', autoInc: true })

  const isTemplateMDEnabled = config.isEnableQQOfficialRobotMarkdownTemplate && config.key !== '' && config.customTemplateId !== ''
  const isNativeMDEnabled = config.enableQQNativeMarkdown
  const isQQOfficialRobotMarkdownTemplateEnabled = isTemplateMDEnabled || isNativeMDEnabled
  const filePath = path.join(__dirname, '../emptyHtml.html').replace(/\\/g, '/')

  const characterNames = [
    'characterListAll',
    'characterListWithIndex',
    'characterListNoIndex',
    'Airi',
    'Akito',
    'An',
    'Emu',
    'Ena',
    'Haruka',
    'Honami',
    'Ichika',
    'KAITO',
    'Kanade',
    'Kohane',
    'Len',
    'Luka',
    'Mafuyu',
    'Meiko',
    'Miku',
    'Minori',
    'Mizuki',
    'Nene',
    'Rin',
    'Rui',
    'Saki',
    'Shiho',
    'Shizuku',
    'Touya',
    'Tsukasa',
  ]

  // wj*
  const pjskListDir: { [key: string]: string } = {}
  const dependencyPjskDir = path.join(__dirname, '../assets')
  for (const name of characterNames) {
    pjskListDir[`pjskListFor${name}Dir`] = path.join(__dirname, '../assets', 'list', `${name}.jpeg`)
  }

  const characters: CharacterEntry[] = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets', 'characters.json'), 'utf8'))
  // pjsk* h* bz*
  // assets 服务不可用时的回退图片地址
  const baseCdn = 'https://pjsk.moe/sticker-maker/img/'

  return {
    ctx,
    config,
    logger,
    characters,
    characterNames,
    pjskListDir,
    dependencyPjskDir,
    filePath,
    baseCdn,
    isTemplateMDEnabled,
    isNativeMDEnabled,
    isQQOfficialRobotMarkdownTemplateEnabled,
  }
}