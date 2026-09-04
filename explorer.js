(function () {
    'use strict';

    let bedData = null;
    let currentState = null;
    let currentSort = { key: 'beds', dir: 'desc' };
    let searchQuery = '';

    // ─── Init ───
    async function init() {
        try {
            const res = await fetch('bed-data.json?v=' + Date.now());
            bedData = await res.json();
            populateStateDropdown();
            bindEvents();
        } catch (err) {
            console.error('Failed to load bed data:', err);
        }
    }

    // ─── Populate Dropdown ───
    function populateStateDropdown() {
        const select = document.getElementById('state-select');
        const states = bedData.states.slice().sort((a, b) => a.name.localeCompare(b.name));
        states.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name;
            select.appendChild(opt);
        });
    }

    // ─── Bind Events ───
    function bindEvents() {
        // State selection
        document.getElementById('show-data-btn').addEventListener('click', function () {
            const stateId = document.getElementById('state-select').value;
            if (!stateId) return;
            currentState = bedData.states.find(s => s.id === stateId);
            if (!currentState) return;
            searchQuery = '';
            document.getElementById('search-input').value = '';
            renderResults();
            // Smooth scroll to results
            setTimeout(() => {
                document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        });

        // Search
        document.getElementById('search-input').addEventListener('input', function () {
            searchQuery = this.value.trim().toLowerCase();
            renderTable();
        });

        // Table header sort
        document.querySelectorAll('.college-table th[data-sort]').forEach(th => {
            th.addEventListener('click', function () {
                const key = this.dataset.sort;
                if (currentSort.key === key) {
                    currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.key = key;
                    currentSort.dir = key === 'beds' ? 'desc' : 'asc';
                }
                renderTable();
            });
        });

        // Form submission
        const form = document.getElementById('strategy-form');
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }
    }

    // ─── Render Results ───
    function renderResults() {
        if (!currentState) return;

        const section = document.getElementById('results');
        section.classList.add('visible');

        // State name
        document.getElementById('results-state-name').textContent = currentState.name;

        // Stats
        const colleges = currentState.colleges;
        const govtCount = colleges.filter(c => c.type === 'Government' || c.type === 'Central').length;
        const privateCount = colleges.filter(c => c.type === 'Private' || c.type === 'Deemed').length;
        const totalBeds = colleges.reduce((sum, c) => sum + c.beds, 0);

        document.getElementById('stat-colleges').textContent = colleges.length;
        document.getElementById('stat-beds').textContent = totalBeds.toLocaleString('en-IN');
        document.getElementById('stat-govt').textContent = govtCount;
        document.getElementById('stat-private').textContent = privateCount;

        renderTable();
    }

    // ─── Render Table ───
    function renderTable() {
        if (!currentState) return;

        let colleges = currentState.colleges.slice();

        // Filter by search
        if (searchQuery) {
            colleges = colleges.filter(c =>
                c.name.toLowerCase().includes(searchQuery) ||
                c.city.toLowerCase().includes(searchQuery)
            );
        }

        // Sort
        colleges.sort((a, b) => {
            let valA, valB;
            switch (currentSort.key) {
                case 'name':
                    valA = a.name.toLowerCase();
                    valB = b.name.toLowerCase();
                    break;
                case 'city':
                    valA = a.city.toLowerCase();
                    valB = b.city.toLowerCase();
                    break;
                case 'type':
                    valA = a.type.toLowerCase();
                    valB = b.type.toLowerCase();
                    break;
                case 'beds':
                default:
                    valA = a.beds;
                    valB = b.beds;
                    break;
            }
            if (valA < valB) return currentSort.dir === 'asc' ? -1 : 1;
            if (valA > valB) return currentSort.dir === 'asc' ? 1 : -1;
            return 0;
        });

        // Update sort icons
        document.querySelectorAll('.college-table th[data-sort]').forEach(th => {
            const key = th.dataset.sort;
            const icon = th.querySelector('.sort-icon');
            if (key === currentSort.key) {
                th.classList.add('sorted');
                icon.textContent = currentSort.dir === 'asc' ? '▲' : '▼';
            } else {
                th.classList.remove('sorted');
                icon.textContent = '▲';
            }
        });

        // Results count
        const countEl = document.getElementById('results-count');
        if (searchQuery) {
            countEl.textContent = `${colleges.length} college${colleges.length !== 1 ? 's' : ''} matching "${searchQuery}"`;
        } else {
            countEl.textContent = `${colleges.length} college${colleges.length !== 1 ? 's' : ''}`;
        }

        // Build rows
        const tbody = document.getElementById('college-tbody');

        if (colleges.length === 0) {
            if (currentState.colleges.length === 0) {
                tbody.innerHTML = `<tr class="no-results-row"><td colspan="4">No medical colleges in this state/UT.</td></tr>`;
            } else {
                tbody.innerHTML = `<tr class="no-results-row"><td colspan="4">No colleges match "${searchQuery}"</td></tr>`;
            }
            return;
        }

        tbody.innerHTML = colleges.map(c => {
            const typeClass = c.type.toLowerCase();
            return `<tr>
                <td>
                    <div class="college-name">${c.name}</div>
                </td>
                <td>
                    <div class="college-city">${c.city}</div>
                </td>
                <td>
                    <span class="college-type ${typeClass}">${c.type}</span>
                </td>
                <td>
                    <span class="bed-count">${c.beds.toLocaleString('en-IN')}</span>
                </td>
            </tr>`;
        }).join('');
    }

    // ─── Form Handling ───
    function handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const name = document.getElementById('sf-name').value.trim();
        const mobile = document.getElementById('sf-mobile').value.trim();
        const email = document.getElementById('sf-email').value.trim();

        if (!name || !mobile || !email) return;
        if (!/^[0-9]{10}$/.test(mobile)) {
            alert('Please enter a valid 10-digit mobile number.');
            return;
        }

        const submitBtn = document.getElementById('sf-submit');
        submitBtn.disabled = true;
        submitBtn.querySelector('.btn-text').textContent = 'Submitting...';

        // Simulate submission
        setTimeout(() => {
            form.style.display = 'none';
            document.getElementById('sf-success').style.display = 'block';
        }, 800);
    }

    // ─── Start ───
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
