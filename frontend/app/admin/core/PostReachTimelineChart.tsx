"use client";

import { useMemo, useState } from "react";
import { useLocale } from '@/utils/strings/client';

type ReachPoint = {
  day: string;
  totalViews: number;
  posts: { postId: number; title: string; views: number }[];
};

type Props = {
  points: ReachPoint[];
  labels: {
    xAxis: string;
    yAxis: string;
    noData: string;
    noPostViews: string;
  };
};

const CHART_WIDTH = 920;
const CHART_HEIGHT = 340;
const PADDING_TOP = 16;
const PADDING_RIGHT = 18;
const PADDING_BOTTOM = 44;
const PADDING_LEFT = 50;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function PostReachTimelineChart({ points, labels }: Props) {
  const locale = useLocale();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const formatDate = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [locale],
  );

  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const maxY = Math.max(5, ...points.map((point) => point.totalViews));
  const yTicks = 5;
  const xStep = points.length > 1 ? plotWidth / (points.length - 1) : 0;

  const chartPoints = points.map((point, index) => {
    const x = PADDING_LEFT + xStep * index;
    const y = PADDING_TOP + (1 - point.totalViews / maxY) * plotHeight;
    return { ...point, x, y };
  });

  const linePath = chartPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const labelStep = Math.max(1, Math.ceil(points.length / 8));
  const activePoint = activeIndex !== null ? chartPoints[activeIndex] : null;

  if (points.length === 0) {
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">{labels.noData}</div>;
  }

  return (
    <div
      className="relative rounded-2xl border border-slate-200 bg-white p-3"
      onMouseLeave={() => setActiveIndex(null)}
    >
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-[320px] w-full">
        <line
          x1={PADDING_LEFT}
          y1={PADDING_TOP}
          x2={PADDING_LEFT}
          y2={CHART_HEIGHT - PADDING_BOTTOM}
          stroke="#cbd5e1"
          strokeWidth="1"
        />
        <line
          x1={PADDING_LEFT}
          y1={CHART_HEIGHT - PADDING_BOTTOM}
          x2={CHART_WIDTH - PADDING_RIGHT}
          y2={CHART_HEIGHT - PADDING_BOTTOM}
          stroke="#cbd5e1"
          strokeWidth="1"
        />

        {Array.from({ length: yTicks + 1 }).map((_, index) => {
          const value = Math.round((maxY / yTicks) * (yTicks - index));
          const y = PADDING_TOP + (index / yTicks) * plotHeight;
          return (
            <g key={index}>
              <line
                x1={PADDING_LEFT}
                y1={y}
                x2={CHART_WIDTH - PADDING_RIGHT}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="2 3"
              />
              <text x={PADDING_LEFT - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">
                {value}
              </text>
            </g>
          );
        })}

        {chartPoints.map((point, index) => {
          if (index % labelStep !== 0 && index !== chartPoints.length - 1) return null;
          return (
            <text
              key={point.day}
              x={point.x}
              y={CHART_HEIGHT - PADDING_BOTTOM + 18}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              {formatDate.format(new Date(`${point.day}T00:00:00.000Z`))}
            </text>
          );
        })}

        <path d={linePath} fill="none" stroke="#0284c7" strokeWidth="2" />

        {chartPoints.map((point, index) => (
          <circle
            key={`dot-${point.day}`}
            cx={point.x}
            cy={point.y}
            r={activeIndex === index ? 4 : 2.8}
            fill={activeIndex === index ? "#0369a1" : "#0ea5e9"}
          />
        ))}

        {chartPoints.map((point, index) => {
          const half = xStep > 0 ? xStep / 2 : plotWidth / 2;
          const nextHalf = index === chartPoints.length - 1 ? half : xStep / 2;
          const x = point.x - half;
          const width = half + nextHalf;
          return (
            <rect
              key={`hover-${point.day}`}
              x={clamp(x, PADDING_LEFT, CHART_WIDTH - PADDING_RIGHT)}
              y={PADDING_TOP}
              width={Math.max(4, width)}
              height={plotHeight}
              fill="transparent"
              onMouseEnter={() => setActiveIndex(index)}
            />
          );
        })}

        <text x={CHART_WIDTH / 2} y={CHART_HEIGHT - 6} textAnchor="middle" fontSize="11" fill="#475569">
          {labels.xAxis}
        </text>
        <text
          x={12}
          y={CHART_HEIGHT / 2}
          textAnchor="middle"
          fontSize="11"
          fill="#475569"
          transform={`rotate(-90 12 ${CHART_HEIGHT / 2})`}
        >
          {labels.yAxis}
        </text>
      </svg>

      {activePoint ? (
        <div
          className="pointer-events-none absolute z-10 max-h-56 w-[280px] overflow-y-auto rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-xl"
          style={{
            left: `${clamp((activePoint.x / CHART_WIDTH) * 100, 18, 82)}%`,
            top: `${clamp((activePoint.y / CHART_HEIGHT) * 100, 14, 80)}%`,
            transform: "translate(-50%, -105%)",
          }}
        >
          <div className="font-semibold text-slate-900">
            {formatDate.format(new Date(`${activePoint.day}T00:00:00.000Z`))}
          </div>
          <div className="mb-2 text-slate-500">Total: {activePoint.totalViews}</div>
          {activePoint.posts.length === 0 ? (
            <div className="text-slate-500">{labels.noPostViews}</div>
          ) : (
            <ul className="grid gap-1 text-slate-700">
              {activePoint.posts
                .slice()
                .sort((a, b) => b.views - a.views)
                .map((item) => (
                  <li key={`${activePoint.day}-${item.postId}`} className="flex items-center justify-between gap-2">
                    <span className="truncate">{item.title}</span>
                    <span className="font-semibold">{item.views}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
