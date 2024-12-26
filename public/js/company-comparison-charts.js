function initializeCharts(comparisonData) {
    try {
        const metrics = [
            { key: 'revenue', label: 'Käive' },
            { key: 'taxes', label: 'Maksud' },
            { key: 'laborTaxes', label: 'Tööjõumaksud' },
            { key: 'employees', label: 'Töötajate arv' }
        ];

        metrics.forEach(metric => {
            const chartContainer = document.getElementById(`${metric.key}Chart`);
            if (!chartContainer) {
                console.error(`Container not found for ${metric.key}`);
                return;
            }

            const series = comparisonData.map(company => ({
                name: company.name,
                data: company.financialData
                    .filter(d => d.period !== null)
                    .sort((a, b) => new Date(a.period) - new Date(b.period))
                    .map(d => ({
                        x: d.period,
                        y: d[metric.key] || null
                    }))
            }));

            new ApexCharts(chartContainer, {
                series,
                chart: {
                    type: 'line',
                    height: 350,
                    zoom: {
                        enabled: false
                    }
                },
                title: {
                    text: metric.label,
                    align: 'center'
                },
                xaxis: {
                    type: 'category'
                },
                yaxis: {
                    min: 0,
                    labels: {
                        formatter: (value) => value?.toLocaleString('et-EE')
                    }
                },
                tooltip: {
                    y: {
                        formatter: (value) => value?.toLocaleString('et-EE')
                    }
                }
            }).render();
        });
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}