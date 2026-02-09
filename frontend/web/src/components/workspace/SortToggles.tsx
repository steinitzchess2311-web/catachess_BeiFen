import React from 'react';
import * as Toggle from '@radix-ui/react-toggle';
import * as Tooltip from '@radix-ui/react-tooltip';
import { CalendarIcon, ClockIcon, ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';
import './SortToggles.css';

type SortKey = 'created' | 'modified' | null;
type SortDir = 'asc' | 'desc';

interface SortTogglesProps {
  sortKey: SortKey;
  sortDir: SortDir;
  onSortChange: (key: SortKey, dir: SortDir) => void;
}

const SortToggles: React.FC<SortTogglesProps> = ({ sortKey, sortDir, onSortChange }) => {
  const handleCreatedClick = () => {
    if (sortKey === 'created') {
      // Same toggle clicked again - toggle direction
      const newDir = sortDir === 'asc' ? 'desc' : 'asc';
      onSortChange('created', newDir);
    } else {
      // Different toggle clicked - switch to created, keep current dir
      onSortChange('created', sortDir);
    }
  };

  const handleModifiedClick = () => {
    if (sortKey === 'modified') {
      // Same toggle clicked again - toggle direction
      const newDir = sortDir === 'asc' ? 'desc' : 'asc';
      onSortChange('modified', newDir);
    } else {
      // Different toggle clicked - switch to modified, keep current dir
      onSortChange('modified', sortDir);
    }
  };

  const DirectionIcon = sortDir === 'asc' ? ArrowUpIcon : ArrowDownIcon;

  // Get tooltip text based on current sort state
  const getTooltipText = (key: 'created' | 'modified'): string => {
    const baseName = key === 'created' ? 'Creation time' : 'Last modified time';

    if (sortKey === key) {
      // Active button - show current state
      const reverseText = sortDir === 'desc' ? ' (reverse)' : '';
      return `Sorted by ${baseName}${reverseText}`;
    } else {
      // Inactive button - show what will happen if clicked
      return `Sort by ${baseName}`;
    }
  };

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="sort-toggles">
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Toggle.Root
              className="sort-toggle"
              pressed={sortKey === 'created'}
              onPressedChange={handleCreatedClick}
              aria-label="Sort by created time"
            >
              <CalendarIcon className="sort-toggle-icon" />
              {sortKey === 'created' && <DirectionIcon className="sort-direction-icon" />}
            </Toggle.Root>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="sort-tooltip-content" sideOffset={5}>
              {getTooltipText('created')}
              <Tooltip.Arrow className="sort-tooltip-arrow" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Toggle.Root
              className="sort-toggle"
              pressed={sortKey === 'modified'}
              onPressedChange={handleModifiedClick}
              aria-label="Sort by modified time"
            >
              <ClockIcon className="sort-toggle-icon" />
              {sortKey === 'modified' && <DirectionIcon className="sort-direction-icon" />}
            </Toggle.Root>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="sort-tooltip-content" sideOffset={5}>
              {getTooltipText('modified')}
              <Tooltip.Arrow className="sort-tooltip-arrow" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    </Tooltip.Provider>
  );
};

export default SortToggles;
