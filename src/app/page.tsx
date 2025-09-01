import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[60px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <header className="row-start-1 w-full flex justify-between items-center">
        <h1 className="text-2xl font-bold">Finance Dashboard</h1>
        <ThemeToggle />
      </header>
    </div>
  );
}
