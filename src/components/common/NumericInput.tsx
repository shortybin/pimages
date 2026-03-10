import { useState, useCallback } from 'react'

interface NumericInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  unit?: string
}

export function NumericInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
}: NumericInputProps) {
  const [inputValue, setInputValue] = useState(String(value))

  // Clamp value to min/max range
  const clampValue = useCallback(
    (val: number) => Math.max(min, Math.min(max, val)),
    [min, max]
  )

  // Handle direct input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  // Handle input blur - validate and commit
  const handleInputBlur = () => {
    const numValue = parseInt(inputValue, 10)
    if (!isNaN(numValue)) {
      const clampedValue = clampValue(numValue)
      onChange(clampedValue)
      setInputValue(String(clampedValue))
    } else {
      setInputValue(String(value))
    }
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur()
    }
  }

  // Handle increment
  const handleIncrement = () => {
    const newValue = clampValue(value + step)
    onChange(newValue)
    setInputValue(String(newValue))
  }

  // Handle decrement
  const handleDecrement = () => {
    const newValue = clampValue(value - step)
    onChange(newValue)
    setInputValue(String(newValue))
  }

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)
    onChange(newValue)
    setInputValue(String(newValue))
  }

  // Sync inputValue with value prop
  const displayInputValue = inputValue

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        <span className="text-xs text-slate-400">
          {min}-{max}{unit}
        </span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={handleSliderChange}
        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:shadow-sm"
      />

      {/* Input with +/- buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleDecrement}
          className="w-6 h-6 flex items-center justify-center rounded bg-slate-100
                     text-slate-600 hover:bg-slate-200 active:bg-slate-300
                     transition-colors text-sm font-medium"
        >
          -
        </button>
        <div className="flex-1 relative">
          <input
            type="text"
            value={displayInputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-6 px-2 text-center text-xs font-mono bg-slate-50
                       border border-slate-200 rounded focus:outline-none focus:border-indigo-400
                       focus:ring-1 focus:ring-indigo-400"
          />
          {unit && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              {unit}
            </span>
          )}
        </div>
        <button
          onClick={handleIncrement}
          className="w-6 h-6 flex items-center justify-center rounded bg-slate-100
                     text-slate-600 hover:bg-slate-200 active:bg-slate-300
                     transition-colors text-sm font-medium"
        >
          +
        </button>
      </div>
    </div>
  )
}
