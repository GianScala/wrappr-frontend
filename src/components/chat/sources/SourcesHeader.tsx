import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FilterButton } from './FilterButton';
import { FilterType, FilterCounts } from '../../../../types/SourcesTypes';

interface SourcesHeaderProps {
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  filterCounts: FilterCounts;
  colors: Record<string, string>;
}

export const SourcesHeader: React.FC<SourcesHeaderProps> = React.memo(({ 
  activeFilter, 
  setActiveFilter, 
  filterCounts, 
  colors 
}) => {
  const filters = [
    { type: 'sources' as FilterType, icon: '🔗', count: filterCounts.sources },
    { type: 'images' as FilterType, icon: '📷', count: filterCounts.images },
    { type: 'videos' as FilterType, icon: '🎥', count: filterCounts.videos },
  ].filter(f => f.count > 0);

  if (filters.length <= 1) return null;

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.filtersRow}>
        {filters.map(filter => (
          <FilterButton
            key={filter.type}
            type={filter.type}
            icon={filter.icon}
            count={filter.count}
            isActive={activeFilter === filter.type}
            onPress={setActiveFilter}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
});