// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

export interface IQuoteType {
  author: string;
  website: string;
  quote: string;
  source: React.ReactElement | string;
}

// tslint:disable
const quotes = [
  {
    author: 'Brian Kernighan',
    website: 'https://www.cs.princeton.edu/~bwk/',
    quote:
      "Everyone knows that debugging is twice as hard as writing a program in the first place. So if you're as clever as you can be when you write it, how will you ever debug it?",
    source: (
      <a href="https://en.wikipedia.org/wiki/The_Elements_of_Programming_Style">The Elements of Programming Style</a>
    ),
  },
  {
    author: 'Don Knuth',
    website: 'https://www-cs-faculty.stanford.edu/~knuth/',
    quote:
      'A programmer is ideally an essayist who works with traditional aesthetic and literary forms as well as mathematical concepts, to communicate the way that an algorithm works and to convince a reader that the results will be correct.',
    source: (
      <a href="https://web.stanford.edu/group/cslipublications/cslipublications/site/1881526917.shtml">
        Selected Papers on Computer Science
      </a>
    ),
  },
  {
    author: 'Martin Fowler',
    website: 'https://martinfowler.com/',
    quote:
      'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.',
    source: (
      <a href="https://www.martinfowler.com/books/refactoring.html">
        Refactoring: Improving the Design of Existing Code
      </a>
    ),
  },
  {
    author: 'Barbara Liskov',
    website: 'http://www.pmg.csail.mit.edu/~liskov/',
    quote:
      'The first programming abstraction mechanism was the procedure. A procedure performs some task or function; other parts of the program call the procedure to accomplish the task. To use the procedure, a programmer cares only about what it does and not how it is implemented. Any implementation that provides the needed function will do, provided it implements the function correctly and is efficient enough.',
    source: (
      <a href="https://pdfs.semanticscholar.org/36be/babeb72287ad9490e1ebab84e7225ad6a9e5.pdf">
        Data Abstraction and Hierarchy
      </a>
    ),
  },
  {
    author: 'Hal Abelson',
    website: 'http://groups.csail.mit.edu/mac/users/hal/hal.html',
    quote: 'Programs must be written for people to read, and only incidentally for machines to execute.',
    source: (
      <a href="https://en.wikipedia.org/wiki/Structure_and_Interpretation_of_Computer_Programs">
        Structure and Interpretation of Computer Programs
      </a>
    ),
  },
];
// tslint:enable

export { quotes };
