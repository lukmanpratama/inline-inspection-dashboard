import React, { useMemo } from 'react';
import KPIBox from './KPIBox';
import DefectChart from './DefectChart';
import DefectImages from './DefectImages';
import StatsChart from './StatsChart';
import BuildingStatusTable from './BuildingStatusTable';
import { findKey, parseNumber, parsePercent, formatDateStr } from '../utils/dataUtils';

const DashboardContentView = ({ data, rawData, filters, id, preloadedImages, activeTab }) => {
  const currentTab = activeTab || (filters && filters.activeTab) || (filters && filters.inspectorType && filters.inspectorType.includes('3rd Party') ? '3rd Party' : filters && filters.inspectorType && filters.inspectorType.includes('CFA') ? 'CFA' : 'PSI');
  const is3rdParty = currentTab === '3rd Party' || currentTab === 'CFA';
  const kpis = useMemo(() => {
    if (!data || data.length === 0) {
      return { qtyOrder: 0, qtyDefect: 0, rft: '0.0', defectRate: '0.0', aGrade: 0, bGrade: '-' };
    }

    const firstItem = rawData[0] || {};

    // ── Column keys ──
    const qtyInsKey    = findKey(firstItem, 'qty_inspection', 'qty inspection');
    const poKey        = findKey(firstItem, 'po');
    const qtyOrderKey  = findKey(firstItem, 'qty_order', 'qty order');
    // Total defect: prefer pre-computed column, fall back to summing defect slots
    const totalDefectKey = findKey(firstItem, 'total_defect', 'total defect', 'qty_defect', 'qty defect');
    const aGradeKey    = findKey(firstItem, 'a_grade', 'a grade', 'agrade');
    const bGradeKey    = findKey(firstItem, 'b_grade', 'b grade', 'bgrade', 'avg_b_grade', 'avg b grade');
    // Pre-computed RFT & defect rate columns from sheet
    const rftKey       = findKey(firstItem, 'rft');
    const statusKey    = findKey(firstItem, 'status_po', 'status po', 'status_inspection', 'status inspection', 'status', 'result', 'pass_fail');

    // Defect slot keys (fallback when no total_defect column)
    const qtyDefectKeys = [];
    for (let i = 1; i <= 25; i++) {
      qtyDefectKeys[i] = findKey(firstItem, `qty_defect_${i}`, `qty defect ${i}`, `qtydefect${i}`);
    }

    // ── Aggregation ──
    let totalInspection = 0;
    let totalDefects    = 0;
    let totalAGrade     = 0;
    let totalBGrade     = 0;
    let sumRft          = 0;
    let countRft        = 0;
    let totalPass       = 0;
    let totalFail       = 0;

    data.forEach(item => {
      totalInspection += parseNumber(item[qtyInsKey]);
      totalAGrade     += parseNumber(item[aGradeKey]);
      totalBGrade     += parseNumber(item[bGradeKey]);

      // Total defect: use pre-computed column if available
      if (totalDefectKey) {
        totalDefects += parseNumber(item[totalDefectKey]);
      } else {
        for (let i = 1; i <= 25; i++) {
          if (qtyDefectKeys[i]) totalDefects += parseNumber(item[qtyDefectKeys[i]]);
        }
      }

      // Collect RFT per row for AVERAGE calculation
      if (rftKey) {
        const val = parsePercent(item[rftKey]);
        if (val !== null) {
          sumRft += val;
          countRft++;
        }
      }

      // Collect Status PO Pass/Fail for Pass Rate Building calculation
      if (statusKey && item[statusKey] !== undefined && item[statusKey] !== null && item[statusKey] !== '') {
        const s = String(item[statusKey]).trim().toUpperCase();
        if (s.includes('FAIL') || s.includes('REJECT') || s === 'F') {
          totalFail++;
        } else if (s.includes('PASS') || s.includes('APPROV') || s === 'P') {
          totalPass++;
        }
      }
    });

    // ── QTY ORDER (unique per PO) ──
    const poOrders = {};
    let hasPO = false;
    let maxFallbackOrder = 0;
    data.forEach(item => {
      const po = item[poKey];
      const orderVal = parseNumber(item[qtyOrderKey]);
      if (po && String(po).trim() !== '-' && String(po).trim() !== '') {
        hasPO = true;
        if (!poOrders[po] || orderVal > poOrders[po]) poOrders[po] = orderVal;
      } else {
        if (orderVal > maxFallbackOrder) maxFallbackOrder = orderVal;
      }
    });
    const totalQtyOrder = hasPO
      ? Object.values(poOrders).reduce((s, v) => s + v, 0)
      : maxFallbackOrder;

    // ── RFT & PASS RATE BUILDING ──
    const rftVal = countRft > 0
      ? (sumRft / countRft)
      : (totalInspection > 0
          ? (((totalInspection - totalDefects) / totalInspection) * 100)
          : 0);

    const rft = rftVal > 0 ? rftVal.toFixed(1) : '0.0';

    // Pass Rate Building matching table total for 3rd Party
    const evaluatedPassFail = totalPass + totalFail;
    const passRateBuildingVal = evaluatedPassFail > 0
      ? ((totalPass / evaluatedPassFail) * 100)
      : (rftVal > 0 ? (100 - parseFloat(rft)) : 0);

    const passRateBuilding = passRateBuildingVal > 0
      ? passRateBuildingVal.toFixed(1)
      : '0.0';

    // PSI Defect Rate: 100 - RFT
    const psiDefectRate = rftVal > 0 ? (100 - parseFloat(rft)).toFixed(1) : '0.0';

    const defectRate = is3rdParty ? passRateBuilding : psiDefectRate;

    return {
      qtyOrder:      totalQtyOrder,
      qtyInspection: totalInspection,
      qtyDefect:     totalDefects,
      rft,
      defectRate,
      aGrade:        totalAGrade,
      bGrade:        totalBGrade
    };
  }, [data, rawData, is3rdParty]);

  const defectStats = useMemo(() => {
    if (!data || data.length === 0) return [];

    const counts = {};
    const imageSelections = {};
    const firstItem = rawData[0] || {};

    const nameKeys = [];
    const qtyKeys = [];
    const imageUrlKeyGroups = [];
    for (let i = 1; i <= 25; i++) {
      nameKeys[i] = findKey(firstItem, `defect_name_${i}`, `defect name ${i}`, `defectname${i}`);
      qtyKeys[i] = findKey(firstItem, `qty_defect_${i}`, `qty defect ${i}`, `qtydefect${i}`);

      const imageSlotStart = ((i - 1) * 3) + 1;
      imageUrlKeyGroups[i] = [0, 1, 2]
        .map((offset) => {
          const slot = imageSlotStart + offset;
          return findKey(firstItem, `link${slot}`, `photo${slot}`);
        })
        .filter(Boolean);
    }

    data.forEach((item, rowIndex) => {
      for (let i = 1; i <= 25; i++) {
        const nameKey = nameKeys[i];
        const qtyKey = qtyKeys[i];
        const imageUrlKeys = imageUrlKeyGroups[i] || [];

        if (!nameKey || !qtyKey) continue;

        const name = item[nameKey];
        const qty = parseNumber(item[qtyKey]);
        const url = imageUrlKeys.map((key) => item[key]).find((value) => value && value !== '-');

        if (name && name !== '-' && name !== 'NO DATA' && qty > 0) {
          const normalizedName = name.trim();
          counts[normalizedName] = (counts[normalizedName] || 0) + qty;

          if (url && url !== '-') {
            const currentSelection = imageSelections[normalizedName];
            if (
              !currentSelection ||
              qty > currentSelection.qty ||
              (qty === currentSelection.qty && rowIndex > currentSelection.rowIndex)
            ) {
              imageSelections[normalizedName] = { url, qty, rowIndex };
            }
          }
        }
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, url: imageSelections[name]?.url || null }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [data, rawData]);

  const defectImages = useMemo(() => {
    // If pre-loaded images are provided (PDF export), use them directly
    if (preloadedImages && preloadedImages.length > 0) {
      return preloadedImages.map(img => ({
        name: img.name,
        url: img.dataUri
      }));
    }
    // Normal dashboard rendering: use proxy URLs
    return defectStats.map(stat => {
      const proxiedUrl = stat.url ? stat.url.replace('https://www.appsheet.com', '/appsheet-img') : null;
      return {
        name: stat.name,
        url: proxiedUrl
      };
    });
  }, [defectStats, preloadedImages]);

  const headerMetadata = useMemo(() => {
    if (!rawData || rawData.length === 0) return {};
    const first = data[0] || rawData[0] || {};
    const dateKey = findKey(rawData[0], 'date');
    const crdKey = findKey(rawData[0], 'crd');

    // Collect all unique values for a field from the filtered data array
    const getAllValues = (rawKey) => {
      const key = findKey(rawData[0], rawKey);
      if (!key) return '-';
      const vals = new Set();
      (data.length > 0 ? data : [first]).forEach(item => {
        const v = item[key];
        if (v && v !== '-') vals.add(String(v));
      });
      return vals.size > 0 ? Array.from(vals).sort().join(', ') : '-';
    };

    return {
      model:    getAllValues('model'),
      factory:  getAllValues('factory'),
      cell:     getAllValues('cell'),
      po:       getAllValues('po'),
      article:  getAllValues('article'),
      inspector: getAllValues('inspector'),
      destinasi: (() => { const v = getAllValues('destination'); return (v && v !== '-') ? v : getAllValues('destinasi'); })(),
      inspectorType: filters && filters.inspectorType && filters.inspectorType.length > 0
        ? filters.inspectorType.join(' / ')
        : null,
      crdDate: first[crdKey] || '-',
      date: filters && filters.startDate && filters.startDate !== 'ALL'
        ? (filters.startDate === filters.endDate ? formatDateStr(filters.startDate) : `${formatDateStr(filters.startDate)} - ${formatDateStr(filters.endDate)}`)
        : (first[dateKey] || 'All Time')
    };
  }, [data, filters, rawData]);

  return (
    <div id={id} className="industrial-border bg-primary p-4 relative w-full rounded-sm flex flex-col gap-3">

      {/* Inspector bar — full width above both columns */}
      {headerMetadata.inspector && headerMetadata.inspector !== '-' && (
        <div className="industrial-border bg-white/5 rounded-sm px-3 py-2 flex items-center gap-3 mb-3 overflow-hidden">
          <span className="text-[11px] uppercase font-bold text-white/50 tracking-wider whitespace-nowrap">INSPECTOR</span>
          <span style={{ writingMode: 'horizontal-tb', textOrientation: 'mixed', whiteSpace: 'normal', wordBreak: 'break-word' }} className="text-[13px] font-bold text-white tracking-wide leading-snug">{headerMetadata.inspector}</span>
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-1/2 flex flex-col gap-3 min-w-0">
          {/* Metadata Boxes Grid — Row 1 aligned with KPI Row 1, Row 2 aligned with KPI Row 2 */}
          <div className="grid grid-cols-[1.5fr_1.8fr_1.2fr] gap-2 font-bold text-center text-[16px]">
            {/* Column 1 */}
            <div className="flex flex-col gap-2">
              <div className="industrial-border px-2 py-1.5 bg-white/5 rounded-sm flex items-center justify-center h-[80px] overflow-y-auto custom-scrollbar">
                <span className="w-full text-center text-[12px] font-bold text-white tracking-wide leading-snug whitespace-pre-wrap [word-break:keep-all]">{headerMetadata.po || '-'}</span>
              </div>
              <div className="industrial-border px-2 py-1.5 bg-white/5 rounded-sm flex items-center justify-center h-[80px] overflow-y-auto custom-scrollbar">
                <span className="w-full text-center text-[12px] font-bold text-white tracking-wide leading-snug whitespace-pre-wrap [word-break:keep-all]">{headerMetadata.article || '-'}</span>
              </div>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-2">
              <div className="industrial-border px-2 py-1.5 bg-white/5 rounded-sm flex items-center justify-center h-[80px] overflow-y-auto custom-scrollbar">
                <span className="w-full text-center text-[12px] font-bold text-white tracking-wide leading-snug whitespace-pre-wrap [word-break:keep-all]">{headerMetadata.model || '-'}</span>
              </div>
              <div className="flex gap-2 h-[80px]">
                <div className="industrial-border px-1 py-1.5 bg-white/5 rounded-sm flex-1 flex items-center justify-center h-[80px] overflow-y-auto custom-scrollbar">
                  <span className="w-full text-center text-[11px] font-bold text-white tracking-wide leading-snug whitespace-pre-wrap [word-break:keep-all]">{headerMetadata.factory || '-'}</span>
                </div>
                <div className="industrial-border px-1 py-1.5 bg-white/5 rounded-sm flex-1 flex items-center justify-center h-[80px] overflow-y-auto custom-scrollbar">
                  <span className="w-full text-center text-[11px] font-bold text-white tracking-wide leading-snug whitespace-pre-wrap [word-break:keep-all]">{headerMetadata.cell || '-'}</span>
                </div>
              </div>
            </div>

            {/* Column 3: CRD + DESTINASI */}
            <div className="flex flex-col gap-2">
              <div className="industrial-border bg-white/5 rounded-sm flex flex-col justify-center items-center py-1.5 px-2 h-[80px] overflow-y-auto custom-scrollbar">
                <span className="text-[9px] uppercase font-bold text-white/50 tracking-wider mb-0.5 whitespace-nowrap">CRD</span>
                <span className="w-full text-center text-[12px] font-bold text-white tracking-wide leading-snug whitespace-pre-wrap [word-break:keep-all]">{headerMetadata.crdDate || '-'}</span>
              </div>
              <div className="industrial-border bg-white/5 rounded-sm flex flex-col justify-center items-center py-1.5 px-2 h-[80px] overflow-y-auto custom-scrollbar">
                <span className="w-full text-center text-[11px] font-bold text-white tracking-wide leading-snug whitespace-pre-wrap [word-break:keep-all]">{headerMetadata.destinasi || '-'}</span>
              </div>
            </div>
          </div>

          {is3rdParty ? (
            <>
              {/* 3rd Party Layout: DefectChart & StatsChart side-by-side */}
              <div className="grid grid-cols-2 gap-2">
                <div className="industrial-border bg-white/5 pb-2 min-w-0">
                  <DefectChart data={defectStats} />
                </div>
                <div className="industrial-border bg-white/5 p-2 min-w-0">
                  <StatsChart data={data} rawData={rawData} />
                </div>
              </div>

              {/* Building Status Table */}
              <div className="w-full">
                <BuildingStatusTable data={data} rawData={rawData} activeTab={currentTab} />
              </div>
            </>
          ) : (
            <>
              {/* PSI Layout: DefectChart stacked above StatsChart, NO Building Status Table */}
              <div className="industrial-border bg-white/5 pb-2">
                <DefectChart data={defectStats} />
              </div>
              <div className="industrial-border bg-white/5 p-3">
                <StatsChart data={data} rawData={rawData} />
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full lg:w-1/2 flex flex-col gap-3 min-w-0">
          {/* KPI Boxes 2x3 — Row 1 aligned with Metadata Row 1, Row 2 aligned with Metadata Row 2 */}
          <KPIBox kpis={kpis} metadata={headerMetadata} is3rdParty={is3rdParty} activeTab={currentTab} />

          {/* Defect Images */}
          <DefectImages defects={defectImages} />
        </div>
      </div>
    </div>
  );
};

export default DashboardContentView;
