import { useState, useEffect } from 'react';
import { PlotData, OrderFormData, FilterOptions } from '../types/plot';
import { PlotService } from '../services/plotService';

export const usePlots = () => {
  const [plots, setPlots] = useState<PlotData[]>([]);
  const [filteredPlots, setFilteredPlots] = useState<PlotData[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<PlotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial plots
  useEffect(() => {
    loadPlots();
  }, []);

  const loadPlots = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const plotsData = await PlotService.getAllPlots();
      setPlots(plotsData);
      setFilteredPlots(plotsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plots');
      console.error('Error loading plots:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchPlots = async (query: string) => {
    if (!query.trim()) {
      setFilteredPlots(plots);
      return;
    }

    try {
      setIsLoading(true);
      const searchResults = await PlotService.searchPlots(query);
      setFilteredPlots(searchResults);
    } catch (err) {
      console.error('Error searching plots:', err);
      // Fallback to local search if API fails
      const localResults = plots.filter(plot => 
        plot.title.toLowerCase().includes(query.toLowerCase()) ||
        plot.description.toLowerCase().includes(query.toLowerCase()) ||
        plot.location.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredPlots(localResults);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPlots = async (filters: FilterOptions) => {
    try {
      setIsLoading(true);
      const filteredResults = await PlotService.filterPlots({
        type: filters.type,
        status: filters.status,
        priceMin: filters.priceRange.min,
        priceMax: filters.priceRange.max,
        areaMin: filters.areaRange.min,
        areaMax: filters.areaRange.max,
      });
      
      // Apply additional local filters
      let results = filteredResults;
      
      if (filters.location) {
        results = results.filter(plot =>
          plot.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      setFilteredPlots(results);
    } catch (err) {
      console.error('Error filtering plots:', err);
      // Fallback to local filtering
      let results = plots;

      if (filters.type.length > 0) {
        results = results.filter(plot => filters.type.includes(plot.type));
      }

      if (filters.status.length > 0) {
        results = results.filter(plot => filters.status.includes(plot.status));
      }

      if (filters.location) {
        results = results.filter(plot =>
          plot.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      results = results.filter(plot =>
        plot.price >= filters.priceRange.min &&
        plot.price <= filters.priceRange.max &&
        plot.area >= filters.areaRange.min &&
        plot.area <= filters.areaRange.max
      );

      setFilteredPlots(results);
    } finally {
      setIsLoading(false);
    }
  };

  const createInquiry = async (plotId: string, orderData: OrderFormData) => {
    try {
      await PlotService.createPlotInquiry(plotId, orderData);
    } catch (err) {
      console.error('Error creating inquiry:', err);
      throw err;
    }
  };

  const selectPlot = (plot: PlotData | null) => {
    setSelectedPlot(plot);
  };

  const refreshPlots = () => {
    loadPlots();
  };

  return {
    plots: filteredPlots,
    selectedPlot,
    isLoading,
    error,
    searchPlots,
    filterPlots,
    createInquiry,
    selectPlot,
    refreshPlots,
    totalPlots: plots.length,
    filteredCount: filteredPlots.length
  };
};