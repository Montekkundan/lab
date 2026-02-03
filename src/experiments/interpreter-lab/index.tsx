import { FC } from 'react';
import Link from 'next/link';
import { NavigationLayout } from '@/components/layouts/navigation-layout';

interface InterpreterLabProps {}

interface InterpreterLabComponent extends FC<InterpreterLabProps> {
  Layout?: FC<{ children: React.ReactNode; slug: string; title?: string; description?: React.ReactNode; background?: string }>;
  Title?: string;
  Description?: React.ReactNode;
  Tags?: string[];
  background?: 'white' | 'dots' | 'dots_white' | 'none';
}

const FullscreenLayout: FC<{ children: React.ReactNode; slug: string; title?: string; description?: React.ReactNode }> = ({
  children,
  title,
  description,
  slug
}) => {
  return (
    <NavigationLayout title={title} description={description} slug={slug}>
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#050505] text-[#c7c7c7]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:28px_28px] opacity-20" />
        <div className="pointer-events-none absolute inset-0 opacity-25 [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.025)_0,rgba(255,255,255,0.025)_1px,transparent_1px,transparent_3px)]" />
        <div className="relative h-full w-full">{children}</div>
      </div>
    </NavigationLayout>
  );
};

const sampleCode = [
  'let five = 5;',
  'let ten = 10;',
  '',
  'let add = fn(x, y) {',
  '  x + y;',
  '};',
  '',
  'let result = add(five, ten);',
  'result;'
];

const InterpreterLab: InterpreterLabComponent = () => {
  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center justify-between px-10 py-4 text-xs uppercase tracking-[0.35em] text-white/40">
        <div className="flex items-center gap-6">
          <span className="text-white/70">Interpreter</span>
          <Link href="/" className="text-white/30 hover:text-white/60 transition">
            Lab
          </Link>
        </div>
      </header>

      <div className="grid h-full w-full grid-cols-[1fr_360px] gap-8 px-10 py-8">
        <main className="flex h-full flex-col gap-6">
          <section className="grid grid-cols-3 gap-4">
            {[
              { label: 'Tokens', value: '48' },
              { label: 'AST Depth', value: '6' },
              { label: 'Eval', value: '0.2ms' }
            ].map((item) => (
              <div
                key={item.label}
                className="bg-[#0b0b0b] px-4 py-3 text-xs"
              >
                <div className="text-white/40">{item.label}</div>
                <div className="mt-1 text-sm text-white/80">{item.value}</div>
              </div>
            ))}
          </section>

          <section className="flex-1 bg-[#0b0b0b]">
            <header className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/50">
                <span className="h-2 w-2 bg-emerald-400" />
                Editor
              </div>
              <div className="flex items-center gap-3">
                <button className="px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/60">
                  Run
                </button>
                <button className="bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/60">
                  Reset
                </button>
              </div>
            </header>

            <div className="flex h-[420px]">
              <div className="select-none bg-white/5 px-4 py-6 text-right font-mono text-xs leading-6 text-white/30">
                {sampleCode.map((_, idx) => (
                  <div key={`line-${idx}`}>{idx + 1}</div>
                ))}
              </div>
              <pre className="flex-1 overflow-auto px-6 py-6 font-mono text-sm leading-6 text-white/85">
                {sampleCode.map((line, idx) => (
                  <div key={`code-${idx}`}>{line || '\u00A0'}</div>
                ))}
              </pre>
            </div>

            <footer className="bg-[#080808] px-5 py-4 text-xs text-white/60">
              <div className="flex items-center justify-between">
                <span>Output</span>
                <span className="text-white/35">Lexer · Parser · Evaluator · Types</span>
              </div>
              <div className="mt-3 bg-black/40 px-4 py-3 font-mono text-xs text-emerald-300/90">
                result = 15
              </div>
            </footer>
          </section>

        </main>

        <aside className="flex h-full flex-col gap-4">
          <div className="bg-[#0b0b0b] px-5 py-4">
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">Lexing</div>
            <div className="mt-2 bg-black/40 px-3 py-2 font-mono text-xs text-white/70">
              LET five = 5 ; LET ten = 10 ; LET add = FN ( x , y ) {`{`} x + y ; {`}`}
            </div>
          </div>

          <div className="bg-[#0b0b0b] px-5 py-4">
            <div className="text-xs uppercase tracking-[0.2em] text-white/50">Parsing</div>
            <div className="mt-2 bg-black/40 px-3 py-2 font-mono text-xs text-white/70">
              Program → LetStatement → Identifier(add) → FunctionLiteral(params: x, y)
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

InterpreterLab.Layout = FullscreenLayout;
InterpreterLab.Title = 'Interpreter Lab';
InterpreterLab.Description = 'Minimal editor with a collapsible inspection rail for lexing, parsing, evaluation, and types.';
InterpreterLab.Tags = ['ui', 'editor', 'interpreter'];
InterpreterLab.background = 'none';

export default InterpreterLab;
