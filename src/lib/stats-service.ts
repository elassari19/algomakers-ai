import { prisma } from '@/lib/prisma';
import { StatsPeriod, StatsType } from '@/generated/prisma';

export async function upsertFileMetricsStats(data: Record<string, any>) {
  try {
    // Only require pairId
    if (!data.pairId) {
      throw new Error('Missing pairId in stats data');
    }

    const pairId = data.pairId;

    // Parse any string fields that might be JSON
    const processedData = { ...data };
    Object.keys(processedData).forEach(key => {
      if (typeof processedData[key] === 'string') {
        try {
          // Try to parse if it looks like JSON
          if (processedData[key].startsWith('{') || processedData[key].startsWith('[')) {
            processedData[key] = JSON.parse(processedData[key]);
          }
        } catch (e) {
          // If parsing fails, keep as string
          // This is expected for regular string values
        }
      }
    });

    // Find existing stats record for the pair by filtering type and pairId
    const existingStats = await prisma.stats.findFirst({
      where: {
        type: StatsType.FILE_METRICS,
        metadata: {
          path: ['pairId'],
          equals: pairId
        }
      }
    });

    let newMetadata;
    if (existingStats && existingStats.metadata) {
      // Merge old data with new data (new data overwrites old data)
      const existingMetadata = typeof existingStats.metadata === 'object' && existingStats.metadata !== null 
        ? existingStats.metadata as Record<string, any>
        : {};
      newMetadata = {
        ...existingMetadata,
        ...processedData
      };
    } else {
      // No existing data, use new data as is
      newMetadata = processedData;
    }

    let stats;
    if (existingStats) {
      // Update existing record
      stats = await prisma.stats.update({
        where: { id: existingStats.id },
        data: {
          updatedAt: new Date(),
          metadata: newMetadata
        }
      });
      console.log('Stats updated for pairId:', pairId);
    } else {
      // Create new record
      stats = await prisma.stats.create({
        data: {
          type: StatsType.FILE_METRICS,
          period: StatsPeriod.ALL_TIME,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: newMetadata
        }
      });
      console.log('Stats created for pairId:', pairId);
    }

    return { success: true, stats };
  } catch (error) {
    console.error('Error upserting stats:', error);
    throw error;
  }
}

export async function deleteFileMetricsStats(pairId: string) {
  try {
    // Find existing stats record by filtering type and pairId
    const existingStats = await prisma.stats.findFirst({
      where: {
        type: StatsType.FILE_METRICS,
        metadata: {
          path: ['pairId'],
          equals: pairId
        }
      }
    });

    if (!existingStats) {
      console.log('No stats record found for pairId:', pairId);
      return { success: true, message: 'No stats record found' };
    }

    await prisma.stats.delete({
      where: { id: existingStats.id }
    });

    console.log('Stats deleted for pairId:', pairId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting stats:', error);
    throw error;
  }
}