"use client"

import Link from "next/link"
import { Button } from "./ui/button"
import Image from "next/image"
import { useEffect, useRef } from "react"

const HeroSection = () => {
  const imageRef = useRef(null)

 useEffect(() => {
  let ticking = false

  const handleScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const imageElement = imageRef.current
        if (!imageElement) return

        const scrollPosition = window.scrollY
        const scrollThreshold = 100

        if (scrollPosition > scrollThreshold) {
          imageElement.classList.add("scrolled")
        } else {
          imageElement.classList.remove("scrolled")
        }

        ticking = false
      })

      ticking = true
    }
  }

  window.addEventListener("scroll", handleScroll)

  return () => window.removeEventListener("scroll", handleScroll)
}, [])

  return (
    <div className="pb-20 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl md:text-8xl lg:text-[105px] pb-6 gradient-title">
          Manage Your Finances <br />with Intelligence
        </h1>

        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Track, analyze, and optimize your spending — powered by AI.
        </p>

        <div className="flex justify-center space-x-4">
          <Link href="/dashboard">
            <Button size="lg" className="px-8">
              Get Started
            </Button>
          </Link>
        </div>

        <div className="hero-image-wrapper">
          <div ref={imageRef} className="hero-image transition-all duration-500">
            <Image
              src="/ai.png"
              height={1280}
              width={720}
              alt="Dashboard Preview"
              className="rounded-lg shadow-2xl border mx-auto"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroSection