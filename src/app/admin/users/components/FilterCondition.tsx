'use client'

import React, { useCallback, useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FilterCondition,
  FilterField,
  FILTER_OPERATORS,
} from '../types/filters'

interface FilterConditionProps {
  condition: FilterCondition
  onConditionChange: (condition: FilterCondition) => void
  onRemove: () => void
  availableFields: FilterField[]
  isRemovable?: boolean
}

export const FilterConditionComponent: React.FC<FilterConditionProps> = ({
  condition,
  onConditionChange,
  onRemove,
  availableFields,
  isRemovable = true,
}) => {
  const currentField = useMemo(
    () => availableFields.find((f) => f.name === condition.field),
    [condition.field, availableFields]
  )

  const availableOperators = useMemo(
    () => currentField?.operators || [],
    [currentField?.operators]
  )

  const handleFieldChange = useCallback(
    (fieldName: string) => {
      const field = availableFields.find((f) => f.name === fieldName)
      if (!field) return

      onConditionChange({
        ...condition,
        field: fieldName,
        valueType: field.type,
        operator: field.operators[0],
        value: '',
      })
    },
    [availableFields, condition, onConditionChange]
  )

  const handleOperatorChange = useCallback(
    (operator: string) => {
      onConditionChange({
        ...condition,
        operator: operator as any,
      })
    },
    [condition, onConditionChange]
  )

  const handleValueChange = useCallback(
    (value: any) => {
      onConditionChange({
        ...condition,
        value,
      })
    },
    [condition, onConditionChange]
  )

  // Render value input based on value type
  const renderValueInput = () => {
    if (!currentField) {
      return null
    }

    // Skip value input for existence checks
    if (['isEmpty', 'isNotEmpty', 'isNull', 'isNotNull'].includes(condition.operator)) {
      return null
    }

    switch (currentField.type) {
      case 'select':
      case 'multiSelect':
        return (
          <Select value={condition.value || ''} onValueChange={handleValueChange}>
            <SelectTrigger className="flex-1 h-8">
              <SelectValue placeholder="Select value..." />
            </SelectTrigger>
            <SelectContent>
              {currentField.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'date':
      case 'dateRange':
        return (
          <Input
            type="date"
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            className="flex-1 h-8"
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            placeholder="Enter value..."
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            className="flex-1 h-8"
          />
        )

      default: // text
        return (
          <Input
            type="text"
            placeholder="Enter value..."
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            className="flex-1 h-8"
          />
        )
    }
  }

  return (
    <div className="flex gap-2 items-center flex-wrap">
      {/* Field selector */}
      <Select value={condition.field || ''} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-32 h-8">
          <SelectValue placeholder="Select field..." />
        </SelectTrigger>
        <SelectContent>
          {availableFields.map((field) => (
            <SelectItem key={field.name} value={field.name}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator selector */}
      {currentField && (
        <Select value={condition.operator || ''} onValueChange={handleOperatorChange}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue placeholder="Select operator..." />
          </SelectTrigger>
          <SelectContent>
            {availableOperators.map((op) => (
              <SelectItem key={op} value={op}>
                {FILTER_OPERATORS[op]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Value input */}
      {currentField && renderValueInput()}

      {/* Remove button */}
      {isRemovable && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700"
          title="Remove this condition"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}

export default FilterConditionComponent
