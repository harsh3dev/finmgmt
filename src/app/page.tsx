import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  Database,
  LockKeyhole,
  RefreshCcw,
  Palette,
  Grid2x2
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[60px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <header className="row-start-1 w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold">Finance Dashboard</h1>
        <ThemeToggle />
      </header>
      
      <main className="row-start-2 flex flex-col gap-8 items-center sm:items-start max-w-4xl">
        <div className="text-center sm:text-left">
          <h2 className="text-4xl font-bold mb-4 tracking-tight">
            Your Adaptive Finance Intelligence Workspace
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Connect trusted market data sources, transform JSON responses into meaningful insights, and
            assemble a living dashboard powered by smart widgets, secure API key handling, and automatic
            display optimization.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
          <Card>
            <CardHeader>
              <Grid2x2 className="h-8 w-8 mb-2 text-blue-600" />
              <CardTitle>Adaptive Widgets</CardTitle>
              <CardDescription>
                Smart auto-detection picks the best view (card / table / chart) from raw JSON
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Database className="h-8 w-8 mb-2 text-green-600" />
              <CardTitle>Multi‑Source APIs</CardTitle>
              <CardDescription>
                Plug in market & currency data with caching + manual refresh control
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 mb-2 text-purple-600" />
              <CardTitle>Instant Insight</CardTitle>
              <CardDescription>
                Charts & tables enhanced with search, pagination & numeric parsing
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <LockKeyhole className="h-8 w-8 mb-2 text-amber-600" />
              <CardTitle>Secure Keys</CardTitle>
              <CardDescription>
                AES‑GCM encrypted API keys & masked in UI for safer local usage
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <RefreshCcw className="h-8 w-8 mb-2 text-cyan-600" />
              <CardTitle>Intelligent Caching</CardTitle>
              <CardDescription>
                Avoid redundant calls with smart memoization & force refresh option
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Palette className="h-8 w-8 mb-2 text-pink-600" />
              <CardTitle>Theme Ready</CardTitle>
              <CardDescription>
                Refined dark / light mode & responsive bento grid layout
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row w-full sm:w-auto">
          <Link href="/dashboard">
            <Button size="lg" className="w-full sm:w-auto">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg w-full">
          <h3 className="text-lg font-semibold mb-3">Currently Implemented Capabilities</h3>
          <ul className="text-sm text-muted-foreground space-y-1 leading-relaxed">
            <li>• Smart widget type inference (auto card / table / chart selection)</li>
            <li>• Hierarchical field explorer with nested & array structure awareness</li>
            <li>• Secure API key encryption (AES‑GCM) & masked UI handling</li>
            <li>• Real-time currency conversion via secure proxy & formatting utilities</li>
            <li>• Drag-and-drop responsive bento grid with expansion logic</li>
            <li>• Search & pagination for data-heavy table widgets</li>
            <li>• Numeric string parsing + adaptive chart rendering</li>
            <li>• Manual refresh + intelligent caching layer</li>
            <li>• Persistent local storage hydration & state restoration</li>
            <li>• Theme switching (dark / light) + accessible UI foundations</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
