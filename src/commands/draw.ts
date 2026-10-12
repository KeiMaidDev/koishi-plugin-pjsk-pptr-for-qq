import { h } from 'koishi'
import {} from '@koishijs/plugin-help'
import { calculateFontSize, calculateOffsets, findLongestLine } from '../utils'
import type { Range } from '../types'
import type { PjskRuntime } from '../runtime'

export function registerDrawCommands(runtime: PjskRuntime) {
  const { ctx, config, characters, dependencyPjskDir, sendMessage, sendQQNativeMarkdown, uploadImageToAssets, draw } = runtime

async function checkOptions(session, options: any, key: string, range: Range): Promise<boolean> {
  if (options[key] !== undefined && (options[key] < range.min || options[key] > range.max)) {
    await sendMessage(session, range.message, `随机绘制 自选绘制`);
    return true;
  }
  return false;
}

  // hz*
  ctx.command('pjsk.绘制 [inputText:text]', '绘制表情包')
    .usage('pjsk.绘制 <text>\npjsk.绘制 -n <id> <text>\npjsk.绘制 -n <id> -x <x> -y <y> <text>')
    .example('pjsk.绘制 今天的烤肉真香啊')
    .example('pjsk.绘制 -n 12 为什么要熬夜呢')
    .example('pjsk.绘制 -n 18 -y 10 -c 真的绝望了')
    .option('number', '-n [number:number] 表情包ID', {fallback: undefined})
    .option('positionY', '-y [positionY:number] 文本的垂直位置', {fallback: undefined})
    .option('positionX', '-x [positionX:number] 文本的水平位置', {fallback: undefined})
    .option('rotate', '-r [rotate:number] 文本的旋转角度', {fallback: undefined})
    .option('fontSize', '-s [fontSize:number] 文本字体的大小', {fallback: undefined})
    .option('spaceSize', '-l [spaceSize:number] 文本上下行间距', {fallback: 18})
    .option('curve', '-c 是否启用文本曲线', {fallback: false})
    .option('disableAdaptiveFunctionality', '--daf 关闭自适应功能', {hidden: true, fallback: false})
    .option('showDashboard', '-d 显示调整面板', {hidden: true, fallback: false})
    .action(async ({session, options}, inputText) => {

      // 表情包 ID 必须在 characters 的元素个数之内，即小于 characters.length，默认为随机
      // 文本的垂直位置 y 范围 0~256，默认为 character 中指定的值
      // 文本的水平位置 x 范围 0~296，默认为 character 中指定的值
      // 文本的旋转角度 rotate 范围 -10 ~ 10 默认为 character 中指定的值
      // 文本的字体大小 fontSize 范围 10 ~ 100 默认为 character 中指定的值
      // 是否启用文本曲线功能 curve 默认为 false
      // 文本上下行间距 spaceSize 范围 18 ~ 100，默认值为 18

      let character: { defaultText?: any; id?: string; name?: string; character?: string; img?: any; color?: any; };
      let characterId: number;
      if (options.number !== undefined) {
        const isValidCharacter = options.number >= 0 && options.number < characters.length;
        if (!isValidCharacter) {
          return await sendMessage(session, `抱歉，您输入的表情 ID 无效，请输入范围在 0 到 358 之间的有效表情 ID。`, `随机绘制 自选绘制`)
        }
        character = characters[options.number]
        characterId = options.number
      } else {
        const randomIndex = Math.floor(Math.random() * characters.length);
        character = characters[randomIndex];
        characterId = randomIndex
      }

      let {text, x, y, r: rotate, s: fontSize} = character.defaultText;
      if (inputText) {
        text = inputText.replace(/\/+/g, '\\n').replace(/\n/g, '\\n');
      }
      const {color, img} = character;
      const imgPath = 'file://' + dependencyPjskDir.replaceAll('\\', '/') + `/img/${img}`;

      const curve = options.curve || false;
      let spaceSize = options.spaceSize || 18;
      let specifiedX = options.positionX !== undefined ? options.positionX : x;
      let specifiedY = options.positionY !== undefined ? options.positionY : y + 12;
      const specifiedRotate = options.rotate !== undefined ? options.rotate : rotate;
      let specifiedFontSize = options.fontSize !== undefined ? options.fontSize : fontSize;


      if (config.isTextSizeAdaptationEnabled && !options.disableAdaptiveFunctionality) {
        const longestLine = findLongestLine(text);
        const offsets = calculateOffsets(longestLine, options);
        specifiedX += offsets.x;
        specifiedY += offsets.y;
        specifiedFontSize = calculateFontSize(specifiedFontSize, longestLine);
        spaceSize += specifiedFontSize / 2 + 10;
      }

      const ranges: { [key: string]: Range } = {
        positionY: {min: 0, max: 256, message: '抱歉，文本的垂直位置必须在 0 到 256 之间。'},
        positionX: {min: 0, max: 296, message: '抱歉，文本的水平位置必须在 0 到 296 之间。'},
        rotate: {min: -10, max: 10, message: '抱歉，文本的旋转角度必须在 -10 到 10 之间。'},
        fontSize: {min: 10, max: 100, message: '抱歉，文本的字体大小必须在 10 到 100 之间。'},
        spaceSize: {min: 18, max: 100, message: '抱歉，文本的上下行间距必须在 18 到 100 之间。'}
      };

      if (!options.curve) {
        for (const key in ranges) {
          if (await checkOptions(session, options, key, ranges[key])) {
            return;
          }
        }
      }

      const angle = (Math.PI * text.length) / 7; // 曲线弯曲的角度
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        await ctx.database.create('pjsk', {
          userId: session.userId,
          username: session.username,
          text,
          fontSize: specifiedFontSize,
          curve,
          characterId,
          x: specifiedX,
          y: specifiedY,
          spaceSize,
          rotate: specifiedRotate
        })
      } else {
        await ctx.database.set('pjsk', {userId: session.userId}, {
          userId: session.userId, username: session.username,
          text,
          fontSize: specifiedFontSize,
          curve,
          characterId,
          x: specifiedX,
          y: specifiedY,
          spaceSize,
          rotate: specifiedRotate
        })
      }
      const buffer = await draw(text, imgPath, specifiedX, specifiedY, specifiedRotate, specifiedFontSize, color, curve, spaceSize, angle)
      
      let assetUrl = '';
      if (session.platform === 'qq' && (config.enableQQNativeMarkdown || config.isEnableQQOfficialRobotMarkdownTemplate)) {
        assetUrl = await uploadImageToAssets(Buffer.from(buffer), 'pjsk.png');
      }

      if (!assetUrl) {
        await session.send(h.image(buffer, 'image/png'));
      }

      if (session.platform === 'qq' && (config.enableQQNativeMarkdown || config.isEnableQQOfficialRobotMarkdownTemplate)) {
          session['seq'] = session['seq'] || 0;
          const msgSeq = ++session['seq'];
          
          if (options.showDashboard) {
            await session.execute('pjsk.调整' + (assetUrl ? ` -u "${assetUrl}"` : ''));
            return;
          }

          let trailingMd = assetUrl ? `![image #296px #256px](${assetUrl})\n> 💡 绘制完成！接下来...` : `> 💡 绘制完成！接下来...`;
          const keyboard = {
            content: {
              rows: [{
                buttons: [
                  { id: '1', render_data: { label: '更改内容', style: 1 }, action: { type: 2, permission: { type: 2 }, data: '/pjsk.调整', enter: true } },
                  { id: '2', render_data: { label: '随机绘制', style: 0 }, action: { type: 2, permission: { type: 2 }, data: '/pjsk.绘制', enter: true } },
                  { id: '3', render_data: { label: '返回菜单', style: 0 }, action: { type: 2, permission: { type: 2 }, data: '/pjsk', enter: true } }
                ]
              }]
            }
          };
          await sendQQNativeMarkdown(session, msgSeq, trailingMd, keyboard);
          return;
      } else {
         if (config.shouldSendSuccessMessageAfterDrawingEmoji) {
            return await session.send(`🎉 表情包绘制完成！\n\n🔍 输入"pjsk.调整"获取调整指令\n或直接输入"pjsk.角色列表"开始新的绘制\n\n✨ 期待您的下一个创作！`);
         }
      }
    })

}
