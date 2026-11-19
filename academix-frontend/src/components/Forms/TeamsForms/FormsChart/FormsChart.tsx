import { 
  BarChart, 
  Bar, 
  YAxis, 
  Tooltip, 
  Cell, 
  ResponsiveContainer 
} from 'recharts';
import { useState } from 'react';

type Form = {
  id: number;
  title: string;
  taskName: string;
  scores_average: number | null;
  scores: number[];
};

interface FormsChartProps {
  forms?: Form[];
}

const EXAMPLE_FORMS: Form[] = [
  { id: 1, title: 'מבחן על מונגו', taskName: 'מונגו', scores_average: 98, scores: [98] },
  { id: 2, title: 'סיכום ריאקט', taskName: 'ריאקט', scores_average: 85, scores: [85] },
  { id: 3, title: 'מבחן JavaScript מתקדם', taskName: 'JS', scores_average: 92, scores: [92] },
  { id: 4, title: 'פרויקט TypeScript', taskName: 'TS', scores_average: 88, scores: [88] },
  { id: 5, title: 'מבחן CSS ועיצוב', taskName: 'CSS', scores_average: 76, scores: [76] },
  { id: 6, title: 'סיכום Node.js', taskName: 'Node', scores_average: 91, scores: [91] },
  { id: 7, title: 'מבחן בדיקות יחידה', taskName: 'Testing', scores_average: 79, scores: [79] },
  { id: 8, title: 'פרויקט React', taskName: 'React', scores_average: 95, scores: [95] },
  { id: 9, title: 'מבחן GraphQL', taskName: 'GraphQL', scores_average: 83, scores: [83] },
  { id: 10, title: 'סיכום Docker', taskName: 'Docker', scores_average: 87, scores: [87] },
  { id: 11, title: 'מבחן CI/CD', taskName: 'CI/CD', scores_average: 72, scores: [72] },
  { id: 12, title: 'פרויקט AWS', taskName: 'AWS', scores_average: 68, scores: [68] },
  { id: 13, title: 'סיכום PostgreSQL', taskName: 'PostgreSQL', scores_average: 90, scores: [90] },
  { id: 14, title: 'מבחן REST API', taskName: 'REST', scores_average: 84, scores: [84] },
  { id: 15, title: 'פרויקט מסכם', taskName: 'Final', scores_average: 96, scores: [96] },
  { id: 16, title: 'סיכום Git', taskName: 'Git', scores_average: 89, scores: [89] },
  { id: 17, title: 'מבחן אבטחת מידע', taskName: 'Security', scores_average: 65, scores: [65] },
  { id: 18, title: 'פרויקט Webpack', taskName: 'Webpack', scores_average: 78, scores: [78] },
  { id: 19, title: 'סיכום Redux', taskName: 'Redux', scores_average: 86, scores: [86] },
  { id: 20, title: 'מבחן ביצועים', taskName: 'Performance', scores_average: 81, scores: [81] },
  { id: 21, title: 'פרויקט Next.js', taskName: 'Next.js', scores_average: 94, scores: [94] },
  { id: 22, title: 'סיכום Prisma', taskName: 'Prisma', scores_average: 77, scores: [77] },
];

// 🎨 מעבר צבעים חלק
const getBarGradient = (average: number): string => {
  if (average >= 90) return 'url(#greenGradient)';
  if (average >= 80) return 'url(#blueGradient)';
  if (average >= 70) return 'url(#yellowGradient)';
  return 'url(#redGradient)';
};

// פלטת צבעים מודרנית
const colors = {
  green: { light: '#10b981', dark: '#059669' },
  blue: { light: '#3b82f6', dark: '#2563eb' },
  yellow: { light: '#f59e0b', dark: '#d97706' },
  red: { light: '#ef4444', dark: '#dc2626' },
  bg: '#f8fafc',
  card: '#ffffff',
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    muted: '#94a3b8',
  },
  border: '#e2e8f0',
};

const FormsChart: React.FC<FormsChartProps> = ({ forms }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = forms;

  const chartData = data
    ?.filter((form): form is Form & { scores_average: number } => 
      form.scores_average !== null
    )
    .sort((a, b) => b.scores_average - a.scores_average)
    .map(form => ({
      name: form.taskName,
      fullName: form.title,
      average: form.scores_average,
    })) || [];

  const overallAverage = chartData.length > 0
    ? Math.round(chartData.reduce((sum, f) => sum + f.average, 0) / chartData.length)
    : 0;

  const getBarColor = (average: number) => {
    if (average >= 90) return colors.green.light;
    if (average >= 80) return colors.blue.light;
    if (average >= 70) return colors.yellow.light;
    return colors.red.light;
  };

  const getStatusColor = (average: number) => {
    if (average >= 90) return { bg: '#dcfce7', text: '#166534', label: 'מצוין' };
    if (average >= 80) return { bg: '#dbeafe', text: '#1e40af', label: 'טוב' };
    if (average >= 70) return { bg: '#fef3c7', text: '#92400e', label: 'בינוני' };
    return { bg: '#fee2e2', text: '#991b1b', label: 'דורש שיפור' };
  };

  const statusInfo = getStatusColor(overallAverage);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const color = getBarColor(value);
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '12px',
          fontSize: '13px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          minWidth: '160px',
        }}>
          <p style={{ 
            margin: 0, 
            marginBottom: '8px',
            fontWeight: '500',
            color: '#e2e8f0',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '8px',
          }}>
            {payload[0].payload.fullName}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: color,
            }} />
            <span style={{ color: '#94a3b8' }}>ציון:</span>
            <span style={{ fontWeight: '700', fontSize: '18px', color }}>
              {value}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return <></>;
  }

  return (
    <div style={{
      background: colors.card,
      borderRadius: '16px',
      padding: '20px',
      border: `1px solid ${colors.border}`,
      width: '100%',
      maxWidth: '800px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      
          <div>
            <h3 style={{ 
              margin: 0, 
              fontSize: '14px', 
              fontWeight: '600', 
              color: colors.text.primary,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              פילוח ציונים
            </h3>
          
          </div>
        </div>
        
        {/* Overall Average Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: statusInfo.bg,
          padding: '8px 16px',
          borderRadius: '12px',
        }}>
          <div style={{ textAlign: 'right' }}>
         {/*    <p style={{ 
              margin: 0, 
              fontSize: '10px', 
              color: statusInfo.text,
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              {statusInfo.label}
            </p> */}
            <p style={{ 
              margin: 0, 
              fontSize: '20px', 
              fontWeight: '700', 
              color: statusInfo.text,
              lineHeight: 1.2,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              {overallAverage}%
            </p>
          </div>
          <div style={{
            width: '4px',
            height: '32px',
            borderRadius: '2px',
            background: statusInfo.text,
            opacity: 0.3,
          }} />
        </div>
      </div>

      {/* Chart */}
      <div style={{ 
        width: '100%', 
        height: '180px',
        marginTop: '8px',
      }}>
        <ResponsiveContainer>
          <BarChart 
            data={chartData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            barCategoryGap="20%"
          >
            <defs>
              <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.green.light} />
                <stop offset="100%" stopColor={colors.green.dark} />
              </linearGradient>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.blue.light} />
                <stop offset="100%" stopColor={colors.blue.dark} />
              </linearGradient>
              <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.yellow.light} />
                <stop offset="100%" stopColor={colors.yellow.dark} />
              </linearGradient>
              <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.red.light} />
                <stop offset="100%" stopColor={colors.red.dark} />
              </linearGradient>
            </defs>
            
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 10, fill: colors.text.muted }} 
              axisLine={false}
              tickLine={false}
              tickCount={5}
              width={30}
            />
            
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ 
                fill: 'rgba(148, 163, 184, 0.08)',
                radius: 4,
              }} 
            />
            
            <Bar 
              dataKey="average" 
              radius={[4, 4, 0, 0]} 
              barSize={12}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.average)}
                  style={{
                    filter: hoveredIndex === index ? 'brightness(1.1)' : 'none',
                    transform: hoveredIndex === index ? 'scaleY(1.02)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                    transition: 'all 0.15s ease',
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: `1px solid ${colors.border}`,
      }}>
        {[
          { color: colors.green.light, label: '90+' },
          { color: colors.blue.light, label: '80+' },
          { color: colors.yellow.light, label: '70+' },
          { color: colors.red.light, label: '<70' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: colors.text.secondary,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              background: item.color,
            }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormsChart;