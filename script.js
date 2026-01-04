const sheetUrl = 'JOUW_CSV_LINK_HIER'; // PLAK HIER JE LINK DIE EINDIGT OP output=csv

async function fetchData() {
    try {
        const response = await fetch(sheetUrl);
        const data = await response.text();
        const rows = data.split('\n').slice(1); // Skip de koprij

        let totalIncome = 0;
        let totalExpenses = 0;
        const categories = {};

        rows.forEach(row => {
            const cols = row.split(',');
            if (cols.length < 2) return;

            const bedrag = parseFloat(cols[3]); // Stel dat bedrag in kolom 4 staat
            const type = cols[2].trim().toLowerCase(); // 'inkomst' of 'uitgave'
            const categorie = cols[1];

            if (type === 'inkomst') {
                totalIncome += bedrag;
            } else {
                totalExpenses += bedrag;
                categories[categorie] = (categories[categorie] || 0) + bedrag;
            }
        });

        updateUI(totalIncome, totalExpenses, categories);
    } catch (error) {
        console.error("Fout bij laden data:", error);
    }
}

function updateUI(income, expenses, categoryData) {
    document.getElementById('totalIncome').innerText = `€${income.toFixed(2)}`;
    document.getElementById('totalExpenses').innerText = `€${expenses.toFixed(2)}`;
    document.getElementById('totalBalance').innerText = `€${(income - expenses).toFixed(2)}`;

    // Voorbeeld Chart: Uitgaven per categorie
    const ctx = document.getElementById('expenseCategoryChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: ['#ff00e0', '#00f2ff', '#00ff88', '#ffbb00', '#ff4444']
            }]
        },
        options: {
            plugins: {
                legend: { labels: { color: 'white' } }
            }
        }
    });
}

fetchData();
