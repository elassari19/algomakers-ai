import { StatsType } from '@/generated/prisma';
import { prisma } from './prisma';

export async function patchMetricsStats(statsType: StatsType, newMetrics: Record<string, any>) {
  try {
    if (!statsType) throw new Error('statsType is required');
    if (!newMetrics) throw new Error('newMetrics is required');

    // If newMetrics is an array, treat as legacy metadata array
    if (Array.isArray(newMetrics)) {
      // Upsert by type, replace metadata array
      const now = new Date();
      // Find existing stats record by type to get its id
      const existingStats = await prisma.stats.findFirst({
        where: { type: statsType },
        orderBy: { updatedAt: 'desc' },
      });

      if (existingStats) {
        await prisma.stats.update({
          where: { id: existingStats.id },
          data: { metadata: newMetrics, updatedAt: now },
        });
      } else {
        await prisma.stats.create({
          data: { type: statsType, metadata: newMetrics, createdAt: now, updatedAt: now },
        });
      }
      return;
    }

    // If newMetrics is an object with id, treat as single object upsert/update
    const { id, ...data } = newMetrics;
    if (!id) throw new Error('newMetrics must contain an id field');

    // Find existing stats record by type
    const existingStats = await prisma.stats.findFirst({
      where: { type: statsType },
      orderBy: { updatedAt: 'desc' },
    });
    const now = new Date();

    if (!existingStats) {
      // Create new stats record with metadata as array
      await prisma.stats.create({
        data: {
          type: statsType,
          metadata: [newMetrics],
          createdAt: now,
          updatedAt: now,
        },
      });
      return;
    }

    // If metadata is array, update or add item by id
    let updatedMetadata;
    if (Array.isArray(existingStats.metadata)) {
      const idx = existingStats.metadata.findIndex((item: any) => item.id === id);
      if (idx >= 0) {
        // Update existing item
        updatedMetadata = [...existingStats.metadata];
        updatedMetadata[idx] = { ...(updatedMetadata[idx] as {}), ...newMetrics };
      } else {
        // Add new item
        updatedMetadata = [...existingStats.metadata, newMetrics];
      }
    } else {
      // If not array, replace with new array
      updatedMetadata = [newMetrics];
    }

    await prisma.stats.update({
      where: { id: existingStats.id },
      data: {
        metadata: updatedMetadata,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error('Error updating file metrics:', error);
    throw error;
  }
}

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