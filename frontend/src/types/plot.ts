export interface PlotData {
  id: string;
  title: string;
  description: string;
  price: number;
  area: number;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  boundaries?: Array<{
    lat: number;
    lng: number;
  }>;
  status: 'available' | 'sold' | 'reserved' | 'pending';
  type: 'residential' | 'commercial' | 'agricultural' | 'industrial';
  amenities: string[];
  images: string[];
  owner: {
    name: string;
    contact: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  zoning?: string;
  utilities?: string[];
  access_roads?: boolean;
  soil_type?: string;
  elevation?: number;
}

export interface MapViewProps {
  plots: PlotData[];
  selectedPlot?: PlotData | null;
  onPlotSelect: (plot: PlotData | null) => void;
  isLoading?: boolean;
}

export interface PlotModalProps {
  plot: PlotData | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderClick: (plot: PlotData) => void;
}

export interface PlotOrderModalProps {
  plot: PlotData | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderData: OrderFormData) => void;
}

export interface OrderFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  inspection_date?: string;
  financing_needed?: boolean;
}

export interface FilterOptions {
  type: string[];
  status: string[];
  priceRange: {
    min: number;
    max: number;
  };
  areaRange: {
    min: number;
    max: number;
  };
  location: string;
  amenities: string[];
}