import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

const formatDefectLabel = (text, maxCharsPerLine = 22) => {
  if (!text) return [''];
  const val = String(text).trim();
  if (val.length <= maxCharsPerLine) return [val];

  const words = val.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);

  if (lines.length > 2) {
    const l1 = lines[0];
    const l2 = lines.slice(1).join(' ');
    if (l2.length > maxCharsPerLine + 3) {
      return [l1, l2.substring(0, maxCharsPerLine) + '…'];
    }
    return [l1, l2];
  }

  return lines;
};

const CustomYAxisTick = ({ x, y, payload }) => {
  if (!payload || !payload.value) return null;
  const lines = formatDefectLabel(payload.value, 22);

  const maxLen = Math.max(...lines.map(l => l.length));
  const fontSize = maxLen > 24 ? 7.5 : maxLen > 18 ? 8.5 : 9.5;

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => {
        const totalLines = lines.length;
        const dy = (index - (totalLines - 1) / 2) * (fontSize + 3);
        return (
          <text
            key={index}
            x={-5}
            y={dy}
            dy="0.32em"
            textAnchor="end"
            fill="white"
            fontSize={fontSize}
            fontWeight="bold"
          >
            {line}
          </text>
        );
      })}
    </g>
  );
};

const DefectChart = ({ data, height = 210 }) => {
  // Calculate max value from data
  const maxVal = data.length > 0 ? Math.max(...data.map(d => d.value), 0) : 0;
  
  // Give just enough padding at the right (around 15-20% extra) so the bar fills the width nicely
  let xMax = 60;
  if (maxVal > 0) {
    if (maxVal <= 5) {
      xMax = 6;
    } else if (maxVal <= 10) {
      xMax = 12;
    } else {
      xMax = Math.ceil(maxVal * 1.15);
    }
  }

  // Generate 4-5 evenly spaced ticks across the axis
  const tickCount = 5;
  const step = xMax / (tickCount - 1);
  const ticks = Array.from({ length: tickCount }, (_, i) => Math.round(i * step));

  return (
    <div className="w-full mt-1 px-2">
      <h2 className="text-sm font-bold mb-2 text-center uppercase tracking-widest border-b border-white/20 pb-1">
        Top 5 Defect
      </h2>
      <div style={{ height: `${height}px` }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 35, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, xMax]}
              ticks={ticks}
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
              tickLine={{ stroke: 'rgba(255,255,255,0.15)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              stroke="white" 
              width={145}
              tick={<CustomYAxisTick />}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.1)' }}
              contentStyle={{ backgroundColor: '#1A0F5A', borderColor: 'rgba(255,255,255,0.2)' }}
            />
            <Bar dataKey="value" fill="#FF6A00" barSize={25} isAnimationActive={false}>
              <LabelList dataKey="value" position="right" fill="white" style={{ fontSize: '12px', fontWeight: 'bold' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DefectChart;
