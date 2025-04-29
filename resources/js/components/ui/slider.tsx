import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider-root"
      className={cn(
        "relative flex w-full h-6 items-center group",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="h-1 rounded-full w-full relative overflow-hidden bg-gray-300/50">
        <SliderPrimitive.Range className="absolute h-1 rounded-full bg-[#1A1A3D]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block w-3 h-3 rounded-full border-2 border-white bg-[#1A1A3D] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6800FF] cursor-pointer" />
    </SliderPrimitive.Root>
  )
}

export { Slider }
