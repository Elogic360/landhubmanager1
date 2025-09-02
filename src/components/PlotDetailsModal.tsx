import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  DollarSign,
  Square,
  Calendar,
  User,
  Mail,
  Phone,
  Home,
  Zap,
  Car,
  Mountain,
  Droplets,
  Wifi,
  Shield,
  Truck,
  TreePine,
  Building,
  ShoppingCart
} from 'lucide-react';
import { PlotData } from '../types/plot';

interface PlotDetailsModalProps {
  plot: PlotData | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderClick: (plot: PlotData) => void;
}

const PlotDetailsModal: React.FC<PlotDetailsModalProps> = ({
  plot,
  isOpen,
  onClose,
  onOrderClick
}) => {
  if (!plot) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatArea = (area: number) => {
    return `${area.toLocaleString()} sq ft`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'text-green-600 bg-green-50 border-green-200',
      sold: 'text-red-600 bg-red-50 border-red-200',
      reserved: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      pending: 'text-purple-600 bg-purple-50 border-purple-200'
    };
    return colors[status as keyof typeof colors] || colors.available;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      residential: Home,
      commercial: Building,
      agricultural: TreePine,
      industrial: Truck
    };
    return icons[type as keyof typeof icons] || Home;
  };

  const getAmenityIcon = (amenity: string) => {
    const iconMap: { [key: string]: any } = {
      'electricity': Zap,
      'water': Droplets,
      'internet': Wifi,
      'security': Shield,
      'parking': Car,
      'road_access': Truck,
      'landscaping': TreePine,
      'shopping': ShoppingCart,
      'default': Home
    };
    return iconMap[amenity.toLowerCase().replace(' ', '_')] || iconMap.default;
  };

  const TypeIcon = getTypeIcon(plot.type);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative">
              {plot.images && plot.images.length > 0 && (
                <div className="h-64 sm:h-80 overflow-hidden">
                  <img
                    src={plot.images[0]}
                    alt={plot.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              )}
              
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200 shadow-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-start justify-between">
                  <div className="text-white">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">{plot.title}</h2>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{plot.location}</span>
                      </div>
                      <div className="flex items-center">
                        <TypeIcon className="w-4 h-4 mr-1" />
                        <span className="capitalize">{plot.type}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize border ${getStatusColor(plot.status)}`}>
                    {plot.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-320px)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Price and Area */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center text-green-600 mb-1">
                        <DollarSign className="w-5 h-5 mr-2" />
                        <span className="text-sm font-medium">Price</span>
                      </div>
                      <p className="text-2xl font-bold text-green-700">{formatPrice(plot.price)}</p>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center text-blue-600 mb-1">
                        <Square className="w-5 h-5 mr-2" />
                        <span className="text-sm font-medium">Area</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">{formatArea(plot.area)}</p>
                    </div>
                  </div>

                  {/* Description */}
                  {plot.description && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                      <p className="text-gray-600 leading-relaxed">{plot.description}</p>
                    </div>
                  )}

                  {/* Amenities */}
                  {plot.amenities && plot.amenities.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {plot.amenities.map((amenity, index) => {
                          const IconComponent = getAmenityIcon(amenity);
                          return (
                            <div
                              key={index}
                              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            >
                              <IconComponent className="w-4 h-4 mr-2 text-primary-600" />
                              <span className="text-sm text-gray-700 capitalize">
                                {amenity.replace('_', ' ')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Additional Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {plot.zoning && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-1">Zoning</h4>
                        <p className="text-gray-600">{plot.zoning}</p>
                      </div>
                    )}
                    
                    {plot.soil_type && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-1">Soil Type</h4>
                        <p className="text-gray-600">{plot.soil_type}</p>
                      </div>
                    )}
                    
                    {plot.elevation && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-1">Elevation</h4>
                        <div className="flex items-center text-gray-600">
                          <Mountain className="w-4 h-4 mr-1" />
                          <span>{plot.elevation} ft</span>
                        </div>
                      </div>
                    )}
                    
                    {plot.access_roads !== null && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-1">Road Access</h4>
                        <div className="flex items-center text-gray-600">
                          <Car className="w-4 h-4 mr-1" />
                          <span>{plot.access_roads ? 'Available' : 'Not Available'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Utilities */}
                  {plot.utilities && plot.utilities.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Utilities</h3>
                      <div className="flex flex-wrap gap-2">
                        {plot.utilities.map((utility, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                          >
                            {utility}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Owner Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span>{plot.owner.name}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        <a
                          href={`tel:${plot.owner.contact}`}
                          className="hover:text-primary-600 transition-colors duration-200"
                        >
                          {plot.owner.contact}
                        </a>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <a
                          href={`mailto:${plot.owner.email}`}
                          className="hover:text-primary-600 transition-colors duration-200"
                        >
                          {plot.owner.email}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Listing Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Listing Details</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Listed on:</span>
                        <span className="font-medium">{formatDate(plot.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Last updated:</span>
                        <span className="font-medium">{formatDate(plot.updated_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Plot ID:</span>
                        <span className="font-medium font-mono text-xs">{plot.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {plot.status === 'available' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onOrderClick(plot)}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
                    >
                      Inquire About This Plot
                    </motion.button>
                  )}
                  
                  {plot.status !== 'available' && (
                    <div className="text-center p-3 bg-gray-100 rounded-lg">
                      <p className="text-gray-600 font-medium capitalize">
                        This plot is currently {plot.status}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlotDetailsModal;