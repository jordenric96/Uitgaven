const baseUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQIsloLC-G5R3K6b0fJPXkVyDp1efiNXmFkmK3gXjI1a8SOH8bVGOzblVT7JsczpxK4ltZGvYf60iEv/pub?output=csv';
const sheetUrl = `${baseUrl}&cacheignore=${new Date().getTime()}`;

async function fetchData() {
    try {
        const response = await fetch(sheetUrl);
        const csvText = await response.text();
        
        // Split rijen en verwijder lege regels en koprij
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        const rows = lines.slice(1); 

        let totalIncome = 0;
        let totalExpenses = 0;
        const categoryData = {};

        rows.forEach(row => {
            const cols = row.split(',');
            if (cols.length < 2) return;

            // STATUS CHECK: We kijken naar de EERSTE LETTER van de eerste kolom
            const rawStatus = cols[0].trim().toLowerCase();
            const isIncome = rawStatus.startsWith('i'); // 'in' wordt herkend
            const isExpense = rawStatus.startsWith('u'); // 'uit' wordt herkend

            // BEDRAG FIX: Haal alle troep weg, verander komma in punt
            let rawPrice = cols[1].replace(/[^\d,.-]/g, '').replace(',', '.');
            const price = parseFloat(rawPrice);

            const category = cols[3] ? cols[3].trim() : 'Overig';

            if (!isNaN(price)) {
                if (isIncome) {
                    totalIncome += price;
                } else if (isExpense) {
                    totalExpenses += price;
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
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(cats),
            datasets: [{
                data: Object.values(cats),
                backgroundColor: ['#39ff14', '#00f2ff', '#ff0055', '#ffaa00', '#cc00ff'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#fff', font: { size: 10 } } }
            }
        }
    });
}

fetchData();
