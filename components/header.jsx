import { Show, SignInButton, UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'
import { LayoutDashboard, PenBox } from 'lucide-react'
import { checkUser } from '@/lib/chechUser'

const Header = async() => {
  await checkUser();
  
  return (
    <header className='fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b'>
      <nav className='container mx-auto px-4 py-4 flex items-center justify-between'>
        <Link href={'/'}>
          <Image
          src={"/logo.png"}
          alt='FinTrack logo'
          height={100}
          width={400}
          className='h-20 w-auto object-contain'
           />
        </Link>
              <div className='flex items-center space-x-4'>
                <Show when="signed-in">
                  <Link href={"/dashboard"} className='text-gray-600 hover:text-blue-600 flex items-center gap-2'>
                    <Button variant='outline'>
                      <LayoutDashboard size={18}/>
                      <span className='hidden md:inline'>Dashboard</span>
                    </Button>
                  </Link>

                  <Link href={"/transaction/create"} className='flex items-center gap-2'>
                    <Button>
                      <PenBox size={18}/>
                      <span className='hidden md:inline'>Add Transaction</span>
                    </Button>
                  </Link>
                  <UserButton appearance={{elements:{avatarBox: "w-18 h-18",},}} />
                </Show>
                <Show when="signed-out" >
                  <SignInButton forceRedirectUrl='/dashboard'>
                    <Button variant='outline'>Login</Button>
                  </SignInButton>
                </Show>
              </div>
      </nav>
    </header>
  )
}

export default Header
