const baseUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQIsloLC-G5R3K6b0fJPXkVyDp1efiNXmFkmK3gXjI1a8SOH8bVGOzblVT7JsczpxK4ltZGvYf60iEv/pub?output=csv';
// Voeg een tijdstempel toe zodat Google niet een oude versie uit het geheugen serveert
const sheetUrl = `${baseUrl}&cacheignore=${new Date().getTime()}`;

async function fetchData() {
    try {
        console.log("Data ophalen...");
        const response = await fetch(sheetUrl);
        const data = await response.text();
        
        // Split op nieuwe regels en verwijder de lege regels
        const rows = data.split('\n').map(row => row.trim()).filter(row => row !== '');
        const dataRows = rows.slice(1); // Verwijder de koprij (In/uit, bedrag, etc.)

        let totalIncome = 0;
        let totalExpenses = 0;
        const categoryData = {};

        dataRows.forEach((row, index) => {
            // Split op komma's
            const cols = row.split(',');
            
            if (cols.length >= 2) {
                // Kolom A: In/uit
                const inUit = cols[0].toLowerCase().trim();
                
                // Kolom B: Bedrag (Schoonmaken: spaties, € tekens en punten weg, dan komma naar punt)
                let bedragSchoon = cols[1].replace(/[€\s]/g, '').replace('.', '').replace(',', '.').trim();
                const bedrag = parseFloat(bedragSchoon);
                
                // Kolom D: Type
                const type = cols[3] ? cols[3].trim() : 'Overig';

                if (!isNaN(bedrag)) {
                    if (inUit === 'in') {
                        totalIncome += bedrag;
                    } else if (inUit === 'uit') {
                        totalExpenses += bedrag;
                        categoryData[type] = (categoryData[type] || 0) + bedrag;
                    }
                }
            }
        });

        console.log("Resultaten:", {totalIncome, totalExpenses, categoryData});
        updateUI(totalIncome, totalExpenses, categoryData);
    } catch (error) {
        console.error("Fout:", error);
        document.getElementById('totalBalance').innerText = "Fout!";
    }
}

function updateUI(income, expenses, categoryData) {
    const formatEuro = (num) => `€ ${num.toLocaleString('nl-NL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    document.getElementById('totalIncome').innerText = formatEuro(income);
    document.getElementById('totalExpenses').innerText = formatEuro(expenses);
    document.getElementById('totalBalance').innerText = formatEuro(income - expenses);

    const ctx = document.getElementById('expenseCategoryChart').getContext('2d');
    if (window.myChart) { window.myChart.destroy(); }

    window.myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: ['#ff00e0', '#00f2ff', '#00ff88', '#ffbb00', '#7000ff', '#ff4444'],
                borderColor: '#1a1a1a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#ffffff', font: { family: 'Orbitron', size: 10 } } }
            }
        }
    });
}

fetchData();
