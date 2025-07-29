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
  const { toast } = useToast();
  const { accessToken, isAuthenticated } = useAuth();

  const entityTypes = ['all', 'product', 'customer', 'supplier', 'category', 'invoice', 'receipt'];

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
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditHistory.map((item) => (
                      <TableRow key={item.id}>
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
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {item.details && Object.keys(item.details).length > 0 ? (
                              <ul className="list-none p-0 m-0">
                                {Object.entries(item.details).map(([key, value]) => (
                                  <li key={key} className="text-sm">
                                    <span className="font-medium">{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : value}
                                  </li>
                                ))}
                              </ul>
                            ) : 'No details'}
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