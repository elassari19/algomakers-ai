import { prisma } from '@/lib/prisma';
import { StatsPeriod, StatsType } from '@/generated/prisma';

export async function patchMetricsStats(statsType: string, newMetrics: Record<string, any>) {
  try {
    await fetch('/api/affiliates/stats', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'FILE_METRICS',
        data: { statsType, ...newMetrics }
      })
    });
  } catch (error) {
    console.error('Error updating file metrics:', error);
  }
};

export async function upsertFileMetricsStats(data: Record<string, any>) {
  try {
    // Only require pairId
    if (!data.pairId) {
      throw new Error('Missing pairId in stats data');
    }

    // Use patchMetricsStats to handle the upsert via API route
    await patchMetricsStats(StatsType.FILE_METRICS, {
      id: data.pairId,
      ...data,
      type: 'FILE_METRICS_UPSERT',
      timestamp: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error upserting stats:', error);
    throw error;
  }
}

export async function deleteFileMetricsStats(pairId: string) {
  try {
    // Use patchMetricsStats to handle the deletion via API route
    await patchMetricsStats(StatsType.FILE_METRICS, {
      id: pairId,
      pairId: pairId,
      deletedAt: new Date().toISOString(),
      type: 'FILE_METRICS_DELETE',
      action: 'DELETE'
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting stats:', error);
    throw error;
  }
}