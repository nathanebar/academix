import { useState } from 'react';
import { Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

const DownloadButton = () => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    const url = 'https:';
    const fileName = '1352.waw';

    try {
      setLoading(true);
      
      // 1. Fetch le fichier
      const response = await fetch(url);
      const blob = await response.blob();

      // 2. Créer une URL blob
      const blobUrl = window.URL.createObjectURL(blob);

      // 3. Créer un lien temporaire pour le téléchargement
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName; // Nom du fichier souhaité
      document.body.appendChild(link);
      link.click();

      // 4. Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="link"
      icon={<DownloadOutlined />}
      onClick={handleDownload}
      loading={loading}
      size="middle"
    />
  );
};

export default DownloadButton;