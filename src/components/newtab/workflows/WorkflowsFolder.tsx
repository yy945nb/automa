import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Folder {
  id: string;
  name: string;
}

interface WorkflowsFolderProps {
  value?: string;
  onChange?: (folderId: string) => void;
}

export default function WorkflowsFolder({ value = '', onChange }: WorkflowsFolderProps) {
  const { t } = useTranslation();
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    // TODO: Load folders from store
    try {
      const stored = localStorage.getItem('workflow-folders');
      if (stored) setFolders(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const newFolder = () => {
    const name = prompt(t('workflow.folder.new', 'New folder name'));
    if (!name) return;
    const folder: Folder = { id: `folder-${Date.now()}`, name };
    const next = [...folders, folder];
    setFolders(next);
    localStorage.setItem('workflow-folders', JSON.stringify(next));
  };

  return (
    <div className="mt-6 border-t pt-4">
      <div className="flex items-center text-gray-600 dark:text-gray-300">
        <span className="flex-1">Folders</span>
        <button className="rounded-md transition hover:text-black dark:hover:text-gray-100" onClick={newFolder}>
          + <span>{t('common.new')}</span>
        </button>
      </div>
      <ul className="mt-2 space-y-1">
        <li>
          <button
            className={`w-full rounded-lg px-4 py-2 text-left ${value === '' ? 'bg-box-transparent font-semibold' : 'hoverable'}`}
            onClick={() => onChange?.('')}
          >
            📂 All
          </button>
        </li>
        {folders.map((folder) => (
          <li key={folder.id}>
            <button
              className={`w-full rounded-lg px-4 py-2 text-left ${folder.id === value ? 'bg-box-transparent font-semibold' : 'hoverable'}`}
              onClick={() => onChange?.(folder.id)}
            >
              📁 <span className="text-overflow flex-1">{folder.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
