import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export interface CalendarEvent {
  id: string;
  tripId: string;
  title: string;
  datetime: string;
  dateStr: string; // YYYY-MM-DD
  route: string;
  passenger: string;
  status: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onViewDetail: (id: string) => void;
}

export default function CalendarView({ events, onViewDetail }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper arrays
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const dayNames = ["Ming", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  // Days calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const prevLastDay = new Date(year, month, 0).getDate();

  const calendarDays: { date: number; monthType: "prev" | "current" | "next"; fullDateStr: string }[] = [];

  // Previous month days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevLastDay - i;
    const prevMonthNum = month === 0 ? 11 : month - 1;
    const prevYearNum = month === 0 ? year - 1 : year;
    const fullDateStr = `${prevYearNum}-${String(prevMonthNum + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ date: d, monthType: "prev", fullDateStr });
  }

  // Current month days
  for (let i = 1; i <= lastDay; i++) {
    const fullDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({ date: i, monthType: "current", fullDateStr });
  }

  // Next month days
  const totalSlots = 42; // 6 rows * 7 days
  const nextDaysCount = totalSlots - calendarDays.length;
  for (let i = 1; i <= nextDaysCount; i++) {
    const nextMonthNum = month === 11 ? 0 : month + 1;
    const nextYearNum = month === 11 ? year + 1 : year;
    const fullDateStr = `${nextYearNum}-${String(nextMonthNum + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({ date: i, monthType: "next", fullDateStr });
  }

  // Group events by dateStr
  const getEventsForDate = (dateStr: string) => {
    return events.filter(e => e.dateStr === dateStr);
  };

  // Selected date trips list
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-bold text-[#0f172a]">Kalender Tugas</h2>
          <p className="text-[12.5px] text-[#64748b]">Lihat jadwal penugasan driver di grid kalender bulanan.</p>
        </div>
        
        {/* Month Selector */}
        <div className="flex items-center gap-3 bg-white border border-[#e2e8f0] px-3.5 py-1.5 rounded-xl shadow-sm self-start sm:self-auto">
          <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer">
            <Icon name="chevron_left" className="text-xl" />
          </button>
          <span className="text-[13.5px] font-extrabold text-[#0f172a] min-w-[120px] text-center uppercase tracking-wide">
            {monthNames[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer">
            <Icon name="chevron_right" className="text-xl" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid Box */}
        <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden p-5 flex flex-col">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2 border-b border-[#f1f5f9] pb-2">
            {dayNames.map((d, i) => {
              const isWeekendHeader = i === 0 || i === 6;
              return (
                <div key={d} className={`text-center text-[11px] font-bold uppercase tracking-wider py-1 ${
                  isWeekendHeader ? "text-red-500" : "text-[#64748b]"
                }`}>
                  {d}
                </div>
              );
            })}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[300px]">
            {calendarDays.map((day, idx) => {
              const isSelected = selectedDate === day.fullDateStr;
              const isToday = new Date().toISOString().split("T")[0] === day.fullDateStr;
              const dateEvents = getEventsForDate(day.fullDateStr);
              const hasActiveTask = dateEvents.some(
                (ev) => !ev.status.toLowerCase().includes("complete") && !ev.status.toLowerCase().includes("reject")
              );
              const hasEvents = dateEvents.length > 0;
              const dayOfWeek = idx % 7;
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              let bgClass = "bg-white border-[#f1f5f9] text-[#1e293b] hover:border-slate-300";

              if (day.monthType !== "current") {
                bgClass = "bg-[#f8fafc] border-[#f8fafc] text-[#94a3b8]";
              } else if (isSelected) {
                bgClass = "bg-[#1e3a8a] border-[#1e3a8a] text-white";
              } else if (hasActiveTask) {
                bgClass = "bg-[#dbeafe] border-[#bfdbfe] text-[#1e40af] font-bold hover:bg-[#c7d7f7]";
              } else if (isWeekend) {
                bgClass = "bg-[#fef2f2] border-[#fecaca] text-[#dc2626] hover:bg-[#fee2e2]";
              }

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(day.fullDateStr)}
                  className={`min-h-[55px] p-1.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative ${bgClass} ${
                    isToday && !isSelected ? "ring-2 ring-blue-500/20 border-blue-400 font-extrabold" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold">{day.date}</span>
                    {isToday && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Hari Ini" />}
                  </div>

                  {/* Event indicators */}
                  {hasEvents && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dateEvents.slice(0, 2).map((ev) => {
                        const statusLower = ev.status.toLowerCase();
                        const dotColor = statusLower.includes("complete")
                          ? "bg-green-500"
                          : statusLower.includes("reject")
                          ? "bg-red-500"
                          : "bg-blue-500";
                        return (
                          <div
                            key={ev.id}
                            className={`h-1.5 w-1.5 rounded-full ${dotColor}`}
                            title={`${ev.tripId}: ${ev.route}`}
                          />
                        );
                      })}
                      {dateEvents.length > 2 && (
                        <span className="text-[9px] font-bold text-[#64748b]">+{dateEvents.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details Box */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-[14.5px] font-bold text-[#0f172a] flex items-center gap-1.5">
              <Icon name="event" className="text-blue-600 text-lg" />
              <span>Detail Tanggal:</span>
              <span className="text-blue-700 font-extrabold">
                {selectedDate ? selectedDate.split("-").reverse().join("-") : "-"}
              </span>
            </h3>
            <p className="text-[12px] text-[#64748b] mt-0.5">Daftar penugasan driver pada hari ini.</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] min-h-[200px]">
            {selectedDateEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#94a3b8]">
                <Icon name="calendar_today" className="text-3xl opacity-40 mb-2" />
                <p className="text-[12px] font-bold">Tidak ada penugasan</p>
                <p className="text-[11px] mt-0.5">Jadwal Anda kosong pada hari ini.</p>
              </div>
            ) : (
              selectedDateEvents.map((ev) => {
                const statusLower = ev.status.toLowerCase();
                const badgeClass = statusLower.includes("complete")
                  ? "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]"
                  : statusLower.includes("reject")
                  ? "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]"
                  : "bg-[#eff6ff] text-[#1e3a8a] border-[#bfdbfe]";

                return (
                  <div key={ev.id} className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex flex-col gap-2 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-extrabold text-[#1e3a8a]">{ev.tripId}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                        {ev.status}
                      </span>
                    </div>

                    <div className="text-[13px] font-bold text-[#334155] leading-snug">{ev.route}</div>

                    <div className="flex flex-col gap-0.5 text-[11px] text-[#64748b] mt-1">
                      <div>Waktu: <span className="font-semibold text-slate-700">{ev.datetime}</span></div>
                      <div>Pemohon: <span className="font-semibold text-slate-700">{ev.passenger}</span></div>
                    </div>

                    <button
                      onClick={() => onViewDetail(ev.id)}
                      className="mt-2 w-full h-8 bg-white border border-[#e2e8f0] text-slate-700 text-[11.5px] font-bold rounded-lg hover:bg-slate-100 hover:text-[#1e3a8a] transition-colors cursor-pointer"
                    >
                      Buka Detail Tugas
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
