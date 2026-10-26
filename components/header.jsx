import { Show, SignInButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'
import { Home, LayoutDashboard, PenBox, Sparkles } from 'lucide-react'
import { checkUser } from '@/lib/chechUser'
import { ModeToggle } from './mode-toggle'
import { getUserAccounts } from '@/actions/dashboard'
import { AccountSwitcher } from './account-switcher'

const Header = async () => {
  const user = await checkUser();
  let accounts = [];

  if (user) {
    try {
      accounts = await getUserAccounts();
    } catch (e) {
      // User might not have accounts yet or is logged out
      accounts = [];
    }
  }

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-xl z-50 border-b border-border/60 transition-colors">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text hidden sm:inline">
            FinTrack
          </span>
        </Link>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Home Button */}
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground text-xs h-8 px-2.5"
              title="Home"
            >
              <Home size={15} />
              <span className="hidden md:inline">Home</span>
            </Button>
          </Link>

          {/* Account Switcher Button (when signed-in with accounts) */}
          <Show when="signed-in">
            {accounts.length > 0 && <AccountSwitcher accounts={accounts} />}

            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground text-xs h-8 px-2.5"
                title="Dashboard"
              >
                <LayoutDashboard size={15} />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>

            <Link href="/transaction/create">
              <Button
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs text-xs h-8 px-3"
              >
                <PenBox size={14} />
                <span className="hidden sm:inline">Add Transaction</span>
              </Button>
            </Link>

            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 ring-2 ring-primary/20",
                },
              }}
            />
          </Show>

          {/* Dark / Light Mode Switcher */}
          <ModeToggle />

          <Show when="signed-out">
            <SignInButton forceRedirectUrl="/dashboard">
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm text-xs h-8 px-3.5"
              >
                Sign In
              </Button>
            </SignInButton>
          </Show>
        </div>
      </nav>
    </header>
  );
};

export default Header;
