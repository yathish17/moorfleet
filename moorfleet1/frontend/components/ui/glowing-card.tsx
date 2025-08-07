"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface GlowingCardProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
}

export function GlowingCard({ children, className, glowColor = "blue" }: GlowingCardProps) {
  const glowColors = {
    blue: "shadow-blue-500/25 hover:shadow-blue-500/40",
    green: "shadow-green-500/25 hover:shadow-green-500/40",
    red: "shadow-red-500/25 hover:shadow-red-500/40",
    yellow: "shadow-yellow-500/25 hover:shadow-yellow-500/40",
    purple: "shadow-purple-500/25 hover:shadow-purple-500/40",
  }

  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card
        className={cn(
          "backdrop-blur-sm bg-card/90 border-border/50 transition-all duration-300",
          "shadow-lg hover:shadow-xl",
          glowColors[glowColor as keyof typeof glowColors],
          className,
        )}
      >
        {children}
      </Card>
    </motion.div>
  )
}
