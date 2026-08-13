import React, { useMemo } from 'react';
import { findKey, parseNumber } from '../utils/dataUtils';

const formatPercentIndo = (num) => {
  const val = parseFloat(num);
  if (isNaN(val)) return '0,0%';
  return val.toLocaleString('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }) + '%';
};

const BuildingStatusTable = ({ data = [], rawData = [], activeTab = '3rd Party' }) => {
  const isCfa = activeTab === 'CFA';
  const isT1qm = activeTab === 'T1QM';

  const rows = useMemo(() => {
    if (!data || data.length === 0 || !rawData || rawData.length === 0) return [];

    const firstItem = rawData[0] || {};
    const factoryKey = findKey(firstItem, 'factory', 'building') || 'factory';
    const cfaGroupKey = (isCfa || isT1qm)
      ? (findKey(firstItem, 'cfa_name', 'cfa name', 't1qm_name', 't1qm name', 'cfa', 'inspector', 'inspector_name') || factoryKey)
      : factoryKey;
    const statusKey = findKey(firstItem, 'status_po', 'status po', 'status_inspection', 'status inspection', 'status', 'result', 'pass_fail');

    const buildingMap = {};

    data.forEach(item => {
      let rawBuilding = String(item[cfaGroupKey] || 'Unknown').trim();
      if (!rawBuilding || rawBuilding === '-') rawBuilding = 'Unknown';

      if (!buildingMap[rawBuilding]) {
        buildingMap[rawBuilding] = { totalInspection: 0, pass: 0, fail: 0 };
      }

      buildingMap[rawBuilding].totalInspection += 1;

      if (statusKey && item[statusKey] !== undefined && item[statusKey] !== null && item[statusKey] !== '') {
        const s = String(item[statusKey]).trim().toUpperCase();
        if (s.includes('FAIL') || s.includes('REJECT') || s === 'F') {
          buildingMap[rawBuilding].fail += 1;
        } else if (s.includes('PASS') || s.includes('APPROV') || s === 'P') {
          buildingMap[rawBuilding].pass += 1;
        }
      }
    });

    return Object.entries(buildingMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([building, stats]) => {
        const totalInspection = stats.totalInspection;
        const passCount = stats.pass;
        const failCount = stats.fail;
        const evaluated = passCount + failCount;
        const passRate = evaluated > 0 ? (passCount / evaluated) * 100 : 0;

        return {
          building,
          totalInspection,
          pass: passCount,
          fail: failCount,
          passRate
        };
      });
  }, [data, rawData, isCfa, isT1qm]);

  const totals = useMemo(() => {
    const totalInspection = rows.reduce((s, r) => s + r.totalInspection, 0);
    const pass = rows.reduce((s, r) => s + r.pass, 0);
    const fail = rows.reduce((s, r) => s + r.fail, 0);
    const evaluated = pass + fail;
    const passRate = evaluated > 0 ? (pass / evaluated) * 100 : 0;
    return { totalInspection, pass, fail, passRate };
  }, [rows]);

  if (rows.length === 0) return null;

  return (
    <div className="industrial-border bg-white/5 p-4 rounded-sm w-full">
      <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/90 flex items-center gap-2">
          🏢 {isCfa ? 'AQL CFA — STATUS (PASS / FAIL)' : isT1qm ? 'T1QM — STATUS (PASS / FAIL)' : 'AQL 3RD PARTY — BUILDING STATUS (PASS / FAIL)'}
        </h3>
        <span className="text-[10px] text-white/60 font-bold bg-white/10 px-2 py-0.5 rounded">
          TOTAL INSPECTION: {totals.totalInspection}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/20 bg-white/10 text-white/80 uppercase text-[11px] font-bold">
              <th className="py-2 px-3">{isCfa ? 'CFA NAME' : isT1qm ? 'T1QM NAME' : 'BUILDING'}</th>
              <th className="py-2 px-3 text-center">TOTAL INSPECTION</th>
              <th className="py-2 px-3 text-center text-emerald-400">PASS</th>
              <th className="py-2 px-3 text-center text-rose-400">FAIL</th>
              <th className="py-2 px-3 text-right">{isCfa ? 'PASS RATE CFA' : isT1qm ? 'PASS RATE T1QM' : 'PASS RATE BUILDING'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((r) => (
              <tr key={r.building} className="hover:bg-white/5 transition-colors font-medium">
                <td className="py-2 px-3 font-bold text-white">{r.building}</td>
                <td className="py-2 px-3 text-center font-bold text-white">{r.totalInspection}</td>
                <td className="py-2 px-3 text-center font-bold text-emerald-400 bg-emerald-500/10 rounded">{r.pass}</td>
                <td className="py-2 px-3 text-center font-bold text-rose-400 bg-rose-500/10 rounded">{r.fail}</td>
                <td className="py-2 px-3 text-right font-bold text-white">
                  {formatPercentIndo(r.passRate)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-white/30 bg-white/10 font-bold text-white text-xs">
              <td className="py-2 px-3">TOTAL</td>
              <td className="py-2 px-3 text-center">{totals.totalInspection}</td>
              <td className="py-2 px-3 text-center text-emerald-400">{totals.pass}</td>
              <td className="py-2 px-3 text-center text-rose-400">{totals.fail}</td>
              <td className="py-2 px-3 text-right text-emerald-300">
                {formatPercentIndo(totals.passRate)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default BuildingStatusTable;
