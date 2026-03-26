import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface SharedWysiwygProps {
  children?: React.ReactNode;
  [key: string]: any;
}

export default function SharedWysiwyg({ children, ...props }: SharedWysiwygProps) {
  const { t } = useTranslation();
  // TODO: Convert Pinia stores, Vue Router, and other Vue-specific logic to React equivalents
  return (
    <div className="sharedwysiwyg-wrapper">
      {/* Converted from Vue SFC - template below */}
      <div className="wysiwyg-editor">
          {children}
          <div
            {/* v-if: editor && toolbar && !readonly */}
            className="bg-box-transparent sticky top-0 z-50 mb-2 flex items-center space-x-1 rounded-lg p-2 backdrop-blur"
          >
            <button
              className={{
                'bg-box-transparent text-primary': editor.isActive('heading', {
                  level: 1,
                }),
              }}
              title="Heading 1"
              className="editor-menu-btn hoverable"
              onClick={editor.commands.toggleHeading({ level: 1 })}
            >
              <i className={"ri-icon"} />
            </button>
            <button
              className={{
                'bg-box-transparent text-primary': editor.isActive('heading', {
                  level: 2,
                }),
              }}
              title="Heading 2"
              className="editor-menu-btn hoverable"
              onClick={editor.commands.toggleHeading({ level: 2 })}
            >
              <i className={"ri-icon"} />
            </button>
            <span
              className="h-5 w-px bg-gray-300 dark:bg-gray-600"
              style="margin: 0 12px"
            ></span>
            <button
              /* v-for: item in menuItems */ key={item.id}
              title={item.name}
              className={'bg-box-transparent text-primary': editor.isActive(item.id),}
              className="editor-menu-btn hoverable"
              onClick={editor.chain().focus()[item.action]().run()}
            >
              <i className={item.icon} />
            </button>
            <span
              className="h-5 w-px bg-gray-300 dark:bg-gray-600"
              style="margin: 0 12px"
            ></span>
            <button
              className={'bg-box-transparent text-primary': editor.isActive('blockquote'),}
              title="Blockquote"
              className="editor-menu-btn hoverable"
              onClick={editor.commands.toggleBlockquote()}
            >
              <i className={"ri-icon"} />
            </button>
            <button
              title="Insert image"
              className="editor-menu-btn hoverable"
              onClick={insertImage(editor)}
            >
              <i className={"ri-icon"} />
            </button>
            <button
              className={'bg-box-transparent text-primary': editor.isActive('link'),}
              title="Link"
              className="editor-menu-btn hoverable"
              onClick={setLink(editor)}
            >
              <i className={"ri-icon"} />
            </button>
            <button
              style={display: (editor.isActive('link')) ? undefined : 'none'}
              title="Remove link"
              className="editor-menu-btn hoverable"
              onClick={editor.commands.unsetLink()}
            >
              <i className={"ri-icon"} />
            </button>
          </div>
          <editor-content editor={editor} />
          {children}
        </div>
    </div>
  );
}
