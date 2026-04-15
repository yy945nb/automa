import React from 'react';
import { useParams } from 'react-router-dom';

export default function StorageTables() {
  const { id } = useParams<{ id: string }>();

  // TODO: Implement storage tables detail view (migrated from storage/Tables.vue)
  return (
    <div className="storage-tables p-4">
      <h2 className="text-lg font-semibold">Storage Table: {id || 'All'}</h2>
      <p className="mt-2 text-gray-500">TODO: Table data viewer</p>
    </div>
  );
}
