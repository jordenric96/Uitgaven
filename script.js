const baseUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQIsloLC-G5R3K6b0fJPXkVyDp1efiNXmFkmK3gXjI1a8SOH8bVGOzblVT7JsczpxK4ltZGvYf60iEv/pub?output=csv';
const sheetUrl = `${baseUrl}&cacheignore=${new Date().getTime()}`;

async function fetchData() {
    try {
        const response = await fetch(sheetUrl);
        const data = await response.text();
        
        // Split op regels en negeer de koprij
        const rows = data.split('\n').map(row => row.trim()).filter(row => row !== '');
        const dataRows = rows.slice(1); 

        let totalIncome = 0;
        let totalExpenses = 0;
        const categoryData = {};

        dataRows.forEach((row) => {
            // Split op de komma
            const cols = row.split(',');
            
            if (cols.length >= 2) {
                // Kolom 1 (A): In/uit - We checken op 'in'
                const status = cols[0].toLowerCase().trim();
                
                // Kolom 2 (B): Bedrag - we halen alles weg wat geen cijfer of komma is
                let bedragRaw = cols[1].replace(/[^\d,.-]/g, '').replace(',', '.').trim();
                const bedrag = parseFloat(bedragRaw);
                
                // Kolom 4 (D): Type/Categorie
                const type = cols[3] ? cols[3].trim() : 'Overig';

                if (!isNaN(bedrag)) {
                    // Flexibele check: kijkt of 'in' voorkomt in de eerste kolom
                    if (status.includes('in')) {
                        totalIncome += bedrag;
                    } else if (status !== "") {
                        // Alles wat niet 'in' is, zien we als uitgave
                        totalExpenses += bedrag;
                        categoryData[type] = (categoryData[type] || 0) + bedrag;
                    }
                }
            }
        });

        updateUI(totalIncome, totalExpenses, categoryData);
    } catch (error) {
        console.error("Fout bij ophalen data:", error);
    }
}

function updateUI(income, expenses, categoryData) {
    const formatEuro = (num) => `€ ${num.toLocaleString('nl-NL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    // Update de teksten in je HTML
    document.getElementById('totalIncome').innerText = formatEuro(income);
    document.getElementById('totalExpenses').innerText = formatEuro(expenses);
    document.getElementById('totalBalance').innerText = formatEuro(income - expenses);

    // Grafiek instellingen
    const ctx = document.getElementById('expenseCategoryChart').getContext('2d');
    if (window.myChart) { window.myChart.destroy(); }

    window.myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: [
                    '#ff00e0', // Neon roze
                    '#00f2ff', // Neon blauw
                    '#00ff88', // Neon groen
                    '#ffbb00', // Neon geel
                    '#7000ff', // Neon paars
                    '#ff4444'  // Neon rood
                ],
                borderWidth: 2,
                borderColor: '#1a1a1a'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'bottom', 
                    labels: { 
                        color: '#ffffff',
                        font: { family: 'Orbitron', size: 10 }
                    } 
                }
            }
        }
    });
}

// Start de functie
fetchData();
