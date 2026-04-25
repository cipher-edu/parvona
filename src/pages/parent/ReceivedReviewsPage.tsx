import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import { PageHeader } from '../../components/layout/PageHeader';
import { getReceivedReviews } from '../../api/reviews';
import { Review } from '../../api/types';

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  );
}

export default function ReceivedReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReceivedReviews()
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '–';

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <PageHeader
        title="Mening reytingim"
        subtitle={`Enagalar tomonidan qoldirilgan sharhlar · O'rtacha: ${avg} ⭐`}
      />

      {reviews.length === 0 ? (
        <EmptyState
          icon={<Star className="w-8 h-8" />}
          title="Hali sharhlar yo'q"
          description="Buyurtma yakunlangandan so'ng enagalar sizni baholashi mumkin"
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((r, idx) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card padding="md">
                <div className="flex items-start gap-3">
                  <Avatar src={r.author.photo} name={r.author.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{r.author.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(r.created_at).toLocaleDateString('uz-UZ', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </p>
                      </div>
                      <StarRow rating={r.rating} />
                    </div>
                    {r.text && (
                      <p className="text-sm text-slate-700 mt-2 leading-relaxed">{r.text}</p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
