// jk*
export interface CharacterEntry {
  id?: string
  name?: string
  character: string
  img: string
  color?: string
  defaultText?: {
    text?: any
    x: number
    y: number
    r?: number
    s?: number
    [key: string]: any
  }
  [key: string]: any
}

export interface Range {
  min: number;
  max: number;
  message: string;
}

export interface Button {
  render_data: {
    label: string;
    visited_label: string;
    style: number;
  };
  action: {
    type: number;
    permission: { type: number };
    data: string;
    enter: boolean;
  };
}

export type SendMessage = (session: any, message: any, markdownCommands: string, width?: number, height?: number) => Promise<void>
export type SendQQNativeMarkdown = (session: any, msgSeq: number, markdownContent: string, keyboardPayload?: any) => Promise<void>
export type CreateButtons = (markdownCommands: string) => Button[]
export type UploadImageToAssets = (buffer: Buffer | Uint8Array, filename: string) => Promise<string>
export type DrawFunction = (text: any, imgPath: string, specifiedX: any, specifiedY: any, specifiedRotate: any, specifiedFontSize: any, color: any, curve: boolean, spaceSize: number, angle: number) => Promise<Buffer>
export type DrawList = (picsDir: string) => Promise<Buffer>
export type DrawList2 = () => Promise<Buffer>
export type GetCharacterName = (character: string) => string
export type GetCharacterImagePath = (characterName: string) => string
export type GetCharacterImageBuffer = (character: string) => Buffer | '无效的角色序号或角色名！' | '找不到角色图像！'
export type ProcessUserInput = (session: any) => Promise<unknown>
