import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

// Register the required Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export const PieChart = (props: { data: any }) => {
  const { data } = props;
  const chartData = {
    labels: data.map((item: any) => item.label),
    datasets: [
      {
        data: data.map((item: any) => item.value),
        backgroundColor: data.map((item: any) => item.color),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage =
              total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return <Pie data={chartData} options={options} />;
};
