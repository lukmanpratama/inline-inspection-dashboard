import axios from 'axios';
import Papa from 'papaparse';

const RAW_DATA_URL = 'https://docs.google.com/spreadsheets/d/1a-uVy2HfZlitzW1kJ-DGoVisnKbIVKeFZRahH4QwL6I/export?format=csv&gid=1063163792';
const SUMMARY_DATA_URL = 'https://docs.google.com/spreadsheets/d/1a-uVy2HfZlitzW1kJ-DGoVisnKbIVKeFZRahH4QwL6I/export?format=csv&gid=445107403';

export const fetchData = async () => {
  try {
    const [rawRes, summaryRes] = await Promise.all([
      axios.get(RAW_DATA_URL),
      axios.get(SUMMARY_DATA_URL)
    ]);

    const rawData = Papa.parse(rawRes.data, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.toLowerCase().trim().replace(/\s+/g, '_'),
      transform: (v) => v.trim()
    }).data;

    const summaryData = Papa.parse(summaryRes.data, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.toLowerCase().trim().replace(/\s+/g, '_'),
      transform: (v) => v.trim()
    }).data;

    return { rawData, summaryData };
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    return { rawData: [], summaryData: [] };
  }
};
