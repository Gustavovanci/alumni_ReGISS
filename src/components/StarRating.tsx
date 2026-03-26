import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  setRating?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
}

export const StarRating = ({
  rating,
  setRating,
  readonly = false,
  size = 28,
}: StarRatingProps) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const currentValue = hover || rating;
        const isActive = currentValue >= star;

        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && setRating && setRating(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`transition-all duration-200 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
              }`}
          >
            <Star
              size={size}
              className={`transition-all ${isActive
                  ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                  : 'text-slate-600'
                }`}
              fill={isActive ? 'currentColor' : 'none'}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
};