import React, { useState } from 'react';
import { Search, Filter, MapPin, DollarSign, Square, Home, Building, TreePine, Truck } from 'lucide-react';
import { FilterOptions } from '../types/plot';

interface SearchAndFiltersProps {
  onSearch: (query: string) => void;
  onFilter: (filters: FilterOptions) => void;
  isLoading?: boolean;
  plotCount: number;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  onSearch,
  onFilter,
  isLoading,
  plotCount
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    type: [],
    status: [],
    priceRange: { min: 0, max: 1000000 },
    areaRange: { min: 0, max: 50000 },
    location: '',
    amenities: []
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handleTypeFilter = (type: string) => {
    const newTypes = filters.type.includes(type)
      ? filters.type.filter(t => t !== type)
      : [...filters.type, type];
    handleFilterChange('type', newTypes);
  };

  const handleStatusFilter = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    handleFilterChange('status', newStatuses);
  };

  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      type: [],
      status: [],
      priceRange: { min: 0, max: 1000000 },
      areaRange: { min: 0, max: 50000 },
      location: '',
      amenities: []
    };
    setFilters(defaultFilters);
    onFilter(defaultFilters);
  };

  const hasActiveFilters = 
    filters.type.length > 0 ||
    filters.status.length > 0 ||
    filters.location !== '' ||
    filters.priceRange.min > 0 ||
    filters.priceRange.max < 1000000 ||
    filters.areaRange.min > 0 ||
    filters.areaRange.max < 50000;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by location, title, or description..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Filter Toggle and Results Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
              hasActiveFilters
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {filters.type.length + filters.status.length + (filters.location ? 1 : 0)}
              </span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              Clear all filters
            </button>
          )}
        </div>
        
        <div className="text-sm text-gray-600">
          {plotCount} {plotCount === 1 ? 'plot' : 'plots'} found
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-t pt-4 space-y-6">
          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="Filter by location..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              />
            </div>
          </div>

          {/* Property Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Property Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 'residential', label: 'Residential', icon: Home },
                { value: 'commercial', label: 'Commercial', icon: Building },
                { value: 'agricultural', label: 'Agricultural', icon: TreePine },
                { value: 'industrial', label: 'Industrial', icon: Truck },
              ].map((type) => {
                const IconComponent = type.icon;
                const isSelected = filters.type.includes(type.value);
                return (
                  <button
                    key={type.value}
                    onClick={() => handleTypeFilter(type.value)}
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors duration-200 ${
                      isSelected
                        ? 'bg-primary-50 border-primary-200 text-primary-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 'available', label: 'Available', color: 'green' },
                { value: 'reserved', label: 'Reserved', color: 'yellow' },
                { value: 'pending', label: 'Pending', color: 'purple' },
                { value: 'sold', label: 'Sold', color: 'red' },
              ].map((status) => {
                const isSelected = filters.status.includes(status.value);
                return (
                  <button
                    key={status.value}
                    onClick={() => handleStatusFilter(status.value)}
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors duration-200 ${
                      isSelected
                        ? `bg-${status.color}-50 border-${status.color}-200 text-${status.color}-700`
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-${status.color}-500`}></div>
                    <span className="text-sm font-medium capitalize">{status.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Price Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={filters.priceRange.min}
                  onChange={(e) => handleFilterChange('priceRange', {
                    ...filters.priceRange,
                    min: Number(e.target.value)
                  })}
                  placeholder="Min price"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                />
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={filters.priceRange.max}
                  onChange={(e) => handleFilterChange('priceRange', {
                    ...filters.priceRange,
                    max: Number(e.target.value)
                  })}
                  placeholder="Max price"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                />
              </div>
            </div>
          </div>

          {/* Area Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Area Range (sq ft)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <Square className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={filters.areaRange.min}
                  onChange={(e) => handleFilterChange('areaRange', {
                    ...filters.areaRange,
                    min: Number(e.target.value)
                  })}
                  placeholder="Min area"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                />
              </div>
              <div className="relative">
                <Square className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={filters.areaRange.max}
                  onChange={(e) => handleFilterChange('areaRange', {
                    ...filters.areaRange,
                    max: Number(e.target.value)
                  })}
                  placeholder="Max area"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilters;