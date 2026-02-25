"use client";

import { FC, useState } from "react";
import { NavigationLayout } from "@/components/layouts/navigation-layout";

type MontyInterperatorProps = Record<string, unknown>;

interface MontyInterperatorComponent extends FC<MontyInterperatorProps> {
  Layout?: FC<{
    children: React.ReactNode;
    slug: string;
    title?: string;
    description?: React.ReactNode;
    background?: string;
  }>;
  Title?: string;
  Description?: React.ReactNode;
  Tags?: string[];
  background?: "white" | "dots" | "dots_white" | "none";
}

const FullscreenLayout: FC<{
  children: React.ReactNode;
  slug: string;
  title?: string;
  description?: React.ReactNode;
}> = ({ children, title, description, slug }) => {
  return (
    <NavigationLayout title={title} description={description} slug={slug}>
      <div className="fixed inset-0 w-screen h-screen overflow-auto bg-[#07090e] text-[#e5e7eb]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_40%)]" />
        <div className="relative h-full w-full">{children}</div>
      </div>
    </NavigationLayout>
  );
};

const MontyInterperator: MontyInterperatorComponent = () => {
  const [code, setCode] = useState([
    "let five = 5;",
    "let ten = 10;",
    "",
    "let add = fn(x, y) {",
    "  x + y;",
    "};",
    "",
    "add(five, ten);",
  ].join("\n"));
  const [output, setOutput] = useState("Run to execute with local bin/monty.");
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);

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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 md:px-8">
      <a
        href="https://github.com/montekkundan/monty-interpreter"
        target="_blank"
        rel="noreferrer"
        className="border border-slate-800 bg-slate-950 px-5 py-4 transition hover:border-slate-600"
      >
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">GitHub</div>
        <div className="mt-2 text-lg font-semibold text-slate-100">Monty Interperator Repository</div>
        <div className="mt-1 text-sm text-slate-400">Open source code for the Monty interpreter.</div>
      </a>

      <section className="border border-slate-800 bg-slate-950 px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Local Runner</div>
          <button
            onClick={runCode}
            disabled={isRunning}
            className="border border-slate-700 bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-100 disabled:opacity-50"
          >
            {isRunning ? "Running" : "Run"}
          </button>
        </div>
        <textarea
          value={code}
          onChange={(event) => setCode(event.target.value)}
          spellCheck={false}
          className="h-52 w-full border border-slate-800 bg-[#030712] px-3 py-3 font-mono text-sm text-slate-200 outline-none"
        />
        <div className="mt-3 text-xs text-slate-400">
          {durationMs === null ? "Duration: --" : `Duration: ${durationMs}ms`}
        </div>
        <pre className="mt-2 min-h-20 whitespace-pre-wrap border border-slate-800 bg-[#030712] px-3 py-3 font-mono text-xs text-emerald-300">
          {output}
        </pre>
      </section>

    </div>
  );
};

MontyInterperator.Layout = FullscreenLayout;
MontyInterperator.Title = "Monty Interperator";
MontyInterperator.Description = "Monty interpreter links and demo video player.";
MontyInterperator.Tags = ["video", "monty", "interpreter"];
MontyInterperator.background = "none";

export default MontyInterperator;
