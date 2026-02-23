import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  setRating?: (rating: number) => void;
  readonly?: boolean;
}

export const StarRating = ({ rating, setRating, readonly = false }: StarRatingProps) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = (hover || rating) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`transition-all duration-200 transform ${readonly ? '' : 'hover:scale-110'} ${isActive ? 'text-yellow-400' : 'text-slate-600'
              } ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
            onClick={() => !readonly && setRating && setRating(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
          >
            <Star
              size={28}
              className={isActive ? 'drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : ''}
              fill={isActive ? 'currentColor' : 'none'}
            />
          </button>
        );
      })}
    </div>
  );
};