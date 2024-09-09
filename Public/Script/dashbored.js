document.addEventListener('DOMContentLoaded', function () {
    const ramCtx = document.getElementById('ramUsageChart').getContext('2d');
    const networkCtx = document.getElementById('networkUsageChart').getContext('2d');
    const diskCtx = document.getElementById('diskUsageChart').getContext('2d');
    let currentChart;

    // Initialize charts with empty data
    const ramChart = createChart(ramCtx, 'RAM Usage (%)', 'rgb(99, 179, 237)', 'rgba(99, 179, 237, 0.2)');
    const networkChart = createChart(networkCtx, 'Network Speed (Mbps)', 'rgb(255, 206, 86)', 'rgba(255, 206, 86, 0.2)');
    const diskChart = createChart(diskCtx, 'Disk Usage (%)', 'rgb(75, 192, 192)', 'rgba(75, 192, 192, 0.2)');

    // Function to create a new Chart instance
    function createChart(ctx, label, borderColor, backgroundColor) {
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                        label: label,
                        data: [],
                        borderColor: borderColor,
                        backgroundColor: backgroundColor,
                        tension: 0.1,
                        fill: true
                    },
                    {
                        label: `${label} Speed`,
                        data: [],
                        borderColor: borderColor, // Adjust speedBorderColor and speedBackgroundColor as per your requirements
                        backgroundColor: backgroundColor,
                        tension: 0.1,
                        fill: false
                    }
                ]
            },
            options: getChartOptions(label)
        });
    }

    // Function to update chart data
    function updateChart(chart, label, data, speedData) {
        chart.data.labels.push(label);
        chart.data.datasets[0].data.push(data);

        // Maintain only the latest maxDataPoints data points
        const maxDataPoints = 10;
        if (chart.data.labels.length > maxDataPoints) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }

        if (speedData) {
            chart.data.datasets[1].data.push(speedData);

            // Maintain only the latest maxDataPoints data points for speedData
            if (chart.data.datasets[1].data.length > maxDataPoints) {
                chart.data.datasets[1].data.shift();
            }
        }

        chart.update(); // Update the chart
    }

    updateCharts(); // Fetch initial data on page load
    
    // Function to fetch and update real data from server
    async function updateCharts() {
        try {
            const response = await fetch('/api/getUsageData'); // Replace with your actual API endpoint
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            const timestamp = new Date().toLocaleTimeString();
            updateChart(ramChart, timestamp, data.ramUsage);
            // Adjust network speed calculation as per your actual implementation
            const networkSpeed = calculateNetworkSpeed(data); // Example function to calculate speed
            updateChart(networkChart, timestamp, networkSpeed);
            updateChart(diskChart, timestamp, data.diskUsage);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    // Example function to calculate network speed, adjust as per your actual implementation
    function calculateNetworkSpeed(data) {
        // Example calculation based on received data
        return data.downloadSpeed + data.uploadSpeed;
    }

    // Event listeners for navigation buttons
    document.getElementById('ramUsageBtn').addEventListener('click', function () {
        currentChart = ramChart;
        toggleChartVisibility('ramUsageChart');
        updateCharts();
    });

    document.getElementById('networkUsageBtn').addEventListener('click', function () {
        currentChart = networkChart;
        toggleChartVisibility('networkUsageChart');
        updateCharts();
    });

    document.getElementById('diskUsageBtn').addEventListener('click', function () {
        currentChart = diskChart;
        toggleChartVisibility('diskUsageChart');
        updateCharts();
    });

    // Function to toggle chart visibility
    function toggleChartVisibility(chartId) {
        const charts = ['ramUsageChart', 'networkUsageChart', 'diskUsageChart'];
        charts.forEach(id => {
            const display = id === chartId ? 'block' : 'none';
            document.getElementById(id).style.display = display;
        });
    }

    // Default chart shown on page load
    currentChart = ramChart;

    // Automatically update charts every 10 seconds
    setInterval(updateCharts, 30000); // Adjust the interval as needed
});

// Function to get common chart options
function getChartOptions(title) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: title,
                font: {
                    weight: 'bold'
                },
                color: 'white'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)'
                }
            },
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)'
                }
            }
        }
    };
}

