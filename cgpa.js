document.addEventListener('DOMContentLoaded', () => {

    const cgpaForm = document.getElementById('cgpa-form');
    const cgpaResultBox = document.getElementById('cgpa-result');
    const cgpaOutput = document.getElementById('cgpa-output');

    if (cgpaForm) {
        cgpaForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const currentCgpa = parseFloat(document.getElementById('current-cgpa').value);
            const creditsCompleted = parseFloat(document.getElementById('credits-completed').value);
            const currentGpa = parseFloat(document.getElementById('current-gpa').value);
            const semesterCredits = parseFloat(document.getElementById('semester-credits').value);

            if (isNaN(currentCgpa) || isNaN(creditsCompleted) || isNaN(currentGpa) || isNaN(semesterCredits)) {
                window.showToast("Please enter valid numbers in all fields.");
                return;
            }

            if (creditsCompleted % 0.5 !== 0 || semesterCredits % 0.5 !== 0) {
                window.showToast("Credits must be in multiples of 0.5 (e.g., 19, 19.5, 20).");
                return;
            }

            if (currentCgpa > 10 || currentGpa > 10) {
                window.showToast("CGPA and GPA cannot exceed 10.");
                return;
            }

            const totalPrevPoints = currentCgpa * creditsCompleted;
            const currentPoints = currentGpa * semesterCredits;
            
            const newTotalCredits = creditsCompleted + semesterCredits;
            const newCgpa = (totalPrevPoints + currentPoints) / newTotalCredits;

            cgpaOutput.textContent = newCgpa.toFixed(2);
            cgpaResultBox.classList.remove('hidden');
        });
    }
});
