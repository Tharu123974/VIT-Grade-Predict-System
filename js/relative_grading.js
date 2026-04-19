document.addEventListener('DOMContentLoaded', () => {
    
    // UI Elements
    const rgForm = document.getElementById('rg-form');
    const iterSlider = document.getElementById('rg-iterations');
    const iterVal = document.getElementById('iter-val');
    const rangeContainer = document.getElementById('rg-range-container');
    const addRangeBtn = document.getElementById('add-rg-range');
    const inputSection = document.getElementById('rg-input-section');
    const resultSection = document.getElementById('rg-result-section');
    const backBtn = document.getElementById('rg-back-btn');
    const specificMarksInput = document.getElementById('rg-specific-marks');
    const totalStudentsInput = document.getElementById('rg-total-students');
    const isCoreInput = document.getElementById('rg-is-core');
    const isAbsoluteInput = document.getElementById('rg-is-absolute');

    // Chart instances
    let pieChartInstance = null;
    let barChartInstance = null;
    
    // Dataset for download state
    let lastGeneratedDataset = [];
    let lastGeneratedTxtContent = "";

    // Initialize iteration slider
    if (iterSlider) {
        iterSlider.addEventListener('input', (e) => {
            iterVal.textContent = e.target.value;
        });
    }

    // Range Management
    function createRangeRow() {
        const row = document.createElement('div');
        row.className = 'range-row fade-in';
        row.innerHTML = `
            <div class="form-group" style="margin-bottom:0">
                <label>Students Count</label>
                <input type="number" class="range-count" min="1" required placeholder="e.g. 10">
            </div>
            <div class="form-group" style="margin-bottom:0">
                <label>Lower Limit</label>
                <input type="number" class="range-lower" min="0" max="100" required placeholder="0">
            </div>
            <div class="form-group" style="margin-bottom:0">
                <label>Upper Limit</label>
                <input type="number" class="range-upper" min="0" max="100" required placeholder="100">
            </div>
            <button type="button" class="btn-delete" title="Remove Range">✖</button>
        `;
        row.querySelector('.btn-delete').addEventListener('click', () => row.remove());
        return row;
    }

    if (addRangeBtn && rangeContainer) {
        // Add one by default
        rangeContainer.appendChild(createRangeRow());
        addRangeBtn.addEventListener('click', () => {
            rangeContainer.appendChild(createRangeRow());
        });
    }

    // Math Utils
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Grades Definition
    const GRADE_NAMES = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];

    // Main Submit Logic
    if (rgForm) {
        rgForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            errorState = false;
            
            // 1. Gather specific marks
            const specificStr = specificMarksInput.value.trim();
            const specificMarks = [];
            if (specificStr) {
                const parts = specificStr.split(',');
                for (let p of parts) {
                    const m = parseInt(p.trim());
                    if (isNaN(m) || m < 0 || m > 100) {
                        window.showToast(`Invalid specific mark: ${p.trim()}. Must be 0-100.`);
                        return;
                    }
                    specificMarks.push(m);
                }
            }

            // 2. Gather ranges
            const rangeRows = rangeContainer.querySelectorAll('.range-row');
            let ranges = [];
            let rCountSum = 0;
            
            for (let row of rangeRows) {
                const count = parseInt(row.querySelector('.range-count').value);
                const lower = parseInt(row.querySelector('.range-lower').value);
                const upper = parseInt(row.querySelector('.range-upper').value);

                if (lower < 0 || upper > 100 || lower > upper) {
                    window.showToast("Invalid upper/lower limit. Must be 0-100, lower <= upper.");
                    return;
                }
                
                ranges.push({ count, lower, upper });
                rCountSum += count;
            }

            // 3. Validate student count
            const totalDeclared = parseInt(totalStudentsInput.value);
            const actualSum = rCountSum + specificMarks.length;
            
            if (totalDeclared !== actualSum) {
                window.showToast(`Total students (${totalDeclared}) does not match sum of ranges and specific marks (${actualSum}).`);
                return;
            }

            const isCore = isCoreInput.checked;
            const forceAbsolute = isAbsoluteInput.checked;
            const iterations = parseInt(iterSlider.value);
            const useAbsolute = forceAbsolute || totalDeclared <= 10;

            // Generate & Calculate Results for each iteration
            let allIterationResults = [];

            for (let i = 0; i < iterations; i++) {
                // Generate dataset
                let dataset = [...specificMarks];
                for (let r of ranges) {
                    for (let j = 0; j < r.count; j++) {
                        dataset.push(randomInt(r.lower, r.upper));
                    }
                }
                
                dataset.sort((a, b) => b - a); // Descending

                let bounds = {};
                
                if (useAbsolute) {
                    // Absolute Grading Boundaries
                    bounds = {
                        S: 90, A: 80, B: 70, C: 60, D: 55, E: 50, F: 0
                    };
                } else {
                    // Relative Grading Stats
                    const sum = dataset.reduce((a, b) => a + b, 0);
                    const mean = sum / totalDeclared;
                    
                    const squareDiffs = dataset.map(value => Math.pow(value - mean, 2));
                    const variance = squareDiffs.reduce((a, b) => a + b, 0) / totalDeclared;
                    const sd = Math.sqrt(variance);

                    // Top 5% or 3 condition
                    const topCount = Math.max(3, Math.ceil(totalDeclared * 0.05));
                    // get the border mark for the top group
                    const topMarkBoundary = dataset[Math.min(topCount - 1, totalDeclared - 1)];

                    let sBound = 0;
                    if (isCore) {
                        sBound = Math.max(80, topMarkBoundary);
                    } else {
                        sBound = Math.max(80, Math.min(topMarkBoundary, mean + 1.5 * sd));
                    }

                    bounds = {
                        S: sBound,
                        A: mean + 0.5 * sd,
                        B: mean - 0.5 * sd,
                        C: mean - sd,
                        D: mean - 1.5 * sd,
                        E: Math.min(50, mean - 2 * sd),
                        F: 0
                    };
                }
                
                allIterationResults.push({
                    dataset,
                    bounds
                });
            }

            processFinalResults(allIterationResults, useAbsolute);
            
            // Switch view
            inputSection.classList.add('hidden');
            resultSection.classList.remove('hidden');
            resultSection.classList.add('fade-in');
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            resultSection.classList.add('hidden');
            inputSection.classList.remove('hidden');
        });
    }

    // Setup Export
    document.getElementById('export-csv-btn')?.addEventListener('click', () => {
        if (!lastGeneratedDataset || lastGeneratedDataset.length === 0) return;
        
        let csvContent = "data:text/csv;charset=utf-8,Student Number,Mark\n";
        lastGeneratedDataset.forEach((mark, index) => {
            csvContent += `${index + 1},${mark}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `dataset_${document.getElementById('rg-course-code').value || 'export'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    document.getElementById('export-txt-btn')?.addEventListener('click', () => {
        if (!lastGeneratedTxtContent) return;
        
        const blob = new Blob([lastGeneratedTxtContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `statistics_${document.getElementById('rg-course-code').value || 'export'}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    function processFinalResults(iterResults, useAbsolute) {
        // Average Boundaries
        const finalBoundsRaw = { S:0, A:0, B:0, C:0, D:0, E:0, F:0 };
        const numIters = iterResults.length;

        // For tracking probability distributions
        const boundsDist = { S:{}, A:{}, B:{}, C:{}, D:{}, E:{} };

        iterResults.forEach(res => {
            for (let g of GRADE_NAMES) {
                finalBoundsRaw[g] += res.bounds[g];
                
                if (g !== 'F') { // F is always < E boundary essentially
                    const roundedMark = Math.round(res.bounds[g]);
                    boundsDist[g][roundedMark] = (boundsDist[g][roundedMark] || 0) + 1;
                }
            }
        });

        const finalBoundsRounded = {};
        for (let g of GRADE_NAMES) {
            finalBoundsRounded[g] = Math.round(finalBoundsRaw[g] / numIters);
        }
        
        // Take the LAST dataset to display and classify
        const displayDataset = iterResults[numIters - 1].dataset;
        lastGeneratedDataset = displayDataset;
        
        // Calculate Mean/SD of the displayed dataset for info
        const total = displayDataset.length;
        const sum = displayDataset.reduce((a, b) => a + b, 0);
        const mean = sum / total;
        const variance = displayDataset.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / total;
        const sd = Math.sqrt(variance);

        // Classify marks using averaged boundaries
        const counts = { S:0, A:0, B:0, C:0, D:0, E:0, F:0 };
        
        displayDataset.forEach(mark => {
            if (mark >= finalBoundsRounded.S) counts.S++;
            else if (mark >= finalBoundsRounded.A) counts.A++;
            else if (mark >= finalBoundsRounded.B) counts.B++;
            else if (mark >= finalBoundsRounded.C) counts.C++;
            else if (mark >= finalBoundsRounded.D) counts.D++;
            else if (mark >= finalBoundsRounded.E) counts.E++;
            else counts.F++;
        });

        // Update Summary UI
        document.getElementById('rg-summary-info').innerHTML = `
            <h3>Course: ${document.getElementById('rg-course-code').value.toUpperCase()} - ${document.getElementById('rg-course-title').value}</h3>
            <p><strong>Total Students:</strong> ${total}</p>
            ${!useAbsolute ? `<p><strong>Mean:</strong> ${mean.toFixed(2)} | <strong>Standard Deviation:</strong> ${sd.toFixed(2)}</p>` : `<p><strong>Applied Rule:</strong> Absolute Grading System</p>`}
            ${iterResults.length > 1 ? `<p><strong>Iterations Run:</strong> ${iterResults.length} (Displaying averaging results)</p>` : ''}
        `;

        // Update Dataset Display
        document.getElementById('rg-dataset-display').textContent = displayDataset.join(', ');

        // Update Table
        const tbody = document.getElementById('rg-distribution-tbody');
        tbody.innerHTML = '';
        GRADE_NAMES.forEach(g => {
            let ruleDesc = '';
            let rangeDisplay = '';
            
            if (g === 'S') rangeDisplay = `>= ${finalBoundsRounded['S']}`;
            else if (g === 'A') rangeDisplay = `>= ${finalBoundsRounded['A']} and < ${finalBoundsRounded['S']}`;
            else if (g === 'B') rangeDisplay = `>= ${finalBoundsRounded['B']} and < ${finalBoundsRounded['A']}`;
            else if (g === 'C') rangeDisplay = `>= ${finalBoundsRounded['C']} and < ${finalBoundsRounded['B']}`;
            else if (g === 'D') rangeDisplay = `>= ${finalBoundsRounded['D']} and < ${finalBoundsRounded['C']}`;
            else if (g === 'E') rangeDisplay = `>= ${finalBoundsRounded['E']} and < ${finalBoundsRounded['D']}`;
            else if (g === 'F') rangeDisplay = `< ${finalBoundsRounded['E']}`;

            if (useAbsolute) {
                ruleDesc = 'Absolute Scale';
            } else {
                if (g==='S') ruleDesc = isCoreInput.checked ? 'max(80, top 3/5%)' : 'max(80, min(top 3/5%, Mean+1.5SD))';
                else if (g==='A') ruleDesc = 'Mean + 0.5 SD';
                else if (g==='B') ruleDesc = 'Mean - 0.5 SD';
                else if (g==='C') ruleDesc = 'Mean - SD';
                else if (g==='D') ruleDesc = 'Mean - 1.5 SD';
                else if (g==='E') ruleDesc = 'min(50, Mean - 2 SD)';
                else if (g==='F') ruleDesc = '< E Boundary';
            }

            const percentage = ((counts[g] / total) * 100).toFixed(1) + '%';

            tbody.innerHTML += `
                <tr>
                    <td><strong>${g}</strong></td>
                    <td>${rangeDisplay}</td>
                    <td>${counts[g]}</td>
                    <td>${percentage}</td>
                    <td><small>${ruleDesc}</small></td>
                </tr>
            `;
        });
        
        // Build TXT Content
        let txtParams = [];
        txtParams.push(`Course: ${document.getElementById('rg-course-code').value.toUpperCase()} - ${document.getElementById('rg-course-title').value}`);
        txtParams.push(`Total Students: ${total}`);
        if (!useAbsolute) {
            txtParams.push(`Mean: ${mean.toFixed(2)}`);
            txtParams.push(`Standard Deviation: ${sd.toFixed(2)}`);
        } else {
            txtParams.push(`Applied Rule: Absolute Grading System`);
        }
        
        txtParams.push(`\n--- Grade Boundaries ---`);
        GRADE_NAMES.forEach(g => {
            let rangeDisplay = '';
            if (g === 'S') rangeDisplay = `>= ${finalBoundsRounded['S']}`;
            else if (g === 'A') rangeDisplay = `>= ${finalBoundsRounded['A']} and < ${finalBoundsRounded['S']}`;
            else if (g === 'B') rangeDisplay = `>= ${finalBoundsRounded['B']} and < ${finalBoundsRounded['A']}`;
            else if (g === 'C') rangeDisplay = `>= ${finalBoundsRounded['C']} and < ${finalBoundsRounded['B']}`;
            else if (g === 'D') rangeDisplay = `>= ${finalBoundsRounded['D']} and < ${finalBoundsRounded['C']}`;
            else if (g === 'E') rangeDisplay = `>= ${finalBoundsRounded['E']} and < ${finalBoundsRounded['D']}`;
            else if (g === 'F') rangeDisplay = `< ${finalBoundsRounded['E']}`;
            
            txtParams.push(`${g}: ${rangeDisplay} (Count: ${counts[g]})`);
        });

        if (iterResults.length > 1 && !useAbsolute) {
            txtParams.push(`\n--- Iterations Breakdown (${iterResults.length} iterations) ---`);
            ['S', 'A', 'B', 'C', 'D', 'E'].forEach(g => {
                const gradesMap = boundsDist[g];
                const sortedMarks = Object.keys(gradesMap).map(Number).sort((a,b)=>b-a);
                txtParams.push(`Grade ${g} Probability Dist:`);
                sortedMarks.forEach(mark => {
                    const count = gradesMap[mark];
                    const perc = Math.round((count / iterResults.length) * 100);
                    txtParams.push(`  - Boundary at ${mark}: ${perc}% chance`);
                });
                txtParams.push('');
            });
        }

        txtParams.push(`\n--- Dataset ---`);
        txtParams.push(displayDataset.join(', '));
        
        lastGeneratedTxtContent = txtParams.join("\n");

        // Render Probabilities
        renderProbabilities(boundsDist, numIters, useAbsolute);

        // Render Charts
        renderCharts(counts);
    }

    function renderProbabilities(dist, totalIters, useAbsolute) {
        const container = document.getElementById('rg-probabilities-container');
        container.innerHTML = '';

        if (totalIters === 1 || useAbsolute) {
            container.innerHTML = `<p class="text-muted">Iterative probabilities not applicable (Only 1 iteration or Absolute Grading).</p>`;
            return;
        }

        ['S', 'A', 'B', 'C', 'D', 'E'].forEach(g => {
            const gradesMap = dist[g];
            const sortedMarks = Object.keys(gradesMap).map(Number).sort((a,b)=>b-a);
            
            let html = `<div class="prob-item">
                <div class="prob-title">${g} Grade Boundaries Distribution</div>`;
            
            let addedAnything = false;
            sortedMarks.forEach(mark => {
                const count = gradesMap[mark];
                const perc = Math.round((count / totalIters) * 100);
                if (perc > 0) {
                    addedAnything = true;
                    html += `
                        <div class="prob-stat">
                            <span>Boundary at <strong>${mark}</strong></span>
                            <span>${perc}% chance</span>
                        </div>
                    `;
                }
            });
            
            html += `</div>`;
            if (addedAnything) container.innerHTML += html;
        });
    }

    function renderCharts(counts) {
        const labels = Object.keys(counts);
        const data = Object.values(counts);
        
        // Colors from our vibrant CSS theme
        const colors = [
            '#667eea', // S primary
            '#ed64a6', // A secondary
            '#4fd1c5', // B accent
            '#f6ad55', // C orange
            '#68d391', // D green
            '#fc8181', // E red
            '#a0aec0'  // F gray
        ];

        const ctxPie = document.getElementById('pieChart').getContext('2d');
        const ctxBar = document.getElementById('barChart').getContext('2d');

        if (pieChartInstance) pieChartInstance.destroy();
        if (barChartInstance) barChartInstance.destroy();

        if (typeof Chart === 'undefined') {
            console.error("Chart.js not loaded.");
            return;
        }

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim()
                    }
                }
            }
        };

        pieChartInstance = new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--glass-border').trim()
                }]
            },
            options: {
                ...commonOptions,
                plugins: {
                    title: { display: true, text: 'Grade Distribution (Pie)', color: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() },
                    legend: { position: 'right', labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() } }
                }
            }
        });

        barChartInstance = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Students',
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--glass-border').trim()
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: { 
                        beginAtZero: true, 
                        ticks: { stepSize: 1, color: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() },
                        grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--table-header').trim() }
                    },
                    x: {
                        ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() },
                        grid: { display: false }
                    }
                },
                plugins: {
                    title: { display: true, text: 'Grade Distribution (Bar)', color: getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() },
                    legend: { display: false }
                }
            }
        });
    }

    // Re-render chart texts if theme changes
    window.addEventListener('themeChanged', () => {
        if(pieChartInstance && barChartInstance) {
            const currentCounts = pieChartInstance.data.datasets[0].data;
            const keysCounts = pieChartInstance.data.labels;
            const obj = {};
            keysCounts.forEach((k,i) => obj[k] = currentCounts[i]);
            renderCharts(obj);
        }
    });

});
