import React, { useContext } from 'react';
import SelectorBlocks from './SelectorBlocks';
import SelectorElementList from './SelectorElementList';
// TODO: create a React context equivalent for rootElement
import { RootElementContext } from './SelectorQuery';

interface ElementAttribute {
  [name: string]: string;
}

interface SelectedElement {
  tagName?: string;
  attributes?: ElementAttribute;
  [key: string]: any;
}

interface SelectElementOption {
  elIndex: number;
  options?: Array<{ name: string; value: string }>;
  [key: string]: any;
}

interface SelectorElementsDetailProps {
  activeTab?: string;
  selectElements?: SelectElementOption[];
  selectedElements?: SelectedElement[];
  elSelector?: string;
  hideBlocks?: boolean;
  onActiveTabChange?: (tab: string) => void;
  onExecute?: (isExecuting: boolean) => void;
  onHighlight?: (payload: { index: number; highlight: boolean }) => void;
  onUpdate?: () => void;
}

const SelectorElementsDetail: React.FC<SelectorElementsDetailProps> = ({
  activeTab = '',
  selectElements = [],
  selectedElements = [],
  elSelector = '',
  hideBlocks = false,
  onActiveTabChange,
  onExecute,
  onHighlight,
  onUpdate,
}) => {
  const rootElement = useContext(RootElementContext);

  const showTabs = !hideBlocks || selectElements.length > 0;

  function copySelector(name: string, value: string) {
    (rootElement?.shadowRoot?.querySelector(`[data-testid="${name}"] input`) as HTMLInputElement | null)?.select();
    const selectEl = rootElement?.shadowRoot?.querySelector('select#select--1') as HTMLSelectElement | null;
    const type = selectEl?.value;
    const firstEl = selectedElements[0];
    const tagName = firstEl?.tagName?.toLowerCase() ?? '';
    const text =
      type === 'css'
        ? `${tagName}[${name}="${value}"]`
        : `//${tagName}[@${name}='${value}']`;
    navigator.clipboard.writeText(text).catch((error) => {
      document.execCommand('copy');
      console.error(error);
    });
  }

  return (
    <>
      {showTabs && (
        <div className="mt-2 flex">
          {['attributes', ...(selectElements.length > 0 ? ['options'] : []), ...(!hideBlocks ? ['blocks'] : [])].map((tab) => (
            <button
              key={tab}
              className={`flex-1 py-2 capitalize ${activeTab === tab ? 'border-b-2 border-primary font-semibold' : ''}`}
              onClick={() => onActiveTabChange?.(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
      <div
        className="scroll overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 17rem)' }}
      >
        {activeTab === 'attributes' && (
          <SelectorElementList
            elements={selectedElements}
            onHighlight={onHighlight}
            renderItem={(element) => (
              <>
                {Object.entries(element.attributes ?? {}).map(([name, value]) => (
                  <div
                    key={name}
                    className="bg-box-transparent mb-1 rounded-lg py-2 px-3"
                  >
                    <p
                      className="text-overflow text-sm leading-tight text-gray-600"
                      title="Attribute name"
                    >
                      {name}
                    </p>
                    <div className="relative w-full" data-testid={name}>
                      <button
                        className="absolute ml-2"
                        onClick={() => copySelector(name, value as string)}
                      >
                        <i className="ri-file-copy-line" />
                      </button>
                      <input
                        value={value as string}
                        placeholder={!value ? 'EMPTY' : undefined}
                        title={name}
                        readOnly
                        className="w-full py-2 pl-8"
                      />
                    </div>
                  </div>
                ))}
              </>
            )}
          />
        )}
        {activeTab === 'options' && (
          <SelectorElementList
            elements={selectElements}
            elementName="Select element options"
            onHighlight={(e) =>
              onHighlight?.({ index: e.element.elIndex, highlight: e.highlight })
            }
            renderItem={(element) => (
              <>
                {(element.options ?? []).map((option: { name: string; value: string }) => (
                  <div
                    key={option.name}
                    className="bg-box-transparent mb-1 rounded-lg py-2 px-3"
                  >
                    <p
                      className="text-overflow text-sm leading-tight text-gray-600"
                      title="Option name"
                    >
                      {option.name}
                    </p>
                    <input
                      value={option.value}
                      title="Option value"
                      className="text-overflow w-full bg-transparent focus:ring-0"
                      readOnly
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                  </div>
                ))}
              </>
            )}
          />
        )}
        {activeTab === 'blocks' && (
          <SelectorBlocks
            elements={selectedElements}
            selector={elSelector}
            onExecute={onExecute}
            onUpdate={onUpdate}
          />
        )}
      </div>
    </>
  );
};

export default SelectorElementsDetail;
