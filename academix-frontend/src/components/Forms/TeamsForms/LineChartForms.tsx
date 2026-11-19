import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Photo from "../../../UI/Photo/Photo";

const data = [
  { name: "נקודה 1", average: 40, distribution: 18, score: 20 },
  { name: "נקודה 2", average: 25, distribution: 30, score: 20 },
  { name: "נקודה 3", average: 28, distribution: 20, score: 28 },
  { name: "נקודה 4", average: 15, distribution: 25, score: 35 },
  { name: "נקודה 5", average: 10, distribution: 25, score: 35 },
];

const CustomToolTip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#fff",
          padding: "10px",
          borderRadius: "15px",
          boxShadow: "0 4px 20px rgba(236, 0, 0, 0.1)",
          textAlign: "center",
          minWidth: "120px",
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "18px" }}>
          {payload[0].value}
        </div>
      </div>
    );
  }
};

const LineChartForms = () => {
  return (
    <ResponsiveContainer width={'100%'} style={{marginRight:'1vw'}}>
      <LineChart data={data}>
        {/* <CartesianGrid vertical={false} opacity={0.3}> */}
        {/* <XAxis dataKey="name" /> */}
        <YAxis />
        <Tooltip content={CustomToolTip} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="rgba(252,82,62,1)"
          strokeWidth={4}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="distribution"
          stroke="rgba(109,225,227,1)"
          strokeWidth={4}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="average"
          stroke="rgba(68,199,165,1)"
          strokeWidth={4}
          dot={false}
        />
        {/* </CartesianGrid> */}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineChartForms;
