import {} from '@koishijs/plugin-help'
import type { PjskRuntime } from '../runtime'

export function registerAdjustCommands(runtime: PjskRuntime) {
  const { ctx, config, characters, isQQOfficialRobotMarkdownTemplateEnabled, sendMessage, sendQQNativeMarkdown } = runtime

  // tz*
  ctx.command('pjsk.调整', '调整指令引导')
    .option('url', '-u [url:string] 附带服务器临时链接', {hidden: true})
    .action(async ({session, options}, character) => {
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }

      if (session.platform === 'qq' && (config.enableQQNativeMarkdown || config.isEnableQQOfficialRobotMarkdownTemplate)) {
        const lastRecord = userRecord[0];
        const characterName = characters[lastRecord.characterId]?.character || `未知(${lastRecord.characterId})`;
        const textStr = lastRecord.text.replace(/\\n/g, ' ').substring(0, 10) + (lastRecord.text.length > 10 ? '...' : '');

        let md = `❖ **PJSK 表情控制台**\n`;
        if (options.url) {
          md += `![image #296px #256px](${options.url})\n`;
        }
        md += `> 角色：${characterName}\n`;
        md += `> 文本：${textStr}\n`;

        const keyboard = {
          content: {
            rows: [
              {
                 buttons: [
                   { id: '11', render_data: { label: '修改文字', style: 0 }, action: { type: 2, permission: { type: 2 }, data: '/pjsk.调整.文本 ', enter: false } },
                   { id: '12', render_data: { label: '切换角色', style: 0 }, action: { type: 2, permission: { type: 2 }, data: '/pjsk.调整.角色 ', enter: false } }
                 ]
              },
              {
                 buttons: [
                   { id: '21', render_data: { label: '上移', style: 1 }, action: { type: 2, permission: { type: 2 }, data: '/pjsk.调整.位置.上', enter: true } },
                   { id: '22', render_data: { label: '下移', style: 1 }, action: { type: 2, permission: { type: 2 }, data: '/pjsk.调整.位置.下', enter: true } },
                   { id: '23', render_data: { label: '左移', style: 1 }, action: { type: 2, permission: { type: 2 }, data: '/pjsk.调整.位置.左', enter: true } },
                   { id: '24', render_data: { label: '右移', style: 1 }, action: { type: 2, permission: { type: 2 }, data: '/pjsk.调整.位置.右', enter: true } }
                 ]
              },
              {
                 buttons: [
                   { id: '31', render_data: { label: '大字', style: 0 }, action: { type: 2, permission: { type: 2 }, data: '/pjsk.调整.字体.大', enter: true } },
                   { id: '32', render_data: { label: '小字', style: 0 }, action: { type: 2, permission: { type: 2 }, data: '/pjsk.调整.字体.小', enter: true } },
                   { id: '33', render_data: { label: '加行距', style: 0 }, action: { type: 2, permission: { type: 2 }, data: '/pjsk.调整.行间距.大', enter: true } },
                   { id: '34', render_data: { label: '减行距', style: 0 }, action: { type: 2, permission: { type: 2 }, data: '/pjsk.调整.行间距.小', enter: true } }
                 ]
              },
              {
                 buttons: [
                   { id: '41', render_data: { label: '开启弯曲', style: 0 }, action: { type: 2, permission: { type: 2 }, data: '/pjsk.调整.文本曲线.开启', enter: true } },
                   { id: '42', render_data: { label: '关闭弯曲', style: 0 }, action: { type: 2, permission: { type: 2 }, data: '/pjsk.调整.文本曲线.关闭', enter: true } }
                 ]
              }
            ]
          }
        };

        session['seq'] = session['seq'] || 0;
        return await sendQQNativeMarkdown(session, ++session['seq'], md, keyboard);
      }

      return await sendMessage(session, `请使用以下指令调整表情包：
> pjsk.调整.文本 [文本内容] - 修改文本
> pjsk.调整.字体.大 - 字体变大
> pjsk.调整.字体.小 - 字体变小
> pjsk.调整.行间距.大 - 行间距变大
> pjsk.调整.行间距.小 - 行间距变小
> pjsk.调整.文本曲线.开启 - 开启文本曲线
> pjsk.调整.文本曲线.关闭 - 关闭文本曲线
> pjsk.调整.位置.上 - 文本上移
> pjsk.调整.位置.下 - 文本下移
> pjsk.调整.位置.左 - 文本左移
> pjsk.调整.位置.右 - 文本右移
> pjsk.调整.角色 [角色ID] - 修改表情包角色
`, ``)
    })
  // tz* wb*
  ctx.command('pjsk.调整.文本 <textContent:text>', '修改文本内容')
    .action(async ({session}, textContent) => {
      if (!textContent) {
        return await sendMessage(session, `请输入有效的文本内容！`, `随机绘制 自选绘制`)
      }
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }
      await ctx.database.set('pjsk', {userId: session.userId}, {text: textContent})
      const {
        fontSize, curve, characterId, x, y, spaceSize, rotate
      } = userRecord[0]
      await session.execute(`pjsk.绘制 -d -n ${characterId}${curve ? ` -c` : ''} ${textContent}`)
    })

  // tz* zt*
  ctx.command('pjsk.调整.字体', '调整字体大小指令引导')
    .action(async ({session}, change) => {
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }
      if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
        return await sendMessage(session, `您可以对字体进行的操作有：
1. 字体变大
2. 字体变小`, `字体变大 字体变小`)
      }
      return await sendMessage(session, `请使用以下指令调整字体大小：
> pjsk.调整.字体.大 - 字体变大
> pjsk.调整.字体.小 - 字体变小`, ``)
    })

  // tz* zt*
  ctx.command('pjsk.调整.字体.大', '')
    .action(async ({session}, change) => {
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }
      const {fontSize} = userRecord[0]
      await ctx.database.set('pjsk', {userId: session.userId}, {fontSize: fontSize + 5})
      const {
        text, curve, characterId, x, y, spaceSize, rotate
      } = userRecord[0]
      await session.execute(`pjsk.绘制 -d --daf -n ${characterId} -s ${fontSize + 5} -x ${x} -y ${y} -l ${spaceSize}${curve ? ` -c` : ''} ${text}`)
    })

  // tz* zt*
  ctx.command('pjsk.调整.字体.小', '')
    .action(async ({session}, change) => {
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }
      const {fontSize} = userRecord[0]
      await ctx.database.set('pjsk', {userId: session.userId}, {fontSize: fontSize - 5})
      const {
        text, curve, characterId, x, y, spaceSize, rotate
      } = userRecord[0]
      await session.execute(`pjsk.绘制 -d --daf -n ${characterId} -s ${fontSize - 5} -x ${x} -y ${y} -l ${spaceSize}${curve ? ` -c` : ''} ${text}`)
    })

  // tz* hjj*
  ctx.command('pjsk.调整.行间距', '调整行间距指令引导')
    .action(async ({session}, change) => {
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }
      if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
        return await sendMessage(session, `您可以对行间距进行的操作有：
1. 行间距变大
2. 行间距变小`, `行间距变大 行间距变小`)
      }
      return await sendMessage(session, `请使用以下指令调整行间距：
> pjsk.调整.行间距.大 - 行间距变大
> pjsk.调整.行间距.小 - 行间距变小`, ``)
    })

  // tz* hjj*
  ctx.command('pjsk.调整.行间距.大', '')
    .action(async ({session}, change) => {
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }
      const {spaceSize} = userRecord[0]
      await ctx.database.set('pjsk', {userId: session.userId}, {spaceSize: spaceSize + 5})
      const {
        text, curve, characterId, x, y, fontSize, rotate
      } = userRecord[0]
      await session.execute(`pjsk.绘制 -d --daf -n ${characterId} -s ${fontSize} -x ${x} -y ${y} -l ${spaceSize + 5}${curve ? ` -c` : ''} ${text}`)
    })

  // tz* hjj*
  ctx.command('pjsk.调整.行间距.小', '')
    .action(async ({session}, change) => {
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }
      const {spaceSize} = userRecord[0]
      await ctx.database.set('pjsk', {userId: session.userId}, {spaceSize: spaceSize - 5})
      const {
        text, curve, characterId, x, y, fontSize, rotate
      } = userRecord[0]
      await session.execute(`pjsk.绘制 -d --daf -n ${characterId} -s ${fontSize} -x ${x} -y ${y} -l ${spaceSize - 5}${curve ? ` -c` : ''} ${text}`)
    })

  // tz* wbqx* qx*
  ctx.command('pjsk.调整.文本曲线', '调整文本曲线指令引导')
    .action(async ({session}, change) => {
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }
      if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
        return await sendMessage(session, `您可以对文本曲线进行的操作有：
1. 开启文本曲线
2. 关闭文本曲线`, `开启文本曲线 关闭文本曲线`)
      }
      return await sendMessage(session, `请使用以下指令调整文本曲线：
> pjsk.调整.文本曲线.开启 - 开启文本曲线
> pjsk.调整.文本曲线.关闭 - 关闭文本曲线`, ``)
    })

  // tz* wbqx* qx*
  ctx.command('pjsk.调整.文本曲线.开启', '开启文本曲线')
    .action(async ({session}, change) => {
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }
      await ctx.database.set('pjsk', {userId: session.userId}, {curve: true})
      const {
        text, fontSize, characterId, x, y, spaceSize, rotate
      } = userRecord[0]
      await session.execute(`pjsk.绘制 -d -n ${characterId} -c ${text}`)
    })

  // tz* wbqx* qx*
  ctx.command('pjsk.调整.文本曲线.关闭', '关闭文本曲线')
    .action(async ({session}, change) => {
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }
      await ctx.database.set('pjsk', {userId: session.userId}, {curve: false})
      const {
        text, fontSize, characterId, x, y, spaceSize, rotate
      } = userRecord[0]
      await session.execute(`pjsk.绘制 -d -n ${characterId} ${text}`)
    })

  // tz* wz*
  ctx.command('pjsk.调整.位置', '调整文本位置指令引导')
    .action(async ({session}, change) => {
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }
      if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
        return await sendMessage(session, `您可以对文本进行的操作有：
1. 文本上移
2. 文本下移
3. 文本左移
4. 文本右移`, `文本上移 文本下移 文本左移 文本右移`)
      }
      return await sendMessage(session, `请使用以下指令调整文本位置：
> pjsk.调整.位置.上 - 文本上移
> pjsk.调整.位置.下 - 文本下移
> pjsk.调整.位置.左 - 文本左移
> pjsk.调整.位置.右 - 文本右移`, ``)
    })

  // tz* wz*
  ctx.command('pjsk.调整.位置.上', '文本上移')
    .action(async ({session}, change) => {
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }
      const {y} = userRecord[0]
      await ctx.database.set('pjsk', {userId: session.userId}, {y: y - 20})
      const {
        text, fontSize, curve, characterId, x, spaceSize, rotate
      } = userRecord[0]
      await session.execute(`pjsk.绘制 -d --daf -n ${characterId} -s ${fontSize} -x ${x} -y ${y - 20} -l ${spaceSize}${curve ? ` -c` : ''} ${text}`)
    })

  // tz* wz*
  ctx.command('pjsk.调整.位置.下', '文本下移')
    .action(async ({session}, change) => {
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }
      const {y} = userRecord[0]
      await ctx.database.set('pjsk', {userId: session.userId}, {y: y + 20})
      const {
        text, fontSize, curve, characterId, x, spaceSize, rotate
      } = userRecord[0]
      await session.execute(`pjsk.绘制 -d --daf -n ${characterId} -s ${fontSize} -x ${x} -y ${y + 20} -l ${spaceSize}${curve ? ` -c` : ''} ${text}`)
    })

  // tz* wz*
  ctx.command('pjsk.调整.位置.左', '文本左移')
    .action(async ({session}, change) => {
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }
      const {x} = userRecord[0]
      await ctx.database.set('pjsk', {userId: session.userId}, {x: x - 20})
      const {
        text, fontSize, curve, characterId, y, spaceSize, rotate
      } = userRecord[0]
      await session.execute(`pjsk.绘制 -d --daf -n ${characterId} -s ${fontSize} -x ${x - 20} -y ${y} -l ${spaceSize}${curve ? ` -c` : ''} ${text}`)
    })

  // tz* wz*
  ctx.command('pjsk.调整.位置.右', '文本右移')
    .action(async ({session}, change) => {
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }
      const {x} = userRecord[0]
      await ctx.database.set('pjsk', {userId: session.userId}, {x: x + 20})
      const {
        text, fontSize, curve, characterId, y, spaceSize, rotate
      } = userRecord[0]
      await session.execute(`pjsk.绘制 -d --daf -n ${characterId} -s ${fontSize} -x ${x + 20} -y ${y} -l ${spaceSize}${curve ? ` -c` : ''} ${text}`)
    })

  // tz* jx*
  ctx.command('pjsk.调整.角色 <characterId:number>', '修改表情包角色')
    .option('random', '-r 随机选择角色', {fallback: false})
    .action(async ({session, options}, characterId) => {
      if (options.random) {
        characterId = Math.floor(Math.random() * characters.length)
      }
      if (!characterId) {
        return await sendMessage(session, `请输入有效的表情 ID！`, `随机绘制 自选绘制`)
      }
      if (characterId < 0 || characterId >= characters.length) {
        return await sendMessage(session, `抱歉，您输入的表情 ID 无效，请输入范围在 0 到 ${characters.length - 1} 之间的有效表情 ID。`, `修改角色 随机角色`)
      }
      const userRecord = await ctx.database.get('pjsk', {userId: session.userId})
      if (userRecord.length === 0) {
        return await sendMessage(session, `抱歉，您尚未绘制过表情包。`, `随机绘制 自选绘制`)
      }
      await ctx.database.set('pjsk', {userId: session.userId}, {characterId})
      const {
        text, fontSize, curve, x, y, spaceSize, rotate
      } = userRecord[0]
      await session.execute(`pjsk.绘制 -d --daf -n ${characterId} -s ${fontSize} -x ${x} -y ${y} -l ${spaceSize}${curve ? ` -c` : ''} ${text}`)
    })

}
