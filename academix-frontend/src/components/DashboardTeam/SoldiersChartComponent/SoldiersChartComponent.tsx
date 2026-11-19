import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Spin, Tooltip } from 'antd';
import { getDuplicatedTasks } from '../../../services/ApiServices';
import styles from './SoldiersChartComponent.module.css';

interface TaskInfo {
  taskName: string;
  count: number;
}

interface TaskData {
  name: string;
  teamName: string;
  tasks: TaskInfo[];
}

interface SoldiersChartComponentProps {
  teamId: number;
  courseBatchId: number;
}

const SoldiersChartComponent: React.FC<SoldiersChartComponentProps> = ({
  teamId,
  courseBatchId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getDuplicatedTasks(teamId, courseBatchId);
        
        if (response && response.success && Array.isArray(response.data)) {
          setData(response.data);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching duplicated tasks:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (teamId && courseBatchId) {
      fetchData();
    }
  }, [teamId, courseBatchId]);

  if (loading) {
    return (
      <Card title="משימות ששובצו מספר פעמים" styles={{ body: { height: '100%', padding: 0 } }}>
        <div className={styles.loading}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card title="משימות ששובצו מספר פעמים" styles={{ body: { height: '100%',width:'33vw', padding: 0 } }}>
        <div className={styles.emptyState}>
          אין משימות משוכפלות
        </div>
      </Card>
    );
  }

  // עיבוד הנתונים
  const soldiersWithDuplicates = data.map((soldier, index) => {
    const totalDuplicates = (soldier.tasks || []).reduce(
      (sum: number, task: TaskInfo) => sum + (task.count || 0), 
      0
    );
    
    return {
      id: index,
      name: soldier.name || 'ללא שם',
      teamName: soldier.teamName || 'ללא צוות',
      tasks: soldier.tasks || [],
      totalDuplicates
    };
  });

  const maxValue = Math.max(...soldiersWithDuplicates.map(s => s.totalDuplicates), 1);

  // יצירת קווי ציר Y
  const yAxisLines = [];
  const step = Math.ceil(maxValue / 5);
  for (let i = 0; i <= maxValue + step; i += Math.max(1, step)) {
    yAxisLines.push(i);
  }

  // פונקציה ליצירת תוכן הטולטיפ
  const createTooltipContent = (soldier: any) => (
    <div style={{ 
      direction: 'rtl', 
      fontFamily: 'Heebo, Arial, sans-serif',
      maxHeight: '300px',
      overflowY: 'auto',
      padding: '0 5px',
    }}>
      <div style={{ fontWeight: 'bold', color: '#fff', fontSize: 15, marginBottom: 4 }}>
         {soldier.name}
      </div>
      <div style={{ color: '#eee', fontSize: 12, marginBottom: 8 }}>
         {soldier.teamName}
      </div>
      <div style={{ 
        fontWeight: 'bold', 
        color: 'black',
        background: '#fff',
        padding: '6px 12px', 
        borderRadius: 6, 
        textAlign: 'center',
        fontSize: 18,
        marginBottom: 10,
      }}>
         {soldier.totalDuplicates}
      </div>
      <div style={{ 
        borderTop: '1px solid rgba(255,255,255,0.3)', 
        paddingTop: 8,
      }}>
        <div style={{ fontSize: 12, color: '#eee', fontWeight: 'bold', marginBottom: 6 }}>
          משימות ({soldier.tasks.length}):
        </div>
        {soldier.tasks.map((task: TaskInfo, idx: number) => (
          <div key={idx} style={{ 
            fontSize: 11, 
            padding: '4px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{ 
              direction: 'rtl', 
              flex: 1, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              marginLeft: 8,
            }}>
              • {task.taskName}
            </span>
            <span style={{ 
              fontWeight: 'bold', 
              color: 'black',
              background: '#fff',
              padding: '2px 8px',
              borderRadius: 8,
              direction: 'ltr',
              fontSize: 10,
            }}>
              ×{task.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const tooltipOverlayStyle = { 
    backgroundColor: '#d4c7ad',
    borderRadius: 12,
    padding: 12,
    maxWidth: 280,
  };

  return (
    <Card 
      title="משימות ששובצו מספר פעמים"
      styles={{ body: { height: '100%', padding: 0, overflow: 'hidden' } }}
      style={{ height: '100%' }}
    >
      <div 
        ref={containerRef}
        className={styles.container}
      >
        <svg 
          viewBox="0 0 1300 500"
          preserveAspectRatio="xMidYMid meet"
          className={styles.chartSvg}
        >

          {/* קווי רשת */}
          {yAxisLines.map((value) => {
            const y = 420 - (value / (maxValue + 1)) * 380;
            return (
              <g key={value}>
                <line
                  x1="50"
                  y1={y}
                  x2="1250"
                  y2={y}
                  stroke="#e8e8e8"
                />
                <text
                  x="40"
                  y={y + 5}
                  textAnchor="middle"
                  fontSize="27"
                  fontWeight="bold"
                  fill="black"
                  fontFamily="Heebo, Arial, sans-serif"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* ציר Y */}
          <line x1="50" y1="40" x2="50" y2="420" stroke="#d9d9d9" strokeWidth="2" />
          
          {/* ציר X */}
          <line x1="50" y1="420" x2="1250" y2="420" stroke="#d9d9d9" strokeWidth="2" />

          {/* נקודות וקווים */}
          {soldiersWithDuplicates.map((soldier, i) => {
            const spacing = soldiersWithDuplicates.length > 1 
              ? 1200 / (soldiersWithDuplicates.length - 1) 
              : 600;
            const x = 50 + i * spacing;
            const y = 420 - (soldier.totalDuplicates / (maxValue + 1)) * 380;
            

            return (
              <g key={soldier.id}>
                {/* קו אנכי */}
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2="420"
                  stroke={'black'}
                  strokeWidth="10"
                  strokeDasharray="4,4"
                  opacity="0.3"
                />
                
                {/* נקודה עם Tooltip */}
                <Tooltip
                  title={createTooltipContent(soldier)}
                  placement="top"
                  overlayInnerStyle={tooltipOverlayStyle}
                  mouseEnterDelay={0.1}
                  mouseLeaveDelay={0.1}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r="20"
                    fill={'silver'}
                    stroke="#fff"
                    strokeWidth="3"
                    filter="url(#glow)"
                    style={{ cursor: 'pointer' }}
                  />
                </Tooltip>

                {/* ערך מעל הנקודה */}
                <text
                  x={x}
                  y={y - 30}
                  textAnchor="middle"
                  fontSize="20"
                  fontWeight="bold"
                  fill={'black'}
                  fontFamily="Heebo, Arial, sans-serif"
                >
                  {soldier.totalDuplicates}
                </text>

                {/* שם מתחת לגרף עם Tooltip */}
                <foreignObject
                  x={x - 60}
                  y="435"
                  width="120"
                  height="50"
                >
                  <div 
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <Tooltip
                      title={createTooltipContent(soldier)}
                      placement="bottom"
                      overlayInnerStyle={tooltipOverlayStyle}
                      mouseEnterDelay={0.1}
                      mouseLeaveDelay={0.1}
                    >
                      <div style={{
                        padding: '8px 12px',
                        background: '#d4c7ad',
                        color: '#fff',
                        borderRadius: 16,
                        fontSize: 22,
                        fontWeight: 600,
                        fontFamily: 'Heebo, Arial, sans-serif',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}>
                        {soldier.name.length > 9 ? soldier.name.substring(0,9)+'...' : soldier.name}
                      </div>
                    </Tooltip>
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {/* קו העקומה */}
          {soldiersWithDuplicates.length > 1 && (
            <path
              d={(() => {
                const pts = soldiersWithDuplicates.map((soldier, i) => {
                  const spacing = 1200 / (soldiersWithDuplicates.length - 1);
                  const x = 50 + i * spacing;
                  const y = 420 - (soldier.totalDuplicates / (maxValue + 1)) * 380;
                  return { x, y };
                });
                
                return pts.reduce((acc, pt, idx) => {
                  if (idx === 0) return `M ${pt.x} ${pt.y}`;
                  const prev = pts[idx - 1];
                  const cpx = (prev.x + pt.x) / 2;
                  return `${acc} C ${cpx} ${prev.y}, ${cpx} ${pt.y}, ${pt.x} ${pt.y}`;
                }, '');
              })()}
              fill="none"
              stroke="rgb(239, 167, 34)"
              strokeWidth="20"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          )}
        </svg>
      </div>
    </Card>
  );
};

export default SoldiersChartComponent;