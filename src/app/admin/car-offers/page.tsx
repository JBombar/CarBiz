"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, X, ExternalLink, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Define TypeScript interface for car offer data
interface CarOffer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  fuel_type: string;
  transmission: string;
  condition: string;
  city: string;
  asking_price: number;
  contacted: boolean;
  created_at: string;
  photo_urls?: string[];
  description?: string;
  status?: string;
}

export default function AdminCarsPage() {
  const [carOffers, setCarOffers] = useState<CarOffer[]>([]);
  const [filteredCarOffers, setFilteredCarOffers] = useState<CarOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<CarOffer | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const supabase = createClient();
  const { toast } = useToast();

  // Fetch car offers from Supabase
  useEffect(() => {
    const fetchCarOffers = async () => {
      try {
        const { data, error } = await supabase
          .from("car_offers")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCarOffers(data || []);
        setFilteredCarOffers(data || []);
      } catch (error) {
        console.error("Error fetching car offers:", error);
        toast({
          title: "Error fetching data",
          description: "Could not load car offers. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCarOffers();
  }, [supabase, toast]);

  // Filter car offers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCarOffers(carOffers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = carOffers.filter(
      (offer) =>
        offer.full_name?.toLowerCase().includes(query) ||
        offer.email?.toLowerCase().includes(query) ||
        offer.make?.toLowerCase().includes(query) ||
        offer.model?.toLowerCase().includes(query) ||
        offer.city?.toLowerCase().includes(query)
    );
    setFilteredCarOffers(filtered);
  }, [searchQuery, carOffers]);

  // Update the contacted status
  const toggleContactedStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("car_offers")
        .update({ contacted: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      // Update local state to reflect change
      setCarOffers((prev) =>
        prev.map((offer) =>
          offer.id === id
            ? { ...offer, contacted: !offer.contacted }
            : offer
        )
      );

      toast({
        title: "Status updated",
        description: `Offer marked as ${!currentStatus ? "contacted" : "not contacted"}`,
      });
    } catch (error) {
      console.error("Error updating contact status:", error);
      toast({
        title: "Update failed",
        description: "Could not update contact status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update offer status (Accepted, Rejected, In Review)
  const updateOfferStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("car_offers")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      // Update local state to reflect the status change
      setCarOffers((prev) =>
        prev.map((offer) =>
          offer.id === id ? { ...offer, status } : offer
        )
      );

      // Also update the selected offer if it's currently being viewed
      if (selectedOffer && selectedOffer.id === id) {
        setSelectedOffer({ ...selectedOffer, status });
      }

      toast({
        title: "Status updated",
        description: `Offer status changed to ${status}`,
      });
    } catch (error) {
      console.error("Error updating offer status:", error);
      toast({
        title: "Status update failed",
        description: "Could not update offer status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Get status badge color
  const getStatusBadgeColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "in review":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Handle opening modal with selected offer
  const openOfferDetails = (offer: CarOffer) => {
    setSelectedOffer(offer);
    setCurrentImageIndex(0);
  };

  // Close the modal
  const closeOfferDetails = () => {
    setSelectedOffer(null);
  };

  // Handle image navigation
  const nextImage = () => {
    if (selectedOffer?.photo_urls && selectedOffer.photo_urls.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedOffer.photo_urls!.length);
    }
  };

  const prevImage = () => {
    if (selectedOffer?.photo_urls && selectedOffer.photo_urls.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? selectedOffer.photo_urls!.length - 1 : prev - 1
      );
    }
  };

  // Handle opening lightbox from the detail view
  const openLightbox = (index: number) => {
    setLightboxImageIndex(index);
    setLightboxOpen(true);
  };

  // Close the lightbox
  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  // Handle lightbox navigation
  const nextLightboxImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedOffer?.photo_urls && selectedOffer.photo_urls.length > 0) {
      setLightboxImageIndex((prev) => (prev + 1) % selectedOffer.photo_urls!.length);
    }
  };

  const prevLightboxImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedOffer?.photo_urls && selectedOffer.photo_urls.length > 0) {
      setLightboxImageIndex((prev) =>
        prev === 0 ? selectedOffer.photo_urls!.length - 1 : prev - 1
      );
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;

      if (e.key === 'ArrowRight') {
        nextLightboxImage();
      } else if (e.key === 'ArrowLeft') {
        prevLightboxImage();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, selectedOffer]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Car Offers Management</h1>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search by name, email, make, model, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredCarOffers.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No car offers found</p>
        </div>
      ) : (
        <div className="overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Contacted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCarOffers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>
                    {offer.photo_urls && offer.photo_urls.length > 0 ? (
                      <div className="relative h-16 w-16 rounded overflow-hidden cursor-pointer" onClick={() => openOfferDetails(offer)}>
                        <Image
                          src={offer.photo_urls[0]}
                          alt={`${offer.make} ${offer.model}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 bg-muted flex items-center justify-center rounded">
                        <span className="text-xs text-muted-foreground">No image</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{offer.full_name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{offer.email}</div>
                      <div className="text-sm text-muted-foreground">{offer.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>
                        {offer.make} {offer.model}
                      </div>
                      <div className="text-sm text-muted-foreground">{offer.year}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div>{offer.mileage} miles</div>
                      <div className="text-sm text-muted-foreground">
                        {offer.fuel_type}, {offer.transmission}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Condition: {offer.condition}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{offer.city}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(offer.asking_price)}
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(offer.status)}`}>
                      {offer.status || "New"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {offer.created_at && format(new Date(offer.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={offer.contacted}
                      onCheckedChange={() => toggleContactedStatus(offer.id, offer.contacted)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openOfferDetails(offer)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Offer Details Modal */}
      <Dialog open={selectedOffer !== null} onOpenChange={(open) => !open && closeOfferDetails()}>
        <DialogContent className="max-w-4xl">
          {selectedOffer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center justify-between">
                  <span>
                    {selectedOffer.make} {selectedOffer.model} ({selectedOffer.year})
                  </span>
                  <Badge className={getStatusBadgeColor(selectedOffer.status)}>
                    {selectedOffer.status || "New"}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Offered by {selectedOffer.full_name} on {format(new Date(selectedOffer.created_at), "MMMM d, yyyy")}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
                {/* Image Gallery */}
                <div className="flex flex-col">
                  {selectedOffer.photo_urls && selectedOffer.photo_urls.length > 0 ? (
                    <div className="space-y-2">
                      <div
                        className="relative h-64 w-full rounded-md overflow-hidden border cursor-pointer group"
                        onClick={() => openLightbox(currentImageIndex)}
                      >
                        <Image
                          src={selectedOffer.photo_urls[currentImageIndex]}
                          alt={`${selectedOffer.make} ${selectedOffer.model}`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 className="text-white h-8 w-8" />
                        </div>
                      </div>

                      {selectedOffer.photo_urls.length > 1 && (
                        <div className="flex justify-between">
                          <Button size="sm" variant="outline" onClick={prevImage}>Previous</Button>
                          <span className="text-sm text-muted-foreground">
                            {currentImageIndex + 1} of {selectedOffer.photo_urls.length}
                          </span>
                          <Button size="sm" variant="outline" onClick={nextImage}>Next</Button>
                        </div>
                      )}

                      {selectedOffer.photo_urls.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto py-2">
                          {selectedOffer.photo_urls.map((url, idx) => (
                            <div
                              key={url}
                              className={`relative h-16 w-16 rounded overflow-hidden border-2 cursor-pointer ${currentImageIndex === idx ? 'border-primary' : 'border-transparent'}`}
                              onClick={() => {
                                setCurrentImageIndex(idx);
                                // Don't open lightbox on thumbnail click - let user click main image
                              }}
                            >
                              <Image
                                src={url}
                                alt={`Thumbnail ${idx + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-64 w-full bg-muted flex items-center justify-center rounded-md">
                      <span className="text-muted-foreground">No images available</span>
                    </div>
                  )}
                </div>

                {/* Car Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Vehicle Details</h3>
                    <dl className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Make</dt>
                        <dd>{selectedOffer.make}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Model</dt>
                        <dd>{selectedOffer.model}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Year</dt>
                        <dd>{selectedOffer.year}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Mileage</dt>
                        <dd>{selectedOffer.mileage} miles</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Fuel Type</dt>
                        <dd>{selectedOffer.fuel_type}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Transmission</dt>
                        <dd>{selectedOffer.transmission}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Condition</dt>
                        <dd>{selectedOffer.condition}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Asking Price</dt>
                        <dd className="font-semibold">{formatCurrency(selectedOffer.asking_price)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium">Seller Information</h3>
                    <dl className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                        <dd>{selectedOffer.full_name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                        <dd>
                          <a href={`mailto:${selectedOffer.email}`} className="text-primary hover:underline">
                            {selectedOffer.email}
                          </a>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
                        <dd>
                          <a href={`tel:${selectedOffer.phone}`} className="text-primary hover:underline">
                            {selectedOffer.phone}
                          </a>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Location</dt>
                        <dd>{selectedOffer.city}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Contacted</dt>
                        <dd>
                          <Checkbox
                            checked={selectedOffer.contacted}
                            onCheckedChange={() => toggleContactedStatus(selectedOffer.id, selectedOffer.contacted)}
                          />
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {selectedOffer.description && (
                    <div>
                      <h3 className="text-lg font-medium">Description</h3>
                      <div className="h-24 mt-2 rounded-md border p-2 overflow-y-auto">
                        <p className="text-sm">{selectedOffer.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2 mr-auto">
                  <span className="text-sm font-medium">Status:</span>
                  <Select
                    value={selectedOffer.status || ""}
                    onValueChange={(value) => updateOfferStatus(selectedOffer.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Set status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Review">In Review</SelectItem>
                      <SelectItem value="Accepted">Accepted</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={closeOfferDetails}
                  >
                    Close
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      toggleContactedStatus(selectedOffer.id, selectedOffer.contacted);
                      closeOfferDetails();
                    }}
                  >
                    {selectedOffer.contacted ? "Mark as Not Contacted" : "Mark as Contacted"}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox Modal */}
      <Dialog
        open={lightboxOpen && selectedOffer?.photo_urls && selectedOffer.photo_urls.length > 0}
        onOpenChange={setLightboxOpen}
      >
        <DialogContent className="max-w-5xl p-0 bg-black/95 border-none">
          <div className="relative h-[80vh] w-full" onClick={closeLightbox}>
            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                closeLightbox();
              }}
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Left navigation arrow */}
            {selectedOffer?.photo_urls && selectedOffer.photo_urls.length > 1 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                onClick={prevLightboxImage}
              >
                <ChevronLeft className="h-8 w-8 text-white" />
              </button>
            )}

            {/* Right navigation arrow */}
            {selectedOffer?.photo_urls && selectedOffer.photo_urls.length > 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                onClick={nextLightboxImage}
              >
                <ChevronRight className="h-8 w-8 text-white" />
              </button>
            )}

            {/* Main image */}
            {selectedOffer?.photo_urls && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative w-full h-full max-h-[90vh] flex items-center justify-center">
                  <Image
                    src={selectedOffer.photo_urls[lightboxImageIndex]}
                    alt={`${selectedOffer.make} ${selectedOffer.model} - Large view`}
                    fill
                    className="object-contain"
                    quality={95}
                    priority
                  />
                </div>
              </div>
            )}

            {/* Image counter */}
            {selectedOffer?.photo_urls && selectedOffer.photo_urls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
                {lightboxImageIndex + 1} / {selectedOffer.photo_urls.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 