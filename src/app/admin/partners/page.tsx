'use client';

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { Search, Plus, Pencil, Trash2, RefreshCcw, User } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

// Define the Partner type based on the database schema
interface Partner {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    notes: string | null;
    status: 'active' | 'inactive' | 'pending';
    created_at: string;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    location: string | null;
    is_active: boolean | null;
    trust_level: 'unrated' | 'trusted' | 'verified' | 'flagged';
}

// Partner form validation schema
const partnerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    contact_name: z.string().min(1, "Contact name is required"),
    contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
    contact_phone: z.string().min(5, "Phone number should be at least 5 characters").optional().or(z.literal("")),
    company: z.string().optional().or(z.literal("")),
    location: z.string().optional().or(z.literal("")),
    is_active: z.boolean().default(true),
    notes: z.string().optional().or(z.literal("")),
    status: z.enum(["active", "inactive", "pending"]).default("pending"),
    trust_level: z.enum(["unrated", "trusted", "verified", "flagged"]).default("unrated"),
});

export default function PartnersPage() {
    const supabase = createClient();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formType, setFormType] = useState<'create' | 'edit'>('create');
    const [currentPartner, setCurrentPartner] = useState<Partner | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        contact_name: string;
        contact_email: string;
        contact_phone: string;
        company: string;
        location: string;
        is_active: boolean;
        status: 'active' | 'inactive' | 'pending';
        notes: string;
        trust_level: 'unrated' | 'trusted' | 'verified' | 'flagged';
    }>({
        name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        company: '',
        location: '',
        is_active: true,
        status: 'pending',
        notes: '',
        trust_level: 'unrated',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter partners based on search query
    useEffect(() => {
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            const filtered = partners.filter(
                partner =>
                    partner.name.toLowerCase().includes(lowercasedQuery) ||
                    (partner.email && partner.email.toLowerCase().includes(lowercasedQuery)) ||
                    (partner.company && partner.company.toLowerCase().includes(lowercasedQuery)) ||
                    (partner.phone && partner.phone.includes(lowercasedQuery))
            );
            setFilteredPartners(filtered);
        } else {
            setFilteredPartners(partners);
        }
    }, [searchQuery, partners]);

    // Fetch partners on component mount
    useEffect(() => {
        fetchPartners();
    }, []);

    // Fetch partners from the API
    const fetchPartners = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/partners');

            if (!response.ok) {
                throw new Error(`Error fetching partners: ${response.statusText}`);
            }

            const data = await response.json();
            setPartners(data);
            setFilteredPartners(data);
        } catch (err) {
            console.error('Failed to fetch partners:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Reset all fields when adding a new partner
    const handleAddPartner = () => {
        setFormData({
            name: '',
            contact_name: '',
            contact_email: '',
            contact_phone: '',
            company: '',
            location: '',
            is_active: true,
            notes: '',
            status: 'pending',
            trust_level: 'unrated',
        });
        setFormErrors({});
        setFormType('create');
        setIsFormOpen(true);
    };

    // Open form for editing an existing partner
    const handleEditPartner = (partner: Partner) => {
        setFormData({
            name: partner.name,
            contact_name: partner.contact_name || '',
            contact_email: partner.contact_email || '',
            contact_phone: partner.contact_phone || '',
            company: partner.company || '',
            location: partner.location || '',
            is_active: partner.is_active ?? true,
            notes: partner.notes || '',
            status: partner.status,
            trust_level: partner.trust_level || 'unrated',
        });
        setFormErrors({});
        setCurrentPartner(partner);
        setFormType('edit');
        setIsFormOpen(true);
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error for the field being edited
        if (formErrors[name]) {
            setFormErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    // Handle status select change
    const handleStatusChange = async (partnerId: string, newStatus: 'active' | 'inactive' | 'pending') => {
        try {
            const response = await fetch('/api/partners', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: partnerId,
                    status: newStatus
                }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to update status');
            }

            // Update local state to reflect the change
            setPartners(partners.map(partner =>
                partner.id === partnerId
                    ? { ...partner, status: newStatus }
                    : partner
            ));

            setFilteredPartners(filteredPartners.map(partner =>
                partner.id === partnerId
                    ? { ...partner, status: newStatus }
                    : partner
            ));

            // Show success message
            toast({
                title: "Status updated",
                description: "Partner status has been updated successfully.",
            });
        } catch (err) {
            console.error('Failed to update status:', err);
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to update status",
                variant: "destructive",
            });
        }
    };

    // Handle trust level select change
    const handleTrustLevelChange = async (partnerId: string, newTrustLevel: 'unrated' | 'trusted' | 'verified' | 'flagged') => {
        try {
            const response = await fetch('/api/partners', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: partnerId,
                    trust_level: newTrustLevel
                }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to update trust level');
            }

            // Update local state to reflect the change
            setPartners(partners.map(partner =>
                partner.id === partnerId
                    ? { ...partner, trust_level: newTrustLevel }
                    : partner
            ));

            setFilteredPartners(filteredPartners.map(partner =>
                partner.id === partnerId
                    ? { ...partner, trust_level: newTrustLevel }
                    : partner
            ));

            // Show success message
            toast({
                title: "Trust level updated",
                description: "Partner trust level has been updated successfully.",
            });
        } catch (err) {
            console.error('Failed to update trust level:', err);
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to update trust level",
                variant: "destructive",
            });
        }
    };

    // Submit form to create or update a partner
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setFormErrors({});

        try {
            // Validate form data
            const validationResult = partnerSchema.safeParse(formData);

            if (!validationResult.success) {
                const errors: Record<string, string> = {};
                validationResult.error.errors.forEach(err => {
                    if (err.path[0]) {
                        errors[err.path[0].toString()] = err.message;
                    }
                });
                setFormErrors(errors);
                setIsSubmitting(false);
                return;
            }

            // Prepare request options
            const url = '/api/partners';
            const method = formType === 'create' ? 'POST' : 'PUT';
            const bodyData = formType === 'create'
                ? formData
                : { id: currentPartner?.id, ...formData };

            console.log('Submitting partner data:', bodyData);

            // Send request
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to save partner');
            }

            // Close form and refresh data
            setIsFormOpen(false);
            fetchPartners();

            // Show success message
            toast({
                title: formType === 'create' ? "Partner created" : "Partner updated",
                description: formType === 'create'
                    ? "New partner has been added successfully."
                    : "Partner information has been updated successfully.",
            });
        } catch (err) {
            console.error('Failed to save partner:', err);
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to save partner",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Open delete confirmation dialog
    const handleDeleteClick = (partner: Partner) => {
        setPartnerToDelete(partner);
        setIsDeleteDialogOpen(true);
    };

    // Delete a partner
    const handleDeletePartner = async () => {
        if (!partnerToDelete) return;

        setIsDeleting(true);

        try {
            const response = await fetch('/api/partners', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: partnerToDelete.id }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete partner');
            }

            // Close dialog and refresh data
            setIsDeleteDialogOpen(false);
            fetchPartners();

            // Show success message
            toast({
                title: "Partner deleted",
                description: "Partner has been removed successfully."
            });
        } catch (err) {
            console.error('Failed to delete partner:', err);
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to delete partner",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // Render status badge with appropriate color
    const StatusBadge = ({ status }: { status: string }) => {
        let variant: "default" | "secondary" | "destructive" | "outline" | null | undefined = "secondary";

        switch (status) {
            case "active":
                variant = "default";
                break;
            case "inactive":
                variant = "outline";
                break;
            case "pending":
                variant = "secondary";
                break;
            default:
                variant = "secondary";
        }

        return <Badge variant={variant}>{status}</Badge>;
    };

    // Render trust level badge with appropriate color
    const TrustLevelBadge = ({ trustLevel }: { trustLevel: string }) => {
        let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";

        switch (trustLevel) {
            case "trusted":
                variant = "default";
                break;
            case "verified":
                variant = "secondary";
                break;
            case "flagged":
                variant = "destructive";
                break;
            case "unrated":
            default:
                variant = "outline";
                break;
        }

        return <Badge variant={variant}>{trustLevel}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Partners</h1>
                    <p className="text-muted-foreground">
                        Manage business partners and collaborators
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={fetchPartners} variant="outline" className="gap-2 w-full sm:w-auto">
                        <RefreshCcw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Button onClick={handleAddPartner} className="gap-2 w-full sm:w-auto">
                        <Plus className="h-4 w-4" />
                        Add Partner
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Partners</CardTitle>
                    <CardDescription>
                        {partners.length} total partners in the system
                    </CardDescription>

                    <div className="relative mt-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search partners..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
                            <p>{error}</p>
                            <Button
                                onClick={fetchPartners}
                                variant="outline"
                                className="mt-2"
                            >
                                Try Again
                            </Button>
                        </div>
                    ) : filteredPartners.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchQuery ? 'No partners found matching your search.' : 'No partners added yet.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Trust Level</TableHead>
                                        <TableHead>Date Added</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPartners.map((partner) => (
                                        <TableRow key={partner.id}>
                                            <TableCell className="font-medium">{partner.name}</TableCell>
                                            <TableCell>{partner.company || '—'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    {partner.email && <span className="text-sm">{partner.email}</span>}
                                                    {partner.phone && <span className="text-sm text-muted-foreground">{partner.phone}</span>}
                                                    {!partner.email && !partner.phone && '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={partner.status}
                                                    onValueChange={(value) => handleStatusChange(
                                                        partner.id,
                                                        value as 'active' | 'inactive' | 'pending'
                                                    )}
                                                >
                                                    <SelectTrigger className="h-8 w-28 px-2">
                                                        <StatusBadge status={partner.status} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={partner.trust_level || 'unrated'}
                                                    onValueChange={(value) => handleTrustLevelChange(
                                                        partner.id,
                                                        value as 'unrated' | 'trusted' | 'verified' | 'flagged'
                                                    )}
                                                >
                                                    <SelectTrigger className="h-8 w-28 px-2">
                                                        <TrustLevelBadge trustLevel={partner.trust_level || 'unrated'} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unrated">Unrated</SelectItem>
                                                        <SelectItem value="trusted">Trusted</SelectItem>
                                                        <SelectItem value="verified">Verified</SelectItem>
                                                        <SelectItem value="flagged">Flagged</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(partner.created_at), 'MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditPartner(partner)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(partner)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Partner Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {formType === 'create' ? 'Add New Partner' : 'Edit Partner'}
                        </DialogTitle>
                        <DialogDescription>
                            {formType === 'create'
                                ? 'Add a new business partner to your network.'
                                : 'Update partner information.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                Name <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Enter partner name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={formErrors.name ? "border-destructive" : ""}
                            />
                            {formErrors.name && (
                                <p className="text-xs text-destructive">{formErrors.name}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="contact_name" className="text-sm font-medium">
                                Contact Name <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="contact_name"
                                name="contact_name"
                                placeholder="Enter contact person's name"
                                value={formData.contact_name}
                                onChange={handleInputChange}
                                className={formErrors.contact_name ? "border-destructive" : ""}
                            />
                            {formErrors.contact_name && (
                                <p className="text-xs text-destructive">{formErrors.contact_name}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="company" className="text-sm font-medium">
                                Company
                            </label>
                            <Input
                                id="company"
                                name="company"
                                placeholder="Enter company name"
                                value={formData.company}
                                onChange={handleInputChange}
                                className={formErrors.company ? "border-destructive" : ""}
                            />
                            {formErrors.company && (
                                <p className="text-xs text-destructive">{formErrors.company}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="contact_email" className="text-sm font-medium">
                                Contact Email
                            </label>
                            <Input
                                id="contact_email"
                                name="contact_email"
                                type="email"
                                placeholder="Enter contact email address"
                                value={formData.contact_email}
                                onChange={handleInputChange}
                                className={formErrors.contact_email ? "border-destructive" : ""}
                            />
                            {formErrors.contact_email && (
                                <p className="text-xs text-destructive">{formErrors.contact_email}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="contact_phone" className="text-sm font-medium">
                                Contact Phone
                            </label>
                            <Input
                                id="contact_phone"
                                name="contact_phone"
                                placeholder="Enter contact phone number"
                                value={formData.contact_phone}
                                onChange={handleInputChange}
                                className={formErrors.contact_phone ? "border-destructive" : ""}
                            />
                            {formErrors.contact_phone && (
                                <p className="text-xs text-destructive">{formErrors.contact_phone}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="status" className="text-sm font-medium">
                                Status
                            </label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        status: value as 'active' | 'inactive' | 'pending'
                                    }));
                                }}
                            >
                                <SelectTrigger id="status" className={formErrors.status ? "border-destructive" : ""}>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                            {formErrors.status && (
                                <p className="text-xs text-destructive">{formErrors.status}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="location" className="text-sm font-medium">
                                Location
                            </label>
                            <Input
                                id="location"
                                name="location"
                                placeholder="Enter location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className={formErrors.location ? "border-destructive" : ""}
                            />
                            {formErrors.location && (
                                <p className="text-xs text-destructive">{formErrors.location}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="trust_level" className="text-sm font-medium">
                                Trust Level
                            </label>
                            <Select
                                value={formData.trust_level}
                                onValueChange={(value) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        trust_level: value as 'unrated' | 'trusted' | 'verified' | 'flagged'
                                    }));
                                }}
                            >
                                <SelectTrigger id="trust_level" className={formErrors.trust_level ? "border-destructive" : ""}>
                                    <SelectValue placeholder="Select trust level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unrated">Unrated</SelectItem>
                                    <SelectItem value="trusted">Trusted</SelectItem>
                                    <SelectItem value="verified">Verified</SelectItem>
                                    <SelectItem value="flagged">Flagged</SelectItem>
                                </SelectContent>
                            </Select>
                            {formErrors.trust_level && (
                                <p className="text-xs text-destructive">{formErrors.trust_level}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="notes" className="text-sm font-medium">
                                Notes
                            </label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="Add any additional notes here"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className={formErrors.notes ? "border-destructive" : ""}
                                rows={4}
                            />
                            {formErrors.notes && (
                                <p className="text-xs text-destructive">{formErrors.notes}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsFormOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></div>
                                    Saving...
                                </>
                            ) : (
                                'Save Partner'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the partner
                            <strong> {partnerToDelete?.name}</strong> and remove their data from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.preventDefault();
                                handleDeletePartner();
                            }}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></div>
                                    Deleting...
                                </>
                            ) : (
                                'Delete Partner'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
