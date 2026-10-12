import * as fs from 'fs'

export function getImgDimensions(imgPath: string, targetHeight: number = 33): { w: number, h: number } {
  let fd;
  try {
    fd = fs.openSync(imgPath, 'r');
    const buffer = Buffer.alloc(24);
    fs.readSync(fd, buffer, 0, 24, 0);
    if (buffer.toString('utf8', 1, 4) === 'PNG') {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { w: Math.round(width * (targetHeight / height)), h: Math.round(targetHeight) };
    }
  } catch (e) {
  } finally {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch (e) {}
    }
  }
  return { w: Math.round(targetHeight), h: Math.round(targetHeight) };
}

export function countEnglishLetters(text: string): number {
  const englishLettersRegex = /[a-zA-Z]/g;
  const englishLetters = text.match(englishLettersRegex);

  if (englishLetters) {
    return englishLetters.length;
  } else {
    return 0;
  }
}


export function containsEnglishLetter(text: string): boolean {
  const regex = /[a-zA-Z]/;
  return regex.test(text);
}


export function containsChinese(text: string): boolean {
  const chineseRegex = /[\u4e00-\u9fa5]/;

  return chineseRegex.test(text);
}


export function calculateOffsets(longestLine: string, options: any): { x: number; y: number } {
  const offsets = {x: 0, y: 0};

  if (options.curve) {
    if (longestLine.length <= 5) {
      offsets.x = -20;
      offsets.y = 200;
    } else {
      if (longestLine.length >= 8) {
        offsets.x = containsChinese(longestLine) ? -30 : -60;
        offsets.y = containsChinese(longestLine) ? 100 : 150;
      } else {
        offsets.x = -60;
        offsets.y = containsChinese(longestLine) ? 130 : 150;
      }

    }
  }

  return offsets;
}


export function calculateFontSize(specifiedFontSize: number, longestLine: string): number {
  if (containsChinese(longestLine)) {
    if (containsEnglishLetter(longestLine) && longestLine.length > 3) {
      const englishLetterCount = countEnglishLetters(longestLine);
      return 278 / (longestLine.length) + englishLetterCount;
    } else if (longestLine.length > 3) {
      if (longestLine.length > 4) {
        return 278 / longestLine.length;
      }
      return 278 / longestLine.length - 12;
    } else {
      return specifiedFontSize + 10 * (3 - longestLine.length) + 12;
    }
  } else {
    return longestLine.length > 6
      ? 278 / longestLine.length + 10.5
      : longestLine.length > 4
        ? 278 / longestLine.length + 3
        : 278 / (longestLine.length + (longestLine.length > 2 ? 1 : 4 - longestLine.length));
  }
}


export function findLongestLine(text: string): string {
  const lines = text.replace(/\\n/g, '\n').split('\n');
  let maxLength = 0;
  let longestLine = '';

  for (const line of lines) {
    let length = 0;
    for (const char of line.trim()) {
      length += char.charCodeAt(0) > 255 ? 1 : 0.5;
    }

    if (length > maxLength) {
      maxLength = length;
      longestLine = line;
    }
  }

  return longestLine;
}


export function checkFileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}
