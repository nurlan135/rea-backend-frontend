'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Plus, 
  Calendar, 
  User, 
  FileText, 
  Receipt,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface ExpensesListProps {
  expenses: any[];
  property: any;
  currentUser?: any;
}

const expenseCategories = {
  'renovation': { label: 'Təmir', color: 'bg-blue-100 text-blue-800', icon: '🔧' },
  'maintenance': { label: 'Baxım', color: 'bg-green-100 text-green-800', icon: '🛠️' },
  'utilities': { label: 'Kommunal', color: 'bg-yellow-100 text-yellow-800', icon: '⚡' },
  'legal': { label: 'Hüquqi', color: 'bg-purple-100 text-purple-800', icon: '⚖️' },
  'marketing': { label: 'Marketinq', color: 'bg-pink-100 text-pink-800', icon: '📢' },
  'other': { label: 'Digər', color: 'bg-gray-100 text-gray-800', icon: '📋' }
};

const expenseStatuses = {
  'pending': { label: 'Gözləmədə', color: 'bg-yellow-100 text-yellow-800' },
  'approved': { label: 'Təsdiqləndi', color: 'bg-green-100 text-green-800' },
  'rejected': { label: 'Rədd edildi', color: 'bg-red-100 text-red-800' },
  'paid': { label: 'Ödənildi', color: 'bg-blue-100 text-blue-800' }
};

export default function ExpensesList({ expenses, property, currentUser }: ExpensesListProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('az-AZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    if (filterCategory !== 'all' && expense.category !== filterCategory) return false;
    if (filterStatus !== 'all' && expense.status !== filterStatus) return false;
    return true;
  });

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const approvedExpenses = expenses
    .filter(expense => ['approved', 'paid'].includes(expense.status))
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const pendingExpenses = expenses
    .filter(expense => expense.status === 'pending')
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);

  // Group expenses by category for stats
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || 'other';
    if (!acc[category]) {
      acc[category] = { count: 0, amount: 0 };
    }
    acc[category].count++;
    acc[category].amount += expense.amount || 0;
    return acc;
  }, {} as { [key: string]: { count: number; amount: number } });

  const canAddExpense = currentUser?.role === 'agent' || 
                        currentUser?.role === 'manager' || 
                        currentUser?.role === 'admin';

  if (expenses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Xərclər</h2>
          <p className="text-gray-600">Bu əmlak üçün heç bir xərc qeyd edilməyib</p>
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-gray-400">
              <DollarSign className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Xərc Yoxdur</h3>
              <p className="text-sm mb-4">
                Bu əmlak üçün hələ heç bir xərc qeyd edilməyib.
              </p>
              
              {canAddExpense && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Xərc Əlavə Et
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-2">Xərclər</h2>
          <p className="text-gray-600">{expenses.length} xərc qeydiyyatda</p>
        </div>
        
        {canAddExpense && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Xərc
          </Button>
        )}
      </div>

      {/* Expense Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ümumi Xərc</p>
                <p className="text-2xl font-bold">{formatPrice(totalExpenses)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Təsdiqləndi</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(approvedExpenses)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gözləyir</p>
                <p className="text-2xl font-bold text-yellow-600">{formatPrice(pendingExpenses)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {Object.keys(expensesByCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kateqoriya üzrə Bölgü</CardTitle>
            <CardDescription>Xərclər kateqoriyalara görə qruplaşdırılıb</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(expensesByCategory).map(([category, data]) => {
                const categoryInfo = expenseCategories[category as keyof typeof expenseCategories] || expenseCategories.other;
                
                return (
                  <div key={category} className="text-center">
                    <div className="text-2xl mb-1">{categoryInfo.icon}</div>
                    <h4 className="font-medium text-sm">{categoryInfo.label}</h4>
                    <p className="text-lg font-bold text-gray-900">{formatPrice(data.amount)}</p>
                    <p className="text-xs text-gray-500">{data.count} xərc</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Kateqoriya:</label>
              <select 
                className="ml-2 border rounded px-2 py-1"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">Hamısı</option>
                {Object.entries(expenseCategories).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select 
                className="ml-2 border rounded px-2 py-1"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Hamısı</option>
                {Object.entries(expenseStatuses).map(([key, status]) => (
                  <option key={key} value={key}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <div className="space-y-4">
        {filteredExpenses.map((expense, index) => {
          const categoryInfo = expenseCategories[expense.category as keyof typeof expenseCategories] || expenseCategories.other;
          const statusInfo = expenseStatuses[expense.status as keyof typeof expenseStatuses] || expenseStatuses.pending;
          
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg">{categoryInfo.icon}</span>
                      <div>
                        <h4 className="font-semibold">{expense.title || 'Xərc'}</h4>
                        <p className="text-sm text-gray-600">
                          {expense.description || 'Təsvir mövcud deyil'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(expense.expense_date || expense.created_at)}
                      </div>
                      
                      {expense.created_by_first_name && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {expense.created_by_first_name} {expense.created_by_last_name}
                        </div>
                      )}
                      
                      {expense.receipt_url && (
                        <div className="flex items-center">
                          <Receipt className="h-4 w-4 mr-1" />
                          Qəbz var
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      {formatPrice(expense.amount)}
                    </p>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={categoryInfo.color}>
                        {categoryInfo.label}
                      </Badge>
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    
                    {expense.receipt_url && (
                      <Button variant="outline" size="sm" className="mt-2">
                        <FileText className="h-4 w-4 mr-1" />
                        Qəbz
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredExpenses.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-gray-400">
              <Minus className="h-8 w-8 mx-auto mb-3" />
              <h4 className="font-medium mb-2">Filtrə uyğun xərc tapılmadı</h4>
              <p className="text-sm">
                Seçilmiş kateqoriya və status üzrə xərc mövcud deyil
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}