import React, { useState, useEffect } from 'react';
// TODO: import Handle, Position from react-flow equivalent
// TODO: import useEditorBlock, useComponentId from composables
// TODO: import usePackageStore from '@/stores/package'
import BlockBase from './BlockBase';

interface PackageInput {
  id: string;
  name: string;
}
interface PackageOutput {
  id: string;
  name: string;
}

interface BlockPackageProps {
  id?: string;
  label?: string;
  data?: {
    icon?: string;
    name?: string;
    author?: string;
    id?: string;
    inputs?: PackageInput[];
    outputs?: PackageOutput[];
    disableBlock?: boolean;
    [key: string]: any;
  };
  editor?: Record<string, any> | null;
  onDelete?: (id: string) => void;
  onUpdate?: (payload: Record<string, any>) => void;
  onSettings?: (payload: Record<string, any>) => void;
}

const BlockPackage: React.FC<BlockPackageProps> = ({
  id = '',
  label = '',
  data = {},
  editor = null,
  onDelete,
  onUpdate,
  onSettings,
}) => {
  // TODO: replace with real hook implementations
  // const block = useEditorBlock(label);
  // const componentId = useComponentId('block-package');
  // const packageStore = usePackageStore();
  const block: any = { details: { id: label, icon: 'riBox2Line', name: label }, category: { color: 'bg-blue-500' } };
  const componentId = `block-package-${id}`;

  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // TODO: setIsInstalled(!!packageStore.getById(data.id));
  }, [data.id]);

  function installPackage() {
    // TODO: packageStore.insert({ ...data, isExternal: Boolean(data.author) }, false).then(() => setIsInstalled(true));
    console.warn('TODO: install package', data.id);
    setIsInstalled(true);
  }

  function updatePackage() {
    // TODO: implement full update logic using packageStore and editor
    console.warn('TODO: update package', data.id);
  }

  const icon = data.icon || '';
  const isHttpIcon = icon.startsWith('http');

  return (
    <BlockBase
      id={componentId}
      data={data}
      blockId={id}
      blockData={block}
      className="block-package w-64"
      onDelete={() => onDelete?.(id)}
      onUpdate={onUpdate}
      onSettings={onSettings}
    >
      <div className="flex items-center">
        {isHttpIcon && (
          <img src={icon} width={36} height={36} className="mr-2 rounded-lg" alt="" />
        )}
        <div
          className={`mr-4 inline-block overflow-hidden rounded-lg p-2 text-sm dark:text-black ${data.disableBlock ? 'bg-box-transparent' : block.category.color}`}
        >
          {!isHttpIcon && (
            <i
              className={icon || 'ri-global-line'}
              style={{ fontSize: 20, marginRight: 4, display: 'inline-block' }}
            />
          )}
          <span className="text-overflow">{data.name || 'Unnamed package'}</span>
        </div>
        <div className="grow" />
        {isInstalled ? (
          <i
            className="ri-refresh-line cursor-pointer"
            title="Update package"
            onClick={updatePackage}
          />
        ) : (
          <i
            className="ri-download-line cursor-pointer"
            title="Install package"
            onClick={installPackage}
          />
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-2">
        <ul className="pkg-handle-container">
          {(data.inputs || []).map((input) => (
            <li key={input.id} title={input.name} className="target relative">
              {/* TODO: Handle - <Handle id={`${id}-input-${input.id}`} type="target" position={Position.Left} /> */}
              <div data-handle-id={`${id}-input-${input.id}`} data-handle-type="target" data-handle-position="left" />
              <p className="text-overflow">{input.name}</p>
            </li>
          ))}
        </ul>
        <ul className="pkg-handle-container">
          {(data.outputs || []).map((output) => (
            <li key={output.id} title={output.name} className="source relative">
              {/* TODO: Handle - <Handle id={`${id}-output-${output.id}`} type="source" position={Position.Right} /> */}
              <div data-handle-id={`${id}-output-${output.id}`} data-handle-type="source" data-handle-position="right" />
              <p className="text-overflow">{output.name}</p>
            </li>
          ))}
        </ul>
      </div>
      {data.author && (
        <div className="mt-1 flex items-center text-sm text-gray-600 dark:text-gray-200">
          <p>By {data.author}</p>
          <a
            href={`https://extension.automa.site/packages/${data.id}`}
            target="_blank"
            rel="noreferrer"
            title="Open package page"
            className="ml-2"
          >
            <i className="ri-external-link-line" style={{ fontSize: 18 }} />
          </a>
        </div>
      )}
    </BlockBase>
  );
};

export default BlockPackage;
