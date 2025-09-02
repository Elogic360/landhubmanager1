/**
 * Plot Management Service
 * Handles interaction with backend FastAPI for plot order management
 * Updates plot status based on orders in plot_orders table
 */

import { Plot } from '../types/land';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface OrderedPlot {
  plot_id: string;
  customer_name: string;
  order_status: 'pending' | 'approved' | 'rejected';
  order_date: string;
}

interface PlotWithOrderStatus extends Plot {
  hasActiveOrder: boolean;
  orderStatus?: 'pending' | 'approved' | 'rejected';
  orderDate?: string;
  customerName?: string;
}

class PlotManagementService {
  private apiUrl: string;
  private orderedPlotsCache: OrderedPlot[] = [];
  private cacheTimestamp: number = 0;
  private cacheExpirationMs: number = 30000; // 30 seconds cache
  private isLoading: boolean = false;

  constructor() {
    this.apiUrl = API_BASE_URL;
  }

  /**
   * Get all plots that have been ordered from plot_orders table
   */
  async getOrderedPlots(): Promise<OrderedPlot[]> {
    // Check cache validity
    if (this.isCacheValid()) {
      return this.orderedPlotsCache;
    }

    // Prevent multiple simultaneous requests
    if (this.isLoading) {
      // Wait for existing request
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.isCacheValid()) {
        return this.orderedPlotsCache;
      }
    }

    this.isLoading = true;
    try {
      const response = await fetch(`${this.apiUrl}/api/plots/ordered`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Extract ordered_plots array from the response
      const orderedPlots = data.ordered_plots || [];
      
      // Update cache with the array
      this.orderedPlotsCache = orderedPlots;
      this.cacheTimestamp = Date.now();
      
      return orderedPlots;
    } catch (error) {
      console.error('Error fetching ordered plots:', error);
      // Return cache if available, otherwise empty array
      return this.orderedPlotsCache.length > 0 ? this.orderedPlotsCache : [];
    } finally {
      this.isLoading = false;
    }
  }

  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.cacheExpirationMs && 
           Array.isArray(this.orderedPlotsCache);
  }

  /**
   * Invalidate cache when new orders are created
   */
  invalidateCache(): void {
    this.orderedPlotsCache = [];
    this.cacheTimestamp = 0;
  }

  /**
   * Check if a specific plot has an active order
   */
  async isPlotOrdered(plotId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/plots/${plotId}/order-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Plot not ordered
          return false;
        }
        throw new Error(`Failed to check plot order status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.has_active_order || false;
    } catch (error) {
      console.error('[PlotManage] Error checking plot order status:', error);
      return false; // Default to not ordered if there's an error
    }
  }

  /**
   * Merge plot data with order status information
   */
  async enrichPlotsWithOrderStatus(plots: Plot[]): Promise<PlotWithOrderStatus[]> {
    try {
      console.log('[PlotManage] Enriching', plots.length, 'plots with order status...');
      
      // Get all ordered plots
      const orderedPlots = await this.getOrderedPlots();
      console.log('[PlotManage] Fetched ordered plots:', orderedPlots);
      
      if (!Array.isArray(orderedPlots)) {
        console.error('[PlotManage] Expected array but got:', typeof orderedPlots, orderedPlots);
        throw new Error('orderedPlots is not an array');
      }
      
      const orderedPlotsMap = new Map(orderedPlots.map(op => [op.plot_id, op]));

      // Enrich plots with order information
      const enrichedPlots: PlotWithOrderStatus[] = plots.map(plot => {
        const orderInfo = orderedPlotsMap.get(plot.id);
        
        if (orderInfo) {
          return {
            ...plot,
            status: this.getPlotStatusFromOrder(orderInfo.order_status),
            hasActiveOrder: true,
            orderStatus: orderInfo.order_status,
            orderDate: orderInfo.order_date,
            customerName: orderInfo.customer_name,
          };
        }

        return {
          ...plot,
          hasActiveOrder: false,
        };
      });

      console.log('[PlotManage] Enriched plots with order status');
      return enrichedPlots;
    } catch (error) {
      console.error('[PlotManage] Error enriching plots with order status:', error);
      // Return plots without order enrichment if there's an error
      return plots.map(plot => ({ ...plot, hasActiveOrder: false }));
    }
  }

  /**
   * Update plot status based on order status
   */
  private getPlotStatusFromOrder(orderStatus: 'pending' | 'approved' | 'rejected'): Plot['status'] {
    switch (orderStatus) {
      case 'pending':
        return 'pending';
      case 'approved':
        return 'taken';
      case 'rejected':
        return 'available';
      default:
        return 'available';
    }
  }

  /**
   * Check if a plot should show the order button
   */
  shouldShowOrderButton(plot: PlotWithOrderStatus): boolean {
    // Don't show order button if:
    // 1. Plot has an active order (pending or approved)
    // 2. Plot status is not available
    if (plot.hasActiveOrder) {
      return plot.orderStatus === 'rejected'; // Only show if previous order was rejected
    }
    
    return plot.status === 'available';
  }

  /**
   * Get the appropriate button text for a plot
   */
  getOrderButtonText(plot: PlotWithOrderStatus): string {
    if (plot.hasActiveOrder) {
      switch (plot.orderStatus) {
        case 'pending':
          return 'Order Pending';
        case 'approved':
          return 'Plot Taken';
        case 'rejected':
          return 'Reorder Plot';
        default:
          return 'Order This Plot';
      }
    }
    
    return plot.status === 'available' ? 'Order This Plot' : 'Not Available';
  }

  /**
   * Get order summary for display
   */
  getOrderSummary(plot: PlotWithOrderStatus): string | null {
    if (!plot.hasActiveOrder) return null;
    
    const orderDate = plot.orderDate ? new Date(plot.orderDate).toLocaleDateString() : 'Unknown date';
    const customerName = plot.customerName || 'Unknown customer';
    
    switch (plot.orderStatus) {
      case 'pending':
        return `Order pending since ${orderDate} by ${customerName}`;
      case 'approved':
        return `Approved on ${orderDate} for ${customerName}`;
      case 'rejected':
        return `Previous order rejected on ${orderDate}`;
      default:
        return null;
    }
  }
}

// Export singleton instance
export const plotManagementService = new PlotManagementService();
export type { PlotWithOrderStatus, OrderedPlot };
