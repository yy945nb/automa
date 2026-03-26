import React from 'react';

interface ElementItem {
  [key: string]: any;
}

interface SelectorElementListProps {
  elements?: ElementItem[];
  elementName?: string;
  onHighlight?: (payload: { highlight: boolean; index: number; element: ElementItem }) => void;
  /** Render prop for each element item */
  renderItem?: (element: ElementItem) => React.ReactNode;
}

const SelectorElementList: React.FC<SelectorElementListProps> = ({
  elements = [],
  elementName = 'Element',
  onHighlight,
  renderItem,
}) => {
  return (
    <ul className="mt-2 space-y-4">
      {elements.map((element, index) => (
        <li
          key={index}
          onMouseEnter={() => onHighlight?.({ highlight: true, index, element })}
          onMouseLeave={() => onHighlight?.({ highlight: false, index, element })}
        >
          <p className="mb-1">
            #{index + 1} {elementName}
          </p>
          {renderItem?.(element)}
        </li>
      ))}
    </ul>
  );
};

export default SelectorElementList;
