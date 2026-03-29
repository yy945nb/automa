import React, { useContext } from 'react';

// TODO: create a React context equivalent for rootElement (was Vue's inject('rootElement'))
export const RootElementContext = React.createContext<Element | null>(null);

interface SelectorQueryProps {
  selector?: string;
  selectedCount?: number;
  selectorType?: string;
  selectList?: boolean;
  settingsActive?: boolean;
  onSelectorTypeChange?: (value: string) => void;
  onSelectListChange?: (value: boolean) => void;
  onSettings?: (value: boolean) => void;
  onSelector?: (value: string) => void;
  onParent?: () => void;
  onChild?: () => void;
}

const SelectorQuery: React.FC<SelectorQueryProps> = ({
  selector = '',
  selectedCount = 0,
  selectorType = '',
  selectList = false,
  settingsActive = false,
  onSelectorTypeChange,
  onSelectListChange,
  onSettings,
  onSelector,
  onParent,
  onChild,
}) => {
  const rootElement = useContext(RootElementContext);

  function copySelector() {
    (rootElement?.shadowRoot?.querySelector('input') as HTMLInputElement | null)?.select();
    navigator.clipboard.writeText(selector).catch((error) => {
      document.execCommand('copy');
      console.error(error);
    });
  }

  return (
    <div>
      <div className="flex items-center">
        <select
          value={selectorType}
          disabled={selectList}
          className="w-full"
          onChange={(e) => onSelectorTypeChange?.(e.target.value)}
        >
          <option value="css">CSS Selector</option>
          <option value="xpath">XPath</option>
        </select>
        {selectorType === 'css' && (
          <>
            <button
              className={`ml-2 rounded p-1${selectList ? ' text-primary' : ''}`}
              title="Select a list of elements"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onSelectListChange?.(!selectList); }}
            >
              <i className="ri-list-unordered" />
            </button>
            <button
              className="ml-2 rounded p-1"
              title="Selector settings"
              onClick={() => onSettings?.(!settingsActive)}
            >
              <i className={settingsActive ? 'ri-close-line' : 'ri-settings-3-line'} />
            </button>
          </>
        )}
      </div>
      <div className="mt-2 flex items-center">
        <div className="element-selector relative h-full flex-1 leading-normal">
          <button
            className="absolute left-0 ml-2"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); copySelector(); }}
          >
            <i className="ri-file-copy-line" />
          </button>
          <input
            value={selector}
            placeholder="Element selector"
            className="w-full rounded border py-2 pl-8 pr-3"
            onChange={(e) => onSelector?.(e.target.value)}
          />
        </div>
        {selectedCount === 1 && !selector.includes('|>') && (
          <>
            <button
              className="mr-1 ml-2"
              title="Parent element"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onParent?.(); }}
            >
              <i className="ri-arrow-left-line" style={{ transform: 'rotate(90deg)' }} />
            </button>
            <button
              title="Child element"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onChild?.(); }}
            >
              <i className="ri-arrow-left-line" style={{ transform: 'rotate(-90deg)' }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SelectorQuery;
