import React, { useEffect, useState, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import PlotOrderModal from "./PlotOrderModal";
import { Plot, OrderData } from "../types/land";
import { plotService } from "../services/plotService";
import { plotManagementService, PlotWithOrderStatus } from "../services/plotsManage";
import LoadingSpinner from "./LoadingSpinner";
import MapControls from "./MapControls";

// Fix Leaflet default icons
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Tanzania map configuration with precise coordinate handling
const TANZANIA_CONFIG = {
  center: [-3.547857, 36.630366] as L.LatLngTuple, // Updated to specified coordinates for optimal plot visibility
  bounds: [
    [-11.75, 29.34], // SW
    [-0.95, 40.44], // NE
  ] as L.LatLngBoundsExpression,
  defaultZoom: 20, // Set to zoom level 20 for optimal plot display
  minZoom: 8,      // Increased to ensure plot numbers are visible
  maxZoom: 25,     // Increased for detailed viewing
  // Coordinate Reference System (CRS) settings for precise positioning
  crs: L.CRS.EPSG3857, // Web Mercator projection (default for web maps)
  worldCopyJump: false, // Prevent world copy wrapping
  maxBoundsViscosity: 0.8, // Stronger boundary enforcement
};

// Enhanced plot styling with better visual hierarchy and order status support
const getPlotStyle = (plot: PlotWithOrderStatus, isHovered: boolean = false) => {
  const baseStyle = {
    weight: isHovered ? 4 : 2,
    color: "#ffffff",
    fillOpacity: isHovered ? 0.9 : 0.7,
    opacity: 1,
  };

  // Check if plot has an active order (pending or approved)
  if (plot.hasActiveOrder) {
    switch (plot.orderStatus) {
      case "pending":
        return {
          ...baseStyle,
          fillColor: "#DC2626", // red-600 - Ordered plots are red
          fillOpacity: isHovered ? 0.9 : 0.8,
          dashArray: "8,4", // Dashed border for pending orders
        };
      case "approved":
        return {
          ...baseStyle,
          fillColor: "#DC2626", // red-600 - Ordered plots are red
          fillOpacity: isHovered ? 0.9 : 0.8,
          dashArray: undefined, // Solid border for approved orders
        };
      case "rejected":
        return {
          ...baseStyle,
          fillColor: "#10B981", // emerald-500 - Available again after rejection
          dashArray: undefined,
        };
      default:
        return {
          ...baseStyle,
          fillColor: "#DC2626", // red-600 - Default for ordered plots
          fillOpacity: isHovered ? 0.9 : 0.8,
          dashArray: undefined,
        };
    }
  }

  // Fallback to original status-based styling for plots without orders
  switch (plot.status) {
    case "available":
      return {
        ...baseStyle,
        fillColor: "#10B981", // emerald-500
        dashArray: undefined,
      };
    case "taken":
      return {
        ...baseStyle,
        fillColor: "#DC2626", // red-600 - Consistent red for taken plots
        fillOpacity: isHovered ? 0.8 : 0.6,
        dashArray: undefined,
      };
    case "pending":
      return {
        ...baseStyle,
        fillColor: "#F59E0B", // amber-500
        dashArray: "8,4",
      };
    default:
      return {
        ...baseStyle,
        fillColor: "#6B7280", // gray-500
        dashArray: undefined,
      };
  }
};

const getStatusBadgeClass = (plot: PlotWithOrderStatus): string => {
  // Check if plot has an active order first
  if (plot.hasActiveOrder) {
    switch (plot.orderStatus) {
      case "pending":
        return "bg-red-100 text-red-800 border border-red-200"; // Red for ordered plots
      case "approved":
        return "bg-red-100 text-red-800 border border-red-200"; // Red for ordered plots
      case "rejected":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200"; // Green if rejected (available again)
      default:
        return "bg-red-100 text-red-800 border border-red-200"; // Red for ordered plots
    }
  }

  // Fallback to original status-based badges
  switch (plot.status) {
    case "available":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    case "taken":
      return "bg-red-100 text-red-800 border border-red-200";
    case "pending":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200";
  }
};

// Enhanced geometry validation with detailed logging and coordinate normalization
const isValidGeometry = (geometry: any): boolean => {
  if (!geometry || !geometry.type || !geometry.coordinates) {
    return false;
  }

  const isValidCoordinate = (coord: any): boolean => {
    if (!Array.isArray(coord) || coord.length < 2) return false;
    
    const [lng, lat] = coord;
    
    // Check if coordinates are numbers and finite
    if (typeof lng !== "number" || typeof lat !== "number") return false;
    if (!isFinite(lng) || !isFinite(lat)) return false;
    if (isNaN(lng) || isNaN(lat)) return false;
    
    // Check if coordinates are within valid geographic bounds
    // Allow some tolerance for edge cases
    if (lng < -180.1 || lng > 180.1) return false;
    if (lat < -90.1 || lat > 90.1) return false;
    
    return true;
  };

  // Normalize coordinates to ensure they're within bounds
  const normalizeCoordinate = (coord: number[]): number[] => {
    let [lng, lat] = coord;
    
    // Clamp longitude to valid range
    lng = Math.max(-180, Math.min(180, lng));
    
    // Clamp latitude to valid range  
    lat = Math.max(-90, Math.min(90, lat));
    
    return [lng, lat];
  };

  try {
    if (geometry.type === "Polygon") {
      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
        return false;
      }
      
      // Validate and normalize each ring
      return geometry.coordinates.every((ring: any) => {
        if (!Array.isArray(ring) || ring.length < 4) return false;
        
        // Normalize coordinates
        for (let i = 0; i < ring.length; i++) {
          if (isValidCoordinate(ring[i])) {
            ring[i] = normalizeCoordinate(ring[i]);
          } else {
            return false;
          }
        }
        
        // Ensure the ring is closed (first and last coordinates should be the same)
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (Math.abs(first[0] - last[0]) > 1e-10 || Math.abs(first[1] - last[1]) > 1e-10) {
          ring[ring.length - 1] = [first[0], first[1]]; // Close the ring
        }
        
        return true;
      });
    }

    if (geometry.type === "MultiPolygon") {
      if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
        return false;
      }
      
      return geometry.coordinates.every((polygon: any) => {
        if (!Array.isArray(polygon) || polygon.length === 0) return false;
        
        return polygon.every((ring: any) => {
          if (!Array.isArray(ring) || ring.length < 4) return false;
          
          // Normalize coordinates
          for (let i = 0; i < ring.length; i++) {
            if (isValidCoordinate(ring[i])) {
              ring[i] = normalizeCoordinate(ring[i]);
            } else {
              return false;
            }
          }
          
          // Ensure the ring is closed
          const first = ring[0];
          const last = ring[ring.length - 1];
          if (Math.abs(first[0] - last[0]) > 1e-10 || Math.abs(first[1] - last[1]) > 1e-10) {
            ring[ring.length - 1] = [first[0], first[1]];
          }
          
          return true;
        });
      });
    }

    return false;
  } catch (error) {
    console.error("[MapView] Geometry validation error:", error);
    return false;
  }
};

// Optimized centroid calculation with better precision
const getPolygonCentroid = (coordinates: number[][][]): [number, number] => {
  try {
    const ring = coordinates[0];
    if (!ring || ring.length < 4) return [0, 0];

    let area = 0;
    let x = 0;
    let y = 0;

    // Use the proper polygon centroid algorithm
    for (let i = 0; i < ring.length - 1; i++) {
      const [x0, y0] = ring[i];
      const [x1, y1] = ring[i + 1];
      const a = x0 * y1 - x1 * y0;
      area += a;
      x += (x0 + x1) * a;
      y += (y0 + y1) * a;
    }

    if (Math.abs(area) < 1e-10) {
      // Fallback to geometric center if area calculation fails
      const avgX = ring.reduce((sum, coord) => sum + coord[0], 0) / (ring.length - 1);
      const avgY = ring.reduce((sum, coord) => sum + coord[1], 0) / (ring.length - 1);
      return [avgX, avgY];
    }

    area *= 0.5;
    const centroidX = x / (6 * area);
    const centroidY = y / (6 * area);
    
    // Ensure the centroid is within valid geographic bounds
    const clampedX = Math.max(-180, Math.min(180, centroidX));
    const clampedY = Math.max(-90, Math.min(90, centroidY));
    
    return [clampedX, clampedY];
  } catch (error) {
    console.error("[MapView] Centroid calculation error:", error);
    return [0, 0];
  }
};

interface MapViewProps {
  onPlotSelect?: (plot: PlotWithOrderStatus) => void;
  selectedPlotId?: string;
}

const MapView: React.FC<MapViewProps> = ({
  onPlotSelect,
  selectedPlotId,
}) => {
  // Refs for map components
  const mapRef = useRef<L.Map | null>(null);
  const plotLayerRef = useRef<L.GeoJSON | null>(null);
  const labelLayerRef = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hoveredLayerRef = useRef<L.Layer | null>(null);
  // ...existing code...

  // State management
  const [plots, setPlots] = useState<PlotWithOrderStatus[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<PlotWithOrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  
  // Control flags to prevent race conditions and multiple operations
  const initializingRef = useRef(false);
  const renderingRef = useRef(false);
  const loadingRef = useRef(false);
  const lastPlotsHashRef = useRef<string>(''); // Track plot data changes
  const mapViewStateRef = useRef({ zoom: TANZANIA_CONFIG.defaultZoom, center: TANZANIA_CONFIG.center });

  // Stable popup content creator - memoized to prevent re-renders
  const createPopupContent = useCallback((plot: PlotWithOrderStatus) => {
    const container = L.DomUtil.create("div", "plot-popup");
    
    // Header with "Plot Details" title and status
    const header = L.DomUtil.create("div", "popup-header flex justify-between items-start mb-3", container);
    const title = L.DomUtil.create("h3", "text-lg font-bold text-gray-900", header);
    title.textContent = "Plot Details";
    
    const badge = L.DomUtil.create("span", `px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(plot)}`, header);
    badge.textContent = plot.status.charAt(0).toUpperCase() + plot.status.slice(1);

    // Plot details - only show required attributes
    const details = L.DomUtil.create("div", "popup-details space-y-2 text-sm mb-4", container);
    
    const createDetailRow = (label: string, value: string | number) => {
      const row = L.DomUtil.create("div", "flex justify-between items-center", details);
      const labelSpan = L.DomUtil.create("span", "text-gray-600 font-medium", row);
      labelSpan.textContent = label + ":";
      const valueSpan = L.DomUtil.create("span", "text-gray-900", row);
      valueSpan.textContent = value.toString();
    };

    // Extract required attributes from shapefile data
    const blockNumber = plot.attributes?.Block_numb || plot.attributes?.block_numb || 'N/A';
    const plotNumber = plot.attributes?.Plot_Numb || plot.attributes?.plot_numb || plot.plot_code.split('_').pop() || 'N/A';
    const landUse = plot.attributes?.Land_use || plot.attributes?.land_use || 'Not specified';

    // Show only the 4 required attributes
    createDetailRow("Block number", blockNumber);
    createDetailRow("Plot number", plotNumber);
    createDetailRow("Area", `${(plot.area_hectares * 10000).toLocaleString()} m²`);
    createDetailRow("Use", landUse);

    // Show order summary if plot has an active order
    if (plot.hasActiveOrder) {
      const orderSummary = plotManagementService.getOrderSummary(plot);
      if (orderSummary) {
        const orderInfo = L.DomUtil.create("div", "order-info mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs", container);
        orderInfo.textContent = orderSummary;
      }
    }

    // Action button
    const actions = L.DomUtil.create("div", "popup-actions mt-4", container);
    
    const shouldShowButton = plotManagementService.shouldShowOrderButton(plot);
    const buttonText = plotManagementService.getOrderButtonText(plot);
    
    if (shouldShowButton && plot.status === "available") {
      const button = L.DomUtil.create("button", 
        "w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5", 
        actions
      );
      button.textContent = buttonText;
      button.type = "button";

      const handleClick = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedPlot(plot);
        setIsModalOpen(true);
        setOrderError(null);
        onPlotSelect?.(plot);
      };

      button.addEventListener('click', handleClick);
      L.DomEvent.disableClickPropagation(button);
    } else {
      const statusText = plot.hasActiveOrder && plot.orderStatus === 'pending' 
        ? 'Order Pending' 
        : plot.hasActiveOrder && plot.orderStatus === 'approved'
        ? 'Plot Taken'
        : plot.status === 'taken' 
        ? 'Plot Already Taken' 
        : 'Not Available';
      
      const bgColor = plot.hasActiveOrder && plot.orderStatus === 'pending' 
        ? 'bg-yellow-100 text-yellow-800' 
        : 'bg-gray-100 text-gray-600';
        
      const div = L.DomUtil.create("div", 
        `w-full px-4 py-2 ${bgColor} rounded-lg text-center font-medium`, 
        actions
      );
      div.textContent = statusText;
    }

    return container;
  }, [onPlotSelect]); // Only depend on onPlotSelect

  // Stable plot click handler - now just for logging and selection
  const handlePlotClick = useCallback((plot: PlotWithOrderStatus) => {
    console.log('[MapView] Plot clicked:', plot.plot_code, 'Status:', plot.status);
    
    // Don't immediately open modal - let popup show first
    // Modal will be opened via popup button click
    onPlotSelect?.(plot);
  }, [onPlotSelect]); // Only depend on onPlotSelect

  // Optimized plot labels with debouncing and better performance
  const createPlotLabels = useCallback((plotsData: PlotWithOrderStatus[]) => {
    if (!mapRef.current || !isMapReady || renderingRef.current) return;

    // Remove existing labels
    if (labelLayerRef.current) {
      mapRef.current.removeLayer(labelLayerRef.current);
    }

    labelLayerRef.current = L.layerGroup();

    // Show labels at lower zoom levels for better visibility
    const currentZoom = mapRef.current.getZoom();
    if (currentZoom < 10) { // Reduced from 12 to 10
      labelLayerRef.current.addTo(mapRef.current);
      return;
    }

    const validPlots = plotsData.filter(plot => isValidGeometry(plot.geometry));
    
    // Process labels in chunks to prevent blocking
    const processLabelsInChunks = (plots: Plot[], chunkSize = 50) => {
      let index = 0;
      
      const processChunk = () => {
        const chunk = plots.slice(index, index + chunkSize);
        
        chunk.forEach((plot, i) => {
          try {
            let centroid: [number, number];
            const geom = plot.geometry as any;
            
            if (geom.type === "Polygon") {
              centroid = getPolygonCentroid(geom.coordinates);
            } else if (geom.type === "MultiPolygon") {
              centroid = getPolygonCentroid(geom.coordinates[0]);
            } else {
              return;
            }

            // Validate and ensure centroid coordinates are within bounds
            if (isNaN(centroid[0]) || isNaN(centroid[1])) {
              console.warn(`[MapView] Invalid centroid for plot ${plot.plot_code}:`, centroid);
              return;
            }

            // Ensure coordinates are within valid geographic bounds
            const [lng, lat] = centroid;
            if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
              console.warn(`[MapView] Centroid out of bounds for plot ${plot.plot_code}:`, centroid);
              return;
            }

            const plotNumber = plot.attributes?.Plot_Numb || 
                              plot.attributes?.plot_numb || 
                              plot.plot_code.split('_').pop() || 
                              `${index + i + 1}`;

            // Create label with precise coordinate positioning
            const labelIcon = L.divIcon({
              className: "plot-label-clean",
              html: `<div class="plot-number-text" data-status="${plot.status}">${plotNumber}</div>`,
              iconSize: [0, 0], // No size to avoid offset issues
              iconAnchor: [0, 0], // No anchor offset for precise positioning
            });

            // Create marker with exact coordinate positioning (lat, lng)
            const labelMarker = L.marker([lat, lng], {
              icon: labelIcon,
              interactive: false,
              zIndexOffset: 1000,
              // Ensure marker stays at exact coordinates during zoom
              riseOnHover: false,
              bubblingMouseEvents: false,
            });

            labelLayerRef.current?.addLayer(labelMarker);
          } catch (error) {
            console.warn(`[MapView] Error creating label for plot ${plot.plot_code}:`, error);
          }
        });

        index += chunkSize;
        
        if (index < plots.length) {
          // Process next chunk on next frame
          requestAnimationFrame(processChunk);
        } else {
          // Add all labels to map when done
          if (labelLayerRef.current && mapRef.current) {
            labelLayerRef.current.addTo(mapRef.current);
          }
        }
      };
      
      processChunk();
    };

    processLabelsInChunks(validPlots);
  }, [isMapReady]);

  // Enhanced plot rendering with performance optimizations and re-render prevention
  const renderPlots = useCallback((plotsData: PlotWithOrderStatus[]) => {
    if (!mapRef.current || !isMapReady || renderingRef.current) {
      console.warn("[MapView] Cannot render plots: map not ready or already rendering");
      return;
    }

    renderingRef.current = true;
    console.log('[MapView] Rendering', plotsData.length, 'plots');

    try {
      // Store current map view state
      const currentMap = mapRef.current;
      const currentCenter = currentMap.getCenter();
      const currentZoom = currentMap.getZoom();
      mapViewStateRef.current = { 
        center: [currentCenter.lat, currentCenter.lng] as L.LatLngTuple, 
        zoom: currentZoom 
      };

      // Remove existing plot layer
      if (plotLayerRef.current) {
        currentMap.removeLayer(plotLayerRef.current);
        plotLayerRef.current = null;
      }

      const validPlots = plotsData.filter(plot => isValidGeometry(plot.geometry));
      
      if (validPlots.length === 0) {
        console.warn("[MapView] No valid plots to render");
        currentMap.setView(TANZANIA_CONFIG.center, TANZANIA_CONFIG.defaultZoom);
        setLoading(false);
        renderingRef.current = false;
        return;
      }

      // Create GeoJSON data with enhanced coordinate validation
      const geoJsonData = {
        type: "FeatureCollection" as const,
        features: validPlots.map((plot) => {
          // Ensure geometry coordinates are properly formatted
          const geometry = { ...plot.geometry };
          
          // Additional coordinate validation and normalization for GeoJSON
          if (geometry.type === "Polygon") {
            geometry.coordinates = geometry.coordinates.map((ring: number[][]) => 
              ring.map(coord => [
                Math.max(-180, Math.min(180, coord[0])), // Clamp longitude
                Math.max(-90, Math.min(90, coord[1]))     // Clamp latitude
              ])
            );
          } else if (geometry.type === "MultiPolygon") {
            geometry.coordinates = geometry.coordinates.map((polygon: number[][][]) =>
              polygon.map((ring: number[][]) => 
                ring.map(coord => [
                  Math.max(-180, Math.min(180, coord[0])), // Clamp longitude
                  Math.max(-90, Math.min(90, coord[1]))     // Clamp latitude
                ])
              )
            );
          }

          return {
            type: "Feature" as const,
            properties: {
              id: plot.id,
              plot_code: plot.plot_code,
              status: plot.status,
              area_hectares: plot.area_hectares,
              district: plot.district,
              ward: plot.ward,
              village: plot.village,
              attributes: plot.attributes || {},
            },
            geometry: geometry,
          };
        }),
      };

      // Create plot layer with enhanced coordinate precision and interactions
      plotLayerRef.current = L.geoJSON(geoJsonData, {
        // Enhanced styling with coordinate-aware rendering
        style: (feature) => {
          // Find the plot object to pass to getPlotStyle
          const plotId = feature?.properties?.id;
          const plot = plotsData.find(p => p.id === plotId);
          const isSelected = plotId === selectedPlotId;
          
          // Use default plot object if not found (shouldn't happen in normal operation)
          const plotForStyling = plot || {
            id: plotId || '',
            status: feature?.properties?.status ?? "available",
            hasActiveOrder: false
          } as PlotWithOrderStatus;
          
          const baseStyle = getPlotStyle(plotForStyling);

          if (isSelected) {
            return {
              ...baseStyle,
              weight: 4,
              color: "#3B82F6", // blue-500
              // Enhanced rendering for better coordinate attachment
              smoothFactor: 0, // Disable smoothing for precise coordinates
              noClip: false, // Allow clipping for better performance
            };
          }
          return {
            ...baseStyle,
            smoothFactor: 0, // Disable smoothing for all plots
            noClip: false,
          };
        },
        // Enhanced coordinate handling options
        coordsToLatLng: (coords) => {
          // Ensure coordinates are in the correct format [lng, lat] -> [lat, lng]
          const [lng, lat] = coords;
          return L.latLng(lat, lng);
        },
        onEachFeature: (feature, layer) => {
          const plot = validPlots.find(p => p.id === feature.properties.id);
          if (!plot) return;

          // Enhanced hover effects with debouncing
          let hoverTimeout: NodeJS.Timeout;
          
          layer.on({
            mouseover: (e) => {
              clearTimeout(hoverTimeout);
              hoverTimeout = setTimeout(() => {
                const target = e.target;
                hoveredLayerRef.current = target;
                
                const isSelected = plot.id === selectedPlotId;
                const hoverStyle = getPlotStyle(plot, true);

                if (isSelected) {
                  target.setStyle({
                    ...hoverStyle,
                    weight: 4,
                    color: "#3B82F6",
                  });
                } else {
                  target.setStyle(hoverStyle);
                }

                target.bringToFront?.();
              }, 50); // Debounce hover
            },
            mouseout: (e) => {
              clearTimeout(hoverTimeout);
              if (hoveredLayerRef.current === e.target) {
                hoveredLayerRef.current = null;
                if (plotLayerRef.current) {
                  plotLayerRef.current.resetStyle(e.target as L.Path);
                }
              }
            }
            // Removed click handler to allow popup to show on click
          });

          // Bind popup with enhanced content
          layer.bindPopup(() => createPopupContent(plot), {
            maxWidth: 350,
            className: "custom-popup",
            closeButton: true,
            autoPan: true,
            keepInView: true,
            autoClose: false, // Prevent auto-close on map click
          });
        },
      });

      if (currentMap && plotLayerRef.current) {
        plotLayerRef.current.addTo(currentMap);
      
        // Create labels after a short delay to ensure plots are rendered
        setTimeout(() => {
          createPlotLabels(validPlots);
        }, 100);

        // Always set to specific view when plots are first loaded, or restore previous view
        const isFirstLoad = lastPlotsHashRef.current === '';
        
        if (isFirstLoad) {
          // Set to the specific coordinates and zoom level for optimal plot viewing on first load
          currentMap.setView(TANZANIA_CONFIG.center, TANZANIA_CONFIG.defaultZoom);
          console.log(`[MapView] First load - Set view to: ${TANZANIA_CONFIG.center[0]}, ${TANZANIA_CONFIG.center[1]}, zoom: ${TANZANIA_CONFIG.defaultZoom}`);
        } else {
          // Restore previous view state for subsequent updates
          currentMap.setView(mapViewStateRef.current.center, mapViewStateRef.current.zoom);
          console.log(`[MapView] Subsequent load - Restored view to: ${mapViewStateRef.current.center[0]}, ${mapViewStateRef.current.center[1]}, zoom: ${mapViewStateRef.current.zoom}`);
        }
      }

      console.log("[MapView] Successfully rendered", validPlots.length, "plots");
      
    } catch (err) {
      console.error("[MapView] Error rendering plots:", err);
      setError("Failed to render plots on map. Please try refreshing the page.");
    } finally {
      setLoading(false);
      renderingRef.current = false;
    }
  }, [isMapReady, createPlotLabels, createPopupContent, handlePlotClick, selectedPlotId]);

  // Enhanced data loading with retry mechanism and race condition prevention
  const loadPlots = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    
    // Prevent multiple simultaneous loading operations
    if (loadingRef.current) {
      console.log('[MapView] Loading already in progress, skipping...');
      return;
    }
    
    loadingRef.current = true;
    
    try {
      setLoading(true);
      setError(null);
      setConnectionStatus('checking');

      console.log('[MapView] Loading plots from API...');
      const plotsData = await plotService.getAllPlots();
      
      if (!plotsData?.length) {
        throw new Error("No land plots available. Please check if the database has been seeded with shapefile data.");
      }

      console.log('[MapView] Successfully loaded', plotsData.length, 'plots');
      
      // Only update plots if data actually changed
      const newPlotsHash = JSON.stringify(plotsData.map(p => ({ id: p.id, status: p.status })));
      if (newPlotsHash !== lastPlotsHashRef.current) {
        setPlots(plotsData);
      }
      
      setConnectionStatus('connected');
      
    } catch (err) {
      console.error("[MapView] Error loading plots:", err);
      setConnectionStatus('disconnected');
      
      if (retryCount < maxRetries) {
        console.log(`[MapView] Retrying... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          loadingRef.current = false;
          loadPlots(retryCount + 1);
        }, 2000 * (retryCount + 1));
        return;
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to load plots: ${errorMessage}`);
        setLoading(false);
      }
    } finally {
      loadingRef.current = false;
    }
  }, []); // NO dependencies to prevent recreation

  // Initialize map with enhanced error handling and stability
  const initializeMap = useCallback(() => {
    if (!containerRef.current || mapRef.current || initializingRef.current) {
      return;
    }

    try {
      console.log('[MapView] Initializing map...');
      initializingRef.current = true;
      
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        console.warn("Map container has invalid dimensions, retrying...");
        initializingRef.current = false;
        setTimeout(initializeMap, 100);
        return;
      }

      const map = L.map(containerRef.current, {
        center: TANZANIA_CONFIG.center,
        zoom: TANZANIA_CONFIG.defaultZoom,
        minZoom: TANZANIA_CONFIG.minZoom,
        maxZoom: TANZANIA_CONFIG.maxZoom,
        attributionControl: true,
        zoomControl: true,
        preferCanvas: true, // Better performance for large datasets
        maxBounds: TANZANIA_CONFIG.bounds, // Restrict panning to Tanzania
        maxBoundsViscosity: TANZANIA_CONFIG.maxBoundsViscosity,
        crs: TANZANIA_CONFIG.crs, // Ensure proper coordinate reference system
        worldCopyJump: TANZANIA_CONFIG.worldCopyJump,
        // Enhanced interaction options for better coordinate precision
        zoomSnap: 0.25, // Allow fractional zoom levels for smoother transitions
        zoomDelta: 0.5, // Smaller zoom steps for more control
        wheelPxPerZoomLevel: 120, // More precise mouse wheel zooming
        trackResize: true, // Automatically handle container resizing
      });

      const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
        minZoom: 5,
        tileSize: 256,
        zoomOffset: 0,
        detectRetina: true, // Better display on high-DPI screens
        errorTileUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZiNzI4MCI+VGlsZSBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==",
      });

      const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri",
        maxZoom: 19,
        minZoom: 5,
        tileSize: 256,
        zoomOffset: 0,
        detectRetina: true,
      });

      osmLayer.addTo(map);

      L.control.layers({ "OpenStreetMap": osmLayer, "Satellite": satelliteLayer }, {}, { position: 'topright' }).addTo(map);
      L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(map);

      // Set up event handlers
      map.on('load', () => {
        console.log('[MapView] Map loaded successfully');
        setIsMapReady(true);
        setMapError(null);
        initializingRef.current = false;
        map.invalidateSize();
      });

      map.on('error', (e) => {
        console.error('[MapView] Map error:', e);
        setMapError('Map failed to load properly');
        initializingRef.current = false;
      });

      // Prevent re-rendering on map interactions
      map.on('zoomstart movestart', () => {
        renderingRef.current = true;
      });

      map.on('zoomend moveend', () => {
        setTimeout(() => {
          renderingRef.current = false;
        }, 100);
      });

      mapRef.current = map;
      console.log('[MapView] Map instance created');
      
      // Set ready state immediately for leaflet maps
      setTimeout(() => {
        if (initializingRef.current) {
          setIsMapReady(true);
          setMapError(null);
          initializingRef.current = false;
          map.invalidateSize();
        }
      }, 500);
      
    } catch (err) {
      console.error("[MapView] Map initialization failed:", err);
      setMapError(`Failed to initialize map: ${err instanceof Error ? err.message : 'Unknown error'}`);
      initializingRef.current = false;
    }
  }, []); // No dependencies to prevent recreation

  // Enhanced order submission with optimistic updates and better error handling
  const handleOrderSubmit = useCallback(async (orderData: OrderData) => {
    if (!selectedPlot) {
      setOrderError("No plot selected.");
      return;
    }

    setOrderError(null);
    
    const originalPlots = plots;
    try {
      // Optimistic update - mark plot as ordered with red color
      const optimisticPlots = plots.map(p =>
        p.id === selectedPlot.id ? { 
          ...p, 
          status: "pending" as const,
          hasActiveOrder: true,
          orderStatus: "pending" as const,
          orderDate: new Date().toISOString(),
          customerName: `${orderData.first_name} ${orderData.last_name}`
        } : p
      );
      setPlots(optimisticPlots);

      await plotService.createOrder(selectedPlot.id, orderData);
      
      console.log('[MapView] Order submitted successfully');
      
      // Invalidate plot management cache for future requests
      plotManagementService.invalidateCache();
      
      setSelectedPlot(null);
      setIsModalOpen(false);
      
      // No need to reload - optimistic update is sufficient
      console.log('[MapView] ✅ Plot updated optimistically, no reload needed');
      
    } catch (err) {
      console.error("[MapView] Order submission failed:", err);
      
      // Revert optimistic update
      setPlots(originalPlots);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setOrderError(`Failed to submit order: ${errorMessage}`);
    }
  }, [selectedPlot, plots, loadPlots]);

  // Initialize map on mount - ONLY ONCE
  useEffect(() => {
    console.log('[MapView] Component mounted, initializing map...');
    
    if (!mapRef.current && containerRef.current && !initializingRef.current) {
      initializeMap();
    }

    return () => {
      // Clean up map instance on unmount
      if (mapRef.current) {
        console.log('[MapView] Map instance destroyed');
        mapRef.current.remove();
        mapRef.current = null;
      }
      setIsMapReady(false);
      initializingRef.current = false;
      renderingRef.current = false;
      loadingRef.current = false;
    };
  }, []); // EMPTY dependency array - run only once

  // Load plots when map is ready - ONLY ONCE
  useEffect(() => {
    if (isMapReady && plots.length === 0 && !loadingRef.current) {
      console.log('[MapView] Map ready, loading plots...');
      loadPlots();
    }
  }, [isMapReady]); // Only depend on isMapReady

  // Render plots when data changes - WITH STABILITY CHECK
  useEffect(() => {
    if (isMapReady && plots.length > 0 && !renderingRef.current) {
      // Create a hash of the plots data to check for actual changes
      const plotsHash = JSON.stringify(plots.map(p => ({ 
        id: p.id, 
        status: p.status, 
        hasActiveOrder: p.hasActiveOrder,
        orderStatus: p.orderStatus 
      })));
      
      // Only re-render if the data actually changed
      if (plotsHash !== lastPlotsHashRef.current) {
        console.log('[MapView] Plot data changed, re-rendering plots...');
        lastPlotsHashRef.current = plotsHash;
        renderPlots(plots);
      } else {
        console.log('[MapView] Plot data unchanged, skipping re-render');
      }
    }
  }, [plots, isMapReady, renderPlots]); // Only essential dependencies

  // Handle map events - DEBOUNCED AND STABLE
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    let zoomTimeout: NodeJS.Timeout;
    let moveTimeout: NodeJS.Timeout;

    const handleZoom = () => {
      clearTimeout(zoomTimeout);
      zoomTimeout = setTimeout(() => {
        if (plots.length > 0 && !renderingRef.current) {
          createPlotLabels(plots);
        }
      }, 300); // Debounce zoom events
    };

    const handleMove = () => {
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        
        // Update view state reference
        mapViewStateRef.current = {
          center: [center.lat, center.lng] as L.LatLngTuple,
          zoom: zoom
        };
        
        console.log(`[MapView] Map moved to: ${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}, zoom: ${zoom}`);
      }, 200); // Debounce move events
    };

    map.on('zoomend', handleZoom);
    map.on('moveend', handleMove);

    return () => {
      clearTimeout(zoomTimeout);
      clearTimeout(moveTimeout);
      map.off('zoomend', handleZoom);
      map.off('moveend', handleMove);
    };
  }, [isMapReady, plots]); // Stable dependencies

  // Stable refresh function for controls
  const handleRefresh = useCallback(() => {
    if (!loadingRef.current && !renderingRef.current) {
      console.log('[MapView] Manual refresh triggered');
      loadPlots();
    } else {
      console.log('[MapView] Refresh skipped - map is busy');
    }
  }, [loadPlots]);

  // Stable fit bounds function for controls
  const handleFitBounds = useCallback(() => {
    if (mapRef.current && plotLayerRef.current) {
      const bounds = plotLayerRef.current.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { 
          padding: [20, 20],
          maxZoom: 20  // Set to default zoom level for consistent plot visibility
        });
        console.log('[MapView] Map bounds fitted');
      } else {
        console.warn('[MapView] Invalid bounds for fitting');
      }
    }
  }, []);

  return (
    <div className="h-full w-full relative bg-gray-100">
      {/* Map container */}
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ minHeight: "400px" }}
      />

      {/* Enhanced loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-[1000]">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-sm text-gray-600">
              {connectionStatus === 'checking' ? 'Connecting to server...' : 'Loading land plots...'}
            </p>
            {connectionStatus === 'disconnected' && (
              <p className="mt-2 text-xs text-amber-600">
                Connection issues detected. Retrying...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Enhanced error overlay */}
      {(error || mapError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm z-[1000]">
          <div className="text-center max-w-md mx-4">
            <div className="w-16 h-16 mx-auto mb-4 text-red-500">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {mapError ? 'Map Error' : 'Data Loading Error'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {error || mapError}
            </p>
            <div className="space-y-3">
              <button
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                onClick={() => {
                  setError(null);
                  setMapError(null);
                  setPlots([]);
                  if (mapError) {
                    // Reinitialize map
                    if (mapRef.current) {
                      mapRef.current.remove();
                      mapRef.current = null;
                    }
                    setIsMapReady(false);
                    initializingRef.current = false;
                    initializeMap();
                  } else {
                    loadPlots();
                  }
                }}
              >
                Try Again
              </button>
              <button
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map controls */}
      {isMapReady && (
        <MapControls
          onRefresh={handleRefresh}
          onFitBounds={handleFitBounds}
          isLoading={loading}
        />
      )}

      {/* Order error notification */}
      {orderError && (
        <div className="absolute top-4 right-4 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg shadow-lg z-[1000] max-w-sm">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 text-red-500 mt-0.5">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Order Failed</p>
              <p className="text-xs mt-1">{orderError}</p>
            </div>
            <button
              onClick={() => setOrderError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Order modal */}
      {isModalOpen && selectedPlot && (
        <PlotOrderModal
          plot={selectedPlot}
          onClose={() => {
            setSelectedPlot(null);
            setIsModalOpen(false);
            setOrderError(null);
          }}
          onSubmit={handleOrderSubmit}
        />
      )}
    </div>
  );
};

export default MapView;