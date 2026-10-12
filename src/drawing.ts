import { h } from 'koishi'
import path from 'path'
import * as fs from 'fs'
import type {} from 'koishi-plugin-puppeteer'
import type { DrawFunction, DrawList, DrawList2, UploadImageToAssets } from './types'
import type { PjskBaseRuntime } from './runtime'

export interface DrawingService {
  draw: DrawFunction
  drawList: DrawList
  drawList2: DrawList2
  uploadImageToAssets: UploadImageToAssets
}

export function createDrawingService(runtime: PjskBaseRuntime): DrawingService {
  const { ctx, logger, characters, filePath, dependencyPjskDir } = runtime

  async function drawList2() {
    const browser = ctx.puppeteer.browser
    const context = await browser.createBrowserContext()
    const page = await context.newPage()

    const htmlContent = generateHTML(characters);

    await page.goto('file://' + filePath);

    function generateHTML(characters: any[]) {
      let html = `
      <html>
          <head>
              <style>
              @font-face {
    font-family: YurukaStd;
    src: local("YurukaStd"),url('./assets/fonts/YurukaStd.woff2') format("woff2")
}

@font-face {
    font-family: SSFangTangTi;
    src: local("SSFangTangTi"),url('./assets/fonts/ShangShouFangTangTi.woff2') format("woff2")
}

                  .character {
                      position: relative;
                      display: inline-block;
                      margin: 5px;
                      background-color: transparent;
                  }

                  .character img {
                      max-width: 100px;
                      opacity: 1;
                  }

                  .character .number {
                      position: absolute;
                      top: 0;
                      left: 0;
                      color: red;
                      font-weight: bold;
                      font-size: 30px;
                      font-family: 'YurukaStd', 'SSFangTangTi';
                  }
              </style>
          </head>
          <body>
          `;

      characters.forEach((character, index) => {
        const imgPath = 'file://' + dependencyPjskDir.replaceAll('\\', '/') + `/img/${character.img}`;
        html += `
              <div class="character">
                  <div class="number">${index}</div>
                  <img src="${imgPath}" alt="${character.name}">
              </div>
              `;
      });

      html += `
          </body>
          </html>
          `;

      return html;
    }

    await page.setContent(htmlContent);
    const screenshot = await page.screenshot({type: 'jpeg', fullPage: true, omitBackground: true});
    await page.close();
    await context.close()
    return screenshot
  }

  async function drawList(picsDir) {
    function generateHTMLFromPictures(picsDir: string): string {
      const files = fs.readdirSync(picsDir);

      const pngFiles = files.filter((file) => path.extname(file).toLowerCase() === '.png');

      // 排序
      const sortedPngFiles = pngFiles.sort((a, b) => {
        const numA = parseInt(path.basename(a, '.png'), 10);
        const numB = parseInt(path.basename(b, '.png'), 10);
        return numA - numB;
      });

      let html = `
    <html>
      <head>
        <style>
          body {
            background-color: #282C35;
          }
          .gallery {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
          }
   .gallery img {
            width: 9.09%;
            padding: 5px;
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>
        <div class="gallery">
  `;

      // 每行展示 5 张图片
      const imagesPerRow = 11;
      for (let i = 0; i < sortedPngFiles.length; i += imagesPerRow) {
        const rowImages = sortedPngFiles.slice(i, i + imagesPerRow);
        rowImages.forEach((file) => {
          const imagePath = path.join(picsDir, file);
          html += `<img src="${imagePath}" alt="${file}">`;
        });
      }

      html += `
        </div>
      </body>
    </html>
  `;

      return html;
    }

    const html = generateHTMLFromPictures(picsDir);
    const browser = ctx.puppeteer.browser
    const context = await browser.createBrowserContext()
    const page = await context.newPage()
    await page.setViewport({width: 3454, height: 256, deviceScaleFactor: 1})
    await page.goto('file://' + filePath);
    await page.setContent(html);
    const screenshot = await page.screenshot({type: 'jpeg', fullPage: true, omitBackground: true});
    await page.close();
    await context.close()
    return screenshot
  }

  // 将本地图片通过 assets 服务上传，返回可供 QQ 拉取的公网 http(s) 链接；不可用时返回空串
  async function uploadImageToAssets(buffer: Buffer | Uint8Array, filename: string): Promise<string> {
    const assetsService = (ctx as any).assets;
    if (!assetsService) return '';
    try {
      const ext = path.extname(filename).toLowerCase();
      const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
        : ext === '.gif' ? 'image/gif'
        : ext === '.webp' ? 'image/webp'
        : 'image/png';
      const dataUrl = `data:${mime};base64,${Buffer.from(buffer).toString('base64')}`;
      const url = await assetsService.upload(dataUrl, path.basename(filename));
      if (/^https?:/i.test(url)) return url;
      logger.warn('assets 服务返回的链接无法被 QQ 访问：', url);
      return '';
    } catch (e) {
      logger.warn('Failed to upload image to assets service:', e);
      return '';
    }
  }

  async function draw(text, imgPath, specifiedX, specifiedY, specifiedRotate, specifiedFontSize, color, curve, spaceSize, angle) {
    const browser = ctx.puppeteer.browser
    const context = await browser.createBrowserContext()
    const page = await context.newPage()
    // 存储的文本用字面量 \n 表示换行，渲染前还原为真实换行，供 canvas 按行绘制
    const renderText = String(text).replace(/\\n/g, '\n')

    const htmlContent = `
<html lang="zh">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
        @font-face {
            font-family: 'YurukaStd';
            src: local('YurukaStd'), url('./assets/fonts/YurukaStd.woff2') format('woff2');
        }

        @font-face {
            font-family: 'SSFangTangTi';
            src: local('SSFangTangTi'), url('./assets/fonts/ShangShouFangTangTi.woff2') format('woff2');
        }

    .canvas {
      height: 256px;
      width: 296px;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: transparent;
      font-family: 'YurukaStd', 'SSFangTangTi';
    }

  </style>
</head>

<body>
<h1 style="font-family: 'YurukaStd'; font-weight: normal; font-style: normal;">YurukaStd</h1>
<h1 style="font-family: 'SSFangTangTi'; font-weight: normal; font-style: normal;">SSFangTangTi</h1>
  <div class="canvas">
    <canvas id="myCanvas" width="296" height="256">
  </div>


  <script>
 window.onload = () => {
      const canvas = document.getElementById("myCanvas");
      const context = canvas.getContext('2d');
      const text = ${JSON.stringify(renderText).replace(/</g, '\\u003c')};
      const x = ${Number(specifiedX)};
      const y = ${Number(specifiedY)};
      const rotate = ${specifiedRotate};
      const fontSize = ${JSON.stringify(String(specifiedFontSize))};
      const color = ${JSON.stringify(color)};
      const curve = ${curve};
      const position = { x, y }
      const spaceSize = ${spaceSize};
      let angle = ${angle};
      const img = new Image();
      img.src = ${JSON.stringify(imgPath)};

      img.onload = async () => {
        // 等待 Web 字体就绪后再落笔，避免用回退字体绘制
        if (document.fonts && document.fonts.ready) {
          try { await document.fonts.ready } catch (e) {}
        }
        draw(context)
        window.__pjskDrawn = true
      }

      function draw(context) {
        context.canvas.width = 296;
        context.canvas.height = 256;

          var hRatio = context.canvas.width / img.width;
          var vRatio = context.canvas.height / img.height;
          var ratio = Math.min(hRatio, vRatio);
          var centerShift_x = (context.canvas.width - img.width * ratio) / 2;
          var centerShift_y = (context.canvas.height - img.height * ratio) / 2;
          context.clearRect(0, 0, context.canvas.width, context.canvas.height);
          context.drawImage(
            img,
            0,
            0,
            img.width,
            img.height,
            centerShift_x,
            centerShift_y,
            img.width * ratio,
            img.height * ratio
          );
          context.font = \`\${fontSize}px YurukaStd, SSFangTangTi\`;
          context.lineWidth = 9;
          context.save();

          context.translate(position.x, position.y);
          context.rotate(rotate / 10);
          context.textAlign = "center";
          context.strokeStyle = "white";
          context.fillStyle = color;
          var lines = text.split("\\n");
          if (curve) {
            for (let line of lines) {
              for (let i = 0; i < line.length; i++) {
                context.rotate(angle / line.length / 2.5);
                context.save();
                context.translate(0, -1 * fontSize * 3.5);
                context.strokeText(line[i], 0, 0);
                context.fillText(line[i], 0, 0);
                context.restore();
              }
            }
          } else {
            for (var i = 0, k = 0; i < lines.length; i++) {
              context.strokeText(lines[i], 0, k);
              context.fillText(lines[i], 0, k);
              k += spaceSize;
            }
            context.restore();
          }
      }
    }
  </script>
</body>

</html>`

    await page.setViewport({width: 296, height: 256, deviceScaleFactor: 1})
    await page.goto('file://' + filePath);

    await page.setContent(h.unescape(htmlContent), {waitUntil: 'load'});
    // 等待 canvas 绘制完成（含 Web 字体加载），避免截到未绘制或回退字体的画面
    await page.waitForFunction(() => (globalThis as any).__pjskDrawn === true, {timeout: 10000}).catch(() => {});

    const canvas = await page.$('canvas#myCanvas');
    const buffer = await canvas.screenshot({type: 'png', omitBackground: true});

    await page.close();
    await context.close()

    return buffer;
  }

  return { draw, drawList, drawList2, uploadImageToAssets }
}
