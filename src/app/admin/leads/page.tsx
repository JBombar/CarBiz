'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, X, Check, Loader2, RefreshCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
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

// Define the Lead type based on the table schema
type Lead = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  make: string;
  model: string;
  year_from: string;
  year_to: string;
  budget: number | null;
  color: string;
  fuel_type: string;
  transmission: string;
  condition: string;
  location: string;
  max_mileage: number | null;
  notes: string;
  created_at: string;
  status: 'New' | 'In Review' | 'Closed';
  contacted: boolean;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State for modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for updates
  const [isUpdating, setIsUpdating] = useState(false);
  // Add these state variables near the top of your component with the other state declarations
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch leads on component mount
  useEffect(() => {
    const fetchLeads = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(`Error fetching leads: ${error.message}`);
        }

        // Apply default values if fields are missing
        const processedData = (data || []).map(lead => ({
          ...lead,
          status: lead.status || 'New',
          contacted: lead.contacted || false
        }));

        setLeads(processedData);
        setFilteredLeads(processedData);
      } catch (err) {
        console.error('Failed to fetch leads:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Filter leads based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLeads(leads);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = leads.filter(
      lead =>
        lead.full_name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.make?.toLowerCase().includes(query) ||
        lead.model?.toLowerCase().includes(query) ||
        lead.location?.toLowerCase().includes(query)
    );

    setFilteredLeads(filtered);
  }, [searchQuery, leads]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Open modal with lead details
  const openLeadDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedLead) return;

    setIsUpdating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', selectedLead.id);

      if (error) throw new Error(error.message);

      // Update local state optimistically
      const updatedLead = { ...selectedLead, status: newStatus as Lead['status'] };
      setSelectedLead(updatedLead);

      // Update leads list for table display
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === selectedLead.id ? updatedLead : lead
        )
      );
      setFilteredLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === selectedLead.id ? updatedLead : lead
        )
      );

      // Show success toast
      toast({
        title: "Status updated",
        description: `Lead status changed to ${newStatus}`,
        duration: 3000,
      });
    } catch (err) {
      console.error('Failed to update status:', err);
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Failed to update status",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle contacted toggle
  const handleContactedChange = async (contacted: boolean) => {
    if (!selectedLead) return;

    setIsUpdating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('leads')
        .update({ contacted })
        .eq('id', selectedLead.id);

      if (error) throw new Error(error.message);

      // Update local state optimistically
      const updatedLead = { ...selectedLead, contacted };
      setSelectedLead(updatedLead);

      // Update leads list for table display
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === selectedLead.id ? updatedLead : lead
        )
      );
      setFilteredLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === selectedLead.id ? updatedLead : lead
        )
      );

      // Show success toast
      toast({
        title: contacted ? "Marked as contacted" : "Marked as not contacted",
        description: `Lead has been ${contacted ? 'marked as contacted' : 'marked as not contacted'}`,
        duration: 3000,
      });
    } catch (err) {
      console.error('Failed to update contacted status:', err);
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Failed to update contacted status",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Get status badge color
  const getStatusBadgeClass = (status: Lead['status']) => {
    switch (status) {
      case 'New': return 'bg-green-100 text-green-800';
      case 'In Review': return 'bg-blue-100 text-blue-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Add this function with your other handler functions
  const handleDeleteLead = async () => {
    if (!leadToDelete) return;

    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadToDelete.id);

      if (error) throw new Error(error.message);

      // Update local state by removing the deleted lead
      setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadToDelete.id));
      setFilteredLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadToDelete.id));

      // Close the dialog
      setIsDeleteDialogOpen(false);
      setLeadToDelete(null);

      // Show success toast
      toast({
        title: "Lead deleted",
        description: "The lead has been permanently removed",
        duration: 3000,
      });
    } catch (err) {
      console.error('Failed to delete lead:', err);
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Failed to delete lead",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to open the delete confirmation dialog
  const confirmDelete = (lead: Lead) => {
    setLeadToDelete(lead);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customer Leads</h1>
          <p className="text-muted-foreground">
            Manage and view incoming customer lead requests
          </p>
        </div>

        <div className="relative w-full md:w-64 mt-4 md:mt-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <Card className="w-full bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : filteredLeads.length === 0 ? (
        <Card className="w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'No leads found matching your search.' : 'No leads available yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Contact</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Vehicle</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Budget</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium">{lead.full_name || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{lead.email || 'N/A'}</div>
                    <div className="text-muted-foreground">{lead.phone || 'No phone'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      {lead.make} {lead.model}
                    </div>
                    <div className="text-muted-foreground">
                      {lead.year_from && lead.year_to
                        ? `${lead.year_from}-${lead.year_to}`
                        : lead.year_from || lead.year_to || 'Any year'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {lead.condition} • {lead.transmission || 'Any'} • {lead.fuel_type || 'Any fuel'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {lead.budget ? `$${lead.budget.toLocaleString()}` : 'Not specified'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {lead.location || 'Not specified'}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {formatDate(lead.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(lead.status)}`}>
                      {lead.status}
                    </span>
                    {lead.contacted && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                        Contacted
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openLeadDetails(lead)}
                        className="text-xs"
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmDelete(lead)}
                        className="text-xs bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead count indicator */}
      <div className="mt-4 text-sm text-muted-foreground">
        Showing {filteredLeads.length} of {leads.length} leads
        {searchQuery && ' (filtered)'}
      </div>

      {/* Enhanced Lead Details Modal with interactive elements */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Lead Details</DialogTitle>
            <DialogDescription>
              Complete information about the customer lead
            </DialogDescription>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>

          {selectedLead && (
            <div className="grid gap-6 py-4">
              {/* Action Panel - NEW SECTION */}
              <div className="bg-muted p-4 rounded-md">
                <h3 className="text-sm font-medium mb-4">Lead Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status Dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={selectedLead.status}
                      onValueChange={handleStatusChange}
                      disabled={isUpdating}
                    >
                      <SelectTrigger id="status" className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="In Review">In Review</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Contacted Toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="contacted" className="flex flex-col space-y-1">
                        <span>Contacted</span>
                        <span className="font-normal text-xs text-muted-foreground">
                          Mark this lead as contacted
                        </span>
                      </Label>
                      <div className="flex items-center space-x-2">
                        {isUpdating && <Loader2 className="animate-spin h-4 w-4 mr-1" />}
                        <Switch
                          id="contacted"
                          checked={selectedLead.contacted}
                          onCheckedChange={handleContactedChange}
                          disabled={isUpdating}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium mb-2">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">Name</div>
                    <div>{selectedLead.full_name || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Email</div>
                    <div>{selectedLead.email || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Phone</div>
                    <div>{selectedLead.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Location</div>
                    <div>{selectedLead.location || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div>
                <h3 className="text-lg font-medium mb-2">Vehicle Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">Make</div>
                    <div>{selectedLead.make || 'Any'}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Model</div>
                    <div>{selectedLead.model || 'Any'}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Year Range</div>
                    <div>
                      {selectedLead.year_from && selectedLead.year_to
                        ? `${selectedLead.year_from} - ${selectedLead.year_to}`
                        : selectedLead.year_from || selectedLead.year_to || 'Any'}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Budget</div>
                    <div>{selectedLead.budget ? `$${selectedLead.budget.toLocaleString()}` : 'Not specified'}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Condition</div>
                    <div className="capitalize">{selectedLead.condition || 'Any'}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Transmission</div>
                    <div className="capitalize">{selectedLead.transmission || 'Any'}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Fuel Type</div>
                    <div className="capitalize">{selectedLead.fuel_type || 'Any'}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Maximum Mileage</div>
                    <div>
                      {selectedLead.max_mileage
                        ? `${selectedLead.max_mileage.toLocaleString()} km`
                        : 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Color Preference</div>
                    <div>{selectedLead.color || 'Not specified'}</div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-medium mb-2">Additional Information</h3>
                <div className="text-sm">
                  <div className="font-medium text-muted-foreground">Notes</div>
                  <div className="p-3 bg-muted rounded-md mt-1 whitespace-pre-line">
                    {selectedLead.notes || 'No additional notes provided.'}
                  </div>
                </div>
              </div>

              {/* Submission Information */}
              <div>
                <div className="text-sm">
                  <div className="font-medium text-muted-foreground">Submitted On</div>
                  <div>{formatDate(selectedLead.created_at)}</div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the lead from your database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 