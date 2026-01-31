import { File, FileMock, FileType } from './file';
import { describe, it, expect } from 'vitest';

describe('File Infrastructure', () => {
    describe('File.extension', () => {
        it('extracts simple extensions', () => {
            expect(File.extension('test.txt')).toBe('txt');
            expect(File.extension('image.PNG')).toBe('png');
            expect(File.extension('script.py')).toBe('py');
        });

        it('handles files with multiple dots', () => {
            expect(File.extension('archive.tar.gz')).toBe('gz');
            expect(File.extension('component.test.tsx')).toBe('tsx');
        });

        it('handles files with no extension', () => {
            expect(File.extension('Dockerfile')).toBe('');
            expect(File.extension('Makefile')).toBe('');
            expect(File.extension('README')).toBe('');
        });

        it('handles hidden files', () => {
            expect(File.extension('.gitignore')).toBe('gitignore');
            expect(File.extension('.env')).toBe('env');
        });
    });

    describe('File.codeType', () => {
        const makeFile = (name: string): FileType => ({ ...FileMock, name, extension: File.extension(name) });

        it('identifies jupyter notebooks', () => {
            expect(File.codeType(makeFile('notebook.ipynb'))).toBe('jupyter');
            expect(File.codeType(makeFile('notebook.IPYNB'))).toBe('jupyter');
        });

        it('identifies markdown', () => {
            expect(File.codeType(makeFile('readme.md'))).toBe('markdown');
        });

        it('identifies images', () => {
            expect(File.codeType(makeFile('image.png'))).toBe('image');
            expect(File.codeType(makeFile('photo.jpg'))).toBe('image');
        });

        it('identifies pdfs', () => {
            expect(File.codeType(makeFile('doc.pdf'))).toBe('pdf');
        });

        it('defaults others to code', () => {
            expect(File.codeType(makeFile('script.py'))).toBe('code');
            expect(File.codeType(makeFile('Main.java'))).toBe('code');
            expect(File.codeType(makeFile('data.csv'))).toBe('code');
        });
    });

    describe('File.language', () => {
        const makeFile = (name: string, data = ''): FileType => ({
            ...FileMock,
            name,
            extension: File.extension(name),
            data
        });

        it('maps extensions to languages', () => {
            expect(File.language(makeFile('script.py'))).toBe('python');
            expect(File.language(makeFile('script.js'))).toBe('javascript');
            expect(File.language(makeFile('style.css'))).toBe('css');
            // Update this expectation based on actual lang-map behavior if needed, usually 'c++' or 'cpp'
            // LangMap.languages('cpp') -> ['c++', 'cpp']
            const cppLang = File.language(makeFile('main.cpp'));
            expect(['c++', 'cpp']).toContain(cppLang);
        });

        it('defaults to extension if unknown', () => {
            expect(File.language(makeFile('unknown.xyz'))).toBe('xyz');
        });

        describe('Jupyter Notebook Metadata Parsing', () => {
            it('defaults to python if no metadata', () => {
                const file = makeFile('notebook.ipynb', '{}');
                expect(File.language(file)).toBe('python');
            });

            it('parses language_info name', () => {
                const content = JSON.stringify({
                    cells: [],
                    metadata: {
                        language_info: {
                            name: 'javascript',
                        },
                    },
                });
                const file = makeFile('notebook.ipynb', content);
                expect(File.language(file)).toBe('javascript');
            });

            it('parses kernelspec language', () => {
                const content = JSON.stringify({
                    cells: [],
                    metadata: {
                        kernelspec: {
                            display_name: 'R',
                            language: 'R',
                            name: 'ir',
                        },
                    },
                });
                const file = makeFile('notebook.ipynb', content);
                expect(File.language(file)).toBe('r');
            });

            it('prioritizes language_info over kernelspec', () => {
                const content = JSON.stringify({
                    cells: [],
                    metadata: {
                        language_info: { name: 'python' },
                        kernelspec: { language: 'R' },
                    },
                });
                const file = makeFile('notebook.ipynb', content);
                expect(File.language(file)).toBe('python');
            });

            it('handles messy whitespace in json string', () => {
                const content = `
         {
           "metadata": {
             "language_info": {
               "name": "julia"
             }
           }
         }`;
                const file = makeFile('data.ipynb', content);
                expect(File.language(file)).toBe('julia');
            });
        });
    });
});
