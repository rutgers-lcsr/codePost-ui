import { File } from './src/infrastructure/file';

const mockFile = {
  id: 1,
  name: 'test.ipynb',
  extension: 'ipynb',
  code: '{}',
  comments: [],
  submission: 1,
  path: null,
  created: '',
};

const mockFileDot = {
  ...mockFile,
  extension: '.ipynb',
};

const mockFileUpper = {
  ...mockFile,
  extension: 'IPYNB',
};

console.log('ipynb:', File.codeType(mockFile));
console.log('.ipynb:', File.codeType(mockFileDot));
console.log('IPYNB:', File.codeType(mockFileUpper));
