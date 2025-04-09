"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { formatPrice, formatMileage } from '@/utils/format';
import { toast } from "@/components/ui/use-toast";

// Generate dummy images for each car (simulating a carousel)
const generateDummyImages = (id: number) => [
  `/images/car-${id}.jpg`,
  `/images/car-${id % 9 + 1}.jpg`,
  `/images/car-${(id + 1) % 9 + 1}.jpg`,
];

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
  // Add other fields as needed for your UI
}

// Add this interface to define the component props properly
interface AdvancedCarFiltersProps {
  filters: {
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
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  onClose: () => void;
}

// Add new interfaces for makes and models
interface CarMake {
  id: string;
  name: string;
}

interface CarModel {
  id: string;
  make_id: string;
  name: string;
}

export default function InventoryPage() {
  const [cars, setCars] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state - moved up before any useEffects that use it
  const [filters, setFilters] = useState({
    make: "Any",
    model: "",
    yearMin: 2010,
    yearMax: 2024,
    priceMin: 0,
    priceMax: 150000,
    mileageMin: 0,
    mileageMax: 100000,
    fuelType: "Any",
    transmission: "Any",
    condition: "Any",
    bodyType: "Any"
  });

  // New state for makes and models
  const [makes, setMakes] = useState<CarMake[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [makesLoading, setMakesLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [openModelPopover, setOpenModelPopover] = useState(false);

  // Image carousel state for each car
  const [activeImageIndex, setActiveImageIndex] = useState<{ [key: string]: number }>({});

  // Update to fetch and store models for the selected make
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);
  const [modelLoading, setModelLoading] = useState(false);

  // Add search functionality for model selection
  const [modelSearchTerm, setModelSearchTerm] = useState('');

  // Add this state variable near the other state declarations (around line 158)
  const [sortOption, setSortOption] = useState<string>("price-asc");

  // Add new state for AI search
  const [aiSearchInput, setAiSearchInput] = useState("");
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Fetch car data
  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      setError(null);

      try {
        // Add sort parameters to initial fetch
        const [sortBy, sortOrder] = parseSortOption(sortOption);
        const queryParams = new URLSearchParams({
          sortBy,
          sortOrder
        });

        const response = await fetch(`/api/inventory?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch inventory');
        }

        const result = await response.json();

        // Check if the API returned the expected format (object with data property)
        if (result && result.data && Array.isArray(result.data)) {
          setCars(result.data);
        } else if (Array.isArray(result)) {
          // Handle legacy format (direct array)
          setCars(result);
        } else {
          // If data is not in expected format
          console.error('Unexpected data format:', result);
          setError('Received invalid data format from server');
          setCars([]);
        }
      } catch (err) {
        console.error('Error fetching cars:', err);
        setError('Failed to load inventory. Please try again later.');
        setCars([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [sortOption]); // Add sortOption to dependencies

  // Fetch car makes data
  useEffect(() => {
    const fetchMakes = async () => {
      setMakesLoading(true);
      try {
        const response = await fetch('/api/car-makes');
        if (!response.ok) {
          throw new Error('Failed to fetch car makes');
        }
        const data = await response.json();
        setMakes(data);
      } catch (err) {
        console.error('Error fetching car makes:', err);
        // Don't set the main error state as this is not critical
      } finally {
        setMakesLoading(false);
      }
    };

    fetchMakes();
  }, []);

  // Updated: Fetch models when make changes using make_id
  useEffect(() => {
    if (filters.make === "Any") {
      setAvailableModels([]);
      return;
    }

    // Find the selected make's ID
    const selectedMake = makes.find(make => make.name === filters.make);
    if (!selectedMake) {
      console.error('Selected make not found in makes list');
      setAvailableModels([]);
      return;
    }

    setModelLoading(true);

    fetch(`/api/car-models?make_id=${selectedMake.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch models');
        return res.json();
      })
      .then(data => {
        setAvailableModels(data);
      })
      .catch(err => {
        console.error('Error fetching car models:', err);
        setAvailableModels([]);
      })
      .finally(() => {
        setModelLoading(false);
      });
  }, [filters.make, makes]);

  // Format price as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Updated handleFilterChange to reset model when make changes
  const handleFilterChange = (name: string, value: string | number) => {
    if (name === "make" && value !== filters.make) {
      // Fix the type issue by ensuring we're setting a string for make
      setFilters(prev => ({
        ...prev,
        [name]: value as string, // Explicitly cast to string when name is "make"
        model: ""
      }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      make: "Any",
      model: "",
      yearMin: 2010,
      yearMax: 2024,
      priceMin: 0,
      priceMax: 150000,
      mileageMin: 0,
      mileageMax: 100000,
      fuelType: "Any",
      transmission: "Any",
      condition: "Any",
      bodyType: "Any"
    });
  };

  // Updated carousel navigation functions to use dynamic image count
  const nextImage = (carId: string, imageCount: number) => {
    if (imageCount <= 0) return;

    setActiveImageIndex(prev => ({
      ...prev,
      [carId]: ((prev[carId] || 0) + 1) % imageCount // Dynamic count instead of hardcoded 3
    }));
  };

  const prevImage = (carId: string, imageCount: number) => {
    if (imageCount <= 0) return;

    setActiveImageIndex(prev => ({
      ...prev,
      [carId]: ((prev[carId] || 0) - 1 + imageCount) % imageCount // Dynamic count
    }));
  };

  // New state for advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Toggle advanced filters
  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };

  // Add this UUID validation helper function
  function isValidUuid(uuid: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Updated applyFilters function - fixes the setTotalResults error
  const applyFilters = async () => {
    setLoading(true);
    setError(null);

    // Build query string from filters
    const queryParams = new URLSearchParams();

    // Add all valid filters to query params
    if (filters.make !== "Any") queryParams.append('make', filters.make);
    if (filters.model && filters.model !== "Any") queryParams.append('model', filters.model);
    if (filters.yearMin > 2010) queryParams.append('year_from', filters.yearMin.toString());
    if (filters.yearMax < 2024) queryParams.append('year_to', filters.yearMax.toString());
    if (filters.priceMin > 0) queryParams.append('price_min', filters.priceMin.toString());
    if (filters.priceMax < 150000) queryParams.append('price_max', filters.priceMax.toString());
    if (filters.mileageMin > 0) queryParams.append('mileage_min', filters.mileageMin.toString());
    if (filters.mileageMax < 100000) queryParams.append('mileage_max', filters.mileageMax.toString());
    if (filters.fuelType !== "Any") queryParams.append('fuel_type', filters.fuelType);
    if (filters.transmission !== "Any") queryParams.append('transmission', filters.transmission);
    if (filters.condition !== "Any") queryParams.append('condition', filters.condition);
    if (filters.bodyType !== "Any") queryParams.append('body_type', filters.bodyType);

    // Add sort parameters based on sortOption
    const [sortBy, sortOrder] = parseSortOption(sortOption);
    queryParams.append('sortBy', sortBy);
    queryParams.append('sortOrder', sortOrder);

    // Add debug logging before the fetch call
    console.log("Querying inventory with:", queryParams.toString());

    try {
      const response = await fetch(`/api/inventory?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch filtered results');
      }

      const data = await response.json();

      // Update this line to match the backend response structure
      setCars(Array.isArray(data.data) ? data.data : []);

      // After successfully fetching and setting cars data
      // Track the search interaction
      try {
        // Get session ID from localStorage or create a new one
        let sessionId = localStorage.getItem('session_id');
        if (!sessionId) {
          sessionId = uuidv4();
          localStorage.setItem('session_id', sessionId);
        }

        // Extract make_id and model_id if they exist in the filtered results
        let makeId: string | null = null;
        let modelId: string | null = null;

        // If make is selected, find the corresponding make_id
        if (filters.make && filters.make !== "Any") {
          const selectedMake = makes.find(make => make.name === filters.make);
          if (selectedMake) {
            makeId = selectedMake.id;
          }
        }

        // If model is selected, find the corresponding model_id
        if (filters.model && filters.model !== "Any") {
          const selectedModel = availableModels.find(model => model.name === filters.model);
          if (selectedModel) {
            modelId = selectedModel.id;
          }
        }

        // Send the tracking data
        await fetch('/api/track/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            make_id: makeId,
            model_id: modelId,
            filters: filters,
            clicked_listing_id: null
          }),
        });
      } catch (trackingError) {
        // Only log a warning, don't disrupt the main functionality
        console.warn('Failed to track search interaction:', trackingError);
      }
    } catch (err) {
      console.error('Error fetching filtered results:', err);
      setError('Failed to load vehicles. Please try again.');
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  // Add this helper function to parse the sort option
  const parseSortOption = (option: string): [string, string] => {
    // Default to created_at-desc if invalid option
    if (!option || !option.includes('-')) return ['created_at', 'desc'];

    const [field, direction] = option.split('-');
    return [field, direction];
  };

  // Add function to handle AI intent search
  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aiSearchInput.trim()) {
      return;
    }

    setAiSearchLoading(true);
    setSearchError(null);

    try {
      // Get session ID from localStorage or create a new one
      let sessionId = localStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = uuidv4();
        localStorage.setItem('session_id', sessionId);
      }

      const response = await fetch('/api/ai-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: aiSearchInput
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to process your search');
      }

      const { parsed_filters, confidence, success } = await response.json();

      if (!success || !parsed_filters) {
        throw new Error('Could not understand your search. Please try again with different wording.');
      }

      // Update filters based on AI results
      const newFilters = { ...filters };

      // Map the parsed_filters to our filter state
      if (parsed_filters.make) newFilters.make = parsed_filters.make;
      if (parsed_filters.model) newFilters.model = parsed_filters.model;
      if (parsed_filters.body_type) newFilters.bodyType = parsed_filters.body_type;

      // Handle numeric ranges
      if (parsed_filters.year_min) newFilters.yearMin = parsed_filters.year_min;
      if (parsed_filters.year_max) newFilters.yearMax = parsed_filters.year_max;
      if (parsed_filters.price_min) newFilters.priceMin = parsed_filters.price_min;
      if (parsed_filters.price_max) newFilters.priceMax = parsed_filters.price_max;
      if (parsed_filters.mileage_min) newFilters.mileageMin = parsed_filters.mileage_min;
      if (parsed_filters.mileage_max) newFilters.mileageMax = parsed_filters.mileage_max;

      // Handle other categorical filters
      if (parsed_filters.fuel_type) newFilters.fuelType = parsed_filters.fuel_type;
      if (parsed_filters.transmission) newFilters.transmission = parsed_filters.transmission;
      if (parsed_filters.condition) newFilters.condition = parsed_filters.condition;

      // Update filter state
      setFilters(newFilters);

      // Auto-apply filters
      setTimeout(() => {
        applyFilters();

        // Show success message with confidence level
        toast({
          title: "Search processed",
          description: confidence > 0.8
            ? "Found exactly what you're looking for!"
            : "Found potential matches. You can adjust filters if needed.",
          variant: confidence > 0.8 ? "default" : "destructive"
        });
      }, 100);

    } catch (error) {
      console.error('AI search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Failed to process your search');
    } finally {
      setAiSearchLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold text-red-500">Error</h2>
        <p>{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Page Header */}
      <div className="bg-muted/40 py-12">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Browse Our Inventory</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our extensive collection of premium vehicles. Use the filters to find your perfect match.
            </p>
          </div>
        </div>
      </div>

      <section className="container max-w-6xl mx-auto px-6">
        {/* AI Search Input - Add this before the filters section */}
        <div className="bg-background py-6 border-b mb-6">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg shadow-sm mb-8">
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-primary" />
                What are you looking for?
              </h2>

              <form onSubmit={handleAiSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={aiSearchInput}
                    onChange={(e) => setAiSearchInput(e.target.value)}
                    placeholder="e.g. A weekend coupe under 50k"
                    className="pl-10 w-full"
                    disabled={aiSearchLoading}
                  />
                </div>
                <Button type="submit" disabled={aiSearchLoading}>
                  {aiSearchLoading ? "Searching..." : "Search"}
                </Button>
              </form>

              {searchError && (
                <div className="mt-2 text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {searchError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters section - Static with no scroll behavior */}
        <div className="bg-background py-8 border-b mb-6">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-medium">Filter Vehicles</h2>
                </div>
              </div>

              {/* Basic Filters - Improved spacing */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 mb-8">
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">Make</label>
                  <Select
                    value={filters.make}
                    onValueChange={(value) => handleFilterChange("make", value)}
                    disabled={makesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Any">Any</SelectItem>
                      {makes.map(make => (
                        <SelectItem key={make.id} value={make.name}>{make.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">Model</label>
                  <Select
                    value={filters.model}
                    onValueChange={(value) => handleFilterChange("model", value)}
                    disabled={filters.make === "Any" || modelLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={modelLoading ? "Loading models..." : "Select model"} />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Add search input */}
                      <div className="px-2 py-2 sticky top-0 bg-background z-10 border-b">
                        <Input
                          placeholder="Search models..."
                          className="h-8"
                          onChange={(e) => setModelSearchTerm(e.target.value)}
                          value={modelSearchTerm}
                          onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on input click
                        />
                      </div>

                      <SelectItem value="any">Any</SelectItem>

                      {availableModels.length > 0 ? (
                        // Filter models by both name validity and search term
                        availableModels
                          .filter(model =>
                            model.name &&
                            model.name.trim() !== '' &&
                            (!modelSearchTerm || model.name.toLowerCase().includes(modelSearchTerm.toLowerCase()))
                          )
                          .map(model => (
                            <SelectItem key={model.id} value={model.name}>
                              {model.name}
                            </SelectItem>
                          ))
                      ) : (
                        // Show when no models are available
                        !modelLoading &&
                        <SelectItem value="no-models" disabled>
                          {modelSearchTerm ? "No matching models" : "No models available"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">Body Type</label>
                  <Select
                    value={filters.bodyType}
                    onValueChange={(value) => handleFilterChange("bodyType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select body type" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Any', 'Sedan', 'SUV', 'Coupe', 'Convertible', 'Hatchback', 'Wagon', 'Truck', 'Van'].map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Second row - 3 sliders in one row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Price Range</label>
                    <span className="text-xs text-muted-foreground">
                      {formatPrice(filters.priceMin)} - {formatPrice(filters.priceMax)}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[filters.priceMin, filters.priceMax]}
                    max={150000}
                    step={1000}
                    onValueChange={(value: number[]) => {
                      handleFilterChange("priceMin", value[0]);
                      handleFilterChange("priceMax", value[1]);
                    }}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Year Range</label>
                    <span className="text-xs text-muted-foreground">
                      {filters.yearMin} - {filters.yearMax}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[filters.yearMin, filters.yearMax]}
                    min={2010}
                    max={2024}
                    step={1}
                    onValueChange={(value: number[]) => {
                      handleFilterChange("yearMin", value[0]);
                      handleFilterChange("yearMax", value[1]);
                    }}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Mileage Range</label>
                    <span className="text-xs text-muted-foreground">
                      {filters.mileageMin.toLocaleString()} - {filters.mileageMax.toLocaleString()} mi
                    </span>
                  </div>
                  <Slider
                    defaultValue={[filters.mileageMin, filters.mileageMax]}
                    max={100000}
                    step={1000}
                    onValueChange={(value: number[]) => {
                      handleFilterChange("mileageMin", value[0]);
                      handleFilterChange("mileageMax", value[1]);
                    }}
                  />
                </div>
              </div>

              {/* Third row - Fuel, Transmission, Condition arranged horizontally */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 mt-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">Fuel Type</label>
                  <Select
                    value={filters.fuelType}
                    onValueChange={(value) => handleFilterChange("fuelType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Any', 'Gasoline', 'Diesel', 'Hybrid', 'Electric'].map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">Transmission</label>
                  <Select
                    value={filters.transmission}
                    onValueChange={(value) => handleFilterChange("transmission", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transmission" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Any', 'Automatic', 'Manual', 'CVT', 'PDK'].map(transmission => (
                        <SelectItem key={transmission} value={transmission}>{transmission}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-2">Condition</label>
                  <Select
                    value={filters.condition}
                    onValueChange={(value) => handleFilterChange("condition", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Any', 'New', 'Used'].map(condition => (
                        <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Filter Toggle Button - Now inline */}
            <div className="mb-6 flex justify-center">
              <Button
                onClick={toggleAdvancedFilters}
                className="flex items-center gap-2"
                variant="outline"
                size="sm"
              >
                {showAdvancedFilters ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    <span>Hide Filters</span>
                  </>
                ) : (
                  <>
                    <Filter className="h-4 w-4" />
                    <span>Show Advanced Filters</span>
                  </>
                )}
              </Button>
            </div>

            {/* Advanced Filters Panel - Static, not floating */}
            <div className={`${showAdvancedFilters ? 'block' : 'hidden'} 
              bg-white rounded-lg p-6 mb-6 w-full`}>
              <AdvancedCarFilters
                filters={filters}
                setFilters={setFilters}
                onClose={toggleAdvancedFilters}
                {...{} as any}
              />
            </div>

            {/* Filter Actions - Adding onClick handler to Apply Filters button */}
            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1"
                onClick={applyFilters}
              >
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>

              <Button
                variant="outline"
                onClick={resetFilters}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Results Count and Sort */}
        <div className="flex justify-between items-center my-6">
          <div className="text-muted-foreground">
            Showing {Array.isArray(cars) ? cars.length : 0} vehicles
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Sort by:</span>
            <Select
              value={sortOption}
              onValueChange={(value) => {
                setSortOption(value);
                // No need to call applyFilters here as the useEffect will trigger a refetch
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="year-desc">Year: Newest First</SelectItem>
                <SelectItem value="year-asc">Year: Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Car Grid with hover effects and image carousel */}
        <div className="car-cards-container">
          {error && (
            <div className="w-full p-4 text-center">
              <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center justify-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            </div>
          )}

          {loading ? (
            <div className="w-full flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : cars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 px-2 sm:px-4">
              {cars.map((car) => {
                // Skip rendering if the car doesn't have an ID (should never happen with real DB data)
                if (!car.id) {
                  console.warn("Car missing ID, skipping render:", car);
                  return null;
                }

                console.log(`Rendering car card for: ${car.make} ${car.model} with ID: ${car.id}`);

                return (
                  <Card
                    key={car.id}
                    className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] focus-within:scale-[1.02] focus-within:shadow-xl"
                  >
                    {/* Image Carousel */}
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/0 z-10" />

                      {/* Carousel Images */}
                      <div className="relative w-full h-full">
                        {car.images && car.images.length > 0 ? (
                          // Map through available images
                          car.images.map((image, index) => (
                            <div
                              key={index}
                              className={`absolute inset-0 transition-opacity duration-500 ${(activeImageIndex[car.id] || 0) === index ? 'opacity-100' : 'opacity-0'
                                }`}
                            >
                              <img
                                src={image}
                                alt={`${car.make} ${car.model} - view ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback for broken image links
                                  (e.target as HTMLImageElement).src = '/images/car-placeholder.jpg';
                                }}
                              />
                            </div>
                          ))
                        ) : (
                          // Fallback for no images
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="text-center">
                              <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
                              <p className="text-sm text-muted-foreground mt-2">No image available</p>
                            </div>
                          </div>
                        )}

                        {/* Only show carousel controls if there are multiple images */}
                        {car.images && car.images.length > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation(); // Prevent event bubbling to card
                                prevImage(car.id, car.images?.length || 0);
                                e.currentTarget.blur(); // Remove focus after click
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 text-white/70 hover:text-white transition-colors"
                              aria-label="Previous image"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation(); // Prevent event bubbling to card
                                nextImage(car.id, car.images?.length || 0);
                                e.currentTarget.blur(); // Remove focus after click
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 text-white/70 hover:text-white transition-colors"
                              aria-label="Next image"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg">{car.make} {car.model}</h3>
                        {/* Enhanced Price Display */}
                        <div className="flex-shrink-0 relative">
                          <div className="absolute inset-0 bg-primary/10 rounded-full blur-sm"></div>
                          <div className="relative font-bold text-lg text-primary px-3 py-1 rounded-full border border-primary/20 bg-primary/5">
                            {formatPrice(car.price || 0)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pb-4">
                      <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Fuel className="h-4 w-4" />
                          <span>{car.fuel_type || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Gauge className="h-4 w-4" />
                          <span>{car.mileage ? `${car.mileage.toLocaleString()} mi` : "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          <span>{car.transmission || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{car.year || "N/A"}</span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="flex justify-between border-t pt-4">
                      <Button variant="outline" size="sm">
                        Add to Compare
                      </Button>
                      <Link
                        href={`/inventory/${car.id}`}
                        className="flex items-center gap-1"
                      >
                        View Details
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="w-full p-8 text-center">
              <p className="text-muted-foreground">No cars found matching your criteria.</p>
              <Button onClick={resetFilters} variant="outline" className="mt-4">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mb-12">
          <div className="flex space-x-1">
            <Button variant="outline" size="icon">
              <span className="sr-only">Previous page</span>
              &lt;
            </Button>
            <Button variant="outline" size="sm" className="px-4">
              1
            </Button>
            <Button size="sm" className="px-4">
              2
            </Button>
            <Button variant="outline" size="sm" className="px-4">
              3
            </Button>
            <Button variant="outline" size="icon">
              <span className="sr-only">Next page</span>
              &gt;
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
} 