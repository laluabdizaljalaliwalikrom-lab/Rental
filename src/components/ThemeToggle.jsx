import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "./useTheme"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-xl w-10 h-10 bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-orange-400" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass border-white/10 text-foreground min-w-[120px] rounded-xl p-1 mt-2">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="flex items-center gap-2 rounded-lg cursor-pointer hover:bg-white/10 focus:bg-white/10 py-2"
        >
          <Sun size={14} className="text-orange-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="flex items-center gap-2 rounded-lg cursor-pointer hover:bg-white/10 focus:bg-white/10 py-2"
        >
          <Moon size={14} className="text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="flex items-center gap-2 rounded-lg cursor-pointer hover:bg-white/10 focus:bg-white/10 py-2"
        >
          <Monitor size={14} className="text-muted-foreground" />
          <span className="text-xs font-bold uppercase tracking-wider">System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
