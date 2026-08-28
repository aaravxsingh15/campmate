"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui";

const ACCENT = "#ff6a1f";
const BLUE = "#4aa3ff";
const GRID = "#262629";
const PIE_COLORS = ["#3fb950", "#ff6a1f", "#f0a92c", "#45454d"];

const axis = { stroke: "#71717a", fontSize: 11 };
const tooltipStyle = {
  contentStyle: {
    background: "#17171a",
    border: "1px solid #33333a",
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: "#a1a1aa" },
};

export function AnalyticsCharts({
  courseData,
  quizTrend,
  topicsByStatus,
}: {
  courseData: { name: string; syllabus: number; accuracy: number }[];
  quizTrend: { name: string; score: number }[];
  topicsByStatus: { name: string; value: number }[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Syllabus vs practice accuracy" hint="by course" />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={courseData} barGap={4}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="name" {...axis} tickLine={false} axisLine={false} />
            <YAxis {...axis} tickLine={false} axisLine={false} domain={[0, 100]} width={28} />
            <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="syllabus" fill={ACCENT} radius={[3, 3, 0, 0]} />
            <Bar dataKey="accuracy" fill={BLUE} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <CardHeader title="Quiz score trend" />
        {quizTrend.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={quizTrend}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="name" {...axis} tickLine={false} axisLine={false} hide />
              <YAxis {...axis} tickLine={false} axisLine={false} domain={[0, 100]} width={28} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="score" stroke={ACCENT} strokeWidth={2} dot={{ r: 3, fill: ACCENT }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-16 text-center text-sm text-muted-2">No quiz attempts yet.</p>
        )}
      </Card>

      <Card>
        <CardHeader title="Topic completion" />
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={topicsByStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
              {topicsByStatus.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-2">
          {topicsByStatus.map((s, i) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              {s.name} ({s.value})
            </span>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Workload by course" hint="open tasks" />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={courseData} layout="vertical">
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" {...axis} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" {...axis} tickLine={false} axisLine={false} width={44} />
            <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="syllabus" fill={ACCENT} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
