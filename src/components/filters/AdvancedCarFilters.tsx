"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw } from "lucide-react";

interface RangeFilter {
  min: number;
  max: number;
  defaultMin: number;
  defaultMax: number;
  step: number;
  unit: string;
  alternateUnit?: string;
}

export function AdvancedCarFilters() {
  const [useAlternateUnit, setUseAlternateUnit] = useState(false);
  
  // Initial filter values
  const [filters, setFilters] = useState({
    horsepower: { min: 100, max: 700, defaultMin: 100, defaultMax: 700, step: 10, unit: "PS", alternateUnit: "kW" },
    displacement: { min: 1000, max: 8000, defaultMin: 1000, defaultMax: 8000, step: 100, unit: "cm³" },
    cylinders: { min: 3, max: 12, defaultMin: 3, defaultMax: 12, step: 1, unit: "" },
    range: { min: 300, max: 800, defaultMin: 300, defaultMax: 800, step: 50, unit: "km" },
    batteryCapacity: { min: 40, max: 150, defaultMin: 40, defaultMax: 150, step: 5, unit: "kWh" },
    towingCapacity: { min: 500, max: 3500, defaultMin: 500, defaultMax: 3500, step: 100, unit: "kg" },
    totalWeight: { min: 1000, max: 3000, defaultMin: 1000, defaultMax: 3000, step: 100, unit: "kg" },
    curbWeight: { min: 800, max: 2500, defaultMin: 800, defaultMax: 2500, step: 100, unit: "kg" }
  });

  // Convert PS to kW (approximately PS * 0.735)
  const convertToKW = (ps: number) => Math.round(ps * 0.735);
  
  // Convert kW to PS (approximately kW / 0.735)
  const convertToPS = (kw: number) => Math.round(kw / 0.735);

  // Handle filter changes
  const handleFilterChange = (
    filter: keyof typeof filters, 
    type: "min" | "max", 
    value: number
  ) => {
    setFilters(prev => ({
      ...prev,
      [filter]: {
        ...prev[filter],
        [type]: value
      }
    }));
  };

  // Toggle between PS and kW for horsepower
  const toggleHorsepowerUnit = () => {
    setUseAlternateUnit(!useAlternateUnit);
    
    if (!useAlternateUnit) {
      // Converting from PS to kW
      setFilters(prev => ({
        ...prev,
        horsepower: {
          ...prev.horsepower,
          min: convertToKW(prev.horsepower.min),
          max: convertToKW(prev.horsepower.max),
          defaultMin: convertToKW(prev.horsepower.defaultMin),
          defaultMax: convertToKW(prev.horsepower.defaultMax),
          step: 5 // Smaller step for kW
        }
      }));
    } else {
      // Converting from kW to PS
      setFilters(prev => ({
        ...prev,
        horsepower: {
          ...prev.horsepower,
          min: convertToPS(prev.horsepower.min),
          max: convertToPS(prev.horsepower.max),
          defaultMin: convertToPS(prev.horsepower.defaultMin),
          defaultMax: convertToPS(prev.horsepower.defaultMax),
          step: 10 // Larger step for PS
        }
      }));
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Advanced Filters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Horsepower Filter */}
        <div className="bg-background rounded-lg border p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Horsepower</h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleHorsepowerUnit}
                className="h-6 text-xs"
              >
                {useAlternateUnit ? "Show PS" : "Show kW"}
              </Button>
            </div>
          </div>
          
          <Slider 
            defaultValue={[filters.horsepower.min, filters.horsepower.max]}
            value={[filters.horsepower.min, filters.horsepower.max]}
            min={filters.horsepower.defaultMin} 
            max={filters.horsepower.defaultMax} 
            step={filters.horsepower.step}
            onValueChange={(value: number[]) => {
              handleFilterChange("horsepower", "min", value[0]);
              handleFilterChange("horsepower", "max", value[1]);
            }}
            className="mb-6"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center">
                <Input 
                  type="number"
                  value={filters.horsepower.min}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleFilterChange("horsepower", "min", parseInt(e.target.value) || 0)
                  }
                  className="h-8 text-sm w-full min-w-[80px]"
                />
                <span className="ml-2 text-sm text-muted-foreground whitespace-nowrap min-w-[30px]">
                  {useAlternateUnit ? filters.horsepower.alternateUnit : filters.horsepower.unit}
                </span>
              </div>
              <label className="text-xs text-muted-foreground mt-1">Min</label>
            </div>
            
            <div>
              <div className="flex items-center">
                <Input 
                  type="number"
                  value={filters.horsepower.max}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleFilterChange("horsepower", "max", parseInt(e.target.value) || 0)
                  }
                  className="h-8 text-sm w-full min-w-[80px]"
                />
                <span className="ml-2 text-sm text-muted-foreground whitespace-nowrap min-w-[30px]">
                  {useAlternateUnit ? filters.horsepower.alternateUnit : filters.horsepower.unit}
                </span>
              </div>
              <label className="text-xs text-muted-foreground mt-1">Max</label>
            </div>
          </div>
        </div>
        
        {/* Engine Displacement */}
        <div className="bg-background rounded-lg border p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Engine Displacement</h4>
          </div>
          
          <Slider 
            defaultValue={[filters.displacement.min, filters.displacement.max]}
            value={[filters.displacement.min, filters.displacement.max]}
            min={filters.displacement.defaultMin} 
            max={filters.displacement.defaultMax} 
            step={filters.displacement.step}
            onValueChange={(value: number[]) => {
              handleFilterChange("displacement", "min", value[0]);
              handleFilterChange("displacement", "max", value[1]);
            }}
            className="mb-6"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center">
                <Input 
                  type="number"
                  value={filters.displacement.min}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleFilterChange("displacement", "min", parseInt(e.target.value) || 0)
                  }
                  className="h-8 text-sm w-full min-w-[80px]"
                />
                <span className="ml-2 text-sm text-muted-foreground whitespace-nowrap min-w-[30px]">
                  {filters.displacement.unit}
                </span>
              </div>
              <label className="text-xs text-muted-foreground mt-1">Min</label>
            </div>
            
            <div>
              <div className="flex items-center">
                <Input 
                  type="number"
                  value={filters.displacement.max}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleFilterChange("displacement", "max", parseInt(e.target.value) || 0)
                  }
                  className="h-8 text-sm w-full min-w-[80px]"
                />
                <span className="ml-2 text-sm text-muted-foreground whitespace-nowrap min-w-[30px]">
                  {filters.displacement.unit}
                </span>
              </div>
              <label className="text-xs text-muted-foreground mt-1">Max</label>
            </div>
          </div>
        </div>
        
        {/* Cylinders */}
        <div className="bg-background rounded-lg border p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Cylinders</h4>
          </div>
          
          <Slider 
            defaultValue={[filters.cylinders.min, filters.cylinders.max]}
            value={[filters.cylinders.min, filters.cylinders.max]}
            min={filters.cylinders.defaultMin} 
            max={filters.cylinders.defaultMax} 
            step={filters.cylinders.step}
            onValueChange={(value: number[]) => {
              handleFilterChange("cylinders", "min", value[0]);
              handleFilterChange("cylinders", "max", value[1]);
            }}
            className="mb-6"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center">
                <Input 
                  type="number"
                  value={filters.cylinders.min}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleFilterChange("cylinders", "min", parseInt(e.target.value) || 0)
                  }
                  className="h-8 text-sm w-full min-w-[80px]"
                />
              </div>
              <label className="text-xs text-muted-foreground mt-1">Min</label>
            </div>
            
            <div>
              <div className="flex items-center">
                <Input 
                  type="number"
                  value={filters.cylinders.max}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleFilterChange("cylinders", "max", parseInt(e.target.value) || 0)
                  }
                  className="h-8 text-sm w-full min-w-[80px]"
                />
              </div>
              <label className="text-xs text-muted-foreground mt-1">Max</label>
            </div>
          </div>
        </div>
        
        {/* Range */}
        <div className="bg-background rounded-lg border p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Range</h4>
          </div>
          
          <Slider 
            defaultValue={[filters.range.min, filters.range.max]}
            value={[filters.range.min, filters.range.max]}
            min={filters.range.defaultMin} 
            max={filters.range.defaultMax} 
            step={filters.range.step}
            onValueChange={(value: number[]) => {
              handleFilterChange("range", "min", value[0]);
              handleFilterChange("range", "max", value[1]);
            }}
            className="mb-6"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center">
                <Input 
                  type="number"
                  value={filters.range.min}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleFilterChange("range", "min", parseInt(e.target.value) || 0)
                  }
                  className="h-8 text-sm w-full min-w-[80px]"
                />
                <span className="ml-2 text-sm text-muted-foreground whitespace-nowrap min-w-[30px]">
                  {filters.range.unit}
                </span>
              </div>
              <label className="text-xs text-muted-foreground mt-1">Min</label>
            </div>
            
            <div>
              <div className="flex items-center">
                <Input 
                  type="number"
                  value={filters.range.max}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleFilterChange("range", "max", parseInt(e.target.value) || 0)
                  }
                  className="h-8 text-sm w-full min-w-[80px]"
                />
                <span className="ml-2 text-sm text-muted-foreground whitespace-nowrap min-w-[30px]">
                  {filters.range.unit}
                </span>
              </div>
              <label className="text-xs text-muted-foreground mt-1">Max</label>
            </div>
          </div>
        </div>
        
        {/* Additional filters */}
        {/* Battery Capacity, Towing Capacity, etc. follow same pattern */}
      </div>
    </div>
  );
} 