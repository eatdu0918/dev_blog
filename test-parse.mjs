import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

const markdown = `
# hello

<pre class="sandpack" data-filename="App.tsx">
import { useState } from 'react';

function Test() {
  return <div>Hello</div>
}
</pre>

done!
`;

unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeStringify, { allowDangerousHtml: true })
  .process(markdown).then(file => console.log(String(file)));
