// app/inventory/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Fuel,
  Gauge,
  RefreshCcw,
  Tag,
  Calendar,
  X,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Search,
  Sparkles
} from "lucide-react";
import { AdvancedCarFilters } from "@/components/filters/AdvancedCarFilters";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { v4 as uuidv4 } from 'uuid';
// REMOVED INCORRECT IMPORT: import { formatPrice, formatMileage } from '@/utils/format';
import { toast } from "@/components/ui/use-toast";

// **** ADD THIS EXPORT ****
export const dynamic = 'force-dynamic';

// **** ADD THESE HELPER FUNCTIONS ****
const formatPrice = (price: number | null | undefined): string => {
  if (price == null) return "N/A"; // Handle null or undefined
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0 // No cents needed for car prices typically
  }).format(price);
};

const formatMileage = (mileage: number | null | undefined): string => {
  if (mileage == null) return "N/A"; // Handle null or undefined
  // Format with commas and add " mi" suffix
  return `${new Intl.NumberFormat('en-US').format(mileage)} mi`;
};
// ************************************

// Type for car listing from database
interface CarListing {
  id: string;
  make: string;
  model: string;
  year: number | null;
  price: number | null;
  mileage: number | null;
  fuel_type: string | null;
  transmission: string | null;
  condition: string | null;
  location_city: string | null;
  location_country: string | null;
  images: string[] | null;
  description: string | null;
  body_type?: string | null;
}

// Define the component props properly
interface AdvancedCarFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onClose: () => void;
}

// Interfaces for makes and models
interface CarMake {
  id: string;
  name: string;
}

interface CarModel {
  id: string;
  make_id: string;
  name: string;
}

// Define a type for the filter state
interface FilterState {
  make: string;
  model: string;
  yearMin: number;
  yearMax: number;
  priceMin: number;
  priceMax: number;
  mileageMin: number;
  mileageMax: number;
  fuelType: string;
  transmission: string;
  condition: string;
  bodyType: string;
}

// Default filter values constant
const defaultFilters: FilterState = {
  make: "Any",
  model: "",
  yearMin: 2010,
  yearMax: new Date().getFullYear(),
  priceMin: 0,
  priceMax: 150000,
  mileageMin: 0,
  mileageMax: 100000,
  fuelType: "Any",
  transmission: "Any",
  condition: "Any",
  bodyType: "Any"
};

// Helper function to parse sort option
const parseSortOption = (option: string): [string, string] => {
  if (!option || !option.includes('-')) return ['created_at', 'desc'];
  const [field, direction] = option.split('-');
  return [field, direction];
};

// Wrap the main component in Suspense for useSearchParams
export default function InventoryPageWrapper() {
  return (
    <Suspense fallback={<InventoryLoadingSkeleton />}>
      <InventoryPage />
    </Suspense>
  );
}

// Loading Skeleton Component
function InventoryLoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

function InventoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>(() => {
    const initialFilters = { ...defaultFilters };
    const bodyTypeParam = searchParams.get('body_type') || searchParams.get('type');
    if (bodyTypeParam) initialFilters.bodyType = bodyTypeParam;
    const fuelTypeParam = searchParams.get('fuel_type');
    if (fuelTypeParam) initialFilters.fuelType = fuelTypeParam;
    const makeParam = searchParams.get('make');
    if (makeParam) initialFilters.make = makeParam;
    const modelParam = searchParams.get('model');
    if (modelParam) initialFilters.model = modelParam;
    const conditionParam = searchParams.get('condition');
    if (conditionParam) initialFilters.condition = conditionParam;
    const transmissionParam = searchParams.get('transmission');
    if (transmissionParam) initialFilters.transmission = transmissionParam;
    // Add parsing for price, year, mileage ranges from URL if needed
    const priceMinParam = searchParams.get('price_min');
    if (priceMinParam) initialFilters.priceMin = parseInt(priceMinParam, 10) || defaultFilters.priceMin;
    const priceMaxParam = searchParams.get('price_max');
    if (priceMaxParam) initialFilters.priceMax = parseInt(priceMaxParam, 10) || defaultFilters.priceMax;
    // ... similar for year and mileage ...
    return initialFilters;
  });

  const [sortOption, setSortOption] = useState<string>(() => {
    return searchParams.get('sort') || "price-asc";
  });

  // Other state variables...
  const [makes, setMakes] = useState<CarMake[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [makesLoading, setMakesLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<{ [key: string]: number }>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [aiSearchInput, setAiSearchInput] = useState("");
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // --- Data Fetching and Filtering Logic ---

  const fetchAndSetCars = useCallback(async (currentFilters: FilterState, currentSort: string) => {
    setLoading(true);
    setError(null);
    const queryParams = new URLSearchParams();

    // Build query params (ensure default values are not added unless necessary)
    if (currentFilters.make !== defaultFilters.make) queryParams.append('make', currentFilters.make);
    if (currentFilters.model && currentFilters.model !== defaultFilters.model && currentFilters.model !== "any") queryParams.append('model', currentFilters.model);
    if (currentFilters.yearMin > defaultFilters.yearMin) queryParams.append('year_from', currentFilters.yearMin.toString());
    if (currentFilters.yearMax < defaultFilters.yearMax) queryParams.append('year_to', currentFilters.yearMax.toString());
    if (currentFilters.priceMin > defaultFilters.priceMin) queryParams.append('price_min', currentFilters.priceMin.toString());
    if (currentFilters.priceMax < defaultFilters.priceMax) queryParams.append('price_max', currentFilters.priceMax.toString());
    if (currentFilters.mileageMin > defaultFilters.mileageMin) queryParams.append('mileage_min', currentFilters.mileageMin.toString());
    if (currentFilters.mileageMax < defaultFilters.mileageMax) queryParams.append('mileage_max', currentFilters.mileageMax.toString());
    if (currentFilters.fuelType !== defaultFilters.fuelType) queryParams.append('fuel_type', currentFilters.fuelType);
    if (currentFilters.transmission !== defaultFilters.transmission) queryParams.append('transmission', currentFilters.transmission);
    if (currentFilters.condition !== defaultFilters.condition) queryParams.append('condition', currentFilters.condition);
    if (currentFilters.bodyType !== defaultFilters.bodyType) queryParams.append('body_type', currentFilters.bodyType);

    const [sortBy, sortOrder] = parseSortOption(currentSort);
    queryParams.append('sortBy', sortBy);
    queryParams.append('sortOrder', sortOrder);
    // Add combined sort option to URL for easier state restoration
    if (currentSort !== "price-asc") { // Only add if not default
      queryParams.append('sort', currentSort);
    }


    const searchString = queryParams.toString();
    // Use router.replace to update URL without adding to history, disable scroll restoration
    // Only update if the search string actually changed
    if (searchString !== searchParams.toString().split('?')[1]) { // Compare only query part
      router.replace(`/inventory?${searchString}`, { scroll: false });
    }


    console.log("Fetching inventory with:", searchString || " (no params)");

    try {
      // Ensure API endpoint exists and handles parameters correctly
      const response = await fetch(`/api/inventory?${searchString}`);
      if (!response.ok) {
        throw new Error(`API Error (${response.status}): ${await response.text()}`);
      }
      const result = await response.json();

      if (result && result.data && Array.isArray(result.data)) {
        setCars(result.data);
      } else {
        console.error('Unexpected API data format:', result);
        setError('Received invalid data format from server');
        setCars([]);
      }
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError(`Failed to load inventory. ${err instanceof Error ? err.message : 'Please try again later.'}`);
      setCars([]); // Clear cars on error
    } finally {
      setLoading(false);
    }
  }, [router, searchParams]);

  // Effect to fetch initial cars or when sort/filters change via state
  useEffect(() => {
    console.log("Filters/Sort state changed, refetching cars...");
    fetchAndSetCars(filters, sortOption);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortOption]); // Runs when filters or sortOption state objects change

  // Effect to synchronize filters state *from* URL search params changes (e.g., back/forward nav)
  useEffect(() => {
    // Function to safely parse numbers from params
    const getIntParam = (name: string, defaultValue: number): number => {
      const param = searchParams.get(name);
      return param ? (parseInt(param, 10) || defaultValue) : defaultValue;
    };

    // Construct filter state based purely on current URL params
    const filtersFromUrl: FilterState = {
      make: searchParams.get('make') || defaultFilters.make,
      model: searchParams.get('model') || defaultFilters.model,
      yearMin: getIntParam('year_from', defaultFilters.yearMin),
      yearMax: getIntParam('year_to', defaultFilters.yearMax),
      priceMin: getIntParam('price_min', defaultFilters.priceMin),
      priceMax: getIntParam('price_max', defaultFilters.priceMax),
      mileageMin: getIntParam('mileage_min', defaultFilters.mileageMin),
      mileageMax: getIntParam('mileage_max', defaultFilters.mileageMax),
      fuelType: searchParams.get('fuel_type') || defaultFilters.fuelType,
      transmission: searchParams.get('transmission') || defaultFilters.transmission,
      condition: searchParams.get('condition') || defaultFilters.condition,
      bodyType: searchParams.get('body_type') || searchParams.get('type') || defaultFilters.bodyType,
    };
    const sortFromUrl = searchParams.get('sort') || "price-asc";

    // Check if the derived state from URL differs from the current component state
    const filtersDiffer = JSON.stringify(filtersFromUrl) !== JSON.stringify(filters);
    const sortDiffer = sortFromUrl !== sortOption;


    if (filtersDiffer || sortDiffer) {
      console.log("URL changed (e.g., back/forward nav), syncing state...");
      if (filtersDiffer) {
        setFilters(filtersFromUrl);
      }
      if (sortDiffer) {
        setSortOption(sortFromUrl);
      }
      // The state updates above will trigger the main fetch useEffect
    }
  }, [searchParams]); // Only depends on searchParams object reference

  // Fetch car makes
  useEffect(() => {
    const fetchMakes = async () => {
      setMakesLoading(true);
      try {
        const response = await fetch('/api/car-makes'); // Ensure this API route exists
        if (!response.ok) throw new Error('Failed to fetch makes');
        const data = await response.json();
        setMakes(data || []); // Handle empty response
      } catch (err) {
        console.error('Error fetching car makes:', err);
        // Optionally show a non-critical error to the user
      } finally {
        setMakesLoading(false);
      }
    };
    fetchMakes();
  }, []);

  // Fetch models when make changes
  useEffect(() => {
    if (filters.make === "Any" || filters.make === defaultFilters.make) {
      setAvailableModels([]);
      return;
    }
    const selectedMake = makes.find(make => make.name === filters.make);
    if (!selectedMake) {
      setAvailableModels([]);
      return;
    }

    setModelsLoading(true);
    fetch(`/api/car-models?make_id=${selectedMake.id}`) // Ensure this API route exists
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch models');
        return res.json();
      })
      .then(data => setAvailableModels(data || []))
      .catch(err => {
        console.error('Error fetching car models:', err);
        setAvailableModels([]);
      })
      .finally(() => setModelsLoading(false));
  }, [filters.make, makes]); // Depends on filters.make and the makes list


  // --- Event Handlers ---

  const handleFilterChange = (name: keyof FilterState, value: string | number) => {
    setFilters(prev => {
      const newState = { ...prev, [name]: value };
      if (name === "make" && value !== prev.make) {
        newState.model = ""; // Reset model if make changes
      }
      // Reset make if body type is changed back to Any? Optional UX decision.
      // if (name === "bodyType" && value === "Any") {
      //     newState.make = "Any";
      //     newState.model = "";
      // }
      return newState;
    });
    // Main fetch useEffect will trigger due to state change
  };

  const handleSliderChange = (nameMin: keyof FilterState, nameMax: keyof FilterState, value: number[]) => {
    setFilters(prev => ({
      ...prev,
      [nameMin]: value[0],
      [nameMax]: value[1],
    }));
    // Main fetch useEffect will trigger due to state change
  };

  // Function is kept for potential explicit "Apply" button, though immediate updates are default now
  const applyFilters = () => {
    console.log("Manual Apply Filters triggered (refetching with current state)");
    fetchAndSetCars(filters, sortOption);
    trackSearchInteraction(filters); // Track when explicitly applied
  };

  const resetFilters = () => {
    // Check if already default to avoid unnecessary state update and fetch
    if (JSON.stringify(filters) === JSON.stringify(defaultFilters) && sortOption === "price-asc") {
      return;
    }
    setFilters(defaultFilters);
    setSortOption("price-asc");
    // Update URL to reflect reset state
    router.replace('/inventory', { scroll: false });
    // Main fetch useEffect will trigger due to state change
  };

  const handleSortChange = (value: string) => {
    // Check if sort option actually changed
    if (value === sortOption) return;
    setSortOption(value);
    // Main fetch useEffect will trigger due to state change
  };

  const nextImage = (carId: string, imageCount: number) => {
    if (!carId || imageCount <= 1) return;
    setActiveImageIndex(prev => ({
      ...prev,
      [carId]: ((prev[carId] || 0) + 1) % imageCount
    }));
  };

  const prevImage = (carId: string, imageCount: number) => {
    if (!carId || imageCount <= 1) return;
    setActiveImageIndex(prev => ({
      ...prev,
      [carId]: ((prev[carId] || 0) - 1 + imageCount) % imageCount
    }));
  };

  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };

  // Debounced tracking or track on explicit actions (like apply/view details) might be better
  const trackSearchInteraction = async (appliedFilters: FilterState, clickedListingId: string | null = null) => {
    console.log("Tracking search interaction...");
    // Basic implementation, consider debouncing or tracking on specific events
    try {
      let sessionId = localStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = uuidv4();
        localStorage.setItem('session_id', sessionId);
      }

      let makeId: string | null = null;
      if (appliedFilters.make && appliedFilters.make !== "Any") {
        const selectedMake = makes.find(make => make.name === appliedFilters.make);
        if (selectedMake) makeId = selectedMake.id;
      }

      let modelId: string | null = null;
      if (appliedFilters.model && appliedFilters.model !== "" && appliedFilters.model !== "Any" && availableModels.length > 0) {
        const selectedModel = availableModels.find(model => model.name === appliedFilters.model);
        if (selectedModel) modelId = selectedModel.id;
      }

      // Ensure API route exists and handles the request
      await fetch('/api/track/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          make_id: makeId,
          model_id: modelId,
          filters: appliedFilters,
          sort_option: sortOption, // Include sort option in tracking
          results_count: cars.length, // Include how many results were shown
          clicked_listing_id: clickedListingId
        }),
      });
    } catch (trackingError) {
      console.warn('Failed to track search interaction:', trackingError);
    }
  };

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = aiSearchInput.trim();
    if (!trimmedInput) return;

    setAiSearchLoading(true);
    setSearchError(null);

    try {
      // Ensure API route exists
      const response = await fetch('/api/ai-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: trimmedInput }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'AI search request failed');
      }

      const { parsed_filters, confidence, success } = await response.json();

      if (!success || !parsed_filters) {
        throw new Error('Could not understand your search request.');
      }

      // Update filters state based on AI results
      setFilters(prevFilters => {
        const newFilters = { ...prevFilters }; // Start with existing filters

        // Map parsed fields carefully, checking for existence
        if (parsed_filters.make) newFilters.make = parsed_filters.make;
        if (parsed_filters.model) newFilters.model = parsed_filters.model;
        if (parsed_filters.body_type) newFilters.bodyType = parsed_filters.body_type;
        if (typeof parsed_filters.year_min === 'number') newFilters.yearMin = parsed_filters.year_min;
        if (typeof parsed_filters.year_max === 'number') newFilters.yearMax = parsed_filters.year_max;
        if (typeof parsed_filters.price_min === 'number') newFilters.priceMin = parsed_filters.price_min;
        if (typeof parsed_filters.price_max === 'number') newFilters.priceMax = parsed_filters.price_max;
        if (typeof parsed_filters.mileage_min === 'number') newFilters.mileageMin = parsed_filters.mileage_min;
        if (typeof parsed_filters.mileage_max === 'number') newFilters.mileageMax = parsed_filters.mileage_max;
        if (parsed_filters.fuel_type) newFilters.fuelType = parsed_filters.fuel_type;
        if (parsed_filters.transmission) newFilters.transmission = parsed_filters.transmission;
        if (parsed_filters.condition) newFilters.condition = parsed_filters.condition;

        // Reset model if make was changed by AI but model wasn't provided
        if (parsed_filters.make && !parsed_filters.model && newFilters.make !== prevFilters.make) {
          newFilters.model = "";
        }
        return newFilters;
      });

      // Main fetch useEffect will trigger. Show toast feedback.
      toast({
        title: "AI Search Applied",
        description: confidence > 0.7 ? "Filters updated based on your request." : "Interpreted your search, review filters.",
        variant: confidence > 0.7 ? "default" : "destructive"
      });

    } catch (error) {
      console.error('AI search error:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      setSearchError(message);
      toast({ title: "AI Search Error", description: message, variant: "destructive" });
    } finally {
      setAiSearchLoading(false);
    }
  };


  // --- Render Logic ---

  // Use the skeleton if initial loading and no cars yet
  if (loading && cars.length === 0 && !error) {
    return <InventoryLoadingSkeleton />;
  }

  // Show persistent error if loading failed critically before any cars were loaded
  if (error && cars.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center p-6 bg-red-50 rounded-lg shadow-md max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Inventory</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchAndSetCars(filters, sortOption)}> {/* Allow retry */}
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-muted/40 py-12">
        <div className="container max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">Browse Our Inventory</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find your next vehicle using our smart filters or describe what you're looking for.
          </p>
        </div>
      </div>

      <section className="container max-w-6xl mx-auto px-6">
        {/* AI Search */}
        <div className="py-6 mb-6">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              Describe Your Ideal Car
            </h2>
            <form onSubmit={handleAiSearch} className="flex flex-col sm:flex-row gap-2">
              {/* Input and Button */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={aiSearchInput}
                  onChange={(e) => setAiSearchInput(e.target.value)}
                  placeholder="e.g., Sporty coupe under $50k, low miles"
                  className="pl-10 w-full"
                  disabled={aiSearchLoading}
                  aria-label="Describe desired car"
                />
              </div>
              <Button type="submit" disabled={aiSearchLoading || !aiSearchInput.trim()} className="w-full sm:w-auto">
                {aiSearchLoading ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div> Searching...</>
                ) : "Find My Car"}
              </Button>
            </form>
            {/* AI Search Error Display */}
            {searchError && (
              <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {searchError}
              </div>
            )}
          </div>
        </div>

        {/* Filters Section - Sticky */}
        <div className="bg-background py-4 border-y mb-6 sticky top-0 z-30 shadow-sm">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3 items-end">
              {/* Make */}
              <div className="space-y-1">
                <label htmlFor="make-select" className="text-xs font-medium text-gray-600">Make</label>
                <Select value={filters.make} onValueChange={(v) => handleFilterChange("make", v)} disabled={makesLoading}>
                  <SelectTrigger id="make-select" className="h-9 text-sm"><SelectValue placeholder="Any Make" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any">Any Make</SelectItem>
                    {makes.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Model */}
              <div className="space-y-1">
                <label htmlFor="model-select" className="text-xs font-medium text-gray-600">Model</label>
                <Select value={filters.model || "any"} onValueChange={(v) => handleFilterChange("model", v === "any" ? "" : v)} disabled={filters.make === "Any" || modelsLoading || !availableModels.length}>
                  <SelectTrigger id="model-select" className="h-9 text-sm"><SelectValue placeholder={modelsLoading ? "Loading..." : "Any Model"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Model</SelectItem>
                    {availableModels.map(m => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Body Type */}
              <div className="space-y-1">
                <label htmlFor="body-type-select" className="text-xs font-medium text-gray-600">Body Type</label>
                <Select value={filters.bodyType} onValueChange={(v) => handleFilterChange("bodyType", v)}>
                  <SelectTrigger id="body-type-select" className="h-9 text-sm"><SelectValue placeholder="Any Body Type" /></SelectTrigger>
                  <SelectContent>
                    {['Any', 'Sedan', 'SUV', 'Coupe', 'Convertible', 'Hatchback', 'Wagon', 'Truck', 'Van'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Reset Button - Placed here for better alignment on larger screens */}
              <div className="flex justify-end">
                <Button variant="ghost" onClick={resetFilters} size="sm" className="text-xs text-muted-foreground hover:text-primary self-end h-9">
                  <RefreshCcw className="mr-1 h-3 w-3" /> Reset All
                </Button>
              </div>
            </div>

            {/* Sliders could go here in a collapsible section if needed */}
            {/* <Button onClick={toggleAdvancedFilters}>Advanced</Button> */}
            {/* {showAdvancedFilters && ( ... sliders ... )} */}

          </div>
        </div>

        {/* Results Count and Sort */}
        <div className="flex flex-col sm:flex-row justify-between items-center my-6 pt-4">
          <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
            {loading ? "Searching..." : `Showing ${cars.length} vehicle${cars.length !== 1 ? 's' : ''}`}
          </div>
          {/* Inline Error Message if fetch failed but cars are still displayed */}
          {error && !loading && cars.length > 0 && (
            <div className="text-xs text-red-600 flex items-center gap-1 mx-4">
              <AlertCircle className="h-3 w-3" /> Error updating results.
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm">Sort by:</span>
            <Select value={sortOption} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="year-desc">Year: Newest</SelectItem>
                <SelectItem value="year-asc">Year: Oldest</SelectItem>
                <SelectItem value="mileage-asc">Mileage: Lowest</SelectItem>
                <SelectItem value="created_at-desc">Date Added: Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Car Grid Area */}
        <div className="relative min-h-[400px]">
          {/* Loading Overlay - covers grid when loading */}
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Grid or No Results Message */}
          {!loading && cars.length === 0 && !error ? (
            <div className="w-full p-8 text-center min-h-[300px] flex flex-col items-center justify-center border rounded-lg bg-muted/30">
              <Search className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-lg font-medium mb-2">No vehicles match your criteria</p>
              <p className="text-muted-foreground mb-4">Try adjusting filters or use the AI search above.</p>
              <Button onClick={resetFilters} variant="outline">
                <RefreshCcw className="mr-2 h-4 w-4" /> Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {cars.map((car) => (
                <Card key={car.id} className="overflow-hidden transition-shadow duration-300 hover:shadow-lg focus-within:shadow-lg group flex flex-col">
                  {/* Image */}
                  <div className="aspect-video relative overflow-hidden bg-muted flex-shrink-0">
                    <div className="absolute inset-0 z-10" /> {/* Optional: Gradient overlay */}
                    {car.images && car.images.length > 0 ? (
                      car.images.map((image, index) => (
                        <div key={index} className={`absolute inset-0 transition-opacity duration-300 ${(activeImageIndex[car.id] || 0) === index ? 'opacity-100' : 'opacity-0'}`}>
                          <Image fill src={image} alt={`${car.make} ${car.model} view ${index + 1}`} className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" priority={index === 0} onError={(e) => e.currentTarget.src = '/images/car-placeholder.jpg'} />
                        </div>
                      ))
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <Image src="/images/car-placeholder.jpg" alt="Placeholder" width={100} height={75} className="opacity-50" />
                      </div>
                    )}
                    {/* Carousel Controls */}
                    {car.images && car.images.length > 1 && (
                      <>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevImage(car.id, car.images!.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 focus:opacity-100" aria-label="Previous image"><ChevronLeft className="h-5 w-5" /></button>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextImage(car.id, car.images!.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 focus:opacity-100" aria-label="Next image"><ChevronRight className="h-5 w-5" /></button>
                      </>
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex flex-col flex-grow p-4">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">{car.make} {car.model}</h3>
                      <div className="text-base font-bold text-primary whitespace-nowrap">{formatPrice(car.price)}</div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{car.year} • {car.condition || 'N/A'}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-4 flex-grow">
                      <div className="flex items-center gap-1.5"><Fuel size={14} className="flex-shrink-0" /> <span className="truncate">{car.fuel_type || "N/A"}</span></div>
                      <div className="flex items-center gap-1.5"><Gauge size={14} className="flex-shrink-0" /> <span className="truncate">{formatMileage(car.mileage)}</span></div>
                      <div className="flex items-center gap-1.5"><Tag size={14} className="flex-shrink-0" /> <span className="truncate">{car.transmission || "N/A"}</span></div>
                      {car.body_type && <div className="flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16.5V18a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2v-1.5m4-12V5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v1.5m10 0h.5a2.5 2.5 0 0 1 0 5H3M4 6.5h.5a2.5 2.5 0 0 0 0 5H2" /></svg><span className="truncate">{car.body_type}</span></div>}
                    </div>
                    <Link href={`/inventory/${car.id}`} className="mt-auto w-full">
                      <Button variant="default" size="sm" className="w-full text-sm">
                        View Details <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Placeholder */}
        {/* Add real pagination based on total count from API */}

      </section>
    </div>
  );
}