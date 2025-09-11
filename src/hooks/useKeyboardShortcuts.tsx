import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  category?: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when user is typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      // Allow certain shortcuts even in input fields (like Cmd+K for search)
      const allowedInInputs = shortcuts.filter(shortcut => 
        shortcut.key === 'k' && (shortcut.ctrlKey || shortcut.metaKey)
      );
      
      const matchingShortcut = allowedInInputs.find(shortcut =>
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.metaKey === event.metaKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.altKey === event.altKey
      );

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
      return;
    }

    // Find matching shortcut
    const matchingShortcut = shortcuts.find(shortcut =>
      shortcut.key.toLowerCase() === event.key.toLowerCase() &&
      !!shortcut.ctrlKey === event.ctrlKey &&
      !!shortcut.metaKey === event.metaKey &&
      !!shortcut.shiftKey === event.shiftKey &&
      !!shortcut.altKey === event.altKey
    );

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  // Format shortcut display
  const formatShortcut = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.metaKey) parts.push('⌘');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('⇧');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join(' + ');
  };

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category || 'General';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, KeyboardShortcut[]>);

  return {
    formatShortcut,
    groupedShortcuts,
  };
};

// Common shortcuts that can be reused across components
export const commonShortcuts = {
  save: {
    key: 's',
    ctrlKey: true,
    metaKey: true,
    description: 'Save current work',
    category: 'General'
  },
  search: {
    key: 'k',
    ctrlKey: true,
    metaKey: true,
    description: 'Open search',
    category: 'Navigation'
  },
  newItem: {
    key: 'n',
    ctrlKey: true,
    metaKey: true,
    description: 'Create new item',
    category: 'General'
  },
  undo: {
    key: 'z',
    ctrlKey: true,
    metaKey: true,
    description: 'Undo last action',
    category: 'General'
  },
  redo: {
    key: 'z',
    ctrlKey: true,
    metaKey: true,
    shiftKey: true,
    description: 'Redo last action',
    category: 'General'
  },
  copy: {
    key: 'c',
    ctrlKey: true,
    metaKey: true,
    description: 'Copy selected item',
    category: 'General'
  },
  paste: {
    key: 'v',
    ctrlKey: true,
    metaKey: true,
    description: 'Paste copied item',
    category: 'General'
  },
  selectAll: {
    key: 'a',
    ctrlKey: true,
    metaKey: true,
    description: 'Select all items',
    category: 'General'
  },
  delete: {
    key: 'Delete',
    description: 'Delete selected item',
    category: 'General'
  },
  escape: {
    key: 'Escape',
    description: 'Close dialog or cancel action',
    category: 'Navigation'
  }
};