'use client';

import { ThreadItem } from '@/core/executive-thread/types';

interface Props {
  items: ThreadItem[];
}

export function ExecutiveThreadList({
  items,
}: Props) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="border rounded-xl p-4 bg-white shadow-sm"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">
              {item.title}
            </h3>

            <span className="text-xs uppercase">
              {item.status}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-600">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}
