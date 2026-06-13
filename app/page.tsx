import { TerminalWindow } from "@/components/terminal-window"
import { TerminalOutput } from "@/components/terminal-output"
import { WelcomeBox } from "@/components/welcome-box"
import { LaunchDialog } from "@/components/launch-dialog"

export default function Page() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4 sm:p-8">
      <TerminalWindow>
        <TerminalOutput />
        <WelcomeBox />
        <LaunchDialog />
      </TerminalWindow>
    </main>
  )
}
