"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FloatingCardProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function FloatingCard({ children, className, delay = 0 }: FloatingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card
        className={cn(
          "backdrop-blur-sm bg-card/80 border-border/50 hover:border-primary/50 transition-all duration-300",
          className,
        )}
      >
        {children}
      </Card>
    </motion.div>
  )
}
