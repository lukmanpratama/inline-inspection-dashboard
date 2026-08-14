import React, { useMemo } from 'react';
import KPIBox from './KPIBox';
import DefectChart from './DefectChart';
import DefectImages from './DefectImages';
import StatsChart from './StatsChart';
import BuildingStatusChart from './BuildingStatusChart';
import { findKey, parseNumber, parsePercent, formatDateStr } from '../utils/dataUtils';

const DashboardContentView = ({ data, rawData, filters, id, preloadedImages, activeTab }) => {
  const currentTab = activeTab || (filters && filters.activeTab) || (filters && filters.inspectorType && filters.inspectorType.includes('3rd Party') ? '3rd Party' : filters && filters.inspectorType && filters.inspectorType.includes('CFA') ? 'CFA' : 'PSI');
  const is3rdParty = currentTab === '3rd Party' || currentTab === 'CFA';
  const kpis = useMemo(() => {
    if (!data || data.length === 0) {
      return { qtyOrder: 0, qtyDefect: 0, rft: '0.0', defectRate: '0.0', aGrade: 0, bGrade: '-', totalAGrade: 0, criticalDefect: 0, majorDefect: 0, minorDefect: 0 };
    }

    const firstItem = rawData[0] || {};

    // ── Column keys ──
    const qtyInsKey = findKey(firstItem, 'qty_inspection', 'qty inspection');
    const poKey = findKey(firstItem, 'po');
    const qtyOrderKey = findKey(firstItem, 'qty_order', 'qty order');
    // Total defect: prefer pre-computed column, fall back to summing defect slots
    const totalDefectKey = findKey(firstItem, 'total_defect', 'total defect', 'qty_defect', 'qty defect');
    const aGradeKey = findKey(firstItem, 'a_grade', 'a grade', 'agrade');
    const bGradeKey = findKey(firstItem, 'b_grade', 'b grade', 'bgrade', 'avg_b_grade', 'avg b grade');
    // Pre-computed RFT & defect rate columns from sheet
    const rftKey = findKey(firstItem, 'rft');
    const statusKey = findKey(firstItem, 'status_po', 'status po', 'status_inspection', 'status inspection', 'status', 'result', 'pass_fail');
    // 3rd Party specific columns — derived from classification slots
    const totalAGradeKey = findKey(firstItem, 'total_a_grade', 'total a grade', 'a_grade', 'a grade', 'agrade');
    // Defect slot keys — qty + classification (up to 25 slots)
    const qtyDefectKeys = [];
    const classificationKeys = [];
    for (let i = 1; i <= 25; i++) {
      qtyDefectKeys[i] = findKey(firstItem, `qty_defect_${i}`, `qty defect ${i}`, `qtydefect${i}`);
      classificationKeys[i] = findKey(firstItem, `classification_${i}`, `classification ${i}`, `clasification_${i}`, `clasification ${i}`);
    }

    // ── Aggregation ──
    let totalInspection = 0;
    let totalDefects = 0;
    let totalAGrade = 0;
    let totalBGrade = 0;
    let sumRft = 0;
    let countRft = 0;
    let totalPass = 0;
    let totalFail = 0;
    let totalAGradeFull = 0;
    let totalCritical = 0;
    let totalMajor = 0;
    let totalMinor = 0;

    data.forEach(item => {
      totalInspection += parseNumber(item[qtyInsKey]);
      totalAGrade += parseNumber(item[aGradeKey]);
      totalBGrade += parseNumber(item[bGradeKey]);
      totalAGradeFull += parseNumber(item[totalAGradeKey]);

      // Sum critical / major / minor from classification slots
      for (let i = 1; i <= 25; i++) {
        if (!qtyDefectKeys[i] && !classificationKeys[i]) continue;
        const qty = parseNumber(item[qtyDefectKeys[i]]);
        const cls = classificationKeys[i] ? String(item[classificationKeys[i]] || '').trim().toUpperCase() : '';
        if (qty <= 0) continue;
        if (cls.includes('CRITICAL')) totalCritical += qty;
        else if (cls.includes('MAJOR')) totalMajor += qty;
        else if (cls.includes('MINOR')) totalMinor += qty;
      }

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
      qtyOrder: totalQtyOrder,
      qtyInspection: totalInspection,
      qtyChecking: totalInspection,
      qtyDefect: totalDefects,
      rft,
      defectRate,
      aGrade: totalAGrade,
      bGrade: totalBGrade,
      totalAGrade: totalAGradeFull || totalAGrade,
      totalBGrade: totalBGrade,
      criticalDefect: totalCritical,
      majorDefect: totalMajor,
      minorDefect: totalMinor
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

    // Compute STATUS PO: check all filtered rows
    let poPass = 0;
    let poFail = 0;
    const statusPoKey = findKey(rawData[0], 'status_po', 'status po', 'status_inspection', 'status inspection', 'status', 'result', 'pass_fail');
    (data.length > 0 ? data : [first]).forEach(item => {
      if (!statusPoKey || item[statusPoKey] === undefined || item[statusPoKey] === null || item[statusPoKey] === '') return;
      const s = String(item[statusPoKey]).trim().toUpperCase();
      if (s.includes('FAIL') || s.includes('REJECT') || s === 'F') poFail++;
      else if (s.includes('PASS') || s.includes('APPROV') || s === 'P') poPass++;
    });
    let statusPo = null;
    let passRate = null;
    if (poPass + poFail > 0) {
      if (poFail === 0) statusPo = 'PASS';
      else if (poPass === 0) statusPo = 'FAIL';
      else statusPo = 'MIXED';
      passRate = ((poPass / (poPass + poFail)) * 100).toFixed(1);
    }

    // STATUS PO untuk header 3rd Party: hanya tampil jika filter tepat 1 PO (bukan ALL / multiple)
    // Jika filter ALL atau multiple PO dipilih → statusPoHeader = null (kosong)
    const isSinglePoFilter = filters && filters.po && filters.po.length === 1;
    const statusPoHeader = isSinglePoFilter ? statusPo : null;

    return {
      model: getAllValues('model'),
      factory: getAllValues('factory'),
      cell: getAllValues('cell'),
      po: getAllValues('po'),
      article: getAllValues('article'),
      inspector: getAllValues('inspector'),
      destinasi: (() => { const v = getAllValues('destination'); return (v && v !== '-') ? v : getAllValues('destinasi'); })(),
      inspectorType: filters && filters.inspectorType && filters.inspectorType.length > 0
        ? filters.inspectorType.join(' / ')
        : null,
      crdDate: first[crdKey] || '-',
      statusPo,
      statusPoHeader,
      passRate,
      date: filters && filters.startDate && filters.startDate !== 'ALL'
        ? (filters.startDate === filters.endDate ? formatDateStr(filters.startDate) : `${formatDateStr(filters.startDate)} - ${formatDateStr(filters.endDate)}`)
        : (first[dateKey] || 'All Time')
    };
  }, [data, filters, rawData]);

  return (
    <div id={id} className="industrial-border bg-primary p-4 relative w-full rounded-sm flex flex-col gap-3">

      {/* ── Header bar khusus AQL 3rd Party: FACTORY + STATUS PO + PASS RATE ── */}
      {currentTab === '3rd Party' && headerMetadata.factory && headerMetadata.factory !== '-' && (
        <div className="industrial-border bg-white/5 rounded-sm px-3 py-2 flex items-center gap-3 mb-3 overflow-hidden">
          <span className="text-[11px] uppercase font-bold text-white/50 tracking-wider whitespace-nowrap">FACTORY</span>
          <span style={{ writingMode: 'horizontal-tb', textOrientation: 'mixed', whiteSpace: 'normal', wordBreak: 'break-word' }} className="text-[13px] font-bold text-white tracking-wide leading-snug flex-1">{headerMetadata.factory}</span>
          {/* STATUS PO badge — hanya tampil jika single PO filter (PASS atau FAIL) */}
          {headerMetadata.statusPoHeader && headerMetadata.statusPoHeader !== 'MIXED' && (
            <div className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-sm industrial-border min-w-[72px] shrink-0 ${
              headerMetadata.statusPoHeader === 'PASS'
                ? 'bg-emerald-600/80 border-emerald-400/40'
                : 'bg-rose-700/80 border-rose-400/40'
            }`}>
              <span className="text-[9px] uppercase font-bold text-white/70 tracking-widest leading-none mb-0.5 whitespace-nowrap">STATUS PO</span>
              <span className={`text-[13px] font-black tracking-wide leading-none ${
                headerMetadata.statusPoHeader === 'PASS' ? 'text-emerald-200' : 'text-rose-200'
              }`}>{headerMetadata.statusPoHeader}</span>
            </div>
          )}
          {/* Pass Rate badge */}
          {headerMetadata.passRate !== null && headerMetadata.passRate !== undefined && (
            <div className={`flex flex-row items-center justify-center gap-3 px-5 py-2 rounded-sm industrial-border min-w-[120px] shrink-0 ${parseFloat(headerMetadata.passRate) >= 90
              ? 'bg-emerald-600/80 border-emerald-400/40'
              : parseFloat(headerMetadata.passRate) >= 70
                ? 'bg-amber-600/80 border-amber-400/40'
                : 'bg-rose-700/80 border-rose-400/40'
              }`}>
              <span className="text-[11px] uppercase font-bold text-white/70 tracking-widest whitespace-nowrap">PASS RATE</span>
              <span className={`text-[16px] font-black tracking-wide whitespace-nowrap ${parseFloat(headerMetadata.passRate) >= 90
                ? 'text-emerald-200'
                : parseFloat(headerMetadata.passRate) >= 70
                  ? 'text-amber-200'
                  : 'text-rose-200'
                }`}>{headerMetadata.passRate}%</span>
            </div>
          )}
        </div>
      )}

      {/* ── Header bar untuk PSI: FACTORY + STATUS PO ── */}
      {currentTab === 'PSI' && headerMetadata.factory && headerMetadata.factory !== '-' && (
        <div className="industrial-border bg-white/5 rounded-sm px-3 py-2 flex items-center gap-3 mb-3 overflow-hidden">
          <span className="text-[11px] uppercase font-bold text-white/50 tracking-wider whitespace-nowrap">FACTORY</span>
          <span style={{ writingMode: 'horizontal-tb', textOrientation: 'mixed', whiteSpace: 'normal', wordBreak: 'break-word' }} className="text-[13px] font-bold text-white tracking-wide leading-snug flex-1">{headerMetadata.factory}</span>
          {/* Status PO badge */}
          {headerMetadata.statusPo && (
            <div className={`flex flex-col items-center justify-center px-3 py-1 rounded-sm industrial-border min-w-[72px] shrink-0 ${headerMetadata.statusPo === 'PASS'
              ? 'bg-emerald-600/80 border-emerald-400/40'
              : headerMetadata.statusPo === 'FAIL'
                ? 'bg-rose-700/80 border-rose-400/40'
                : 'bg-amber-600/80 border-amber-400/40'
              }`}>
              <span className="text-[9px] uppercase font-bold text-white/70 tracking-widest leading-none mb-0.5">STATUS PO</span>
              <span className={`text-[13px] font-black tracking-wide leading-none ${headerMetadata.statusPo === 'PASS'
                ? 'text-emerald-200'
                : headerMetadata.statusPo === 'FAIL'
                  ? 'text-rose-200'
                  : 'text-amber-200'
                }`}>{headerMetadata.statusPo}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Header bar untuk CFA, T1QM: INSPECTOR + STATUS PO ── */}
      {currentTab !== '3rd Party' && currentTab !== 'PSI' && headerMetadata.inspector && headerMetadata.inspector !== '-' && (
        <div className="industrial-border bg-white/5 rounded-sm px-3 py-2 flex items-center gap-3 mb-3 overflow-hidden">
          <span className="text-[11px] uppercase font-bold text-white/50 tracking-wider whitespace-nowrap">INSPECTOR</span>
          <span style={{ writingMode: 'horizontal-tb', textOrientation: 'mixed', whiteSpace: 'normal', wordBreak: 'break-word' }} className="text-[13px] font-bold text-white tracking-wide leading-snug flex-1">{headerMetadata.inspector}</span>
          {/* Status PO badge */}
          {headerMetadata.statusPo && (
            <div className={`flex flex-col items-center justify-center px-3 py-1 rounded-sm industrial-border min-w-[72px] shrink-0 ${headerMetadata.statusPo === 'PASS'
              ? 'bg-emerald-600/80 border-emerald-400/40'
              : headerMetadata.statusPo === 'FAIL'
                ? 'bg-rose-700/80 border-rose-400/40'
                : 'bg-amber-600/80 border-amber-400/40'
              }`}>
              <span className="text-[9px] uppercase font-bold text-white/70 tracking-widest leading-none mb-0.5">STATUS PO</span>
              <span className={`text-[13px] font-black tracking-wide leading-none ${headerMetadata.statusPo === 'PASS'
                ? 'text-emerald-200'
                : headerMetadata.statusPo === 'FAIL'
                  ? 'text-rose-200'
                  : 'text-amber-200'
                }`}>{headerMetadata.statusPo}</span>
            </div>
          )}
        </div>
      )}

      {/* Two-column layout — gap-2 seragam */}
      <div className="flex flex-col lg:flex-row gap-2 w-full">

        {/* ── LEFT COLUMN ── */}
        <div className="w-full lg:w-1/2 flex flex-col gap-2 min-w-0">

          {/* Metadata 4-kolom × 2-baris — sejajar dengan KPI kanan */}
          <div className="grid grid-cols-4 gap-2">

            {/* ── ROW 1 ── */}
            {/* PO */}
            <div className="industrial-border px-2 py-1 bg-white/5 rounded-sm flex flex-col items-center justify-center h-[76px] overflow-y-auto custom-scrollbar">
              <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider mb-0.5 whitespace-nowrap">PO</span>
              <span className="w-full text-center text-[11px] font-bold text-white leading-snug whitespace-pre-wrap [word-break:keep-all]">{headerMetadata.po || '-'}</span>
            </div>
            {/* Model */}
            <div className="industrial-border px-2 py-1 bg-white/5 rounded-sm flex flex-col items-center justify-center h-[76px] overflow-y-auto custom-scrollbar">
              <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider mb-0.5 whitespace-nowrap">MODEL</span>
              <span className="w-full text-center text-[11px] font-bold text-white leading-snug whitespace-pre-wrap [word-break:keep-all]">{headerMetadata.model || '-'}</span>
            </div>
            {/* CRD */}
            <div className="industrial-border px-2 py-1 bg-white/5 rounded-sm flex flex-col items-center justify-center h-[76px] overflow-y-auto custom-scrollbar">
              <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider mb-0.5 whitespace-nowrap">CRD</span>
              <span className="w-full text-center text-[11px] font-bold text-white leading-snug whitespace-pre-wrap [word-break:keep-all]">{headerMetadata.crdDate || '-'}</span>
            </div>
            {/* Destinasi */}
            <div className="industrial-border px-2 py-1 bg-white/5 rounded-sm flex flex-col items-center justify-center h-[76px] overflow-y-auto custom-scrollbar">
              <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider mb-0.5 whitespace-nowrap">DESTINATION</span>
              <span className="w-full text-center text-[11px] font-bold text-white leading-snug whitespace-pre-wrap [word-break:keep-all]">{headerMetadata.destinasi || '-'}</span>
            </div>

            {/* ── ROW 2 ── */}
            {/* Article */}
            <div className="industrial-border px-2 py-1 bg-white/5 rounded-sm flex flex-col items-center justify-center h-[76px] overflow-y-auto custom-scrollbar">
              <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider mb-0.5 whitespace-nowrap">ARTICLE</span>
              <span className="w-full text-center text-[11px] font-bold text-white leading-snug whitespace-pre-wrap [word-break:keep-all]">{headerMetadata.article || '-'}</span>
            </div>
            {/* Factory */}
            <div className="industrial-border px-2 py-1 bg-white/5 rounded-sm flex flex-col items-center justify-center h-[76px] overflow-y-auto custom-scrollbar">
              <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider mb-0.5 whitespace-nowrap">FACTORY</span>
              <span className="w-full text-center text-[11px] font-bold text-white leading-snug whitespace-pre-wrap [word-break:keep-all]">{headerMetadata.factory || '-'}</span>
            </div>
            {/* Cell */}
            <div className="industrial-border px-2 py-1 bg-white/5 rounded-sm flex flex-col items-center justify-center h-[76px] overflow-y-auto custom-scrollbar">
              <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider mb-0.5 whitespace-nowrap">CELL / LINE</span>
              <span className="w-full text-center text-[11px] font-bold text-white leading-snug whitespace-pre-wrap [word-break:keep-all]">{headerMetadata.cell || '-'}</span>
            </div>
            {/* Date */}
            <div className="industrial-border px-2 py-1 bg-white/5 rounded-sm flex flex-col items-center justify-center h-[76px] overflow-y-auto custom-scrollbar">
              <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider mb-0.5 whitespace-nowrap">DATE</span>
              <span className="w-full text-center text-[11px] font-bold text-white leading-snug whitespace-pre-wrap [word-break:keep-all]">{headerMetadata.date || '-'}</span>
            </div>

          </div>

          {is3rdParty ? (
            <>
              {/* 3rd Party Layout: DefectChart full width */}
              <div className="industrial-border bg-white/5 pb-2 w-full min-w-0">
                <DefectChart data={defectStats} height={260} />
              </div>
              {/* Building Status Chart */}
              <div className="w-full">
                <BuildingStatusChart data={data} rawData={rawData} activeTab={currentTab} />
              </div>
            </>
          ) : (
            <>
              {/* PSI Layout: DefectChart + StatsChart */}
              <div className="industrial-border bg-white/5 pb-2">
                <DefectChart data={defectStats} />
              </div>
              <div className="industrial-border bg-white/5 p-3">
                <StatsChart data={data} rawData={rawData} />
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="w-full lg:w-1/2 flex flex-col gap-2 min-w-0">
          {/* KPI Boxes */}
          <KPIBox kpis={kpis} metadata={headerMetadata} is3rdParty={is3rdParty} activeTab={currentTab} />
          {/* Defect Images */}
          <DefectImages defects={defectImages} />
        </div>

      </div>
    </div>
  );
};

export default DashboardContentView;
