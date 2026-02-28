import imglyRemoveBackground from 'https://esm.sh/@imgly/background-removal';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Element References for Inputs
    const inputIds = [
        'yearGrade',
        'subjectName',
        'teacherName',
        'qualifications',
        'institution',
        'classDays',
        'classTime',
        'contactInfo'
    ];

    const inputs = {};
    inputIds.forEach(id => {
        inputs[id] = document.getElementById(id);
    });

    const photoUpload = document.getElementById('photoUpload');
    const fileNameDisplay = document.getElementById('fileName');

    // Template Radios
    const templateRadios = document.querySelectorAll('input[name="template"]');

    // Download Button
    const downloadBtn = document.getElementById('downloadBtn');

    // 2. Real-time Form Binding using Classes
    inputIds.forEach(id => {
        if (!inputs[id]) return;

        inputs[id].addEventListener('input', (e) => {
            // Find all output elements across all templates
            const outElements = document.querySelectorAll(`.out-${id}`);

            outElements.forEach(el => {
                if (e.target.value.trim() === '') {
                    el.textContent = e.target.placeholder.replace('e.g., ', '');
                } else {
                    el.textContent = e.target.value;
                }
            });
        });
    });

    // 3. Profile Photo Upload Handling (with Background Removal)
    photoUpload.addEventListener('change', async function (e) {
        const file = e.target.files[0];
        if (file) {
            fileNameDisplay.textContent = 'Removing background... please wait';
            photoUpload.disabled = true;

            const config = {
                publicPath: "https://unpkg.com/@imgly/background-removal@1.4.3/dist/"
            };

            try {
                // Remove background using Gemini-powered logic (via imgly)
                const blob = await imglyRemoveBackground(file, config);
                const url = URL.createObjectURL(blob);

                fileNameDisplay.textContent = file.name + ' (BG Removed)';
                const photos = document.querySelectorAll('.out-photo');
                photos.forEach(img => {
                    img.src = url;
                });
            } catch (error) {
                console.error("BG Removal Error: ", error);
                fileNameDisplay.textContent = file.name + ' (Fallback)';

                // Fallback to original image if API fails
                const reader = new FileReader();
                reader.onload = function (event) {
                    const photos = document.querySelectorAll('.out-photo');
                    photos.forEach(img => {
                        img.src = event.target.result;
                    });
                };
                reader.readAsDataURL(file);
            } finally {
                photoUpload.disabled = false;
            }
        } else {
            fileNameDisplay.textContent = 'No file chosen';
        }
    });

    // 4. Template Switching Logic
    templateRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            // Hide all posters
            document.querySelectorAll('.poster-canvas').forEach(poster => {
                poster.classList.remove('active-poster');
            });

            // Show selected poster
            const selectedTplId = `poster-${e.target.value}`;
            const selectedPoster = document.getElementById(selectedTplId);
            if (selectedPoster) {
                selectedPoster.classList.add('active-poster');
            }
        });
    });

    // 5. Download Poster using html2canvas
    downloadBtn.addEventListener('click', () => {
        // Find the currently active poster
        const activePoster = document.querySelector('.active-poster');
        if (!activePoster) return;

        // Add a visual loading state
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = 'Generating...';
        downloadBtn.style.opacity = '0.8';
        downloadBtn.disabled = true;

        // html2canvas config
        html2canvas(activePoster, {
            scale: 2, // Higher resolution
            useCORS: true, // Allow external images
            backgroundColor: null,
            logging: false,
            onclone: (clonedDoc) => {
                // In cloned document, find active poster
                const clonedPoster = clonedDoc.querySelector('.active-poster');
                if (clonedPoster) {
                    clonedPoster.style.transform = 'none'; // Fix scaling issues
                    clonedPoster.style.boxShadow = 'none'; // Remove UI dropshadow

                    // Specific fix for template 1 gradient width if needed
                    clonedPoster.style.width = getComputedStyle(activePoster).width;
                    clonedPoster.style.height = getComputedStyle(activePoster).height;
                }
            }
        }).then((canvas) => {
            // Convert canvas to data URL (PNG)
            const imageURL = canvas.toDataURL('image/png');

            // Create a temporary link to trigger download
            const link = document.createElement('a');
            const subject = inputs.subjectName.value || 'Class';
            const year = inputs.yearGrade.value || 'Poster';
            link.download = `${year}-${subject.replace(/\\s+/g, '-')}-Poster.png`;
            link.href = imageURL;
            link.click();

        }).catch(err => {
            console.error("Error generating image: ", err);
            alert("Oops! Something went wrong while generating the poster.");
        }).finally(() => {
            // Restore button state
            downloadBtn.innerHTML = originalText;
            downloadBtn.style.opacity = '1';
            downloadBtn.disabled = false;
        });
    });

    // 6. Navigation Tabs Interaction (Visual Only)
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            navTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
});
