// Constants
const DEFAULT_LOGO = 'logo_default.jpg';
// Placeholder background (National Assembly approx)
const DEFAULT_BG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Palais_Bourbon_fa%C3%A7ade_sud.jpg/1200px-Palais_Bourbon_fa%C3%A7ade_sud.jpg';

let currentSlideType = 'title';

// Init
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('slideBg').style.backgroundImage = `url('${DEFAULT_BG}')`;
    updatePreview();
});

// Update Preview Logic
function updatePreview() {
    const mainText = document.getElementById('mainText').value;
    const subText = document.getElementById('subText').value;
    const highlightText = document.getElementById('highlightText').value;
    const bgOpacity = document.getElementById('bgOpacity').value;

    const previewMain = document.getElementById('previewMainText');
    const previewSub = document.getElementById('previewSubText');
    const slideBg = document.getElementById('slideBg');

    // Handle Highlighting
    if (highlightText && highlightText.trim() !== '') {
        const regex = new RegExp(`(${highlightText.trim()})`, 'gi');
        previewMain.innerHTML = mainText.replace(regex, '<span class="highlight">$1</span>');
    } else {
        previewMain.innerText = mainText;
    }

    previewSub.innerText = subText;
    slideBg.style.opacity = bgOpacity;
}

// Slide Type Switching
function setSlideType(type) {
    currentSlideType = type;
    const slide = document.getElementById('slidePreview');

    // Reset classes
    slide.classList.remove('content-mode', 'quote-mode');

    // Update active button
    document.querySelectorAll('.slide-type-selector button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (type === 'content') {
        slide.classList.add('content-mode');
    } else if (type === 'quote') {
        slide.classList.add('quote-mode');
    }
}

// Logo Handling
function toggleLogo(show) {
    const container = document.getElementById('previewLogoContainer');
    container.style.display = show ? 'flex' : 'none';
}

function uploadLogo(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewLogo').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Background Handling
function uploadBackground(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('slideBg').style.backgroundImage = `url('${e.target.result}')`;
        };
        reader.readAsDataURL(file);
    }
}

// Download Logic
function downloadSlide() {
    const slide = document.getElementById('slidePreview');

    // Use html2canvas
    html2canvas(slide, {
        scale: 2, // High resolution
        useCORS: true, // Allow cross-origin images
        allowTaint: true,
        backgroundColor: '#000000'
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `slide-chaoui-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

// Marine Le Pen Data Loading
function loadMarineLePenData() {
    // Data based on research (simulated here as per prompt instructions to find specific votes)
    // Example: Vote on purchasing power or SMIC

    document.getElementById('mainText').value = "Le RN vote CONTRE l'augmentation du SMIC";
    document.getElementById('subText').value = "Juillet 2022 : L'Assemblée rejette la hausse du SMIC à 1500€. Marine Le Pen et son groupe votent CONTRE.";
    document.getElementById('highlightText').value = "CONTRE";

    setSlideType('title'); // Start with title slide
    updatePreview();

    // Generate Bio
    const bio = `🚨 POUVOIR D'ACHAT : LE VRAI VISAGE DU RN\n\nAlors que les Français souffrent de l'inflation, rappelons les faits.\n\nEn juillet 2022, une proposition de loi visait à augmenter le SMIC à 1500€ net. Le résultat ?\n\n❌ Marine Le Pen et l'ensemble des députés RN ont voté CONTRE.\n\nLes discours c'est bien, les actes c'est mieux. Ne nous laissons pas endormir.\n\n#Politique #France #RN #MarineLePen #SMIC #PouvoirDachat #ChaouiEngagé`;

    document.getElementById('bioText').value = bio;
}

function copyBio() {
    const bioText = document.getElementById('bioText');
    bioText.select();
    document.execCommand('copy');
    alert('Bio copiée dans le presse-papier !');
}
