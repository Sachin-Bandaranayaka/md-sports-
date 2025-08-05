'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Trash2,
  RotateCcw,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CalendarIcon,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface RecycleBinItem {
  id: number;
  entity: string;
  entityId: number;
  originalData: any;
  deletedAt: string;
  deletedBy: string;
  deletedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  canRecover: boolean;
}

interface AuditHistoryItem {
  id: number;
  userId?: number;
  action: string;
  entity: string;
  entityId?: number;
  details?: Record<string, any> | undefined;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export default function AuditTrailPage() {
  const [activeTab, setActiveTab] = useState('recycle-bin');
  const [recycleBinItems, setRecycleBinItems] = useState<RecycleBinItem[]>([]);
  const [auditHistory, setAuditHistory] = useState<AuditHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 20,
    total: 0,
  });
  const [selectedAudit, setSelectedAudit] = useState<AuditHistoryItem | null>(null);
  const { toast } = useToast();
  const { accessToken, isAuthenticated } = useAuth();
  
  // State for entity name resolution
  const [shopNames, setShopNames] = useState<Record<string, string>>({});
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});

  const entityTypes = ['all', 'product', 'customer', 'supplier', 'category', 'invoice', 'receipt', 'ExpensePayment'];

  useEffect(() => {
    if (activeTab === 'recycle-bin') {
      fetchRecycleBinItems();
    } else {
      fetchAuditHistory();
    }
  }, [activeTab, entityFilter, dateFrom, dateTo, pagination.offset]);

  const fetchRecycleBinItems = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated || !accessToken) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to view the audit trail',
          variant: 'destructive',
        });
        return;
      }

      const params = new URLSearchParams({
        type: 'deleted',
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        ...(entityFilter !== 'all' && { entity: entityFilter }),
        ...(dateFrom && { dateFrom: dateFrom.toISOString() }),
        ...(dateTo && { dateTo: dateTo.toISOString() })
      });

      const response = await fetch(`/api/audit-trail?${params}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecycleBinItems(data.items);
        setPagination(prev => ({ ...prev, total: data.total }));
      } else {
        throw new Error('Failed to fetch recycle bin items');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch recycle bin items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditHistory = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated || !accessToken) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to view the audit trail',
          variant: 'destructive',
        });
        return;
      }

      const params = new URLSearchParams({
        type: 'all',
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        ...(entityFilter !== 'all' && { entity: entityFilter }),
        ...(dateFrom && { dateFrom: dateFrom.toISOString() }),
        ...(dateTo && { dateTo: dateTo.toISOString() })
      });

      const response = await fetch(`/api/audit-trail?${params}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAuditHistory(data.items);
        setPagination(prev => ({ ...prev, total: data.total }));
      } else {
        throw new Error('Failed to fetch audit history');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch audit history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (auditLogId: number) => {
    try {
      if (!isAuthenticated || !accessToken) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to recover items',
          variant: 'destructive',
        });
        return;
      }

      // Get CSRF token from cookie
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrfToken='))
        ?.split('=')[1];

      const response = await fetch('/api/audit-trail/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
        body: JSON.stringify({ auditLogId }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Item recovered successfully',
        });
        fetchRecycleBinItems();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to recover item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to recover item',
        variant: 'destructive',
      });
    }
  };

  const handlePermanentDelete = async (auditLogIds: number[]) => {
    try {
      if (!isAuthenticated || !accessToken) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to delete items',
          variant: 'destructive',
        });
        return;
      }

      // Get CSRF token from cookie
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrfToken='))
        ?.split('=')[1];

      const response = await fetch('/api/audit-trail/recover', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
        body: JSON.stringify({ auditLogIds }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Items permanently deleted',
        });
        setSelectedItems([]);
        fetchRecycleBinItems();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to permanently delete items');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to permanently delete items',
        variant: 'destructive',
      });
    }
  };

  const handleSelectItem = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === recycleBinItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(recycleBinItems.map(item => item.id));
    }
  };

  const filteredRecycleBinItems = recycleBinItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(item.originalData).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'recover': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEntityDisplayName = (originalData: any, entity: string) => {
    if (originalData?.name) return originalData.name;
    if (originalData?.title) return originalData.title;
    if (originalData?.sku) return originalData.sku;
    return `${entity} #${originalData?.id || 'Unknown'}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Trail & Recycle Bin</h1>
          <p className="text-muted-foreground">
            Track changes and recover deleted items
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="recycle-bin">Recycle Bin</TabsTrigger>
          <TabsTrigger value="audit-history">Audit History</TabsTrigger>
        </TabsList>

        <div className="flex gap-4 mb-4 flex-wrap">
          <div className="flex-1">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by entity" />
            </SelectTrigger>
            <SelectContent>
              {entityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === 'all' ? 'All Entities' : type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-40 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-left flex items-center text-sm",
                    !dateFrom && "text-gray-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From Date"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg rounded-md" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-40 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-left flex items-center text-sm",
                    !dateTo && "text-gray-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {dateTo ? format(dateTo, "MMM dd, yyyy") : "To Date"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg rounded-md" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {(dateFrom || dateTo) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
                className="flex items-center"
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="recycle-bin">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Deleted Items</CardTitle>
                <div className="flex gap-2">
                  {selectedItems.length > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Permanently Delete ({selectedItems.length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the selected items.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handlePermanentDelete(selectedItems)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredRecycleBinItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No deleted items found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedItems.length === recycleBinItems.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Deleted By</TableHead>
                      <TableHead>Deleted At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecycleBinItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => handleSelectItem(item.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.entity.charAt(0).toUpperCase() + item.entity.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getEntityDisplayName(item.originalData, item.entity)}
                        </TableCell>
                        <TableCell>
                          {item.deletedByUser?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(item.deletedAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {item.canRecover && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRecover(item.id)}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Recover
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Permanently Delete Item?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this item.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handlePermanentDelete([item.id])}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Permanently
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-history">
          <Card>
            <CardHeader>
              <CardTitle>Audit History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : auditHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No audit history found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditHistory.map((item) => (
                      <TableRow key={item.id} onClick={() => setSelectedAudit(item)} className="cursor-pointer hover:bg-gray-100">
                        <TableCell>
                          <Badge className={getActionBadgeColor(item.action)}>
                            {item.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.entity.charAt(0).toUpperCase() + item.entity.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.user?.name || 'System'}
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <Drawer open={!!selectedAudit} onOpenChange={(open: boolean) => !open && setSelectedAudit(null)}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Audit Details</DrawerTitle>
                <DrawerDescription>
                  Details for {selectedAudit?.entity} {selectedAudit?.action} by {selectedAudit?.user?.name || 'System'} on {selectedAudit ? format(new Date(selectedAudit.createdAt), 'PPP') : ''}
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4">
                {selectedAudit && (
                   <AuditDetailsComponent 
                     item={selectedAudit}
                     shopNames={shopNames}
                     setShopNames={setShopNames}
                     customerNames={customerNames}
                     setCustomerNames={setCustomerNames}
                     categoryNames={categoryNames}
                     setCategoryNames={setCategoryNames}
                     accessToken={accessToken}
                   />
                 )}
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} items
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.offset === 0}
            onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.offset + pagination.limit >= pagination.total}
            onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

interface AuditDetailsProps {
   item: AuditHistoryItem;
   shopNames: Record<string, string>;
   setShopNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
   customerNames: Record<string, string>;
   setCustomerNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
   categoryNames: Record<string, string>;
   setCategoryNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
   accessToken: string | null;
 }

const AuditDetailsComponent: React.FC<AuditDetailsProps> = ({
   item,
   shopNames,
   setShopNames,
   customerNames,
   setCustomerNames,
   categoryNames,
   setCategoryNames,
   accessToken
 }) => {
  const { entity, details, action, user, createdAt } = item;
  
  // Fetch related data for better display
  useEffect(() => {
    const fetchRelatedData = async () => {
      if (!details) return;
      
      const shopIds = new Set<string>();
      const customerIds = new Set<number>();
      const categoryIds = new Set<number>();
      
      // Extract IDs from details
      Object.entries(details).forEach(([key, value]) => {
        if (key === 'shopId' && typeof value === 'string') {
          shopIds.add(value);
        }
        if (key === 'customerId' && typeof value === 'number') {
          customerIds.add(value);
        }
        if (key === 'categoryId' && typeof value === 'number') {
          categoryIds.add(value);
        }
        // Handle nested objects
        if (typeof value === 'object' && value !== null) {
          if ('shopId' in value && typeof value.shopId === 'string') {
            shopIds.add(value.shopId);
          }
          if ('customerId' in value && typeof value.customerId === 'number') {
            customerIds.add(value.customerId);
          }
          if ('categoryId' in value && typeof value.categoryId === 'number') {
            categoryIds.add(value.categoryId);
          }
        }
      });
      
      // Fetch shop names
      if (shopIds.size > 0) {
        try {
          const response = await fetch('/api/shops/names', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(accessToken && { Authorization: `Bearer ${accessToken}` })
            },
            body: JSON.stringify({ ids: Array.from(shopIds) })
          });
          if (response.ok) {
            const shops = await response.json();
            const shopMap: Record<string, string> = {};
            shops.forEach((shop: any) => {
              shopMap[shop.id] = shop.name;
            });
            setShopNames(shopMap);
          }
        } catch (error) {
          console.error('Failed to fetch shop names:', error);
        }
      }
      
      // Fetch customer names
      if (customerIds.size > 0) {
        try {
          const response = await fetch('/api/customers/names', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(accessToken && { Authorization: `Bearer ${accessToken}` })
            },
            body: JSON.stringify({ ids: Array.from(customerIds) })
          });
          if (response.ok) {
            const customers = await response.json();
            const customerMap: Record<string, string> = {};
            customers.forEach((customer: any) => {
              customerMap[customer.id] = customer.name;
            });
            setCustomerNames(customerMap);
          }
        } catch (error) {
          console.error('Failed to fetch customer names:', error);
        }
      }
      
      // Fetch category names
      if (categoryIds.size > 0) {
        try {
          const response = await fetch('/api/categories/names', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(accessToken && { Authorization: `Bearer ${accessToken}` })
            },
            body: JSON.stringify({ ids: Array.from(categoryIds) })
          });
          if (response.ok) {
            const categories = await response.json();
            const categoryMap: Record<string, string> = {};
            categories.forEach((category: any) => {
              categoryMap[category.id] = category.name;
            });
            setCategoryNames(categoryMap);
          }
        } catch (error) {
          console.error('Failed to fetch category names:', error);
        }
      }
    };
    
    fetchRelatedData();
  }, [details]);
  
  const formatValue = (key: string, value: any): { display: string; type: string } => {
    if (value === null || value === undefined) return { display: 'N/A', type: 'null' };
    
    // Handle specific field types
    if (key === 'shopId' && typeof value === 'string') {
      const shopName = shopNames[value];
      return { 
        display: shopName ? `${shopName} (${value.slice(-8)})` : value, 
        type: 'reference' 
      };
    }
    
    if (key === 'customerId' && typeof value === 'number') {
      const customerName = customerNames[value];
      return { 
        display: customerName ? `${customerName} (#${value})` : `Customer #${value}`, 
        type: 'reference' 
      };
    }
    
    if (key === 'categoryId' && typeof value === 'number') {
      const categoryName = categoryNames[value];
      return { 
        display: categoryName ? `${categoryName} (#${value})` : `Category #${value}`, 
        type: 'reference' 
      };
    }
    
    if (typeof value === 'boolean') {
      return { display: value ? 'Yes' : 'No', type: 'boolean' };
    }
    
    if (typeof value === 'number') {
      // Format currency fields
      if (key.toLowerCase().includes('price') || key.toLowerCase().includes('total') || key.toLowerCase().includes('amount')) {
        return { display: `$${value.toLocaleString()}`, type: 'currency' };
      }
      return { display: value.toLocaleString(), type: 'number' };
    }
    
    if (typeof value === 'object') {
      // Handle change objects (old/new values)
      if (value && typeof value === 'object' && ('old' in value || 'new' in value)) {
        const oldVal = 'old' in value ? value.old : 'N/A';
        const newVal = 'new' in value ? value.new : 'N/A';
        return { 
          display: `${oldVal} → ${newVal}`, 
          type: 'change' 
        };
      }
      
      // Handle arrays (especially items arrays)
      if (Array.isArray(value)) {
        if (key.toLowerCase() === 'items' && value.length > 0) {
          // Format items array for purchase invoices
          const itemsDisplay = value.map((item, index) => {
            const productInfo = item.productId ? `Product #${item.productId}` : 'Unknown Product';
            const quantity = item.quantity || 0;
            const price = item.price ? `$${Number(item.price).toLocaleString()}` : '$0';
            const total = item.total ? `$${Number(item.total).toLocaleString()}` : 
                         (item.quantity && item.price) ? `$${(Number(item.quantity) * Number(item.price)).toLocaleString()}` : '$0';
            return `${index + 1}. ${productInfo} - Qty: ${quantity}, Price: ${price}, Total: ${total}`;
          }).join('\n');
          return { display: itemsDisplay, type: 'items' };
        }
        
        // Handle other arrays
        if (value.length === 0) {
          return { display: 'Empty array', type: 'array' };
        }
        
        const arrayDisplay = value.map((item, index) => {
          if (typeof item === 'object') {
            return `${index + 1}. ${JSON.stringify(item)}`;
          }
          return `${index + 1}. ${String(item)}`;
        }).join('\n');
        
        return { display: arrayDisplay, type: 'array' };
      }
      
      return { display: JSON.stringify(value, null, 2), type: 'object' };
    }
    
    return { display: String(value), type: 'string' };
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'product': return '📦';
      case 'customer': return '👤';
      case 'supplier': return '🏢';
      case 'category': return '📂';
      case 'order': return '🛒';
      case 'invoice': return '📄';
      default: return '📋';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{getEntityIcon(entity)}</span>
          <div>
            <h3 className="text-lg font-semibold capitalize">
              {entity} {action}
            </h3>
            <p className="text-sm text-gray-600">
              {format(new Date(createdAt), 'PPpp')}
            </p>
          </div>
        </div>
        
        {user && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-sm text-gray-700 mb-1">Performed by</h4>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Section */}
      {details && Object.keys(details).length > 0 ? (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            📊 Change Details
          </h4>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Field</TableHead>
                  <TableHead className="font-semibold">Value</TableHead>
                  <TableHead className="font-semibold w-20">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {Object.entries(details).map(([key, value]) => {
                    const { display, type } = formatValue(key, value);
                    return (
                      <TableRow key={key} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="break-words">
                            {type === 'object' ? (
                              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {display}
                              </pre>
                            ) : type === 'items' ? (
                              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                <div className="font-medium text-blue-900 mb-2 flex items-center gap-1">
                                  📦 Invoice Items
                                </div>
                                <pre className="text-xs text-blue-800 whitespace-pre-wrap">
                                  {display}
                                </pre>
                              </div>
                            ) : type === 'array' ? (
                              <div className="bg-purple-50 border border-purple-200 rounded p-3">
                                <div className="font-medium text-purple-900 mb-2 flex items-center gap-1">
                                  📋 Array Data
                                </div>
                                <pre className="text-xs text-purple-800 whitespace-pre-wrap">
                                  {display}
                                </pre>
                              </div>
                            ) : (
                              <span className={cn(
                                "px-2 py-1 rounded text-sm",
                                type === 'boolean' && 'bg-green-100 text-green-800',
                                type === 'number' && 'bg-blue-100 text-blue-800',
                                type === 'currency' && 'bg-emerald-100 text-emerald-800',
                                type === 'reference' && 'bg-indigo-100 text-indigo-800',
                                type === 'change' && 'bg-orange-100 text-orange-800',
                                type === 'string' && 'bg-gray-100 text-gray-800',
                                type === 'null' && 'bg-gray-50 text-gray-500'
                              )}>
                                {display}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {type === 'reference' ? 'ref' : 
                             type === 'currency' ? 'money' : 
                             type === 'change' ? 'diff' : 
                             type === 'items' ? 'items' :
                             type === 'array' ? 'list' : 
                             type}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📭</div>
          <p>No detailed changes recorded for this action.</p>
        </div>
      )}

      {/* Entity-specific additional info */}
      {entity.toLowerCase() === 'product' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">💡 Product Information</h5>
          <p className="text-sm text-blue-800">
            This audit entry tracks changes to product data including inventory, pricing, and specifications.
          </p>
        </div>
      )}
      
      {entity.toLowerCase() === 'customer' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-medium text-green-900 mb-2">👤 Customer Information</h5>
          <p className="text-sm text-green-800">
            This audit entry tracks changes to customer profile, contact details, and account settings.
          </p>
        </div>
      )}
      
      {entity.toLowerCase() === 'order' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h5 className="font-medium text-purple-900 mb-2">🛒 Order Information</h5>
          <p className="text-sm text-purple-800">
            This audit entry tracks changes to order status, items, shipping, and payment information.
          </p>
        </div>
      )}
      
      {(entity.toLowerCase() === 'purchaseinvoice' || entity.toLowerCase() === 'purchase_invoice') && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h5 className="font-medium text-orange-900 mb-2">📄 Purchase Invoice Information</h5>
          <p className="text-sm text-orange-800">
            This audit entry tracks changes to purchase invoice data including supplier details, items, quantities, pricing, and payment status.
          </p>
        </div>
      )}    </div>
  );
};

// Export the AuditDetailsComponent for use in the main component
export { AuditDetailsComponent };