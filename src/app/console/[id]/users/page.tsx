'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { OverviewSection, OverviewDataItem } from '@/components/dashboard/DashboardStats';
import { ReusableTable, Column } from '@/components/ui/reusable-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchInput } from '@/components/SearchInput';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import {
  BarChart3,
  Target,
  DollarSign,
  Clock,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  UserPlus,
  Eye,
  Pencil,
  Trash2,
  Mail,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  Activity,
  Crown,
  Settings,
} from 'lucide-react';

// Types based on Prisma schema
interface User {
  id: string;
  email: string;
  name?: string;
  tradingviewUsername?: string;
  role: 'USER' | 'ADMIN' | 'SUPPORT' | 'MANAGER';
  image?: string;
  emailVerified?: Date;
  createdAt: Date;
  _count?: {
    subscriptions: number;
    payments: number;
  };
}

interface UserFormData {
  email: string;
  name?: string;
  tradingviewUsername?: string;
  role: 'USER' | 'ADMIN' | 'SUPPORT' | 'MANAGER';
  image?: string;
  password?: string;
}

// Zod validation schema
const userFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().optional(),
  tradingviewUsername: z.string().optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPPORT', 'MANAGER']),
  image: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

type ValidationErrors = Partial<Record<keyof UserFormData, string>>;

// Action buttons component
function ActionButtons({
  row,
  onView,
  onUpdate,
  onDelete,
}: {
  row: User;
  onView: (row: User) => void;
  onUpdate: (row: User) => void;
  onDelete: (row: User) => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      <Button
        className="hover:text-white text-white/70"
        variant={'ghost'}
        size="icon"
        onClick={() => onView(row)}
        title="View Details"
      >
        <Eye size={16} />
      </Button>
      <Button
        className="hover:text-white text-white/70"
        variant={'ghost'}
        size="icon"
        onClick={() => onUpdate(row)}
        title="Edit User"
      >
        <Pencil size={16} />
      </Button>
      <Button
        className="hover:text-red-600 text-red-500"
        variant={'ghost'}
        size="icon"
        onClick={() => onDelete(row)}
        title="Delete User"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
}

// User form component
function UserForm({
  user,
  onSubmit,
  onCancel,
  isLoading,
}: {
  user?: User;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<UserFormData>({
    email: user?.email || '',
    name: user?.name || '',
    tradingviewUsername: user?.tradingviewUsername || '',
    role: user?.role || 'USER',
    image: user?.image || '',
    password: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateForm = () => {
    try {
      setIsValidating(true);
      
      // Create validation data - exclude password if it's empty for updates
      const validationData = { ...formData };
      if (user && !validationData.password) {
        delete validationData.password;
      }
      
      // For new users, password is required
      if (!user && !validationData.password) {
        throw new z.ZodError([
          {
            code: 'custom',
            path: ['password'],
            message: 'Password is required for new users',
          },
        ]);
      }
      
      userFormSchema.parse(validationData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: ValidationErrors = {};
        error.issues.forEach((err) => {
          const field = err.path[0] as keyof UserFormData;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleFieldChange = (field: keyof UserFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-white/90">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            required
            className={`bg-white/10 border-white/20 text-white ${
              errors.email ? 'border-red-500 focus:border-red-500' : ''
            }`}
            placeholder="user@example.com"
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="name" className="text-white/90">Full Name</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className={`bg-white/10 border-white/20 text-white ${
              errors.name ? 'border-red-500 focus:border-red-500' : ''
            }`}
            placeholder="John Doe"
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="tradingviewUsername" className="text-white/90">TradingView Username</Label>
          <Input
            id="tradingviewUsername"
            type="text"
            value={formData.tradingviewUsername}
            onChange={(e) => handleFieldChange('tradingviewUsername', e.target.value)}
            className={`bg-white/10 border-white/20 text-white ${
              errors.tradingviewUsername ? 'border-red-500 focus:border-red-500' : ''
            }`}
            placeholder="tradingview_username"
          />
          {errors.tradingviewUsername && (
            <p className="text-red-400 text-sm mt-1">{errors.tradingviewUsername}</p>
          )}
        </div>

        <div>
          <Label htmlFor="role" className="text-white/90">Role *</Label>
          <Select 
            value={formData.role} 
            onValueChange={(value) => handleFieldChange('role', value)}
          >
            <SelectTrigger className={`bg-white/10 border-white/20 text-white ${
              errors.role ? 'border-red-500 focus:border-red-500' : ''
            }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20">
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="SUPPORT">Support</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-red-400 text-sm mt-1">{errors.role}</p>
          )}
        </div>

        <div>
          <Label htmlFor="image" className="text-white/90">Profile Image URL</Label>
          <Input
            id="image"
            type="url"
            value={formData.image}
            onChange={(e) => handleFieldChange('image', e.target.value)}
            className={`bg-white/10 border-white/20 text-white ${
              errors.image ? 'border-red-500 focus:border-red-500' : ''
            }`}
            placeholder="https://example.com/avatar.jpg"
          />
          {errors.image && (
            <p className="text-red-400 text-sm mt-1">{errors.image}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password" className="text-white/90">
            Password {!user && '*'}
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            className={`bg-white/10 border-white/20 text-white ${
              errors.password ? 'border-red-500 focus:border-red-500' : ''
            }`}
            placeholder={user ? "Leave blank to keep current password" : "Enter password"}
          />
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">{errors.password}</p>
          )}
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 border-white/20 text-white hover:bg-white/10"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white"
        >
          {isLoading ? 'Saving...' : user ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBy, setFilterBy] = useState<string>('all');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (response.ok && data.users) {
        console.log('Fetched users:', data.users);
        setUsers(data.users);
      } else {
        toast.error('Failed to fetch users', {
          style: { background: '#ef4444', color: 'white' },
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users', {
        style: { background: '#ef4444', color: 'white' },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on selected filter and search query
  const getFilteredUsers = () => {
    let filtered = users;

    // Apply category filter first
    switch (filterBy) {
      case 'admin':
        filtered = users.filter((user) => user.role === 'ADMIN');
        break;
      case 'user':
        filtered = users.filter((user) => user.role === 'USER');
        break;
      case 'support':
        filtered = users.filter((user) => user.role === 'SUPPORT');
        break;
      case 'manager':
        filtered = users.filter((user) => user.role === 'MANAGER');
        break;
      case 'verified':
        filtered = users.filter((user) => user.emailVerified);
        break;
      case 'unverified':
        filtered = users.filter((user) => !user.emailVerified);
        break;
      case 'recent':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = users.filter((user) => new Date(user.createdAt) >= thirtyDaysAgo);
        break;
      default:
        filtered = users;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((user) => 
        user.email.toLowerCase().includes(query) ||
        (user.name && user.name.toLowerCase().includes(query)) ||
        (user.tradingviewUsername && user.tradingviewUsername.toLowerCase().includes(query)) ||
        user.role.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredUsers = getFilteredUsers();

  // CRUD Operations
  const handleCreateUser = () => {
    setEditingUser(null);
    setIsSheetOpen(true);
  };

  const handleUpdateUser = (user: User) => {
    setEditingUser(user);
    setIsSheetOpen(true);
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user);
  };

  const handleDeleteUser = (user: User) => {
    setDeleteUser(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteUser) return;

    try {
      const response = await fetch(`/api/users/${deleteUser.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('User deleted successfully!', {
          style: { background: '#22c55e', color: 'white' },
        });
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete user', {
          style: { background: '#ef4444', color: 'white' },
        });
      }
    } catch (error) {
      toast.error('Error deleting user', {
        style: { background: '#ef4444', color: 'white' },
      });
    }

    setDeleteModalOpen(false);
    setDeleteUser(null);
  };

  const handleFormSubmit = async (formData: UserFormData) => {
    setIsFormLoading(true);

    try {
      const isUpdate = !!editingUser;
      const url = isUpdate ? `/api/users/${editingUser.id}` : '/api/users';
      const method = isUpdate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`User ${isUpdate ? 'updated' : 'created'} successfully!`, {
          style: { background: '#22c55e', color: 'white' },
        });
        setIsSheetOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error(result.message || `Failed to ${isUpdate ? 'update' : 'create'} user`, {
          style: { background: '#ef4444', color: 'white' },
        });
      }
    } catch (error) {
      toast.error(`Error ${editingUser ? 'updating' : 'creating'} user`, {
        style: { background: '#ef4444', color: 'white' },
      });
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setEditingUser(null);
  };

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    adminUsers: users.filter(u => u.role === 'ADMIN').length,
    verifiedUsers: users.filter(u => u.emailVerified).length,
    recentUsers: users.filter(u => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(u.createdAt) >= thirtyDaysAgo;
    }).length,
  };

  // Define columns
  const columns: Column<User>[] = [
    {
      key: 'email',
      header: 'User',
      sortable: true,
      render: (email: string, user: User) => (
        <div className="flex items-center gap-3">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || email}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {(user.name || email).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-white">{user.name || 'Unnamed User'}</p>
            <p className="text-sm text-gray-400">{email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      align: 'center',
      render: (role: string) => {
        const roleColors = {
          ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
          MANAGER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          SUPPORT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          USER: 'bg-green-500/20 text-green-400 border-green-500/30',
        };
        
        const roleIcons = {
          ADMIN: Crown,
          MANAGER: Settings,
          SUPPORT: UserCheck,
          USER: Users,
        };

        const Icon = roleIcons[role as keyof typeof roleIcons] || Users;

        return (
          <Badge className={`${roleColors[role as keyof typeof roleColors]} flex items-center gap-1`}>
            <Icon size={12} />
            {role}
          </Badge>
        );
      },
    },
    {
      key: 'tradingviewUsername',
      header: 'TradingView',
      sortable: true,
      align: 'center',
      render: (username: string | null) => (
        <span className="text-white/80 font-mono text-sm">
          {username || 'Not set'}
        </span>
      ),
    },
    {
      key: 'emailVerified',
      header: 'Status',
      sortable: true,
      align: 'center',
      render: (verified: Date | null) => (
        <Badge className={verified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
          {verified ? (
            <>
              <UserCheck size={12} className="mr-1" />
              Verified
            </>
          ) : (
            <>
              <UserX size={12} className="mr-1" />
              Unverified
            </>
          )}
        </Badge>
      ),
    },
    {
      key: '_count',
      header: 'Activity',
      align: 'center',
      width: 'w-44',
      render: (count: any, user: User) => (
        <div className="text-center">
          <div className="text-white/80 text-sm">
            {count?.subscriptions || 0} subs
          </div>
          <div className="text-white/60 text-xs">
            {count?.payments || 0} payments
          </div>
        </div>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      sortable: true,
      render: (date: Date) => (
        <div className="flex items-center gap-2 text-gray-300">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">
            {new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (date: Date) => (
        <div className="flex items-center gap-2 text-gray-300">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">
            {new Date(date).toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            })}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (_, user: User) => (
        <ActionButtons
          row={user}
          onView={handleViewUser}
          onUpdate={handleUpdateUser}
          onDelete={handleDeleteUser}
        />
      ),
    },
  ];

  return (
    <GradientBackground>
      <Toaster position="top-center" />
      <div className="min-h-screen flex flex-col justify-between p-0 md:p-4">
        {/* User Management Stats */}
        <div className="mb-4">
          <OverviewSection
            overviewData={[
              {
                title: 'Total Users',
                currentValue: stats.totalUsers,
                icon: BarChart3,
                description: 'Registered users',
                pastValue: '+1 new user this month',
              },
              {
                title: 'Admin Users',
                currentValue: stats.adminUsers,
                icon: Target,
                description: `${stats.totalUsers > 0 ? ((stats.adminUsers / stats.totalUsers) * 100).toFixed(1) : '0'}% admin rate`,
                pastValue: `${stats.adminUsers} out of ${stats.totalUsers} users`,
              },
              {
                title: 'Verified Users',
                currentValue: stats.verifiedUsers,
                icon: DollarSign,
                description: 'Email verified',
                pastValue: '+15.2% this quarter',
              },
              {
                title: 'Recent Users',
                currentValue: stats.recentUsers,
                icon: Clock,
                description: 'New this month',
                pastValue: 'Recent signups',
              },
            ]}
            className="mb-0 opacity-95"
          />
        </div>

        <div className="flex flex-col justify-end mb-12">
          {/* Main Users Table */}
          <div className="flex-1 min-h-0 space-y-4">
            <Suspense
              fallback={
                <div className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                  <span className="ml-3 text-white/80">Loading users...</span>
                </div>
              }
            >
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  {/* Results Count */}
                  <div className="text-sm text-white/80 font-medium">
                    {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
                  </div>

                  {/* Search Input */}
                  <div className="w-full sm:w-64">
                    <SearchInput placeholder="Search users..." />
                  </div>

                  {/* Filter */}
                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-full sm:w-40 backdrop-blur-md bg-white/15 border border-white/30 text-white hover:bg-white/20 rounded-xl">
                      <SelectValue placeholder="Filter by" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-xl bg-white/10 border border-white/30 rounded-xl">
                      <SelectItem value="all" className="text-white hover:bg-white/20 focus:bg-white/20">
                        All Users
                      </SelectItem>
                      <SelectItem value="admin" className="text-white hover:bg-white/20 focus:bg-white/20">
                        Admins
                      </SelectItem>
                      <SelectItem value="user" className="text-white hover:bg-white/20 focus:bg-white/20">
                        Users
                      </SelectItem>
                      <SelectItem value="support" className="text-white hover:bg-white/20 focus:bg-white/20">
                        Support
                      </SelectItem>
                      <SelectItem value="manager" className="text-white hover:bg-white/20 focus:bg-white/20">
                        Managers
                      </SelectItem>
                      <SelectItem value="verified" className="text-white hover:bg-white/20 focus:bg-white/20">
                        Verified
                      </SelectItem>
                      <SelectItem value="unverified" className="text-white hover:bg-white/20 focus:bg-white/20">
                        Unverified
                      </SelectItem>
                      <SelectItem value="recent" className="text-white hover:bg-white/20 focus:bg-white/20">
                        Recent (30 days)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCreateUser}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold px-6 py-2 rounded-xl shadow-lg"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add New User
                </Button>
              </div>

              <ReusableTable
                data={filteredUsers}
                columns={columns}
                title="User Management"
                icon={Users}
                isLoading={loading}
                searchable={true}
                searchFields={['email', 'name', 'tradingviewUsername']}
                emptyStateTitle="No users found"
                emptyStateDescription="No users found matching your criteria"
                enableRowDetails={true}
                rowDetailTitle={(user) => `${user.name || 'User'} - ${user.email}`}
                excludeFromDetails={['id']}
                rowDetailContent={(user) => (
                  <div className="space-y-6">
                    {/* User Profile */}
                    <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        User Profile
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-white/70">Full Name</p>
                          <p className="text-white">{user.name || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-white/70">Email</p>
                          <p className="text-white">{user.email}</p>
                        </div>
                        <div>
                          <p className="text-white/70">Role</p>
                          <p className="text-white">{user.role}</p>
                        </div>
                        <div>
                          <p className="text-white/70">TradingView Username</p>
                          <p className="text-white">{user.tradingviewUsername || 'Not set'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Account Status */}
                    <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Account Status
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Email Verified:</span>
                          <Badge className={user.emailVerified ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {user.emailVerified ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Account Created:</span>
                          <span className="text-white">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Subscriptions:</span>
                          <span className="text-white">{user._count?.subscriptions || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Total Payments:</span>
                          <span className="text-white">{user._count?.payments || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => handleUpdateUser(user)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit User
                      </Button>
                    </div>
                  </div>
                )}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* User Form Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full md:w-[32rem] max-w-none bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-2xl p-6">
          <SheetHeader className="px-2 mb-6">
            <SheetTitle className="text-white text-lg">
              {editingUser ? 'Edit User' : 'Create New User'}
            </SheetTitle>
            <SheetDescription className="text-white/70">
              {editingUser 
                ? 'Update user information and permissions'
                : 'Add a new user to the system'
              }
            </SheetDescription>
          </SheetHeader>
          <div className="px-2">
            <UserForm
              user={editingUser || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleSheetClose}
              isLoading={isFormLoading}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Delete User</DialogTitle>
          </DialogHeader>
          {deleteUser && (
            <div className="space-y-4">
              <div className="text-lg font-semibold text-red-400">
                Are you sure you want to delete this user?
              </div>
              <div className="text-white/90">
                <p><strong>Name:</strong> {deleteUser.name || 'N/A'}</p>
                <p><strong>Email:</strong> {deleteUser.email}</p>
                <p><strong>Role:</strong> {deleteUser.role}</p>
              </div>
              <div className="text-yellow-400 text-sm">
                This action cannot be undone. All user data including subscriptions and payments will be permanently deleted.
              </div>
              <div className="flex gap-4 justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => setDeleteModalOpen(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </GradientBackground>
  );
};

export default UsersPage;