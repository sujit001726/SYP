const bookings = [
  {
    "id": "f9b45fbe-f0ec-4617-a6b9-6b84b3c3e644",
    "status": "confirmed",
    "startDate": "2026-03-16T00:00:00.000Z",
    "endDate": "2026-03-18T00:00:00.000Z"
  }
];

const year = 2026;
const month = 2; // March
const day = 17;

const cellDate = new Date(year, month, day);
cellDate.setHours(0, 0, 0, 0);

const start = new Date(bookings[0].startDate);
start.setHours(0, 0, 0, 0);

const end = new Date(bookings[0].endDate);
end.setHours(0, 0, 0, 0);

console.log("cellDate:", cellDate, cellDate.getTime());
console.log("start:", start, start.getTime());
console.log("end:", end, end.getTime());
console.log("cellDate >= start && cellDate <= end:", cellDate >= start && cellDate <= end);
