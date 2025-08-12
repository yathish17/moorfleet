"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import type { MooringUnit } from "@/lib/types"
import { MooringStateCard } from "@/components/ui/mooring-state-card"

interface MooringUnitsGridProps {
  units: MooringUnit[]
}

export function MooringUnitsGrid({ units }: MooringUnitsGridProps) {
  return (
    <section className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h2 className="text-3xl font-bold mb-2">MoorFleet Units status</h2>
        <p className="text-muted-foreground">Real-time status monitoring for all mooring units</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit, index) => (
          <motion.div
            key={unit.id || `unit-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link href={`/unit/${unit.id}`}>
              <MooringStateCard unit={unit} />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
