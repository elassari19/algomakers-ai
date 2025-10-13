import Link from 'next/link'
import React from 'react'
import { AuthNavButtons } from './AuthNavButtons'

function MaingHeader() {
  return (
    <header className="w-[90%] md:w-[70%] lg:w-[75%] lg:max-w-screen-xl top-5 mx-auto sticky backdrop-blur-md border-red-600/80 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/10 to-pink-400/10 z-40 flex justify-between items-center px-8 shadow-lg shadow-black/20">
        <Link
          href="/"
          className="font-bold text-lg flex items-center text-white"
        >
          <div className="flex aspect-squares w-full items-center justify-center rounded-lg">
            <img src="/logo.svg" alt="AlgoMakers.AI" className="h-14 w-full" />
          </div>
        </Link>

        <nav className="hidden lg:flex items-center space-x-8">
          <Link
            href="/affiliate"
            className="text-sm font-medium text-zinc-300 hover:text-pink-400 transition-colors"
          >
            Affiliate Program
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-zinc-300 hover:text-pink-400 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="#testimonials"
            className="text-sm font-medium text-zinc-300 hover:text-pink-400 transition-colors"
          >
            Testimonials
          </Link>
          <Link
            href="#contact"
            className="text-sm font-medium text-zinc-300 hover:text-pink-400 transition-colors"
          >
            Contact
          </Link>
        </nav>

        <AuthNavButtons />
      </header>
  )
}

export default MaingHeader