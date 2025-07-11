import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  height?: number | string;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

export function VirtualList<T>({
  items,
  height = 400,
  itemHeight,
  renderItem,
  className,
  overscanCount = 5
}: VirtualListProps<T>) {
  const itemData = useMemo(() => ({ items, renderItem }), [items, renderItem]);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const { items, renderItem } = itemData;
    const item = items[index];
    
    return (
      <div style={style}>
        {renderItem(item, index)}
      </div>
    );
  };

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <AutoSizer>
        {({ height: autoHeight, width }) => (
          <List
            height={autoHeight}
            itemCount={items.length}
            itemSize={itemHeight}
            width={width}
            overscanCount={overscanCount}
            itemData={itemData}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

interface VirtualGridProps<T> {
  items: T[];
  height?: number | string;
  itemHeight: number;
  itemWidth: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

export function VirtualGrid<T>({
  items,
  height = 400,
  itemHeight,
  itemWidth,
  renderItem,
  className,
  overscanCount = 5
}: VirtualGridProps<T>) {
  const itemData = useMemo(() => ({ items, renderItem }), [items, renderItem]);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const { items, renderItem } = itemData;
    const startIndex = index * Math.floor(style.width as number / itemWidth);
    const endIndex = Math.min(startIndex + Math.floor(style.width as number / itemWidth), items.length);
    
    return (
      <div style={style} className="flex">
        {items.slice(startIndex, endIndex).map((item, itemIndex) => (
          <div key={startIndex + itemIndex} style={{ width: itemWidth }}>
            {renderItem(item, startIndex + itemIndex)}
          </div>
        ))}
      </div>
    );
  };

  const rowCount = Math.ceil(items.length / Math.floor(400 / itemWidth));

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <AutoSizer>
        {({ height: autoHeight, width }) => (
          <List
            height={autoHeight}
            itemCount={rowCount}
            itemSize={itemHeight}
            width={width}
            overscanCount={overscanCount}
            itemData={itemData}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
} 