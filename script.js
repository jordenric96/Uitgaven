const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTMIw93q5JDiBaFYv2f7zOz0vDotAklqC8CMIJsbYbTastQjEc4lUfbxC89Y1oxT7pbUmdjlqG8BgCn/pub?output=csv';

async function fetchData() {
    try {
        const response = await fetch(sheetUrl);
        const data = await response.text();
        
        // Split de rijen en filter lege rijen eruit
        const rows = data.split('\n').filter(row => row.trim() !== '').slice(1); 

        let totalIncome = 0;
        let totalExpenses = 0;
        const categoryData = {};

        rows.forEach(row => {
            // Split op komma, rekening houdend met tekst tussen aanhalingstekens
            const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            if (cols.length >= 2) {
                const inUit = cols[0].trim().toLowerCase(); // Kolom A: In/uit
                
                // Haal bedrag op uit Kolom B en maak er een getal van
                let bedragRaw = cols[1].replace(/[€\s.]/g, '').replace(',', '.').trim();
                const bedrag = parseFloat(bedragRaw);
                
                const type = cols[3] ? cols[3].trim() : 'Overig'; // Kolom D: type

                if (!isNaN(bedrag)) {
                    if (inUit === 'in') {
                        totalIncome += bedrag;
                    } else if (inUit === 'uit') {
                        totalExpenses += bedrag;
                        // Groepeer uitgaven per type voor de grafiek
                        categoryData[type] = (categoryData[type] || 0) + bedrag;
                    }
                }
            }
        });

        updateUI(totalIncome, totalExpenses, categoryData);
    } catch (error) {
        console.error("Fout bij laden data:", error);
        document.querySelector('footer p').innerText = "⚠️ Fout bij het ophalen van de Google Sheet data.";
    }
}

function updateUI(income, expenses, categoryData) {
    // Update de grote getallen bovenin
    document.getElementById('totalIncome').innerText = `€ ${income.toLocaleString('nl-NL', {minimumFractionDigits: 2})}`;
    document.getElementById('totalExpenses').innerText = `€ ${expenses.toLocaleString('nl-NL', {minimumFractionDigits: 2})}`;
    const balance = income - expenses;
    document.getElementById('totalBalance').innerText = `€ ${balance.toLocaleString('nl-NL', {minimumFractionDigits: 2})}`;

    // Maak de grafiek voor uitgaven
    const ctx = document.getElementById('expenseCategoryChart').getContext('2d');
    
    if (window.myChart) { window.myChart.destroy(); }

    window.myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: [
                    '#ff00e0', '#00f2ff', '#00ff88', '#ffbb00', '#7000ff', '#ff4444'
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
                    labels: { color: '#ffffff', font: { family: 'Orbitron', size: 10 } }
                }
            }
        }
    });
}

// Start het ophalen van de data
fetchData();
