const months = { Jan: 0, Feb: 1, Mar: 2, March: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

export function experienceTimeline(entries, now = new Date()) {
  function month(value) {
    if (value === 'Present') return now.getUTCFullYear() * 12 + now.getUTCMonth();
    const [name, year] = value.split(' ');
    return Number(year) * 12 + months[name];
  }
  const ranges = entries.map(entry => entry.dates.split(' - ').map(month));
  const start = Math.floor(Math.min(...ranges.map(([from]) => from)) / 12) * 12;
  const end = (Math.floor(Math.max(...ranges.map(([, to]) => to)) / 12) + 1) * 12;
  return {
    startYear: start / 12,
    endYear: end / 12 - 1,
    entries: entries.map((entry, index) => ({
      ...entry,
      left: (ranges[index][0] - start) / (end - start) * 100,
      width: (ranges[index][1] + 1 - ranges[index][0]) / (end - start) * 100
    }))
  };
}
