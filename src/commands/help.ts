import { h, noop } from 'koishi'
import {} from '@koishijs/plugin-help'
import path from 'path'
import * as fs from 'fs'
import { getImgDimensions } from '../utils'
import type { PjskRuntime } from '../runtime'

export function registerHelpCommands(runtime: PjskRuntime) {
  const { ctx, config, characters, baseCdn, pjskListDir, dependencyPjskDir, isQQOfficialRobotMarkdownTemplateEnabled, sendMessage, sendQQNativeMarkdown, uploadImageToAssets, getCharacterName, getCharacterImageBuffer, processUserInput } = runtime

  ctx.command('pjsk', '初音未来表情包生成帮助')
    .example('pjsk')
    .action(async ({session}) => {
      if (session.platform === 'qq' && (config.enableQQNativeMarkdown || config.isEnableQQOfficialRobotMarkdownTemplate)) {
        session['seq'] = session['seq'] || 0;
        const botName = session.bot?.user?.name || session.bot?.user?.nick || '机器人';
        const md = `PJSK表情制作使用方法:\n> 例: @${botName} /pjsk [角色]+[编号]+[内容]\n\n> 🕹️ 请点击下方按钮进入功能引导：`;
        const keyboard = {
          content: {
            rows: [{
              buttons: [
                { id: '1', render_data: { label: '😜 📝 选择角色与编号', style: 1 }, action: { type: 2, permission: { type: 2 }, data: '/pjsk.角色列表', enter: true } }
              ]
            }]
          }
        };
        await sendQQNativeMarkdown(session, ++session['seq'], md, keyboard);
        return;
      }
      await session.execute(`pjsk -h`);
    });

  ctx.command('pjsk.角色列表', 'PJSK 角色选择菜单')
    .example('pjsk.角色列表')
    .action(async ({session}) => {
      if (!(session.platform === 'qq' && (config.enableQQNativeMarkdown || config.isEnableQQOfficialRobotMarkdownTemplate))) {
         return await session.send('该排版目前仅原生 QQ 平台支持。');
      }
      const uniqueCharacters = [];
      const seenChara = new Set();
      for (const c of characters) {
        if (!seenChara.has(c.character)) {
          seenChara.add(c.character);
          uniqueCharacters.push({ character: c.character, img: c.img });
        }
      }
      
      let md = `PJSK角色选择菜单\n点击 [+] 并发送进行下一步~\n\n`;
      let count = 0;
      // 优先使用 assets 服务上传本地图片，失败时回退到 CDN
      const imageUrls = new Map(await Promise.all(uniqueCharacters.map(async (u) => {
        const localImgPath = path.join(dependencyPjskDir, 'img', u.img);
        const url = await uploadImageToAssets(fs.readFileSync(localImgPath), localImgPath) || `${baseCdn}${u.img}`;
        return [u.img, url] as [string, string];
      })));
      for (const u of uniqueCharacters) {
        const url = imageUrls.get(u.img);
        const cmd = `/pjsk.子图列表 ${u.character}`;
        const mqqapi = `mqqapi://aio/inlinecmd?command=${encodeURIComponent(cmd)}&reply=false&enter=true`;
        const localImgPath = path.join(dependencyPjskDir, 'img', u.img);
        const { w, h } = getImgDimensions(localImgPath, 35);
        md += `![${u.character} #${w}px #${h}px](${url}) [[+]](${mqqapi})`;
        count++;
        if (count % 4 === 0) md += '\n\n'; else md += ' ';
      }
      session['seq'] = session['seq'] || 0;
      await sendQQNativeMarkdown(session, ++session['seq'], md);
    });

  ctx.command('pjsk.子图列表 <character:string>', 'PJSK 子图选择菜单')
    .example('pjsk.子图列表 Airi')
    .action(async ({session}, character) => {
      if (!(session.platform === 'qq' && (config.enableQQNativeMarkdown || config.isEnableQQOfficialRobotMarkdownTemplate))) return;
      if (!character) return;
      
      const lowercaseCharacter = character.toLowerCase();
      const filteredCharacters = characters.filter(c => c.character.toLowerCase() === lowercaseCharacter);
      
      if (filteredCharacters.length === 0) {
        session['seq'] = session['seq'] || 0;
        await sendQQNativeMarkdown(session, ++session['seq'], `找不到角色图像！`);
        return;
      }
      
      let md = `${character}子图选择菜单\n点击 [+] 并输入内容即可生成~\n\n`;
      let count = 0;
      // 优先使用 assets 服务上传本地图片，失败时回退到 CDN
      const imageUrls = new Map(await Promise.all(filteredCharacters.map(async (c) => {
        const localImgPath = path.join(dependencyPjskDir, 'img', c.img);
        const url = await uploadImageToAssets(fs.readFileSync(localImgPath), localImgPath) || `${baseCdn}${c.img}`;
        return [c.img, url] as [string, string];
      })));
      for (const c of filteredCharacters) {
        const url = imageUrls.get(c.img);
        const cmd = `/pjsk.绘制 -n ${characters.indexOf(c)} `;
        const mqqapi = `mqqapi://aio/inlinecmd?command=${encodeURIComponent(cmd)}&reply=false&enter=false`;
        const localImgPath = path.join(dependencyPjskDir, 'img', c.img);
        const { w, h } = getImgDimensions(localImgPath, 36);
        md += `![${c.name} #${w}px #${h}px](${url}) [[+]](${mqqapi})`;
        count++;
        if (count % 4 === 0) md += '\n\n'; else md += ' ';
      }
      session['seq'] = session['seq'] || 0;
      await sendQQNativeMarkdown(session, ++session['seq'], md);
    });
  // lb* js* fl*
  ctx.command('pjsk.列表.角色分类', '角色分类表情列表')
    .action(async ({session}) => {
      const buffer = fs.readFileSync(pjskListDir['pjskListForcharacterListWithIndexDir']);
      await sendMessage(session, h.image(buffer, 'image/jpeg'), ``, 1570, 1637)
      if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq' || config.shouldSendDrawingGuideText) {
        await sendMessage(session, `查看指定角色的表情，请输入：
> 角色序号，例如：10
> 角色名，例如：Emu`, `输入角色序号或名称`)
      }
      const userInput = await session.prompt()
      if (!userInput) return isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq' || config.shouldSendDrawingGuideText ? await sendMessage(session, `输入无效或超时！`, ``) : noop()
      const character = getCharacterName(userInput);
      if (character === `无效的角色序号或角色名！` || character === `找不到角色图像！`) {
        return isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq' || config.shouldSendDrawingGuideText ? await sendMessage(session, `无效的角色序号或角色名！`, `表情包列表 角色分类`) : noop()
      } else {
        await session.execute(`pjsk.列表.展开指定角色 ${character}`)
      }
    })
  // lb* js* fl*
  ctx.command('pjsk.列表.展开指定角色 <character:string>', '展开指定角色表情列表')
    .action(async ({session}, character) => {
      if (!character) {
        return await sendMessage(session, `请输入有效的角色序号或角色名！`, `表情包列表 角色分类`)
      }
      const imageBuffer = getCharacterImageBuffer(character);
      if (imageBuffer === `无效的角色序号或角色名！` || imageBuffer === `找不到角色图像！`) {
        return await sendMessage(session, imageBuffer, `表情包列表 指定角色`)
      }
      await sendMessage(session, h.image(imageBuffer, 'image/jpeg'), ``, 1570, 1096)
      await processUserInput(session)
    })

}
