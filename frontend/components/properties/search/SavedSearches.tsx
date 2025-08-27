'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bookmark, 
  Search, 
  Trash2, 
  Calendar, 
  Hash,
  Edit3,
  Play,
  Star,
  AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface SavedSearch {
  id: string;
  name: string;
  criteria: any;
  created_at: string;
  results_count: number;
  is_favorite?: boolean;
  last_run?: string;
  notifications_enabled?: boolean;
}

interface SavedSearchesProps {
  savedSearches: SavedSearch[];
  onLoadSearch: (criteria: any) => void;
  onDeleteSearch: (id: string) => void;
}

export default function SavedSearches({
  savedSearches,
  onLoadSearch,
  onDeleteSearch
}: SavedSearchesProps) {
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [editName, setEditName] = useState('');

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('az-AZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getCriteriaDescription = (criteria: any) => {
    const parts = [];
    
    if (criteria.query) {
      parts.push(`"${criteria.query}"`);
    }
    
    if (criteria.property_category) {
      parts.push(criteria.property_category === 'residential' ? 'Yaşayış' : 'Kommersiya');
    }
    
    if (criteria.category) {
      parts.push(criteria.category === 'sale' ? 'Satış' : 'İcarə');
    }
    
    if (criteria.min_price || criteria.max_price) {
      const min = criteria.min_price ? criteria.min_price.toLocaleString() : '0';
      const max = criteria.max_price ? criteria.max_price.toLocaleString() : '∞';
      parts.push(`${min}-${max} AZN`);
    }
    
    if (criteria.district_id && criteria.district_name) {
      parts.push(criteria.district_name);
    }
    
    return parts.join(' • ') || 'Bütün filtrlər';
  };

  const handleEditStart = (search: SavedSearch) => {
    setEditingSearch(search);
    setEditName(search.name);
  };

  const handleEditSave = () => {
    if (editingSearch && editName.trim()) {
      // TODO: Implement update API
      console.log('Updating search name:', editingSearch.id, editName);
      setEditingSearch(null);
      setEditName('');
    }
  };

  const handleToggleFavorite = (searchId: string) => {
    // TODO: Implement toggle favorite API
    console.log('Toggling favorite:', searchId);
  };

  const handleToggleNotifications = (searchId: string) => {
    // TODO: Implement toggle notifications API
    console.log('Toggling notifications:', searchId);
  };

  const handleRunSearch = (search: SavedSearch) => {
    onLoadSearch(search.criteria);
  };

  const handleDeleteSearch = (searchId: string) => {
    if (confirm('Bu yadda saxlanmış axtarışı silmək istədiyinizə əminsiniz?')) {
      onDeleteSearch(searchId);
    }
  };

  if (savedSearches.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Yadda saxlanmış axtarış yoxdur
          </h3>
          <p className="text-gray-500 mb-4">
            Axtarış parametrlərini saxlamaq üçün axtarış formasında "Saxla" düyməsini istifadə edin
          </p>
          
          <Alert className="border-blue-200 bg-blue-50 max-w-md mx-auto">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-left">
              <strong>Məsləhət:</strong> Yadda saxlanmış axtarışlar sizə vaxt qənaət etməyə kömək edir və 
              yeni uyğun əmlaklar haqqında bildiriş ala bilərsiniz.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Sort searches - favorites first, then by creation date
  const sortedSearches = [...savedSearches].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bookmark className="h-5 w-5 mr-2" />
            Yadda Saxlanmış Axtarışlar
          </CardTitle>
          <CardDescription>
            {savedSearches.length} axtarış saxlanılıb
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedSearches.map((search) => (
              <Card key={search.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-lg">{search.name}</h4>
                        {search.is_favorite && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                        {search.notifications_enabled && (
                          <Badge variant="outline" className="text-xs">
                            Bildirişlər aktiv
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">
                        {getCriteriaDescription(search.criteria)}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Yaradılıb: {formatDate(search.created_at)}
                        </div>
                        
                        <div className="flex items-center">
                          <Hash className="h-4 w-4 mr-1" />
                          Son nəticə: {search.results_count}
                        </div>
                        
                        {search.last_run && (
                          <div className="flex items-center">
                            <Play className="h-4 w-4 mr-1" />
                            Son işlətmə: {formatDate(search.last_run)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleToggleFavorite(search.id)}
                        variant={search.is_favorite ? "default" : "outline"}
                      >
                        <Star className={`h-4 w-4 ${search.is_favorite ? 'fill-current' : ''}`} />
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Axtarış Adını Dəyiş</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Yeni ad daxil edin"
                            />
                            <div className="flex space-x-2">
                              <Button 
                                onClick={handleEditSave}
                                disabled={!editName.trim()}
                              >
                                Yadda saxla
                              </Button>
                              <Button variant="outline">
                                Ləğv et
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        size="sm"
                        onClick={() => handleRunSearch(search)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        İşlət
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteSearch(search.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Search criteria preview */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-medium mb-2">Axtarış parametrləri:</h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(search.criteria)
                        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
                        .map(([key, value], index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {key}: {Array.isArray(value) ? value.join(', ') : value.toString()}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Məsləhətlər</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
              <div>
                <strong>Sevimli axtarışlar:</strong> Ən çox istifadə etdiyiniz axtarışları sevimli kimi qeyd edin
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Search className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <strong>Sürətli axtarış:</strong> Yadda saxlanmış axtarışlardan istifadə edərək daha sürətli nəticə alın
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Bookmark className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <strong>Təşkil edin:</strong> Axtarışlarınıza məna ifadə edən adlar verin
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}