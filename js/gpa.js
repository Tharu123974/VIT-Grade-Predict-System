document.addEventListener('DOMContentLoaded', () => {

    const tbody = document.getElementById('gpa-tbody');
    const addRowBtn = document.getElementById('add-gpa-row');
    const calcBtn = document.getElementById('calc-gpa-btn');
    const gpaResultBox = document.getElementById('gpa-result');
    const gpaOutput = document.getElementById('gpa-output');
    const gpaCreditsOutput = document.getElementById('gpa-total-credits');

    const gradePointsMap = {
        'S': 10,
        'A': 9,
        'B': 8,
        'C': 7,
        'D': 6,
        'E': 5,
        'F': 0
    };

    const validCredits = [1, 1.5, 2, 3, 4, 5, 10, 12, 15, 20];

    function createRow() {
        const tr = document.createElement('tr');
        
        let selectGradeHTML = `<select class="grade-input">
            <option value="" disabled selected>Select Grade</option>`;
        for(let g in gradePointsMap) {
            selectGradeHTML += `<option value="${g}">${g}</option>`;
        }
        selectGradeHTML += `</select>`;

        let selectCreditHTML = `<select class="credit-input">
            <option value="" disabled selected>Credits</option>`;
        validCredits.forEach(c => {
            selectCreditHTML += `<option value="${c}">${c}</option>`;
        });
        selectCreditHTML += `</select>`;

        tr.innerHTML = `
            <td><input type="text" placeholder="Course Name" class="course-name-input"></td>
            <td>${selectGradeHTML}</td>
            <td>${selectCreditHTML}</td>
            <td><button class="btn-delete" title="Remove row">✖</button></td>
        `;

        // Delete Row logic
        tr.querySelector('.btn-delete').addEventListener('click', () => {
            tr.remove();
        });

        return tr;
    }

    if (addRowBtn && tbody) {
        // Add default 5 rows
        for(let i=0; i<5; i++) {
            tbody.appendChild(createRow());
        }

        addRowBtn.addEventListener('click', () => {
            tbody.appendChild(createRow());
        });
    }

    if (calcBtn) {
        calcBtn.addEventListener('click', () => {
            let totalCredits = 0;
            let totalPoints = 0;
            let rowsCounted = 0;
            
            const rows = tbody.querySelectorAll('tr');

            rows.forEach(row => {
                const gradeSelect = row.querySelector('.grade-input');
                const creditSelect = row.querySelector('.credit-input');
                
                if (gradeSelect.value && creditSelect.value) {
                    const grade = gradeSelect.value;
                    const credit = parseFloat(creditSelect.value);
                    
                    const points = gradePointsMap[grade];
                    
                    totalPoints += points * credit;
                    totalCredits += credit;
                    rowsCounted++;
                }
            });

            if (rowsCounted === 0) {
                window.showToast("Please select Grades and Credits for at least one course.");
                return;
            }

            const gpa = totalPoints / totalCredits;

            gpaOutput.textContent = gpa.toFixed(2);
            gpaCreditsOutput.textContent = totalCredits;
            gpaResultBox.classList.remove('hidden');
        });
    }
});
