import { h } from 'koishi'
import type { Button, CreateButtons, SendMessage, SendQQNativeMarkdown } from './types'
import type { PjskBaseRuntime } from './runtime'

export interface MessageService {
  sendMessage: SendMessage
  sendQQNativeMarkdown: SendQQNativeMarkdown
  createButtons: CreateButtons
}

export function createMessageService(runtime: PjskBaseRuntime): MessageService {
  const { config, logger, isTemplateMDEnabled, isNativeMDEnabled, isQQOfficialRobotMarkdownTemplateEnabled } = runtime
  let sentMessages: any[] = []

  // hs*
  function parseMarkdownCommands(markdownCommands: string): string[] {
    return markdownCommands.split(' ').filter(command => command.trim() !== '');
  }

  function createButtons(markdownCommands: string): Button[] {
    const commands = parseMarkdownCommands(markdownCommands);

    return commands.map(command => {
      let dataValue = command;
      switch (command) {
        case '全部':
          dataValue = 'pjsk.列表.全部';
          break;
        case '角色分类':
          dataValue = 'pjsk.列表.角色分类';
          break;
        case '指定角色':
          dataValue = 'pjsk.列表.展开指定角色';
          break;
        case '输入':
          dataValue = '';
          break;
        case '表情包列表':
          dataValue = 'pjsk.列表';
          break;
        case '随机绘制':
          dataValue = 'pjsk.绘制';
          break;
        case '自选绘制':
          dataValue = 'pjsk.列表.角色分类';
          break;
        case '修改文本':
          dataValue = 'pjsk.调整.文本';
          break;
        case '调整字体':
          dataValue = 'pjsk.调整.字体';
          break;
        case '调整行间距':
          dataValue = 'pjsk.调整.行间距';
          break;
        case '文本曲线':
          dataValue = 'pjsk.调整.文本曲线';
          break;
        case '调整位置':
          dataValue = 'pjsk.调整.位置';
          break;
        case '修改角色':
          dataValue = 'pjsk.调整.角色';
          break;
        case '字体变大':
          dataValue = 'pjsk.调整.字体.大';
          break;
        case '字体变小':
          dataValue = 'pjsk.调整.字体.小';
          break;
        case '行间距变大':
          dataValue = 'pjsk.调整.行间距.大';
          break;
        case '行间距变小':
          dataValue = 'pjsk.调整.行间距.小';
          break;
        case '开启曲线':
          dataValue = 'pjsk.调整.文本曲线.开启';
          break;
        case '关闭曲线':
          dataValue = 'pjsk.调整.文本曲线.关闭';
          break;
        case '文本上移':
          dataValue = 'pjsk.调整.位置.上';
          break;
        case '文本下移':
          dataValue = 'pjsk.调整.位置.下';
          break;
        case '文本左移':
          dataValue = 'pjsk.调整.位置.左';
          break;
        case '文本右移':
          dataValue = 'pjsk.调整.位置.右';
          break;
        case '随机角色':
          dataValue = 'pjsk.调整.角色 -r';
          break;
        case '输入角色序号或名称':
          dataValue = '';
          break;
        default:
          dataValue = ``;
          break;
      }

      let array = ['指定角色', '输入', '修改角色', '修改文本', '输入角色序号或名称']
      if (config.shouldWaitForUserInputBeforeSendingCommands) {
        array.push('随机绘制')
      }

      return {
        render_data: {
          label: command,
          visited_label: command,
          style: 1,
        },
        action: {
          type: 2,
          permission: {type: 2},
          data: `${dataValue}`,
          enter: !array.includes(command),
        },
      };
    });
  }

  function createMqqapiLinks(markdownCommands: string): string {
    const commands = parseMarkdownCommands(markdownCommands);
    if (commands.length === 0) return '';
    const links = commands.map(command => {
      let dataValue = command;
      switch (command) {
        case '全部': dataValue = 'pjsk.列表.全部'; break;
        case '角色分类': dataValue = 'pjsk.列表.角色分类'; break;
        case '指定角色': dataValue = 'pjsk.列表.展开指定角色'; break;
        case '输入': dataValue = ''; break;
        case '表情包列表': dataValue = 'pjsk.列表'; break;
        case '随机绘制': dataValue = 'pjsk.绘制'; break;
        case '自选绘制': dataValue = 'pjsk.列表.角色分类'; break;
        case '修改文本': dataValue = 'pjsk.调整.文本'; break;
        case '调整字体': dataValue = 'pjsk.调整.字体'; break;
        case '调整行间距': dataValue = 'pjsk.调整.行间距'; break;
        case '文本曲线': dataValue = 'pjsk.调整.文本曲线'; break;
        case '调整位置': dataValue = 'pjsk.调整.位置'; break;
        case '修改角色': dataValue = 'pjsk.调整.角色'; break;
        case '字体变大': dataValue = 'pjsk.调整.字体.大'; break;
        case '字体变小': dataValue = 'pjsk.调整.字体.小'; break;
        case '行间距变大': dataValue = 'pjsk.调整.行间距.大'; break;
        case '行间距变小': dataValue = 'pjsk.调整.行间距.小'; break;
        case '开启曲线': dataValue = 'pjsk.调整.文本曲线.开启'; break;
        case '关闭曲线': dataValue = 'pjsk.调整.文本曲线.关闭'; break;
        case '文本上移': dataValue = 'pjsk.调整.位置.上'; break;
        case '文本下移': dataValue = 'pjsk.调整.位置.下'; break;
        case '文本左移': dataValue = 'pjsk.调整.位置.左'; break;
        case '文本右移': dataValue = 'pjsk.调整.位置.右'; break;
        case '随机角色': dataValue = 'pjsk.调整.角色 -r'; break;
        case '输入角色序号或名称': dataValue = ''; break;
        default: dataValue = ''; break;
      }
      if (!dataValue) return `[${command}]`;
      let array = ['指定角色', '输入', '修改角色', '修改文本', '输入角色序号或名称'];
      if (config.shouldWaitForUserInputBeforeSendingCommands) {
        array.push('随机绘制');
      }
      const enter = !array.includes(command);
      return `[${command}](mqqapi://aio/inlinecmd?command=${encodeURIComponent(dataValue)}&enter=${enter}&reply=false)`;
    });
    if (links.length === 0) return '';
    return `\n\n> 💡 快捷操作：\n` + links.map(link => `> ${link}`).join('\n');
  }

    async function sendQQNativeMarkdown(session: any, msgSeq: number, markdownContent: string, keyboardPayload?: any) {
    const payload: any = {
      msg_type: 2 as const,
      msg_id: session.messageId,
      msg_seq: msgSeq,
      content: 'PJSK 呈现',
      markdown: { content: markdownContent }
    };
    if (keyboardPayload) {
      payload.keyboard = keyboardPayload;
    }
    try {
      if (session.isDirect) {
        await session.qq.sendPrivateMessage(session.channelId, payload);
      } else {
        await session.qq.sendMessage(session.channelId, payload);
      }
    } catch (e: any) {
      if (config.enableDetailedDebugLog) {
         logger.error('MD发送失败:', e, e.response?.data);
      } else {
         logger.error('MD发送失败:', e.message || e);
      }
    }
  }

async function sendMessage(session: any, message: any, markdownCommands: string, width?: number, height?: number): Promise<void> {
    markdownCommands = markdownCommands || '';
    width = width || 296;
    height = height || 256;
    const {bot, channelId} = session;
    let messageId;
    try {
      if (isQQOfficialRobotMarkdownTemplateEnabled && session.platform === 'qq') {
        session['seq'] = session['seq'] || 0;
        const msgSeq = ++session['seq'];

        if (message.attrs?.src) {
          [messageId] = await session.send(message);
        } else {
          if (config.shouldPrefixAtForMarkdownMessage) {
            message = `<@${session.userId}>\n${message}`;
          }

          if (isTemplateMDEnabled) {
            message = message.replace(/\n/g, '\r');
            const buttons = createButtons(markdownCommands);
            const rows = [];
            let row = {buttons: []};
            buttons.forEach((button, index) => {
              row.buttons.push(button);
              if (row.buttons.length === 5 || index === buttons.length - 1 || row.buttons.length === config.numberOfMessageButtonsPerRow) {
                rows.push(row);
                row = {buttons: []};
              }
            });

            const result = await session.qq.sendMessage(session.channelId, {
              msg_type: 2,
              msg_id: session.messageId,
              msg_seq: msgSeq,
              content: 'PJSK 结果汇报',
              markdown: {
                custom_template_id: config.customTemplateId,
                params: [
                  {
                    key: config.key,
                    values: [`${message}`],
                  },
                ],
              },
              keyboard: {
                content: {
                  rows: rows.slice(0, 5),
                },
              },
            });
            messageId = result.id;
          } else {
            let finalMarkdown = message;
            if (config.enableQQInlineCmd && markdownCommands) {
              finalMarkdown += createMqqapiLinks(markdownCommands);
            }
            const payload = {
              msg_type: 2 as const,
              msg_id: session.messageId,
              msg_seq: msgSeq,
              content: 'PJSK 结果汇报',
              markdown: {
                content: finalMarkdown
              }
            };
            let result;
            if (session.isDirect) {
              result = await session.qq.sendPrivateMessage(session.channelId, payload);
            } else {
              result = await session.qq.sendMessage(session.channelId, payload);
            }
            messageId = result?.id || messageId;
          }
        }


      } else {
        if (config.shouldMentionUserInMessage && !String(message).includes('img')) {
          message = h.at(session.userId) + ' ~ \n' + message;
        }
        [messageId] = await session.send(message);
      }
    } catch (err: any) {
      if (config.enableDetailedDebugLog) {
        logger.error('发送消息失败:', err);
        if (err.response && err.response.data) {
          logger.error('API 响应的详细报错负载信息:', JSON.stringify(err.response.data, null, 2));
        }
      } else {
        logger.error('发送消息失败:', err.message || err);
      }
      return;
    }

    if (config.retractDelay === 0) return;
    sentMessages.push(messageId);

    if (sentMessages.length > 1) {
      const oldestMessageId = sentMessages.shift();
      setTimeout(async () => {
        await bot.deleteMessage(channelId, oldestMessageId);
      }, config.retractDelay * 1000);
    }
  }

  return { sendMessage, sendQQNativeMarkdown, createButtons }
}
