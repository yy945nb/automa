import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import emitter from '@/lib/mitt';

const LogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    emitter.emit('ui:logs', {
      show: true,
      logId: id,
    });

    navigate('/', { replace: true });
  }, []);

  return <p>Hello :)</p>;
};

export default LogDetail;
