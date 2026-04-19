"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export interface GlowMenuItem {
  icon: LucideIcon | React.FC
  label: string
  href: string
  gradient: string
  iconColor: string
}

interface GlowMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  items: GlowMenuItem[]
  activeHref?: string
  orientation?: "horizontal" | "vertical"
}

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
}

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
}

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
}

const sharedTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.5,
}

export const GlowMenu = React.forwardRef<HTMLDivElement, GlowMenuProps>(
  ({ className, items, activeHref, orientation = "vertical", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative", className)}
        {...props}
      >
        <ul
          className={cn(
            "relative z-10",
            orientation === "vertical" ? "flex flex-col gap-0.5" : "flex items-center gap-1"
          )}
        >
          {items.map((item) => {
            const Icon = item.icon
            const isActive =
              activeHref === item.href ||
              (item.href !== "/dashboard" && activeHref?.startsWith(item.href + "/"))

            return (
              <motion.li key={item.href} className="relative w-full">
                <Link href={item.href} className="block w-full">
                  <motion.div
                    className="block rounded-xl overflow-visible group relative w-full"
                    style={{ perspective: "600px" }}
                    whileHover="hover"
                    initial="initial"
                  >
                    {/* Glow background */}
                    <motion.div
                      className="absolute inset-0 z-0 pointer-events-none rounded-xl"
                      variants={glowVariants}
                      animate={isActive ? "hover" : "initial"}
                      style={{
                        background: item.gradient,
                        borderRadius: "12px",
                      }}
                    />

                    {/* Front face */}
                    <motion.div
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 relative z-10 rounded-xl transition-colors w-full",
                        isActive
                          ? "bg-[#0A6A47] text-white shadow-lg shadow-emerald-900/15"
                          : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-800"
                      )}
                      variants={itemVariants}
                      transition={sharedTransition}
                      style={{
                        transformStyle: "preserve-3d",
                        transformOrigin: "center bottom",
                      }}
                    >
                      <span
                        className={cn(
                          "shrink-0 transition-colors duration-300",
                          isActive ? "text-white" : "text-slate-400 group-hover:" + item.iconColor.replace("text-", "")
                        )}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="text-[14px] font-semibold">{item.label}</span>
                    </motion.div>

                    {/* Back face (revealed on hover flip) */}
                    <motion.div
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 absolute inset-0 z-10 rounded-xl transition-colors w-full",
                        isActive
                          ? "bg-[#0A6A47] text-white"
                          : "text-slate-800"
                      )}
                      variants={backVariants}
                      transition={sharedTransition}
                      style={{
                        transformStyle: "preserve-3d",
                        transformOrigin: "center top",
                        rotateX: 90,
                      }}
                    >
                      <span className={cn("shrink-0 transition-colors duration-300", isActive ? "text-white" : item.iconColor)}>
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="text-[14px] font-semibold">{item.label}</span>
                    </motion.div>
                  </motion.div>
                </Link>
              </motion.li>
            )
          })}
        </ul>
      </div>
    )
  }
)

GlowMenu.displayName = "GlowMenu"
