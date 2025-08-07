"use client"

import { useEffect, useState } from "react"
import { motion, useSpring, useTransform } from "framer-motion"

interface AnimatedCounterProps {
  value: number
  duration?: number
  suffix?: string
  prefix?: string
}

export function AnimatedCounter({ value, duration = 1, suffix = "", prefix = "" }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const spring = useSpring(0, { duration: duration * 1000 })
  const display = useTransform(spring, (current) => Math.round(current))

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  useEffect(() => {
    const unsubscribe = display.onChange((latest) => {
      setDisplayValue(latest)
    })
    return unsubscribe
  }, [display])

  return (
    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      {prefix}
      {displayValue}
      {suffix}
    </motion.span>
  )
}
