import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function LogsDetails() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Emit event to show logs panel, then navigate back
    try {
      // emitter.emit('ui:logs', { show: true, logId: id });
    } catch {
      // emitter not available in React context
    }
    navigate('/', { replace: true });
  }, [id, navigate]);

  return null;
}
