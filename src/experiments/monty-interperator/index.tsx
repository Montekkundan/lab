"use client";

import { FC, ReactNode, useMemo, useState } from "react";
import { NavigationLayout } from "@/components/layouts/navigation-layout";
import { DotPattern } from "@/components/ui/dot-pattern";

type MontyInterperatorProps = Record<string, unknown>;
type TabKey =
  | "hello-world"
  | "fibonacci"
  | "recursion"
  | "closures"
  | "arrays"
  | "hash-maps"
  | "builtins";

const examples: Record<TabKey, { label: string; code: string }> = {
  "hello-world": {
    label: "hello-world",
    code: [
    "let name = \"World\";",
    "",
    "let hello = fn(target) {",
    "  \"Hello, \" + target;",
    "};",
    "",
    "hello(name);",
  ].join("\n"),
  },
  fibonacci: {
    label: "fibonacci",
    code: [
    "let fib = fn(n) {",
    "  if (n < 2) {",
    "    n;",
    "  } else {",
    "    fib(n - 1) + fib(n - 2);",
    "  }",
    "};",
    "",
    "fib(10);",
  ].join("\n"),
  },
  recursion: {
    label: "factorial",
    code: [
    "let fact = fn(n) {",
    "  if (n == 0) {",
    "    1;",
    "  } else {",
    "    n * fact(n - 1);",
    "  }",
    "};",
    "",
    "fact(6);",
  ].join("\n"),
  },
  closures: {
    label: "closures",
    code: [
    "let makeAdder = fn(x) {",
    "  fn(y) { x + y };",
    "};",
    "",
    "let addTwo = makeAdder(2);",
    "addTwo(40);",
  ].join("\n"),
  },
  arrays: {
    label: "arrays",
    code: [
    "let numbers = [1, 2, 3, 4];",
    "",
    "let head = first(numbers);",
    "let tail = rest(numbers);",
    "let next = push(tail, 5);",
    "",
    "len(next) + head;",
  ].join("\n"),
  },
  "hash-maps": {
    label: "hash-maps",
    code: [
    "let user = {",
    "  \"name\": \"monty\",",
    "  \"score\": 42,",
    "};",
    "",
    "user[\"name\"] + \"-\" + user[\"score\"];",
  ].join("\n"),
  },
  builtins: {
    label: "builtins",
    code: [
    "let words = [\"mon\", \"ty\"];",
    "",
    "puts(first(words));",
    "puts(last(words));",
    "",
    "len(words);",
  ].join("\n"),
  },
};

interface MontyInterperatorComponent extends FC<MontyInterperatorProps> {
  Layout?: FC<{
    children: ReactNode;
    slug: string;
    title?: string;
    description?: ReactNode;
    background?: string;
  }>;
  Title?: string;
  Description?: ReactNode;
  Tags?: string[];
  background?: "white" | "dots" | "dots_white" | "none";
}

const FullscreenLayout: FC<{
  children: ReactNode;
  slug: string;
  title?: string;
  description?: ReactNode;
}> = ({ children, title, description, slug }) => {
  return (
    <NavigationLayout title={title} description={description} slug={slug}>
      <div className="fixed inset-0 h-screen w-screen overflow-auto bg-[#f8fafc] text-[#1f2937]">
        <DotPattern
          className="text-slate-400/45"
          width={20}
          height={20}
          cx={1.5}
          cy={1.5}
          cr={1.4}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.8),transparent_45%)]" />
        <div className="relative h-full w-full">{children}</div>
      </div>
    </NavigationLayout>
  );
};

const MontyInterperator: MontyInterperatorComponent = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("hello-world");
  const [code, setCode] = useState(examples["hello-world"].code);
  const [output, setOutput] = useState("Run to execute with local bin/monty.");
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const tabs = useMemo(() => Object.keys(examples) as TabKey[], []);
  const lineNumbers = useMemo(() => code.split("\n").map((_, i) => i + 1), [code]);

  const runCode = async () => {
    setIsRunning(true);
    setOutput("Running...");

    try {
      const response = await fetch("/api/monty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const payload = (await response.json()) as
        | { ok: true; stdout: string; durationMs: number }
        | { error?: string };

      if (!response.ok || !("ok" in payload)) {
        setOutput("error" in payload ? payload.error || "Execution failed." : "Execution failed.");
        setDurationMs(null);
        return;
      }

      setOutput(payload.stdout || "(no output)");
      setDurationMs(payload.durationMs);
    } catch {
      setDurationMs(null);
      setOutput("Failed to call /api/monty.");
    } finally {
      setIsRunning(false);
    }
  };

  const onTabClick = (tab: TabKey) => {
    setActiveTab(tab);
    setCode(examples[tab].code);
    setOutput("Run to execute with local bin/monty.");
    setDurationMs(null);
  };

  const onReset = () => {
    setCode(examples[activeTab].code);
    setOutput("Run to execute with local bin/monty.");
    setDurationMs(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-3 pb-8 pt-4 md:px-6 md:pt-6">
      <header className="rounded-md border border-[#cfd6de] bg-[#f2f4f7] px-3 py-2 text-[#1b1c20] shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
        <div className="text-sm font-semibold tracking-tight">Monty Interpreter (Go)</div>
      </header>

      <section className="overflow-hidden rounded-md border border-[#2c2f37] bg-[#ececec] text-[#17181c] shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
        <div className="border-b border-[#d1d1d1] bg-[#e5e5e5] px-2 py-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTabClick(tab)}
                className={`rounded-sm border px-2 py-0.5 text-[11px] font-medium transition ${
                  activeTab === tab
                    ? "border-[#878787] bg-white text-[#1e1f24]"
                    : "border-transparent bg-[#d6d6d6] text-[#696d75] hover:border-[#b0b0b0] hover:bg-[#e2e2e2]"
                }`}
              >
                {examples[tab].label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid min-h-[560px] grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="border-r border-[#d6d6d6] bg-[#f7f7f7]">
            <div className="flex items-center justify-between border-b border-[#d9d9d9] px-2 py-1">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#676b74]">
                <span className="rounded bg-[#d6d6d6] px-1.5 py-0.5">{examples[activeTab].label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onReset}
                  className="rounded-sm border border-[#b6b6b6] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#2a2d33]"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={runCode}
                  disabled={isRunning}
                  className="rounded-sm border border-[#b6b6b6] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#2a2d33] disabled:opacity-50"
                >
                  {isRunning ? "Running" : "Run"}
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute left-0 top-0 h-full w-10 border-r border-[#e0e0e0] bg-[#efefef]" />
              <div className="pointer-events-none absolute left-0 top-0 z-10 w-10 select-none px-2 py-3 text-right font-mono text-[12px] leading-6 text-[#9aa0ab]">
                {lineNumbers.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
              <textarea
                value={code}
                onChange={(event) => setCode(event.target.value)}
                spellCheck={false}
                className="relative z-0 h-[515px] w-full resize-none bg-[#f7f7f7] py-3 pl-12 pr-3 font-mono text-[13px] leading-6 text-[#1f2430] outline-none"
              />
            </div>
          </div>

          <aside className="relative border-t border-[#d6d6d6] bg-[#f1f1f1] md:border-l md:border-t-0">
            <div className="px-3 py-3">
              <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[#6e7380]">
                {durationMs === null ? "Duration: --" : `Duration: ${durationMs}ms`}
              </div>
              <pre className="min-h-[120px] whitespace-pre-wrap rounded border border-[#cecece] bg-white px-2 py-2 font-mono text-[11px] leading-5 text-[#2a303a]">
                {output}
              </pre>
            </div>
          </aside>
        </div>
      </section>

      <a
        href="https://github.com/Montekkundan/go_interpreter"
        target="_blank"
        rel="noreferrer"
        className="ml-auto inline-flex w-fit rounded border border-[#c9d1dc] bg-[#f8fafc] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[#525c6c] transition hover:border-[#9fabbc] hover:text-[#111827]"
      >
        Monty Interpreter Repository
      </a>
    </div>
  );
};

MontyInterperator.Layout = FullscreenLayout;
MontyInterperator.Title = "Monty Interpreter";
MontyInterperator.Description = "Run Monty code and inspect output in-browser.";
MontyInterperator.Tags = ["video", "monty", "interpreter"];
MontyInterperator.background = "dots_white";

export default MontyInterperator;
