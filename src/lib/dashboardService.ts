import { apiService, BatchData, FileData } from './api';
import { supabase } from './supabase';

export interface DashboardStats {
  documentsProcessedToday: number;
  totalThisMonth: number;
  activeBatches: number;
  totalBatches: number;
  totalFiles: number;
  successRate: number;
  trends: {
    dailyChange: number;
    monthlyChange: number;
    pendingCount: number;
  };
}

export interface ActivityItem {
  id: string;
  action: string;
  description: string;
  time: string;
  relativeTime: string;
  status: 'completed' | 'processing' | 'info' | 'warning' | 'failed';
  batchId?: string;
}

export class DashboardService {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      // Get batch statistics
      const [
        totalBatchesResult,
        todayBatchesResult,
        monthBatchesResult,
        lastMonthBatchesResult,
        activeBatchesResult,
        totalFilesResult,
        completedFilesResult
      ] = await Promise.all([
        // Total batches
        supabase
          .from('batches')
          .select('id', { count: 'exact', head: true }),
        
        // Today's batches
        supabase
          .from('batches')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString()),
        
        // This month's batches
        supabase
          .from('batches')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString()),
        
        // Last month's batches
        supabase
          .from('batches')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', lastMonthStart.toISOString())
          .lt('created_at', monthStart.toISOString()),
        
        // Active batches (processing or pending)
        supabase
          .from('batches')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'processing']),
        
        // Total files
        supabase
          .from('files')
          .select('id', { count: 'exact', head: true }),
        
        // Completed files this month
        supabase
          .from('files')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('created_at', monthStart.toISOString())
      ]);

      // Get today's file count
      const { count: todayFilesCount } = await supabase
        .from('files')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('processed_at', todayStart.toISOString());

      // Calculate statistics
      const totalBatches = totalBatchesResult.count || 0;
      const todayBatches = todayBatchesResult.count || 0;
      const monthBatches = monthBatchesResult.count || 0;
      const lastMonthBatches = lastMonthBatchesResult.count || 0;
      const activeBatches = activeBatchesResult.count || 0;
      const totalFiles = totalFilesResult.count || 0;
      const completedFiles = completedFilesResult.count || 0;
      const documentsProcessedToday = todayFilesCount || 0;

      // Calculate trends
      const monthlyChange = lastMonthBatches > 0 
        ? Math.round(((monthBatches - lastMonthBatches) / lastMonthBatches) * 100)
        : monthBatches > 0 ? 100 : 0;

      // Get pending count
      const { count: pendingCount } = await supabase
        .from('batches')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      const successRate = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;

      return {
        documentsProcessedToday,
        totalThisMonth: monthBatches,
        activeBatches,
        totalBatches,
        totalFiles,
        successRate,
        trends: {
          dailyChange: 0, // Would need yesterday's data for comparison
          monthlyChange,
          pendingCount: pendingCount || 0
        }
      };

    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw new Error('Failed to load dashboard statistics');
    }
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
    try {
      // Get recent batches with their status changes
      const { data: recentBatches, error } = await supabase
        .from('batches')
        .select(`
          id,
          batch_name,
          status,
          total_files,
          processed_files,
          failed_files,
          created_at,
          completed_at
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const activities: ActivityItem[] = [];

      // Convert batches to activity items
      for (const batch of recentBatches || []) {
        const batchName = batch.batch_name || `Batch #${batch.id.slice(0, 8)}`;
        const createdTime = new Date(batch.created_at);
        const completedTime = batch.completed_at ? new Date(batch.completed_at) : null;

        // Add completion activity if batch is completed
        if (batch.status === 'completed' && completedTime) {
          activities.push({
            id: `${batch.id}-completed`,
            action: `${batchName} completed`,
            description: `${batch.processed_files} documents watermarked successfully${batch.failed_files > 0 ? `, ${batch.failed_files} failed` : ''}`,
            time: completedTime.toISOString(),
            relativeTime: this.getRelativeTime(completedTime),
            status: batch.failed_files > 0 ? 'warning' : 'completed',
            batchId: batch.id
          });
        }

        // Add processing activity if batch is currently processing
        if (batch.status === 'processing') {
          activities.push({
            id: `${batch.id}-processing`,
            action: `${batchName} processing`,
            description: `${batch.total_files} documents being watermarked`,
            time: createdTime.toISOString(),
            relativeTime: this.getRelativeTime(createdTime),
            status: 'processing',
            batchId: batch.id
          });
        }

        // Add failed activity if batch failed
        if (batch.status === 'failed') {
          activities.push({
            id: `${batch.id}-failed`,
            action: `${batchName} failed`,
            description: `Batch processing encountered errors`,
            time: completedTime ? completedTime.toISOString() : createdTime.toISOString(),
            relativeTime: this.getRelativeTime(completedTime || createdTime),
            status: 'failed',
            batchId: batch.id
          });
        }

        // Add creation activity for recent batches
        if (this.isRecent(createdTime, 24)) { // Last 24 hours
          activities.push({
            id: `${batch.id}-created`,
            action: `New batch started`,
            description: `${batch.total_files} documents uploaded for watermarking`,
            time: createdTime.toISOString(),
            relativeTime: this.getRelativeTime(createdTime),
            status: 'info',
            batchId: batch.id
          });
        }
      }

      // Sort by time (most recent first) and limit
      return activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, limit);

    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      throw new Error('Failed to load recent activity');
    }
  }

  /**
   * Get system health information
   */
  async getSystemHealth(): Promise<{ status: 'healthy' | 'warning' | 'error'; message: string }> {
    try {
      // Check if there are any stuck processing batches (processing for > 2 hours)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      
      const { count: stuckBatches } = await supabase
        .from('batches')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'processing')
        .lt('created_at', twoHoursAgo.toISOString());

      if (stuckBatches && stuckBatches > 0) {
        return {
          status: 'warning',
          message: `${stuckBatches} batch(es) have been processing for over 2 hours`
        };
      }

      // Check recent error rate
      const { count: recentFailed } = await supabase
        .from('batches')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (recentFailed && recentFailed > 5) {
        return {
          status: 'warning',
          message: `High failure rate: ${recentFailed} failed batches in last 24 hours`
        };
      }

      return {
        status: 'healthy',
        message: 'All systems running optimally'
      };

    } catch (error) {
      console.error('Failed to check system health:', error);
      return {
        status: 'error',
        message: 'Unable to check system health'
      };
    }
  }

  /**
   * Format relative time (e.g., "2 minutes ago")
   */
  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Check if a date is within the last N hours
   */
  private isRecent(date: Date, hours: number): boolean {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return date > cutoff;
  }
}

export const dashboardService = new DashboardService();