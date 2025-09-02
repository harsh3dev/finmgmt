import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BarChart3, Settings, Database } from "lucide-react";
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
          <h2 className="text-4xl font-bold mb-4">
            Build Your Custom Financial Dashboard
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Connect to financial APIs, create widgets, and visualize your data in real-time.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 mb-2 text-blue-600" />
              <CardTitle>Create Widgets</CardTitle>
              <CardDescription>
                Add custom widgets to display financial data from various APIs
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Database className="h-8 w-8 mb-2 text-green-600" />
              <CardTitle>Connect APIs</CardTitle>
              <CardDescription>
                Integrate with Alpha Vantage, Yahoo Finance, and other financial data sources
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Settings className="h-8 w-8 mb-2 text-purple-600" />
              <CardTitle>Configure Display</CardTitle>
              <CardDescription>
                Customize how your data appears with different formats and styles
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
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            View Documentation
          </Button>
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg w-full">
          <h3 className="text-lg font-semibold mb-2">Features</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Real-time data updates with configurable refresh intervals</li>
            <li>• Intelligent auto-detection of optimal display types (cards, tables, charts)</li>
            <li>• Flexible field mapping and data formatting options</li>
            <li>• Local storage for persistent dashboard configurations</li>
            <li>• Import/export dashboard settings</li>
            <li>• Dark and light theme support</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
