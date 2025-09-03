declare module 'react-markdown' {
  import * as React from 'react';
  interface ReactMarkdownProps {
    children: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    remarkPlugins?: any[];
    className?: string;
  }
  const ReactMarkdown: React.FC<ReactMarkdownProps>;
  export default ReactMarkdown;
}

declare module 'remark-gfm';