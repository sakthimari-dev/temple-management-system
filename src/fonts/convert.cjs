const fs = require('fs');

const reg = fs.readFileSync('NotoSansTamil-Regular.ttf').toString('base64');
const bold = fs.readFileSync('NotoSansTamil-Bold.ttf').toString('base64');

const output =
  'export const NotoSansTamilRegular = "' + reg + '";\n' +
  'export const NotoSansTamilBold = "' + bold + '";\n';

fs.writeFileSync('NotoSansTamil.js', output);

console.log('Done! NotoSansTamil.js created.');