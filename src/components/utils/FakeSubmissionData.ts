export const FAKE_FILES = {
  'data.csv': `id,name,value
1,test,100
2,dev,200
`,
  'included_file.txt': `This is an included file for testing purposes.
It has multiple lines.
`,
  'python.py': `import sys

def main():
    print("Hello from Python!")
    print(f"Arguments: {sys.argv}")

if __name__ == "__main__":
    main()
`,
  'markdown_test.md': `# Markdown Test

## Headers
### H3
#### H4

* List item 1
* List item 2

1. Ordered 1
2. Ordered 2

**Bold** and *Italic*

\`\`\`python
def code_block():
    return "highlighted"
\`\`\`

> Blockquote
`,
  'jupyter_test.ipynb': `{
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Test Notebook"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 1,
   "metadata": {},
   "outputs": [
    {
     "name": "stdout",
     "output_type": "stream",
     "text": [
      "Hello Notebook\\n"
     ]
    }
   ],
   "source": [
    "print('Hello Notebook')"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.8.5"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 4
}`,
};
