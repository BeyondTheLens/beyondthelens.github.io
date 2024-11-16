// Initialize AOS
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true
});

// Remove loading animation once content is loaded
window.addEventListener('load', () => {
    document.querySelector('.text-animation').style.display = 'none';
});

// Theme toggle functionality
const themeToggle = document.querySelector('.theme-toggle');
let isDarkMode = false; // Track the current mode

themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode; // Toggle the mode
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');

    // Update the icon based on the current mode
    if (isDarkMode) {
        themeToggle.querySelector('i').classList.remove('fa-sun');
        themeToggle.querySelector('i').classList.add('fa-moon');
    } else {
        themeToggle.querySelector('i').classList.remove('fa-moon');
        themeToggle.querySelector('i').classList.add('fa-sun');
    }
});

// Gallery data
const gallery = document.querySelector('.gallery');
const loadMoreBtn = document.querySelector('.load-more-btn');
let photoCount = 0;
const photosPerLoad = 25;
let imageData = []; // Store image data from JSON
let loadedImages = []; // Store indices of loaded images

// Function to fetch image data from JSON
async function fetchImageData() {
    try {
        const response = await fetch('https://beyondthelens.github.io/images.json');
        const data = await response.json();
        imageData = data.images;
    } catch (error) {
        console.error('Error fetching image data:', error);
    }
}

// Determine the number of columns based on window width
function getNumberOfColumns() {
    const width = window.innerWidth;
    if (width >= 1200) return 4;
    if (width >= 992) return 3;
    if (width >= 768) return 2;
    return 1;
}

let numberOfColumns = getNumberOfColumns();
let columns = [];
let columnHeights = [];

// Initialize columns
function setupColumns() {
    // Clear existing columns
    gallery.innerHTML = '';
    columns = [];
    columnHeights = [];

    numberOfColumns = getNumberOfColumns();

    for (let i = 0; i < numberOfColumns; i++) {
        const col = document.createElement('div');
        col.className = 'gallery-column';
        gallery.appendChild(col);
        columns.push(col);
        columnHeights.push(0);
    }
}

// Adjust columns on window resize
window.addEventListener('resize', () => {
    const newNumberOfColumns = getNumberOfColumns();
    if (newNumberOfColumns !== numberOfColumns) {
        numberOfColumns = newNumberOfColumns;
        setupColumns();
        // Reload photos to distribute correctly
        loadPhotos(photoCount);
    }
});

// Function to calculate keyword similarity between two images
function calculateSimilarity(image1, image2) {
    const keywords1 = image1.keywords.split(' ');
    const keywords2 = image2.keywords.split(' ');
    let commonKeywords = 0;
    keywords1.forEach(keyword => {
        if (keywords2.includes(keyword)) {
            commonKeywords++;
        }
    });
    return commonKeywords / (keywords1.length + keywords2.length - commonKeywords);
}

// Function to load photos
function loadPhotos(count) {
    const currentPhotoCount = photoCount;
    let lastImageKeywords = ''; // Store keywords of the last loaded image

    // Choose the first image randomly
    if (currentPhotoCount === 0 && imageData.length > 0) {

        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * imageData.length);
        } while (loadedImages.includes(randomIndex));
        [imageData[0], imageData[randomIndex]] = [imageData[randomIndex], imageData[0]];
        loadedImages.push(randomIndex);
    }


    for (let i = currentPhotoCount; i < currentPhotoCount + count; i++) {
        if (i >= imageData.length) break; // Stop if all images are loaded

        let selectedImageIndex = i; // Start with the current index

        if (i > 0) {
            // Select the image with the least similarity to previous images, with a random factor
            let minSimilarity = Infinity;
            for (let j = i; j < imageData.length; j++) {
                if (!loadedImages.includes(j)) {
                    const similarity = calculateSimilarity(imageData[j], { keywords: lastImageKeywords }) + Math.random() * 0.2; // Add random factor
                    if (similarity < minSimilarity) {
                        minSimilarity = similarity;
                        selectedImageIndex = j;
                    }
                }
            }

            // Swap the selected image with the current image
            [imageData[i], imageData[selectedImageIndex]] = [imageData[selectedImageIndex], imageData[i]];
        }

        const image = imageData[i];

        // Check if image has already been loaded
        if (loadedImages.includes(i)) {
            continue; // Skip to the next image
        }

        loadedImages.push(i); // Mark image as loaded

        const img = new Image();
        img.src = `Images/${image.image}`;
        img.alt = `${image.short_description}`;
        img.style.width = '100%';
        img.style.borderRadius = '8px';
        img.style.display = 'block';

        // Create gallery item
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.setAttribute('data-category', image.keywords); // Use keywords as category
        item.setAttribute('data-aos', 'fade-up');
        item.setAttribute('data-image-index', i); // Store image index for lightbox

        // Append image once loaded
        img.onload = () => {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const fixedWidth = columns[0].clientWidth - 0; // Minus any padding/margin if needed
            const calculatedHeight = fixedWidth / aspectRatio;

            // Find the column with the least height
            const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));

            // Append the image to the shortest column
            columns[shortestColumnIndex].appendChild(item);

            // Update the column height
            columnHeights[shortestColumnIndex] += calculatedHeight + 16; // 16px for gap
        };

        // Append image and overlay to gallery item
        item.appendChild(img);

        const overlay = document.createElement('div');
        overlay.className = 'gallery-item-overlay';
        overlay.innerHTML = `<h3>${image.short_description}</h3>`; // Only short description
        item.appendChild(overlay);

        // Lightbox functionality
        item.addEventListener('click', () => {
            const lightbox = document.querySelector('.lightbox');
            const lightboxImg = lightbox.querySelector('img');
            const lightboxTitle = lightbox.querySelector('.lightbox-title');
            const lightboxDescription = lightbox.querySelector('.lightbox-description');


            const imageIndex = item.getAttribute('data-image-index');
            const imageDetails = imageData[imageIndex];

            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightboxTitle.textContent = imageDetails.short_description;
            lightboxDescription.textContent = imageDetails.detail_description;
            currentImageSrc = img.src;


            lightbox.style.display = 'flex';
        });

        lastImageKeywords = image.keywords; // Update last image keywords
    }
    AOS.refresh();
    photoCount += count;
}

// Initialize columns on page load
setupColumns();

// Fetch image data and load initial photos
fetchImageData().then(() => {
    loadPhotos(photosPerLoad);
});

// Load more button functionality
loadMoreBtn.addEventListener('click', () => {
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading...';
    // Simulate async loading
    setTimeout(() => {
        loadPhotos(photosPerLoad);
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Load More';
    }, 2000);
});

// Lightbox close functionality
const lightbox = document.querySelector('.lightbox');
const lightboxClose = document.querySelector('.lightbox-close');
lightboxClose.addEventListener('click', () => {
    lightbox.style.display = 'none';
});
// Close lightbox when clicking outside the image
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        lightbox.style.display = 'none';
    }
});
let currentImageSrc = null;
const downloadBtn = lightbox.querySelector('.download-btn');
downloadBtn.addEventListener('click', () => {
    if (currentImageSrc) {
        const filename = `BeyondTheLens.png`;
        const link = document.createElement('a');
        link.href = currentImageSrc;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
// Filter functionality
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        const category = button.getAttribute('data-category');
        photoCount = 0;
        setupColumns();
        loadPhotos(photosPerLoad);
        gallery.querySelectorAll('.gallery-item').forEach(item => {
            if (category === 'all' || item.getAttribute('data-category').includes(category)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
});

// Search functionality
const searchBar = document.querySelector('.search-bar');
searchBar.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    photoCount = 0;
    setupColumns();
    loadPhotos(photosPerLoad);
    gallery.querySelectorAll('.gallery-item').forEach(item => {
        const title = item.querySelector('.gallery-item-overlay h3').textContent.toLowerCase();
        const category = item.getAttribute('data-category').toLowerCase();
        if (title.includes(searchTerm) || category.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
});


// Mobile Navigation
const menuIcon = document.querySelector('.menu-icon');
const mobileNavLinks = document.querySelector('.desktop-nav');

menuIcon.addEventListener('click', () => {
    mobileNavLinks.classList.toggle('active');
});
