import { PlotData } from '../types/plot';

export const mockPlots: PlotData[] = [
  {
    id: 'plot-001',
    title: 'Scenic Valley Plot',
    description: 'Beautiful 5-acre plot with mountain views and natural water source. Perfect for residential development or private retreat. The land features rolling hills, mature trees, and excellent soil quality.',
    price: 125000,
    area: 217800, // 5 acres in sq ft
    location: 'Blue Ridge Mountains, VA',
    coordinates: { lat: 38.5767, lng: -78.8714 },
    boundaries: [
      { lat: 38.5770, lng: -78.8720 },
      { lat: 38.5770, lng: -78.8708 },
      { lat: 38.5764, lng: -78.8708 },
      { lat: 38.5764, lng: -78.8720 },
    ],
    status: 'available',
    type: 'residential',
    amenities: ['electricity', 'water', 'road_access', 'landscaping'],
    images: [
      'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1643389/pexels-photo-1643389.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    owner: {
      name: 'Sarah Johnson',
      contact: '+1-540-555-0123',
      email: 'sarah.johnson@email.com'
    },
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-20T15:45:00Z',
    zoning: 'Residential R-2',
    utilities: ['Electric', 'Water', 'Septic'],
    access_roads: true,
    soil_type: 'Loamy Clay',
    elevation: 1250
  },
  {
    id: 'plot-002',
    title: 'Downtown Commercial Lot',
    description: 'Prime commercial real estate in the heart of downtown. Excellent foot traffic and visibility. Zoned for mixed-use development with high growth potential.',
    price: 450000,
    area: 8712, // 0.2 acres in sq ft
    location: 'Downtown Richmond, VA',
    coordinates: { lat: 37.5407, lng: -77.4360 },
    status: 'available',
    type: 'commercial',
    amenities: ['electricity', 'water', 'internet', 'parking', 'security'],
    images: [
      'https://images.pexels.com/photos/2098427/pexels-photo-2098427.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    owner: {
      name: 'Richmond Development Corp',
      contact: '+1-804-555-0456',
      email: 'info@richmonddevelopment.com'
    },
    created_at: '2024-01-18T14:20:00Z',
    updated_at: '2024-01-25T09:15:00Z',
    zoning: 'Commercial C-3',
    utilities: ['Electric', 'Water', 'Sewer', 'Gas', 'Fiber Internet'],
    access_roads: true,
    soil_type: 'Urban Fill',
    elevation: 160
  },
  {
    id: 'plot-003',
    title: 'Agricultural Farmland',
    description: '50-acre productive farmland with irrigation system. Excellent soil quality for crops or livestock. Includes barn and equipment storage.',
    price: 275000,
    area: 2178000, // 50 acres in sq ft
    location: 'Shenandoah Valley, VA',
    coordinates: { lat: 38.9517, lng: -78.1694 },
    boundaries: [
      { lat: 38.9520, lng: -78.1700 },
      { lat: 38.9520, lng: -78.1688 },
      { lat: 38.9514, lng: -78.1688 },
      { lat: 38.9514, lng: -78.1700 },
    ],
    status: 'reserved',
    type: 'agricultural',
    amenities: ['electricity', 'water', 'road_access', 'irrigation'],
    images: [
      'https://images.pexels.com/photos/2253643/pexels-photo-2253643.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1595104/pexels-photo-1595104.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    owner: {
      name: 'Valley Farms LLC',
      contact: '+1-540-555-0789',
      email: 'contact@valleyfarms.com'
    },
    created_at: '2024-01-10T08:45:00Z',
    updated_at: '2024-01-28T11:30:00Z',
    zoning: 'Agricultural A-1',
    utilities: ['Electric', 'Well Water', 'Propane'],
    access_roads: true,
    soil_type: 'Rich Loam',
    elevation: 900
  },
  {
    id: 'plot-004',
    title: 'Industrial Development Site',
    description: 'Large industrial plot with rail access and highway frontage. Suitable for manufacturing, distribution, or logistics operations.',
    price: 680000,
    area: 653400, // 15 acres in sq ft
    location: 'Petersburg, VA',
    coordinates: { lat: 37.2279, lng: -77.4019 },
    status: 'available',
    type: 'industrial',
    amenities: ['electricity', 'water', 'road_access', 'rail_access', 'security'],
    images: [
      'https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/259620/pexels-photo-259620.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    owner: {
      name: 'Industrial Properties Inc',
      contact: '+1-804-555-0321',
      email: 'leasing@industrialproperties.com'
    },
    created_at: '2024-01-22T16:10:00Z',
    updated_at: '2024-01-29T13:25:00Z',
    zoning: 'Industrial I-2',
    utilities: ['Electric', 'Water', 'Sewer', 'Natural Gas'],
    access_roads: true,
    soil_type: 'Engineered Fill',
    elevation: 130
  },
  {
    id: 'plot-005',
    title: 'Waterfront Residential Land',
    description: 'Exclusive waterfront property with 300 feet of lake frontage. Perfect for luxury home construction with stunning water views and private dock access.',
    price: 850000,
    area: 130680, // 3 acres in sq ft
    location: 'Lake Anna, VA',
    coordinates: { lat: 38.1291, lng: -77.7989 },
    boundaries: [
      { lat: 38.1295, lng: -77.7995 },
      { lat: 38.1295, lng: -77.7983 },
      { lat: 38.1287, lng: -77.7983 },
      { lat: 38.1287, lng: -77.7995 },
    ],
    status: 'pending',
    type: 'residential',
    amenities: ['electricity', 'water', 'internet', 'dock_access', 'landscaping'],
    images: [
      'https://images.pexels.com/photos/1166209/pexels-photo-1166209.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    owner: {
      name: 'Lakefront Properties Group',
      contact: '+1-540-555-0654',
      email: 'sales@lakefrontproperties.com'
    },
    created_at: '2024-01-25T12:00:00Z',
    updated_at: '2024-01-30T10:15:00Z',
    zoning: 'Residential R-1',
    utilities: ['Electric', 'Water', 'Septic', 'Cable'],
    access_roads: true,
    soil_type: 'Sandy Loam',
    elevation: 250
  },
  {
    id: 'plot-006',
    title: 'Historic Town Center Plot',
    description: 'Rare opportunity in historic town center. Perfect for boutique retail, restaurant, or mixed-use development. Walking distance to all amenities.',
    price: 325000,
    area: 6534, // 0.15 acres in sq ft
    location: 'Historic Williamsburg, VA',
    coordinates: { lat: 37.2707, lng: -76.7075 },
    status: 'sold',
    type: 'commercial',
    amenities: ['electricity', 'water', 'internet', 'parking', 'foot_traffic'],
    images: [
      'https://images.pexels.com/photos/1838640/pexels-photo-1838640.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    owner: {
      name: 'Historic Preservation Trust',
      contact: '+1-757-555-0987',
      email: 'properties@historictrust.org'
    },
    created_at: '2024-01-05T09:30:00Z',
    updated_at: '2024-01-31T14:45:00Z',
    zoning: 'Historic Commercial HC-1',
    utilities: ['Electric', 'Water', 'Sewer', 'Gas'],
    access_roads: true,
    soil_type: 'Historic Fill',
    elevation: 45
  }
];

// Function to simulate API delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock service functions
export const getMockPlots = async (): Promise<PlotData[]> => {
  await delay(1000); // Simulate network delay
  return mockPlots;
};

export const searchMockPlots = async (query: string): Promise<PlotData[]> => {
  await delay(500);
  if (!query.trim()) return mockPlots;
  
  return mockPlots.filter(plot => 
    plot.title.toLowerCase().includes(query.toLowerCase()) ||
    plot.description.toLowerCase().includes(query.toLowerCase()) ||
    plot.location.toLowerCase().includes(query.toLowerCase())
  );
};

export const filterMockPlots = async (filters: {
  type?: string[];
  status?: string[];
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
}): Promise<PlotData[]> => {
  await delay(500);
  
  let results = mockPlots;

  if (filters.type && filters.type.length > 0) {
    results = results.filter(plot => filters.type!.includes(plot.type));
  }

  if (filters.status && filters.status.length > 0) {
    results = results.filter(plot => filters.status!.includes(plot.status));
  }

  if (filters.priceMin !== undefined) {
    results = results.filter(plot => plot.price >= filters.priceMin!);
  }

  if (filters.priceMax !== undefined) {
    results = results.filter(plot => plot.price <= filters.priceMax!);
  }

  if (filters.areaMin !== undefined) {
    results = results.filter(plot => plot.area >= filters.areaMin!);
  }

  if (filters.areaMax !== undefined) {
    results = results.filter(plot => plot.area <= filters.areaMax!);
  }

  return results;
};