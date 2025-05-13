"use client"

import { Search, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  isLoading?: boolean
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
  isLoading = false,
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the input when clicking on the container
  const handleContainerClick = () => {
    inputRef.current?.focus()
  }

  // Clear the search input
  const handleClear = () => {
    onChange("")
    inputRef.current?.focus()
  }

  return (
    <div
      className={cn(
        "flex items-center border rounded-md px-3 py-2 bg-background transition-all duration-200",
        isFocused ? "ring-2 ring-ring ring-offset-background" : "",
        className,
      )}
      onClick={handleContainerClick}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 text-primary mr-2 flex-shrink-0 animate-spin" />
      ) : (
        <Search className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
      )}
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 ml-1 flex-shrink-0"
          onClick={handleClear}
          type="button"
          disabled={isLoading}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  )
}
