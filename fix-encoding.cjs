const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/hooks/usePlaceReviews.ts');

try {
  // Read as latin1/binary
  const buffer = fs.readFileSync(filePath);
  let content = buffer.toString('latin1');
  
  // Replace typical Brazilian Portuguese character mismatches if needed,
  // or just recreate the file from scratch correctly
  
  const correctContent = `import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Review } from '../types/review';

export const usePlaceReviews = (placeId: string | undefined) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placeId) return;

    const fetchReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<Review[]>(\`/reviews/place/\${placeId}\`);
        setReviews(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar avaliações.');
        console.error('Error fetching place reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [placeId]);

  return { reviews, loading, error };
};
`;

  // Write it back as UTF-8
  fs.writeFileSync(filePath, correctContent, 'utf8');
  console.log('✅ Arquivo src/hooks/usePlaceReviews.ts corrigido e salvo como UTF-8 puro!');
} catch (error) {
  console.error('Erro ao corrigir o arquivo:', error);
}
