import { FC } from 'react'

import { HTMLLayout } from '@/components/layouts/html-layout'

interface HTMLTestComponent extends FC {
  Layout: typeof HTMLLayout
  Title: string
  Description: string
  htmlSrc: string
  cssSrc?: string
  jsSrc?: string
}

const HTMLTest: FC = () => {
  return null
}

(HTMLTest as HTMLTestComponent).Layout = HTMLLayout;
(HTMLTest as HTMLTestComponent).Title = 'HTML Test';
(HTMLTest as HTMLTestComponent).Description = 'Testing plain HTML rendering in Next.js';
(HTMLTest as HTMLTestComponent).htmlSrc = '/experiments/1.html-test/index.html';
(HTMLTest as HTMLTestComponent).cssSrc = '/experiments/1.html-test/styles.css';

export default HTMLTest as HTMLTestComponent;