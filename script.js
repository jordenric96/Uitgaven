const baseUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQIsloLC-G5R3K6b0fJPXkVyDp1efiNXmFkmK3gXjI1a8SOH8bVGOzblVT7JsczpxK4ltZGvYf60iEv/pub?output=csv';
const sheetUrl = `${baseUrl}&cacheignore=${new Date().getTime()}`;

async function fetchData() {
    try {
        const response = await fetch(sheetUrl);
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        const rows = lines.slice(1); 

        let totalIncome = 0;
        let totalExpenses = 0;
        const categoryData = {}; // Hierin worden de subcategorieën opgeslagen

        rows.forEach(row => {
            const cols = row.split(',');
            if (cols.length < 2) return;

            const rawStatus = cols[0].trim().toLowerCase();
            const isIncome = rawStatus.startsWith('i');
            const isExpense = rawStatus.startsWith('u');

            let rawPrice = cols[1].replace(/[^\d,.-]/g, '').replace(',', '.');
            const price = parseFloat(rawPrice);

            // Kolom 4 (Index 3) is je 'type' (bijv. Supermarkt)
            const category = cols[3] ? cols[3].trim() : 'Overig';

            if (!isNaN(price)) {
                if (isIncome) {
                    totalIncome += price;
                } else if (isExpense) {
                    totalExpenses += price;
                    // Voeg bedrag toe aan de specifieke categorie
                    categoryData[category] = (categoryData[category] || 0) + price;
                }
            }
        });

        renderUI(totalIncome, totalExpenses, categoryData);
    } catch (e) {
        console.error("Data error", e);
    }
}

function renderUI(inc, exp, cats) {
    const fmt = (v) => `€${v.toLocaleString('nl-NL', {minimumFractionDigits:2})}`;
    
    document.getElementById('totalIncome').innerText = fmt(inc);
    document.getElementById('totalExpenses').innerText = fmt(exp);
    document.getElementById('totalBalance').innerText = fmt(inc - exp);

    const ctx = document.getElementById('expenseCategoryChart').getContext('2d');
    
    // Verwijder oude chart voor soepele refresh
    if (window.myChart) { window.myChart.destroy(); }

    window.myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(cats),
            datasets: [{
                data: Object.values(cats),
                backgroundColor: ['#39ff14', '#00f2ff', '#ff0055', '#ffaa00', '#cc00ff', '#f39c12', '#1abc9c'],
                borderWidth: 2,
                borderColor: '#111'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'bottom', 
                    labels: { 
                        color: '#fff', 
                        padding: 20, // Ruimte tussen legenda items
                        font: { size: 12, family: 'Orbitron' } 
                    } 
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: €${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            layout: {
                padding: 10
            }
        }
    });
}

fetchData();
