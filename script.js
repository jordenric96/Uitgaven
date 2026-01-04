const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTMIw93q5JDiBaFYv2f7zOz0vDotAklqC8CMIJsbYbTastQjEc4lUfbxC89Y1oxT7pbUmdjlqG8BgCn/pubhtml'; // Zorg dat deze link eindigt op output=csv

async function fetchData() {
    try {
        const response = await fetch(sheetUrl);
        const data = await response.text();
        // We splitsen de regels en filteren lege regels weg
        const rows = data.split('\n').filter(row => row.trim() !== '').slice(1); 

        let totalIncome = 0;
        let totalExpenses = 0;
        const categoryData = {};

        rows.forEach(row => {
            // We splitsen op komma, maar houden rekening met eventuele aanhalingstekens
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            if (cols.length >= 2) {
                const inUit = cols[0].trim().toLowerCase(); // Kolom A: "In" of "Uit"
                // Kolom B: Bedrag (we vervangen de komma door een punt voor de berekening)
                const bedrag = parseFloat(cols[1].replace('€', '').replace('.', '').replace(',', '.').trim());
                const type = cols[3] ? cols[3].trim() : 'Overig'; // Kolom D: Type

                if (!isNaN(bedrag)) {
                    if (inUit.includes('in')) {
                        totalIncome += bedrag;
                    } else {
                        totalExpenses += bedrag;
                        // Data verzamelen voor de grafiek (Uitgaven per Type)
                        categoryData[type] = (categoryData[type] || 0) + bedrag;
                    }
                }
            }
        });

        updateUI(totalIncome, totalExpenses, categoryData);
    } catch (error) {
        console.error("Fout bij laden data:", error);
        document.querySelector('footer p').innerText = "⚠️ Fout bij laden data. Check de CSV-link.";
    }
}

function updateUI(income, expenses, categoryData) {
    // Update de kaarten bovenaan
    document.getElementById('totalIncome').innerText = `€${income.toLocaleString('nl-NL', {minimumFractionDigits: 2})}`;
    document.getElementById('totalExpenses').innerText = `€${expenses.toLocaleString('nl-NL', {minimumFractionDigits: 2})}`;
    const balance = income - expenses;
    document.getElementById('totalBalance').innerText = `€${balance.toLocaleString('nl-NL', {minimumFractionDigits: 2})}`;

    // Grafiek: Uitgaven per Type
    const ctx = document.getElementById('expenseCategoryChart').getContext('2d');
    
    // Vernietig oude grafiek als die bestaat (voorkomt bugs bij herladen)
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
                    '#7000ff'  // Neon paars
                ],
                borderColor: '#1a1a1a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#ffffff', font: { family: 'Orbitron' } }
                }
            }
        }
    });
}

fetchData();
