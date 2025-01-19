document.addEventListener('DOMContentLoaded', function() {
    const metricSelector = document.getElementById('metricSelector');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    let chart = null;

    async function fetchChartData() {
        try {
            const metric = metricSelector.value;
            const startYear = startDateInput.value;
            const endYear = endDateInput.value;

            const response = await fetch(`/analytics/chart-data?metric=${metric}&startYear=${startYear}&endYear=${endYear}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            return data;
        } catch (error) {
            console.error('Error fetching chart data:', error);
            throw error;
        }
    }

    function initializeChart(chartData, metric) {
        const metrics = chartData.metrics.find(m => m.id === metric);

        const options = {
            series: chartData.data.series,
            chart: {
                type: 'line',
                height: 400,
                zoom: {
                    enabled: true
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            title: {
                text: metrics.name,
                align: 'left'
            },
            grid: {
                row: {
                    colors: ['#f3f3f3', 'transparent'],
                    opacity: 0.5
                },
            },
            xaxis: {
                categories: chartData.data.periods,
                title: {
                    text: 'Periood'
                }
            },
            yaxis: {
                title: {
                    text: metrics.unit
                }
            },
            tooltip: {
                y: {
                    formatter: function(value) {
                        return metrics.unit === '€'
                            ? value.toLocaleString('et-EE') + ' €'
                            : value.toFixed(2) + metrics.unit;
                    }
                }
            }
        };

        if (chart) {
            chart.destroy();
        }

        chart = new ApexCharts(document.querySelector("#ratiosChart"), options);
        chart.render();
    }

    async function updateChart() {
        try {
            const data = await fetchChartData();

            // Update metric selector if needed
            if (!metricSelector.options.length) {
                data.metrics.forEach(metric => {
                    const option = new Option(metric.name, metric.id);
                    metricSelector.add(option);
                });
            }

            initializeChart(data, metricSelector.value);
        } catch (error) {
            alert(`Viga graafikute kuvamisel: ${error.message}`);
        }
    }

    // Event listeners
    metricSelector.addEventListener('change', updateChart);
    document.getElementById('applyDateFilter').addEventListener('click', updateChart);

    // Initial load
    updateChart();
});