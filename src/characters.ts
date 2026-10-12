import {} from '@koishijs/plugin-help'
import * as fs from 'fs'
import type { GetCharacterImageBuffer, GetCharacterImagePath, GetCharacterName, ProcessUserInput } from './types'
import type { PjskRuntime } from './runtime'

export interface CharacterHelpers {
  processUserInput: ProcessUserInput
  getCharacterName: GetCharacterName
  getCharacterImagePath: GetCharacterImagePath
  getCharacterImageBuffer: GetCharacterImageBuffer
}

export function createCharacterHelpers(runtime: PjskRuntime): CharacterHelpers {
  const { config, characters, characterNames, pjskListDir, isQQOfficialRobotMarkdownTemplateEnabled, sendMessage } = runtime

  async function processUserInput(session: any) {
    if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq' || config.shouldSendDrawingGuideText) {
      await sendMessage(session, `请选择您中意的表情 ID，
并按以下格式进行绘制：
> 表情包序号 文本内容
例如：6 你好呀`, `输入`)
    }
    const userInput = await session.prompt();
    if (!userInput) return;

    const [number, ...words] = userInput.split(' ');
    const text = words.join(' ');

    const isValidCharacter = /^\d+$/.test(number) && parseInt(number, 10) >= 0 && parseInt(number, 10) < characters.length;

    if (!isValidCharacter) {
      return;
    } else {
      await session.execute(`pjsk.绘制 -n ${parseInt(number, 10)} ${text}`);
    }
  }

  function getCharacterName(character: string): string {
    const lowercaseCharacter = character.toLowerCase();

    if (/^\d+$/.test(lowercaseCharacter)) {
      const index = parseInt(lowercaseCharacter, 10);
      if (index >= 0 && index < characterNames.length - 3) {
        return characterNames[index + 3];
      }
    } else {
      const matchedCharacter = characterNames.find(
        (name) => name.toLowerCase() === lowercaseCharacter
      );
      if (matchedCharacter) {
        return matchedCharacter;
      }
    }

    return `无效的角色序号或角色名！`;
  }

  function getCharacterImagePath(characterName: string): string {
    const imagePath = pjskListDir[`pjskListFor${characterName}Dir`];
    if (!imagePath) {
      return `找不到角色图像！`;
    }
    return imagePath;
  }

  function getCharacterImageBuffer(character: string) {
    const characterName = getCharacterName(character);
    if (characterName === `无效的角色序号或角色名！`) {
      return `无效的角色序号或角色名！`;
    }
    const imagePath = getCharacterImagePath(characterName);
    if (imagePath === `找不到角色图像！`) {
      return `找不到角色图像！`;
    }
    return fs.readFileSync(imagePath);
  }

  return { processUserInput, getCharacterName, getCharacterImagePath, getCharacterImageBuffer }
}
